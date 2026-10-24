import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import crypto from 'crypto';
import { sendDigitalProductDeliveryEmail } from '../utils/emailService';

/**
 * Resolves the direct Google Drive access URL from product metadata
 */
export const resolveProductDriveUrl = (prod: any): string => {
  if (!prod) return '';
  if (prod.googleDriveFileId && typeof prod.googleDriveFileId === 'string' && prod.googleDriveFileId.trim() !== '') {
    const trimmed = prod.googleDriveFileId.trim();
    return trimmed.startsWith('http')
      ? trimmed
      : `https://drive.google.com/file/d/${trimmed}/view?usp=sharing`;
  }
  if (prod.googleDriveLinks) {
    try {
      const parsed = typeof prod.googleDriveLinks === 'string' ? JSON.parse(prod.googleDriveLinks) : prod.googleDriveLinks;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
        const link = parsed[0].toString().trim();
        return link.startsWith('http') ? link : `https://drive.google.com/file/d/${link}/view?usp=sharing`;
      }
    } catch (e) {}
  }
  return '';
};

/**
 * POST /api/licences/verify — Verify License Key and Unlock Product Access
 */
export const verifyLicenceKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { licenseKey, key, email } = req.body;
    const rawKey = (licenseKey || key || '').toString().trim();

    if (!rawKey) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid License Key.'
      });
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // 1. Find direct LicenceKey record
    let licence = await prisma.licenceKey.findFirst({
      where: {
        OR: [
          { keyMasked: { equals: rawKey, mode: 'insensitive' } },
          { keyMasked: { contains: rawKey, mode: 'insensitive' } },
          { keyHash: keyHash },
          { id: rawKey }
        ]
      },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: {
                  include: { category: true }
                },
                bundle: {
                  include: {
                    bundleItems: {
                      include: {
                        product: { include: { category: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // 2. If not found by direct match, attempt pattern match from order number or email
    if (!licence) {
      const allOrders = await prisma.order.findMany({
        where: {
          OR: [
            { paymentStatus: 'PAID' },
            { paymentStatus: 'COMPLETED' },
            { orderStatus: 'FULFILLED' },
            { orderStatus: 'COMPLETED' }
          ]
        },
        include: {
          customer: true,
          items: {
            include: {
              product: { include: { category: true } },
              bundle: { include: { bundleItems: { include: { product: true } } } }
            }
          },
          licenceKeys: true
        },
        orderBy: { createdAt: 'desc' },
        take: 150
      });

      for (const ord of allOrders) {
        const cleanOrd = ord.orderNumber.replace(/[^A-Z0-9]/g, '').toUpperCase();
        const cleanInput = rawKey.replace(/[^A-Z0-9]/g, '').toUpperCase();

        const isOrderMatch = cleanInput.includes(cleanOrd) || cleanOrd.includes(cleanInput);
        const isEmailMatch = (email && (ord.customer?.email?.toLowerCase() === email.trim().toLowerCase() || ord.guestEmail?.toLowerCase() === email.trim().toLowerCase())) ||
                             (rawKey.includes('@') && (ord.customer?.email?.toLowerCase() === rawKey.toLowerCase() || ord.guestEmail?.toLowerCase() === rawKey.toLowerCase()));
        const isKeyMatch = ord.licenceKeys.some(lk => {
          const lkClean = lk.keyMasked.replace(/[^A-Z0-9]/g, '').toUpperCase();
          return lkClean === cleanInput || (lkClean.length > 8 && cleanInput.includes(lkClean.slice(-6)));
        });

        if (isOrderMatch || isKeyMatch || isEmailMatch) {
          let matchedLic = ord.licenceKeys[0] || null;
          if (!matchedLic) {
            const autoKey = `KDW-PERS-${cleanOrd}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            matchedLic = await prisma.licenceKey.create({
              data: {
                orderId: ord.id,
                customerId: ord.customerId,
                keyMasked: autoKey,
                keyHash: crypto.createHash('sha256').update(autoKey).digest('hex'),
                licenceType: 'PERSONAL',
                status: 'ACTIVE',
                activationLimit: 5,
                activationCount: 0
              }
            });
          }

          licence = {
            ...matchedLic,
            order: ord
          } as any;
          break;
        }
      }
    }

    if (!licence) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or unrecognized License Key. Please verify the key from your confirmation email or account dashboard.'
      });
    }

    // Check status
    if (licence.status === 'REVOKED' || licence.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: `This license has been ${licence.status.toLowerCase()}. Please contact support for assistance.`
      });
    }

    if (licence.expiresAt && new Date(licence.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'This license key has expired.'
      });
    }    // Mark licence active & increment activation count
    await prisma.licenceKey.update({
      where: { id: licence.id },
      data: {
        activationCount: { increment: 1 },
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    }).catch(() => {});

    // Mark Order licenceStatus = 'VERIFIED' and accessStatus = 'ACTIVE'
    if (licence.orderId) {
      await prisma.order.update({
        where: { id: licence.orderId },
        data: {
          licenceStatus: 'VERIFIED',
          accessStatus: 'ACTIVE',
          updatedAt: new Date()
        }
      }).catch(() => {});

      await prisma.orderTimelineEvent.create({
        data: {
          orderId: licence.orderId,
          eventType: 'LICENCE_VERIFIED',
          actorType: 'CUSTOMER',
          actorEmail: licence.order?.guestEmail || licence.order?.customer?.email || 'customer@kdw.com',
          status: 'SUCCESS',
          description: `Commercial license key verified. Secure download links unlocked and dispatched to email.`
        }
      }).catch(() => {});
    }

    // Find specific product or all items from the order
    const orderItems = licence.order?.items || [];
    const deliverables: any[] = [];
    const customerEmail = licence.order?.guestEmail || licence.order?.customer?.email || 'customer@kdw.com';
    const customerId = licence.order?.customerId || null;
    const baseAppUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const emailDeliveryItems: { name: string; driveUrl: string; bundleName?: string; licenceKey?: string }[] = [];

    for (const item of orderItems) {
      if (item.product) {
        const p = item.product;

        const downloadLimit = (p.downloadLimit === 999999 || p.downloadLimit === 0) 
          ? 999999 
          : (p.downloadLimit !== null && p.downloadLimit !== undefined ? p.downloadLimit : 5);

        const accessExpiresAt = (p.accessDurationDays === 999999 || !p.accessDurationDays)
          ? null
          : new Date(Date.now() + p.accessDurationDays * 24 * 60 * 60 * 1000);

        const tokenDurationMinutes = p.tokenDurationMinutes || 60;
        const tokenExpiry = new Date(Date.now() + tokenDurationMinutes * 60 * 1000);

        let digitalEntitlement = await prisma.digitalEntitlement.findFirst({
          where: { orderId: licence.orderId, productId: p.id }
        });

        if (!digitalEntitlement) {
          digitalEntitlement = await prisma.digitalEntitlement.create({
            data: {
              orderId: licence.orderId,
              orderItemId: item.id,
              customerId,
              customerEmail,
              productId: p.id,
              productVersion: p.version || '1.0.0',
              status: 'ACTIVE',
              downloadLimit,
              downloadCount: 0,
              accessExpiresAt,
              licenceId: licence.id
            }
          });
        }

        const secureToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(secureToken).digest('hex');

        await prisma.downloadToken.create({
          data: {
            entitlementId: digitalEntitlement.id,
            tokenHash,
            secureToken,
            status: 'ACTIVE',
            expiresAt: tokenExpiry
          }
        });

        const targetDriveUrl = resolveProductDriveUrl(p);
        const secureDownloadUrl = `${baseAppUrl}/api/purchases/download/${secureToken}`;

        emailDeliveryItems.push({
          name: p.name,
          driveUrl: targetDriveUrl || secureDownloadUrl,
          licenceKey: licence.keyMasked
        });

        deliverables.push({
          productId: p.id,
          name: p.name,
          title: p.name,
          slug: p.slug,
          category: p.category?.name || 'Digital Asset',
          version: p.version || 'v1.0.0',
          fileSize: p.fileSize || p.driveFileSize || 'Cloud Deliverable',
          tokenExpiresAt: tokenExpiry,
          coverImage: (p as any).thumbnail || (p as any).coverImage || null,
          licenceType: (p as any).licenceType || (licence as any).licenceType || 'PERSONAL',
          deliveryStatus: 'SENT_TO_EMAIL'
        });
      } else if (item.bundle) {
        const b = item.bundle;
        const subItems = b.bundleItems || [];
        for (const bi of subItems) {
          const bp = bi.product;
          if (!bp) continue;

          const compDownloadLimit = (bp.downloadLimit === 999999 || bp.downloadLimit === 0)
            ? 999999
            : (bp.downloadLimit !== null && bp.downloadLimit !== undefined ? bp.downloadLimit : 10);

          const compAccessExpiresAt = (bp.accessDurationDays === 999999 || !bp.accessDurationDays)
            ? null
            : new Date(Date.now() + bp.accessDurationDays * 24 * 60 * 60 * 1000);

          const compTokenDuration = bp.tokenDurationMinutes || 60;
          const compTokenExpiry = new Date(Date.now() + compTokenDuration * 60 * 1000);

          let compDigitalEnt = await prisma.digitalEntitlement.findFirst({
            where: { orderId: licence.orderId, productId: bp.id, bundleId: b.id }
          });

          if (!compDigitalEnt) {
            compDigitalEnt = await prisma.digitalEntitlement.create({
              data: {
                orderId: licence.orderId,
                orderItemId: item.id,
                customerId,
                customerEmail,
                productId: bp.id,
                bundleId: b.id,
                productVersion: bp.version || bi.versionSnapshot || '1.0.0',
                licenceType: bp.licenceType || b.licenceType || 'PERSONAL',
                downloadLimit: compDownloadLimit,
                downloadCount: 0,
                status: 'ACTIVE',
                accessExpiresAt: compAccessExpiresAt,
                licenceId: licence.id
              }
            });
          }

          const compSecureToken = crypto.randomBytes(32).toString('hex');
          const compTokenHash = crypto.createHash('sha256').update(compSecureToken).digest('hex');

          await prisma.downloadToken.create({
            data: {
              entitlementId: compDigitalEnt.id,
              tokenHash: compTokenHash,
              secureToken: compSecureToken,
              status: 'ACTIVE',
              expiresAt: compTokenExpiry
            }
          });

          const compTargetDriveUrl = resolveProductDriveUrl(bp);
          const compSecureDownloadUrl = `${baseAppUrl}/api/purchases/download/${compSecureToken}`;

          emailDeliveryItems.push({
            name: `${b.title} → ${bp.name}`,
            driveUrl: compTargetDriveUrl || compSecureDownloadUrl,
            bundleName: b.title,
            licenceKey: licence.keyMasked
          });

          deliverables.push({
            productId: bp.id,
            name: `${b.title} → ${bp.name}`,
            title: bp.name,
            bundleTitle: b.title,
            slug: bp.slug,
            category: bp.category?.name || 'Bundle Asset',
            version: bp.version || 'v1.0.0',
            fileSize: bp.fileSize || 'Cloud Deliverable',
            tokenExpiresAt: compTokenExpiry,
            coverImage: bp.thumbnail || b.coverImage || null,
            licenceType: b.licenceType || licence.licenceType || 'PERSONAL',
            deliveryStatus: 'SENT_TO_EMAIL'
          });
        }
      }
    }

    // Dispatch secure email with unlocked tokenized download links
    let emailDispatched = false;
    let emailErrorMsg: string | null = null;
    try {
      const emailResult = await sendDigitalProductDeliveryEmail({
        recipientEmail: customerEmail,
        customerName: licence.order?.guestName || licence.order?.customer?.name || 'Valued Customer',
        orderNumber: licence.order?.orderNumber || 'KDW-ORDER',
        bundleTitle: licence.order?.items?.find(i => i.bundle)?.bundle?.title,
        licenceKey: licence.keyMasked,
        items: emailDeliveryItems,
        isVerified: true
      });
      emailDispatched = !!emailResult.success;
      if (!emailResult.success && !emailResult.skipped) {
        emailErrorMsg = emailResult.error?.message || 'Email delivery failed';
      }
    } catch (mailErr: any) {
      console.error('[LicenceVerification] Error sending delivery email:', mailErr);
      emailErrorMsg = mailErr.message;
    }

    // Return verified response
    res.json({
      success: true,
      verified: true,
      message: 'Personal License verified successfully! Your secure download links have been dispatched to your email.',
      data: {
        licenceKey: licence.keyMasked,
        licenceType: licence.licenceType || 'PERSONAL',
        status: 'ACTIVE',
        issuedAt: licence.issuedAt,
        orderNumber: licence.order?.orderNumber,
        customerName: licence.order?.guestName || licence.order?.customer?.name || 'Valued Customer',
        customerEmail,
        activationCount: licence.activationCount + 1,
        activationLimit: licence.activationLimit || 1,
        emailSent: emailDispatched,
        emailError: emailErrorMsg,
        deliverables,
        primaryDeliverable: deliverables[0] || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/licences/resend-email — Resend active time-limited download links to verified customer email
 */
export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { licenseKey, key, orderNumber, email } = req.body;
    const rawKey = (licenseKey || key || orderNumber || '').toString().trim();

    if (!rawKey) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid License Key or Order Number.'
      });
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const licence = await prisma.licenceKey.findFirst({
      where: {
        OR: [
          { keyMasked: { equals: rawKey, mode: 'insensitive' } },
          { keyMasked: { contains: rawKey, mode: 'insensitive' } },
          { keyHash: keyHash },
          { order: { orderNumber: { equals: rawKey, mode: 'insensitive' } } }
        ]
      },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: { include: { category: true } },
                bundle: { include: { bundleItems: { include: { product: true } } } }
              }
            }
          }
        }
      }
    });

    if (!licence || !licence.order) {
      return res.status(404).json({
        success: false,
        message: 'No active license or order found matching the provided key.'
      });
    }

    const order = licence.order;
    const recipientEmail = (email || order.guestEmail || order.customer?.email || '').trim();

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No delivery email address found for this license.'
      });
    }

    // Refresh time-limited download tokens for all items
    const baseAppUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const emailDeliveryItems: { name: string; driveUrl: string; bundleName?: string; licenceKey?: string }[] = [];

    for (const item of order.items) {
      if (item.product) {
        const p = item.product;
        const tokenDurationMinutes = p.tokenDurationMinutes || 60;
        const tokenExpiry = new Date(Date.now() + tokenDurationMinutes * 60 * 1000);

        let ent = await prisma.digitalEntitlement.findFirst({
          where: { orderId: order.id, productId: p.id }
        });

        if (!ent) {
          ent = await prisma.digitalEntitlement.create({
            data: {
              orderId: order.id,
              orderItemId: item.id,
              customerId: order.customerId,
              customerEmail: recipientEmail,
              productId: p.id,
              productVersion: p.version || '1.0.0',
              status: 'ACTIVE',
              downloadLimit: p.downloadLimit || 5,
              downloadCount: 0,
              licenceId: licence.id
            }
          });
        }

        const secureToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(secureToken).digest('hex');

        await prisma.downloadToken.create({
          data: {
            entitlementId: ent.id,
            tokenHash,
            secureToken,
            status: 'ACTIVE',
            expiresAt: tokenExpiry
          }
        });

        const targetDriveUrl = resolveProductDriveUrl(p);
        emailDeliveryItems.push({
          name: p.name,
          driveUrl: targetDriveUrl || `${baseAppUrl}/api/purchases/download/${secureToken}`,
          licenceKey: licence.keyMasked
        });
      } else if (item.bundle) {
        const b = item.bundle;
        const subItems = b.bundleItems || [];
        for (const bi of subItems) {
          const bp = bi.product;
          if (!bp) continue;

          const compTokenDuration = bp.tokenDurationMinutes || 60;
          const compTokenExpiry = new Date(Date.now() + compTokenDuration * 60 * 1000);

          let compEnt = await prisma.digitalEntitlement.findFirst({
            where: { orderId: order.id, productId: bp.id, bundleId: b.id }
          });

          if (!compEnt) {
            compEnt = await prisma.digitalEntitlement.create({
              data: {
                orderId: order.id,
                orderItemId: item.id,
                customerId: order.customerId,
                customerEmail: recipientEmail,
                productId: bp.id,
                bundleId: b.id,
                productVersion: bp.version || '1.0.0',
                licenceType: 'PERSONAL',
                downloadLimit: bp.downloadLimit || 10,
                downloadCount: 0,
                status: 'ACTIVE',
                licenceId: licence.id
              }
            });
          }

          const compSecureToken = crypto.randomBytes(32).toString('hex');
          const compTokenHash = crypto.createHash('sha256').update(compSecureToken).digest('hex');

          await prisma.downloadToken.create({
            data: {
              entitlementId: compEnt.id,
              tokenHash: compTokenHash,
              secureToken: compSecureToken,
              status: 'ACTIVE',
              expiresAt: compTokenExpiry
            }
          });

          const compTargetDriveUrl = resolveProductDriveUrl(bp);
          emailDeliveryItems.push({
            name: `${b.title} → ${bp.name}`,
            driveUrl: compTargetDriveUrl || `${baseAppUrl}/api/purchases/download/${compSecureToken}`,
            bundleName: b.title,
            licenceKey: licence.keyMasked
          });
        }
      }
    }

    const mailResult = await sendDigitalProductDeliveryEmail({
      recipientEmail,
      customerName: order.guestName || order.customer?.name || 'Valued Customer',
      orderNumber: order.orderNumber,
      bundleTitle: order.items.find(i => i.bundle)?.bundle?.title,
      licenceKey: licence.keyMasked,
      items: emailDeliveryItems,
      isVerified: true
    });

    if (!mailResult.success && !mailResult.skipped) {
      return res.status(500).json({
        success: false,
        message: mailResult.error?.message || 'Failed to dispatch email via SMTP server.'
      });
    }

    await prisma.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        eventType: 'ACCESS_RESENT',
        actorType: 'CUSTOMER',
        actorEmail: recipientEmail,
        status: 'SUCCESS',
        description: `Download links resent to ${recipientEmail} with refreshed time-limited tokens.`
      }
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Active download links successfully resent to ${recipientEmail}. Please check your inbox and spam folder.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/licences/verify/:key — GET verification alias
 */
export const getLicenceByKey = async (req: Request, res: Response, next: NextFunction) => {
  req.body.licenseKey = req.params.key;
  return verifyLicenceKey(req, res, next);
};
