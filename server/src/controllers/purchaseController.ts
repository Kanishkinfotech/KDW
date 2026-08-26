import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { sendProductDeliveryEmail } from '../utils/emailService';

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
    
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // 1. Find entitlement directly
    let purchase = await prisma.purchase.findFirst({
      where: {
        customerId: userId,
        productId: productId,
        accessStatus: 'ACTIVE'
      },
      include: { order: true }
    });

    // 2. Or find it via bundle
    if (!purchase) {
      const bundlePurchases = await prisma.purchase.findMany({
        where: { customerId: userId, bundleId: { not: null }, accessStatus: 'ACTIVE' },
        include: { bundle: { include: { products: true } }, order: true }
      });
      for (const bp of bundlePurchases) {
        if (bp.bundle?.products.some(p => p.id === productId)) {
          purchase = bp;
          break;
        }
      }
    }

    if (!purchase) {
      return res.status(403).json({ success: false, message: 'You do not own this product or access is revoked.' });
    }

    // Verify order is PAID if linked
    if (purchase.order && purchase.order.paymentStatus !== 'PAID') {
      return res.status(403).json({ success: false, message: 'Order is not paid.' });
    }

    // 2. Generate secure token
    const secureToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await prisma.accessToken.create({
      data: {
        purchaseId: purchase.id,
        secureToken,
        expiresAt
      }
    });

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/purchases/download/${secureToken}?productId=${productId}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadProduct = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const rawToken = (req.params.token as string || '').trim();
  const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Download token is required.' });
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
            bundle: { include: { products: true } }
          }
        }
      }
    });

    // If found modern token
    if (downloadToken) {
      const ent = downloadToken.entitlement;
      const prod = ent.product || (ent.bundle?.products?.[0]);

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
        return res.status(403).json({ success: false, message: 'This download token has been revoked.' });
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
        return res.status(403).json({ success: false, message: 'Download link has expired. Please refresh the link from your downloads dashboard.' });
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
        return res.status(403).json({ success: false, message: 'Access to this product has been revoked.' });
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
        return res.status(403).json({ success: false, message: 'Your access period for this product has expired.' });
      }

      // C. Check Download Limits
      if (ent.downloadLimit > 0 && ent.downloadCount >= ent.downloadLimit) {
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
        return res.status(403).json({ success: false, message: `Maximum download limit (${ent.downloadLimit}) reached for this purchase.` });
      }

      // D. Verify Order Payment Status & Refund Status
      if (ent.order) {
        if (ent.order.paymentStatus !== 'PAID' && ent.order.paymentStatus !== 'COMPLETED') {
          return res.status(403).json({ success: false, message: 'Order payment is not verified.' });
        }
        if (ent.order.orderStatus === 'REFUNDED' || ent.order.refundStatus === 'COMPLETED') {
          return res.status(403).json({ success: false, message: 'Access denied: this order was refunded.' });
        }
      }

      // E. Check Customer Block Status
      if (ent.customer && (ent.customer.status === 'BLOCKED' || ent.customer.status === 'SUSPENDED')) {
        if (ent.customer.blockScope === 'DOWNLOADS' || ent.customer.blockScope === 'FULL' || !ent.customer.blockScope) {
          return res.status(403).json({ success: false, message: 'Your account is restricted from downloading digital files.' });
        }
      }

      if (!prod) {
        return res.status(404).json({ success: false, message: 'Product file not found.' });
      }

      // F. Successful Download Execution
      const newCount = ent.downloadCount + 1;
      const newStatus = (ent.downloadLimit > 0 && newCount >= ent.downloadLimit) ? 'DOWNLOADED' : 'PARTIALLY_DOWNLOADED';

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
            bytesStreamed: BigInt(1048576 * 5), // Estimated 5MB
            ipAddress: clientIp,
            userAgent
          }
        })
      ]);

      // Stream / Deliver File securely
      const fileName = `${prod.slug || 'kdw-download'}-v${ent.productVersion || '1.0'}.zip`;
      res.setHeader('Content-disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-type', 'application/zip');
      res.setHeader('X-KDW-Entitlement-ID', ent.id);
      res.setHeader('X-KDW-Download-Count', String(newCount));
      res.setHeader('X-KDW-Download-Limit', String(ent.downloadLimit));

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
      return res.status(404).json({ success: false, message: 'Invalid or expired download link.' });
    }

    if (new Date() > new Date(legacyToken.expiresAt)) {
      return res.status(403).json({ success: false, message: 'Download link has expired.' });
    }

    if (legacyToken.purchase.order && legacyToken.purchase.order.paymentStatus !== 'PAID') {
      return res.status(403).json({ success: false, message: 'Order is not paid.' });
    }

    const legacyProduct = legacyToken.purchase.product || legacyToken.purchase.bundle?.products?.[0];
    if (!legacyProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
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
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const purchases = await prisma.purchase.findMany({
      where: { customerId: userId },
      include: {
        product: true,
        bundle: {
          include: { products: true }
        },
        order: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedPurchases = purchases.map(p => {
      if (p.bundle) {
        return {
          id: p.id,
          bundleId: p.bundleId,
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
          licenseAvailable: false,
          invoiceAvailable: true,
          bundleProducts: p.bundle.products.map(bp => ({
            id: bp.id,
            name: bp.name,
            fileSize: bp.fileSize || 'Unknown',
            productId: bp.id
          }))
        };
      } else if (p.product) {
        return {
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
          invoiceAvailable: true
        };
      }
      return null;
    }).filter(Boolean);

    res.json({
      success: true,
      purchases: formattedPurchases
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: userId, paymentStatus: 'PAID' },
      orderBy: { createdAt: 'desc' }
    });

    const formattedInvoices = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      date: new Date(o.createdAt).toLocaleDateString(),
      amount: o.totalAmount,
      currency: o.currency,
      status: o.paymentStatus
    }));

    res.json({ success: true, invoices: formattedInvoices });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const orderId = req.params.orderId as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId: userId, paymentStatus: 'PAID' },
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
    doc.fontSize(10).text('INVOICE', { align: 'right' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(12).text('Billed To:');
    doc.fontSize(10).text(order.customer?.name || order.guestName || 'Customer');
    doc.text(order.customer?.email || order.guestEmail || 'N/A');
    if (order.customer?.mobile || order.guestMobile) {
      doc.text(order.customer?.mobile || order.guestMobile || '');
    }
    doc.moveDown();

    // Order Info
    doc.text(`Invoice No: INV-${order.orderNumber}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    // Items
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);

    order.items.forEach(item => {
      doc.fontSize(10).text(`${item.productName} (Qty: ${item.quantity}) - ${order.currency} ${item.unitPrice.toFixed(2)}`);
    });

    doc.moveDown(2);
    doc.fontSize(14).text(`Total: ${order.currency} ${order.totalAmount.toFixed(2)}`, { align: 'right' });

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
