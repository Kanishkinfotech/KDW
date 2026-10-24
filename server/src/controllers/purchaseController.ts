import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { sendProductDeliveryEmail } from '../utils/emailService';
import { RefundService } from '../services/refundService';

export const checkOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productIds } = req.body;
    const userId = (req as any).user?.id; // Assuming authMiddleware sets req.user

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ success: false, message: 'productIds array is required' });
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        customerId: userId,
        accessStatus: 'ACTIVE'
      },
      include: {
        bundle: {
          include: { products: true }
        }
      }
    });

    const ownedProductIds = new Set<string>();
    for (const purchase of purchases) {
      if (purchase.productId) {
        ownedProductIds.add(purchase.productId);
      }
      if (purchase.bundle) {
        for (const product of purchase.bundle.products) {
          ownedProductIds.add(product.id);
        }
      }
    }

    const owned = productIds.filter(id => ownedProductIds.has(id));

    res.json({
      success: true,
      data: {
        ownedProductIds: owned
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateDownloadToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email?.toLowerCase();
    
    if (!userId && !userEmail) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // 1. Find DigitalEntitlement directly
    let entitlement = await prisma.digitalEntitlement.findFirst({
      where: {
        productId: productId,
        OR: [
          ...(userId ? [{ customerId: userId }] : []),
          ...(userEmail ? [{ customerEmail: userEmail }] : [])
        ],
        status: { in: ['ACTIVE', 'PARTIALLY_DOWNLOADED', 'DOWNLOADED'] }
      },
      include: { product: true, order: true }
    });

    // 2. Or find it via bundle entitlement
    if (!entitlement) {
      const bundleEnt = await prisma.digitalEntitlement.findFirst({
        where: {
          OR: [
            ...(userId ? [{ customerId: userId }] : []),
            ...(userEmail ? [{ customerEmail: userEmail }] : [])
          ],
          bundleId: { not: null },
          status: { in: ['ACTIVE', 'PARTIALLY_DOWNLOADED', 'DOWNLOADED'] },
          bundle: {
            OR: [
              { bundleItems: { some: { productId } } },
              { products: { some: { id: productId } } }
            ]
          }
        },
        include: { product: true, order: true }
      });
      if (bundleEnt) entitlement = bundleEnt;
    }

    // 3. Or find it from verified paid orders
    if (!entitlement) {
      const paidOrder = await prisma.order.findFirst({
        where: {
          OR: [
            ...(userId ? [{ customerId: userId }] : []),
            ...(userEmail ? [{ guestEmail: userEmail }] : [])
          ],
          paymentStatus: { in: ['PAID', 'COMPLETED'] },
          orderStatus: { notIn: ['REFUNDED', 'CANCELLED'] },
          items: {
            some: {
              OR: [
                { productId },
                { bundle: { bundleItems: { some: { productId } } } },
                { bundle: { products: { some: { id: productId } } } }
              ]
            }
          }
        },
        include: {
          customer: true,
          items: {
            include: { product: true, bundle: { include: { bundleItems: { include: { product: true } }, products: true } } }
          }
        }
      });

      if (paidOrder) {
        const productRecord = await prisma.product.findUnique({ where: { id: productId } });
        if (productRecord) {
          const dlLimit = (productRecord.downloadLimit === 999999 || productRecord.downloadLimit === 0) 
            ? 999999 
            : (productRecord.downloadLimit !== null && productRecord.downloadLimit !== undefined ? productRecord.downloadLimit : 5);
          const accExpires = (productRecord.accessDurationDays === 999999 || !productRecord.accessDurationDays) 
            ? null 
            : new Date(Date.now() + productRecord.accessDurationDays * 86400000);
          
          entitlement = await prisma.digitalEntitlement.create({
            data: {
              orderId: paidOrder.id,
              customerId: userId || paidOrder.customerId || null,
              customerEmail: userEmail || paidOrder.guestEmail || paidOrder.customer?.email || 'customer@kdw.com',
              productId: productRecord.id,
              productVersion: productRecord.version || '1.0.0',
              status: 'ACTIVE',
              downloadLimit: dlLimit,
              downloadCount: 0,
              accessExpiresAt: accExpires
            },
            include: { product: true, order: true }
          });
        }
      }
    }

    if (!entitlement) {
      return res.status(403).json({ success: false, message: 'You do not own this product or access is revoked.' });
    }

    // 4. Validate Entitlement Status & Stage 6 Policy Limits
    if (entitlement.status === 'REVOKED' || entitlement.revokedAt) {
      return res.status(403).json({ success: false, message: 'Access to this product has been revoked.' });
    }

    if (entitlement.accessExpiresAt && new Date() > new Date(entitlement.accessExpiresAt)) {
      await prisma.digitalEntitlement.update({
        where: { id: entitlement.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(403).json({ success: false, message: 'Your access period for this product has expired.' });
    }

    if (entitlement.downloadLimit > 0 && entitlement.downloadLimit !== 999999 && entitlement.downloadCount >= entitlement.downloadLimit) {
      return res.status(403).json({ success: false, message: `Maximum download limit (${entitlement.downloadLimit}) reached for this purchase.` });
    }

    // 5. Enforce Max Concurrent Active Tokens Policy
    const prod = entitlement.product || await prisma.product.findUnique({ where: { id: productId } });
    const maxActive = prod?.maxActiveTokens || 3;
    const tokenDurationMinutes = prod?.tokenDurationMinutes || 60;

    const currentActiveTokens = await prisma.downloadToken.findMany({
      where: {
        entitlementId: entitlement.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (currentActiveTokens.length >= maxActive) {
      const tokensToExpire = currentActiveTokens.slice(0, currentActiveTokens.length - maxActive + 1);
      for (const t of tokensToExpire) {
        await prisma.downloadToken.update({
          where: { id: t.id },
          data: { status: 'EXPIRED' }
        });
      }
    }

    // 6. Generate New Signed Secure Download Token
    const secureToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(secureToken).digest('hex');
    const expiresAt = new Date(Date.now() + tokenDurationMinutes * 60 * 1000);

    await prisma.downloadToken.create({
      data: {
        entitlementId: entitlement.id,
        tokenHash,
        secureToken,
        status: 'ACTIVE',
        expiresAt
      }
    });

    // Also create backwards-compatible AccessToken
    const purchase = await prisma.purchase.findFirst({
      where: { customerId: userId || undefined, productId }
    });
    if (purchase) {
      await prisma.accessToken.create({
        data: {
          purchaseId: purchase.id,
          secureToken,
          expiresAt
        }
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/purchases/download/${secureToken}?productId=${productId}`,
        expiresAt,
        tokenLifetimeMinutes: tokenDurationMinutes,
        remainingDownloads: entitlement.downloadLimit === 999999 ? 'Unlimited' : Math.max(0, entitlement.downloadLimit - entitlement.downloadCount)
      }
    });
  } catch (error) {
    next(error);
  }
};

const sendDownloadResponseError = (
  res: Response,
  req: Request,
  status: number,
  title: string,
  message: string,
  details?: { entitlementId?: string; downloadsUsed?: number; downloadLimit?: number | string; orderNumber?: string; productName?: string; verificationUrl?: string }
) => {
  const acceptsHtml = req.accepts('html') && !req.xhr && !req.query.json;
  if (acceptsHtml) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.status(status).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | Kanishk Digital World</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0b0f19;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            background: #151c2e;
            border: 1px solid #1e293b;
            border-radius: 24px;
            max-width: 480px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          }
          .icon-badge {
            width: 60px;
            height: 60px;
            border-radius: 18px;
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #ef4444;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 18px auto;
            font-size: 24px;
          }
          h1 {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
          }
          p.lead {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 22px;
          }
          .info-box {
            background: #0b0f19;
            border: 1px solid #243049;
            border-radius: 14px;
            padding: 14px 16px;
            margin-bottom: 22px;
            font-size: 12px;
            text-align: left;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #151c2e;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #64748b; font-weight: 600; }
          .info-val { color: #f1f5f9; font-weight: 700; }
          .btn-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .btn {
            display: block;
            padding: 12px 18px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .btn-primary {
            background: #0284c7;
            color: #ffffff;
          }
          .btn-primary:hover {
            background: #0369a1;
          }
          .btn-secondary {
            background: #1e293b;
            color: #cbd5e1;
            border: 1px solid #334155;
          }
          .btn-secondary:hover {
            background: #334155;
            color: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon-badge">🔒</div>
          <h1>${title}</h1>
          <p class="lead">${message}</p>
          ${details ? `
            <div class="info-box">
              ${details.productName ? `<div class="info-row"><span class="info-label">Product:</span><span class="info-val">${details.productName}</span></div>` : ''}
              ${details.orderNumber ? `<div class="info-row"><span class="info-label">Order:</span><span class="info-val">#${details.orderNumber}</span></div>` : ''}
              ${details.downloadsUsed !== undefined ? `<div class="info-row"><span class="info-label">Downloads Used:</span><span class="info-val">${details.downloadsUsed} / ${details.downloadLimit}</span></div>` : ''}
            </div>
          ` : ''}
          <div class="btn-group">
            ${details?.verificationUrl ? `<a href="${details.verificationUrl}" class="btn btn-primary" style="background: #7c3aed; color: #ffffff;">Verify Personal License Now &rarr;</a>` : ''}
            <a href="${frontendUrl}/dashboard?tab=downloads" class="btn ${details?.verificationUrl ? 'btn-secondary' : 'btn-primary'}">Go to My Downloads Dashboard &rarr;</a>
            <a href="${frontendUrl}/verify-license" class="btn btn-secondary">License Verification Portal</a>
            <a href="${frontendUrl}/support" class="btn btn-secondary">Contact Customer Support</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  return res.status(status).json({ success: false, message, title, details });
};

export const downloadProduct = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const rawToken = (req.params.token as string || '').trim();
  const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    if (!rawToken) {
      return sendDownloadResponseError(res, req, 400, 'Invalid Request', 'Download token is required.');
    }

    // 1. Try finding modern DownloadToken & DigitalEntitlement first
    let downloadToken = await prisma.downloadToken.findFirst({
      where: {
        OR: [
          { tokenHash: tokenHash },
          { secureToken: rawToken }
        ]
      },
      include: {
        entitlement: {
          include: {
            order: { include: { customer: true, refunds: true } },
            customer: true,
            product: true,
            bundle: { include: { products: true, bundleItems: { include: { product: true } } } }
          }
        }
      }
    });

    // If found modern token
    if (downloadToken) {
      const ent = downloadToken.entitlement;
      const prod = ent.product || (ent.bundle?.products?.[0]) || (ent.bundle?.bundleItems?.[0]?.product);

      // A. Check token status & expiry
      if (downloadToken.status === 'REVOKED' || downloadToken.revokedAt) {
        await prisma.downloadLog.create({
          data: {
            entitlementId: ent.id,
            customerId: ent.customerId,
            customerEmail: ent.customerEmail,
            orderId: ent.orderId,
            productId: ent.productId,
            productName: prod?.name || 'Digital Product',
            productVersion: ent.productVersion,
            tokenId: downloadToken.id,
            eventType: 'download_failed',
            result: 'FAILED',
            failureReason: 'Token has been revoked by administration.',
            failureCategory: 'Revoked token',
            durationMs: Date.now() - startTime,
            ipAddress: clientIp,
            userAgent
          }
        });
        return sendDownloadResponseError(res, req, 403, 'Access Revoked', 'This download token has been revoked by administration.', { productName: prod?.name, orderNumber: ent.order?.orderNumber });
      }

      if (new Date() > new Date(downloadToken.expiresAt) || downloadToken.status === 'EXPIRED') {
        await prisma.downloadToken.update({
          where: { id: downloadToken.id },
          data: { status: 'EXPIRED' }
        });
        await prisma.downloadLog.create({
          data: {
            entitlementId: ent.id,
            customerId: ent.customerId,
            customerEmail: ent.customerEmail,
            orderId: ent.orderId,
            productId: ent.productId,
            productName: prod?.name || 'Digital Product',
            productVersion: ent.productVersion,
            tokenId: downloadToken.id,
            eventType: 'token_expired',
            result: 'FAILED',
            failureReason: 'Download link token has expired. Please request a new token from your account dashboard.',
            failureCategory: 'Expired token',
            durationMs: Date.now() - startTime,
            ipAddress: clientIp,
            userAgent
          }
        });
        return sendDownloadResponseError(res, req, 403, 'Download Link Expired', 'This secure download link has expired for security reasons. Please generate a new download link from your customer dashboard.', { productName: prod?.name, orderNumber: ent.order?.orderNumber });
      }

      // B. Check Entitlement status
      if (ent.status === 'REVOKED' || ent.revokedAt) {
        await prisma.downloadLog.create({
          data: {
            entitlementId: ent.id,
            customerId: ent.customerId,
            customerEmail: ent.customerEmail,
            orderId: ent.orderId,
            productId: ent.productId,
            productName: prod?.name || 'Digital Product',
            productVersion: ent.productVersion,
            tokenId: downloadToken.id,
            eventType: 'access_revoked',
            result: 'FAILED',
            failureReason: ent.revocationReason || 'Product access has been revoked.',
            failureCategory: 'Revoked access',
            durationMs: Date.now() - startTime,
            ipAddress: clientIp,
            userAgent
          }
        });
        return sendDownloadResponseError(res, req, 403, 'Access Revoked', ent.revocationReason || 'Access to this product has been revoked.', { productName: prod?.name, orderNumber: ent.order?.orderNumber });
      }

      if (ent.accessExpiresAt && new Date() > new Date(ent.accessExpiresAt)) {
        await prisma.digitalEntitlement.update({
          where: { id: ent.id },
          data: { status: 'EXPIRED' }
        });
        await prisma.downloadLog.create({
          data: {
            entitlementId: ent.id,
            customerId: ent.customerId,
            customerEmail: ent.customerEmail,
            orderId: ent.orderId,
            productId: ent.productId,
            productName: prod?.name || 'Digital Product',
            productVersion: ent.productVersion,
            tokenId: downloadToken.id,
            eventType: 'download_failed',
            result: 'FAILED',
            failureReason: 'Entitlement access period has expired.',
            failureCategory: 'Expired access',
            durationMs: Date.now() - startTime,
            ipAddress: clientIp,
            userAgent
          }
        });
        return sendDownloadResponseError(res, req, 403, 'Access Period Expired', 'Your entitlement access period for this product has expired.', { productName: prod?.name, orderNumber: ent.order?.orderNumber });
      }

      // C. Check Download Limits (Quota Enforcement)
      const isUnlimited = ent.downloadLimit === 999999 || ent.downloadLimit <= 0;
      if (!isUnlimited && ent.downloadCount >= ent.downloadLimit) {
        await prisma.downloadLog.create({
          data: {
            entitlementId: ent.id,
            customerId: ent.customerId,
            customerEmail: ent.customerEmail,
            orderId: ent.orderId,
            productId: ent.productId,
            productName: prod?.name || 'Digital Product',
            productVersion: ent.productVersion,
            tokenId: downloadToken.id,
            eventType: 'limit_reached',
            result: 'FAILED',
            failureReason: `Download limit of ${ent.downloadLimit} reached.`,
            failureCategory: 'Limit reached',
            durationMs: Date.now() - startTime,
            ipAddress: clientIp,
            userAgent
          }
        });
        return sendDownloadResponseError(res, req, 403, 'Download Limit Reached', `Maximum download limit (${ent.downloadLimit}) reached for this purchase.`, {
          productName: prod?.name,
          orderNumber: ent.order?.orderNumber,
          downloadsUsed: ent.downloadCount,
          downloadLimit: ent.downloadLimit,
          entitlementId: ent.id
        });
      }

      // D. Verify Order Payment Status & Refund Status
      if (ent.order) {
        if (ent.order.paymentStatus !== 'PAID' && ent.order.paymentStatus !== 'COMPLETED') {
          return sendDownloadResponseError(res, req, 403, 'Payment Required', 'Order payment is not verified.', { productName: prod?.name, orderNumber: ent.order?.orderNumber });
        }
        if (ent.order.orderStatus === 'REFUNDED' || ent.order.refundStatus === 'COMPLETED') {
          return sendDownloadResponseError(res, req, 403, 'Order Refunded', 'Access denied: this order was refunded.', { productName: prod?.name, orderNumber: ent.order?.orderNumber });
        }
      }

      // E. Check Personal License Verification Status
      // Download links in email remain locked until the personal license key is verified.
      const licence = ent.licenceId
        ? await prisma.licenceKey.findUnique({ where: { id: ent.licenceId } })
        : (ent.orderId ? await prisma.licenceKey.findFirst({ where: { orderId: ent.orderId } }) : null);

      const isLicenceVerified = licence
        ? (licence.activationCount > 0 || ent.order?.licenceStatus === 'VERIFIED')
        : (ent.order?.licenceStatus === 'VERIFIED' || ent.order?.licenceStatus === 'NOT_REQUIRED');

      if (licence && !isLicenceVerified) {
        await prisma.downloadLog.create({
          data: {
            entitlementId: ent.id,
            customerId: ent.customerId,
            customerEmail: ent.customerEmail,
            orderId: ent.orderId,
            productId: ent.productId,
            productName: prod?.name || 'Digital Product',
            productVersion: ent.productVersion,
            tokenId: downloadToken.id,
            eventType: 'verification_required',
            result: 'FAILED',
            failureReason: 'Personal license key must be verified before opening download links.',
            failureCategory: 'Unverified license',
            durationMs: Date.now() - startTime,
            ipAddress: clientIp,
            userAgent
          }
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return sendDownloadResponseError(
          res,
          req,
          403,
          'Personal License Verification Required',
          `Your download link is locked until your Personal License Key is verified. Please verify your license key (${licence.keyMasked}) on our verification portal to unlock your product assets and Google Drive access.`,
          {
            productName: prod?.name,
            orderNumber: ent.order?.orderNumber,
            verificationUrl: `${frontendUrl}/verify-license?key=${encodeURIComponent(licence.keyMasked)}`
          }
        );
      }

      // F. Check Customer Block Status
      if (ent.customer && (ent.customer.status === 'BLOCKED' || ent.customer.status === 'SUSPENDED')) {
        if (ent.customer.blockScope === 'DOWNLOADS' || ent.customer.blockScope === 'FULL' || !ent.customer.blockScope) {
          return sendDownloadResponseError(res, req, 403, 'Account Restricted', 'Your account is restricted from downloading digital files.');
        }
      }

      if (!prod) {
        return sendDownloadResponseError(res, req, 404, 'Product Not Found', 'Product deliverable file not found.');
      }

      // G. Successful Download Execution: Increment Download Count & Log
      const newCount = ent.downloadCount + 1;
      const newStatus = (!isUnlimited && newCount >= ent.downloadLimit) ? 'DOWNLOADED' : 'PARTIALLY_DOWNLOADED';

      await prisma.$transaction([
        prisma.downloadToken.update({
          where: { id: downloadToken.id },
          data: {
            lastUsedAt: new Date(),
            status: 'USED'
          }
        }),
        prisma.digitalEntitlement.update({
          where: { id: ent.id },
          data: {
            downloadCount: newCount,
            status: newStatus,
            lastDownloadedAt: new Date()
          }
        }),
        prisma.downloadLog.create({
          data: {
            entitlementId: ent.id,
            customerId: ent.customerId,
            customerEmail: ent.customerEmail,
            orderId: ent.orderId,
            productId: ent.productId,
            productName: prod.name,
            productVersion: ent.productVersion,
            tokenId: downloadToken.id,
            eventType: 'download_completed',
            result: 'SUCCESS',
            durationMs: Date.now() - startTime,
            bytesStreamed: BigInt(1048576 * 5),
            ipAddress: clientIp,
            userAgent
          }
        })
      ]);

      // G. Resolve Target Google Drive Download Link or Stream File
      let targetDriveUrl = '';
      if (prod.googleDriveFileId && prod.googleDriveFileId.trim() !== '') {
        targetDriveUrl = prod.googleDriveFileId.startsWith('http') 
          ? prod.googleDriveFileId 
          : `https://drive.google.com/file/d/${prod.googleDriveFileId}/view?usp=sharing`;
      } else if (prod.googleDriveLinks) {
        try {
          const parsed = typeof prod.googleDriveLinks === 'string' ? JSON.parse(prod.googleDriveLinks) : prod.googleDriveLinks;
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
            targetDriveUrl = parsed[0].startsWith('http') ? parsed[0] : `https://drive.google.com/file/d/${parsed[0]}/view?usp=sharing`;
          }
        } catch (e) {}
      }

      if (targetDriveUrl) {
        return res.redirect(targetDriveUrl);
      }

      // Stream Fallback File Archive
      const fileName = `${prod.slug || 'kdw-download'}-v${ent.productVersion || '1.0'}.zip`;
      res.setHeader('Content-disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-type', 'application/zip');
      res.setHeader('X-KDW-Entitlement-ID', ent.id);
      res.setHeader('X-KDW-Download-Count', String(newCount));
      res.setHeader('X-KDW-Download-Limit', isUnlimited ? 'Unlimited' : String(ent.downloadLimit));

      return res.send(Buffer.from(`KDW SECURE DIGITAL DELIVERY ARCHIVE\nProduct: ${prod.name}\nVersion: ${ent.productVersion}\nLicensed To: ${ent.customerEmail}\nEntitlement ID: ${ent.id}\nTimestamp: ${new Date().toISOString()}`));
    }

    // 2. Fallback to legacy AccessToken / Purchase model
    const legacyToken = await prisma.accessToken.findUnique({
      where: { secureToken: rawToken },
      include: {
        purchase: {
          include: {
            product: true,
            bundle: { include: { products: true } },
            order: true
          }
        }
      }
    });

    if (!legacyToken) {
      await prisma.downloadFailure.create({
        data: {
          productName: 'Unknown Product',
          failureCategory: 'Invalid token',
          priority: 'LOW',
          errorMessage: 'Download attempt with invalid or non-existent token.',
          errorCode: 'INVALID_TOKEN'
        }
      });
      return sendDownloadResponseError(res, req, 404, 'Invalid Link', 'Invalid or expired download link.');
    }

    if (new Date() > new Date(legacyToken.expiresAt)) {
      return sendDownloadResponseError(res, req, 403, 'Download Link Expired', 'Download link has expired.', { orderNumber: legacyToken.purchase.order?.orderNumber });
    }

    if (legacyToken.purchase.order && legacyToken.purchase.order.paymentStatus !== 'PAID') {
      return sendDownloadResponseError(res, req, 403, 'Payment Required', 'Order is not paid.', { orderNumber: legacyToken.purchase.order?.orderNumber });
    }

    if (legacyToken.purchase.orderId) {
      const legacyLicence = await prisma.licenceKey.findFirst({
        where: { orderId: legacyToken.purchase.orderId }
      });
      const isLegacyVerified = legacyLicence
        ? (legacyLicence.activationCount > 0 || legacyToken.purchase.order?.licenceStatus === 'VERIFIED')
        : (legacyToken.purchase.order?.licenceStatus === 'VERIFIED' || legacyToken.purchase.order?.licenceStatus === 'NOT_REQUIRED');

      if (legacyLicence && !isLegacyVerified) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return sendDownloadResponseError(
          res,
          req,
          403,
          'Personal License Verification Required',
          `Your download link is locked until your Personal License Key is verified. Please verify your license key (${legacyLicence.keyMasked}) on our verification portal to unlock your product assets and Google Drive access.`,
          {
            productName: legacyToken.purchase.product?.name,
            orderNumber: legacyToken.purchase.order?.orderNumber,
            verificationUrl: `${frontendUrl}/verify-license?key=${encodeURIComponent(legacyLicence.keyMasked)}`
          }
        );
      }
    }

    const legacyProduct = legacyToken.purchase.product || legacyToken.purchase.bundle?.products?.[0];
    if (!legacyProduct) {
      return sendDownloadResponseError(res, req, 404, 'Product Not Found', 'Product deliverable file not found.');
    }

    await prisma.$transaction([
      prisma.accessToken.update({
        where: { id: legacyToken.id },
        data: { lastUsedAt: new Date() }
      }),
      prisma.purchase.update({
        where: { id: legacyToken.purchaseId },
        data: { downloadCount: { increment: 1 } }
      })
    ]);

    let legacyDriveUrl = '';
    if (legacyProduct.googleDriveFileId && legacyProduct.googleDriveFileId.trim() !== '') {
      legacyDriveUrl = legacyProduct.googleDriveFileId.startsWith('http')
        ? legacyProduct.googleDriveFileId
        : `https://drive.google.com/file/d/${legacyProduct.googleDriveFileId}/view?usp=sharing`;
    }

    if (legacyDriveUrl) {
      return res.redirect(legacyDriveUrl);
    }

    const legacyFilename = `${legacyProduct.slug || 'download'}.zip`;
    res.setHeader('Content-disposition', `attachment; filename="${legacyFilename}"`);
    res.setHeader('Content-type', 'application/zip');
    return res.send(Buffer.from(`KDW DIGITAL PRODUCT DELIVERY\nProduct: ${legacyProduct.name}\nOrder: ${legacyToken.purchase.orderId || 'N/A'}\nDelivered on: ${new Date().toISOString()}`));

  } catch (error) {
    next(error);
  }
};

export const getPurchases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email?.toLowerCase();
    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Fetch direct purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        OR: [
          ...(userId ? [{ customerId: userId }] : []),
          ...(userEmail ? [{ order: { guestEmail: userEmail } }] : [])
        ]
      },
      include: {
        product: true,
        bundle: {
          include: { products: true }
        },
        order: {
          include: { licenceKeys: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch paid orders (to include any order items that may not have direct Purchase rows)
    const paidOrders = await prisma.order.findMany({
      where: {
        OR: [
          ...(userId ? [{ customerId: userId }] : []),
          ...(userEmail ? [{ guestEmail: userEmail }] : [])
        ],
        paymentStatus: 'PAID'
      },
      include: {
        items: {
          include: {
            product: true,
            bundle: { include: { products: true } }
          }
        },
        licenceKeys: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const itemsMap = new Map<string, any>();

    // Add from purchases table
    for (const p of purchases) {
      const orderLicence = p.order?.licenceKeys?.find(
        (lk: any) => (p.productId && lk.productId === p.productId) || (p.bundleId && (lk.keyMasked?.includes('BNDL') || lk.orderItemId))
      ) || p.order?.licenceKeys?.[0];

      const licenceKeyVal = orderLicence?.keyMasked || (p.order?.orderNumber ? `KDW-PERS-${p.order.orderNumber.replace(/[^A-Z0-9]/gi, '')}` : null);

      if (p.bundle) {
        itemsMap.set(`bundle_${p.bundleId}`, {
          id: p.id,
          bundleId: p.bundleId,
          productId: p.productId || p.bundleId,
          type: 'BUNDLE',
          name: p.bundle.title,
          image: p.bundle.coverImage,
          orderId: p.order?.id,
          orderNumber: p.order?.orderNumber,
          amount: p.bundle.price,
          currency: p.order?.currency || 'INR',
          status: p.order?.paymentStatus || 'PAID',
          purchasedAt: p.createdAt,
          productCount: p.bundle.itemsIncluded || 0,
          downloadAvailable: p.accessStatus === 'ACTIVE',
          licenseAvailable: true,
          licenceKey: licenceKeyVal,
          licenseKey: licenceKeyVal,
          invoiceAvailable: true,
          version: '1.0.0',
          bundleProducts: p.bundle.products.map(bp => ({
            id: bp.id,
            name: bp.name,
            fileSize: bp.fileSize || 'Unknown',
            productId: bp.id
          }))
        });
      } else if (p.product) {
        itemsMap.set(`prod_${p.productId}`, {
          id: p.id,
          productId: p.productId,
          type: 'PRODUCT',
          name: p.product.name,
          fileSize: p.product.fileSize || 'Unknown',
          image: p.product.thumbnail || p.product.previewImages,
          orderId: p.order?.id,
          orderNumber: p.order?.orderNumber,
          amount: p.product.price,
          currency: p.order?.currency || 'INR',
          status: p.order?.paymentStatus || 'PAID',
          purchasedAt: p.createdAt,
          downloadAvailable: p.accessStatus === 'ACTIVE',
          licenseAvailable: true,
          licenceKey: licenceKeyVal,
          licenseKey: licenceKeyVal,
          invoiceAvailable: true,
          version: p.product.version || '1.0.0'
        });
      }
    }

    // Complement from paid orders
    for (const o of paidOrders) {
      for (const item of o.items) {
        const itemLicence = o.licenceKeys.find(
          (lk: any) => (item.productId && lk.productId === item.productId) || (item.id && lk.orderItemId === item.id)
        ) || o.licenceKeys[0];

        const licenceKeyVal = itemLicence?.keyMasked || `KDW-PERS-${o.orderNumber.replace(/[^A-Z0-9]/gi, '')}`;

        if (item.productId && item.product && !itemsMap.has(`prod_${item.productId}`)) {
          itemsMap.set(`prod_${item.productId}`, {
            id: item.id,
            productId: item.productId,
            type: 'PRODUCT',
            name: item.product.name,
            fileSize: item.product.fileSize || 'Unknown',
            image: item.product.thumbnail || item.product.previewImages,
            orderId: o.id,
            orderNumber: o.orderNumber,
            amount: item.unitPrice || item.product.price,
            currency: o.currency || 'INR',
            status: o.paymentStatus || 'PAID',
            purchasedAt: o.createdAt,
            downloadAvailable: true,
            licenseAvailable: true,
            licenceKey: licenceKeyVal,
            licenseKey: licenceKeyVal,
            invoiceAvailable: true,
            version: item.product.version || '1.0.0'
          });
        } else if (item.bundleId && item.bundle && !itemsMap.has(`bundle_${item.bundleId}`)) {
          itemsMap.set(`bundle_${item.bundleId}`, {
            id: item.id,
            bundleId: item.bundleId,
            productId: item.bundleId,
            type: 'BUNDLE',
            name: item.bundle.title,
            image: item.bundle.coverImage,
            orderId: o.id,
            orderNumber: o.orderNumber,
            amount: item.unitPrice || item.bundle.price,
            currency: o.currency || 'INR',
            status: o.paymentStatus || 'PAID',
            purchasedAt: o.createdAt,
            productCount: item.bundle.itemsIncluded || 0,
            downloadAvailable: true,
            licenseAvailable: true,
            licenceKey: licenceKeyVal,
            licenseKey: licenceKeyVal,
            invoiceAvailable: true,
            version: '1.0.0',
            bundleProducts: item.bundle.products.map(bp => ({
              id: bp.id,
              name: bp.name,
              fileSize: bp.fileSize || 'Unknown',
              productId: bp.id
            }))
          });
        }
      }
    }

    res.json({
      success: true,
      purchases: Array.from(itemsMap.values())
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email?.toLowerCase();
    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          ...(userId ? [{ customerId: userId }] : []),
          ...(userEmail ? [{ guestEmail: userEmail }] : [])
        ],
        paymentStatus: { in: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] }
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, thumbnail: true } },
            bundle: { select: { id: true, title: true, coverImage: true } }
          }
        },
        payments: {
          select: {
            id: true,
            status: true,
            verificationStatus: true,
            amount: true
          }
        },
        refunds: {
          select: {
            id: true,
            status: true,
            amount: true,
            reason: true,
            rejectionReason: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedInvoices = orders.map(o => {
      const verifiedPayment = o.payments.find(p => p.status === 'CAPTURED' || p.status === 'PARTIALLY_REFUNDED');
      const latestRefund = o.refunds[0] || null;
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt).toLocaleDateString(),
        amount: o.totalAmount,
        currency: o.currency,
        status: o.paymentStatus,
        refundStatus: o.refundStatus,
        refundedAmount: o.refundedAmount,
        isPaymentVerified: !!verifiedPayment,
        paymentStatusDetails: verifiedPayment ? verifiedPayment.status : (o.payments[0]?.status || 'UNVERIFIED'),
        items: o.items,
        latestRefund
      };
    });

    res.json({ success: true, invoices: formattedInvoices });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email?.toLowerCase();
    const orderId = req.params.orderId as string;

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ],
        AND: [
          {
            OR: [
              ...(userId ? [{ customerId: userId }] : []),
              ...(userEmail ? [{ guestEmail: userEmail }] : [])
            ]
          }
        ],
        paymentStatus: 'PAID'
      },
      include: {
        customer: true,
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invoice not found or unauthorized' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-disposition', `attachment; filename=KDW-Invoice-${order.orderNumber}.pdf`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Kanishk Digital World', { align: 'right' });
    doc.fontSize(10).text('OFFICIAL TAX INVOICE', { align: 'right' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(12).text('Billed To:');
    doc.fontSize(10).text(order.customer?.name || order.guestName || 'Valued Customer');
    doc.text(order.customer?.email || order.guestEmail || 'N/A');
    if (order.customer?.mobile || order.guestMobile) {
      doc.text(order.customer?.mobile || order.guestMobile || '');
    }
    doc.moveDown();

    // Order Info
    doc.text(`Invoice No: INV-${order.orderNumber}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Payment Status: ${order.paymentStatus} (VERIFIED)`);
    doc.moveDown();

    // Items
    doc.fontSize(12).text('Purchased Digital Deliverables:', { underline: true });
    doc.moveDown(0.5);

    order.items.forEach(item => {
      doc.fontSize(10).text(`• ${item.productName || 'Digital Resource'} (Qty: ${item.quantity}) — ${order.currency} ${(item.unitPrice || 0).toFixed(2)}`);
    });

    doc.moveDown(2);
    doc.fontSize(14).text(`Total Paid: ${order.currency} ${order.totalAmount.toFixed(2)}`, { align: 'right' });

    doc.end();

  } catch (error) {
    next(error);
  }
};

export const resendDeliveryEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const orderId = req.params.orderId as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId,
        paymentStatus: 'PAID'
      },
      include: {
        items: true,
        customer: { select: { email: true, name: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    // Cooldown check: 60 seconds
    if (order.emailSentAt) {
      const secondsSinceLastEmail = Math.floor((new Date().getTime() - new Date(order.emailSentAt).getTime()) / 1000);
      if (secondsSinceLastEmail < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${60 - secondsSinceLastEmail} seconds before requesting another email resend.`
        });
      }
    }

    const recipientEmail = order.guestEmail || order.customer?.email;
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'No delivery email on file for this order' });
    }

    const productLinks: any[] = [];
    for (const item of order.items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const rawLinks: string[] = [];
          if (product.googleDriveLinks) {
            try {
              const parsed = typeof product.googleDriveLinks === 'string' ? JSON.parse(product.googleDriveLinks) : product.googleDriveLinks;
              if (Array.isArray(parsed) && parsed.length > 0) {
                rawLinks.push(...parsed);
              }
            } catch (e) {}
          }
          if (rawLinks.length === 0 && product.googleDriveFileId) {
            rawLinks.push(product.googleDriveFileId);
          }
          const validLinks = [...new Set(rawLinks.map(l => l?.trim()).filter(Boolean))];
          if (validLinks.length > 0) {
            validLinks.forEach((link, idx) => {
              let url = link;
              if (!link.startsWith('http')) {
                url = `https://drive.google.com/file/d/${link}/view?usp=sharing`;
              }
              productLinks.push({
                name: validLinks.length > 1 ? `${product.name} (File ${idx + 1})` : product.name,
                url
              });
            });
          } else {
            productLinks.push({ name: product.name, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
          }
        }
      } else if (item.bundleId) {
        const bundle = await prisma.bundle.findUnique({ where: { id: item.bundleId } });
        if (bundle) {
          productLinks.push({ name: bundle.title, url: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard/downloads` });
        }
      }
    }

    const emailResult = await sendProductDeliveryEmail(recipientEmail, order.orderNumber, productLinks);

    if (emailResult.success) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          emailDeliveryStatus: 'SENT',
          emailSentAt: new Date(),
          emailDeliveryAttempts: { increment: 1 }
        }
      });
      return res.json({ success: true, message: `Access email successfully resent to ${recipientEmail}` });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          emailDeliveryStatus: 'FAILED',
          emailDeliveryAttempts: { increment: 1 },
          emailLastError: String(emailResult.error)
        }
      });
      return res.status(500).json({ success: false, message: 'Failed to send delivery email. Please try again later.' });
    }
  } catch (error) {
    next(error);
  }
};

export const submitCustomerRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const { orderId, reason, note, productName } = req.body;

    if (!orderId || !reason || !reason.trim() || !note || !note.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID, refund reason, and an explanation for the administrator are mandatory.' 
      });
    }

    const result = await RefundService.requestCustomerRefund({
      orderId,
      customerId: userId,
      customerEmail: userEmail,
      reason,
      note,
      productName
    });

    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const getCustomerRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    const refunds = await RefundService.getCustomerRefunds(userId, userEmail);
    res.json({ success: true, refunds });
  } catch (error: any) {
    next(error);
  }
};

