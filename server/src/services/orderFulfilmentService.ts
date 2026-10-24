import crypto from 'crypto';
import { prisma } from '../database/db';
import { sendDigitalProductDeliveryEmail } from '../utils/emailService';
import { resolveProductDriveUrl } from '../controllers/licenceVerificationController';

export interface FulfilmentActor {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
}

export class OrderFulfilmentService {
  /**
   * Idempotently fulfils an order, creating all product & bundle entitlements,
   * component records, licence keys, and sending the access delivery email.
   */
  static async fulfilOrder(orderId: string, actor: FulfilmentActor = { name: 'Automated System', email: 'system@kdw.com' }) {
    console.log(`[OrderFulfilmentService] Starting fulfilment for Order ID: ${orderId}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
                    product: {
                      include: { category: true }
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          }
        },
        bundleEntitlements: true,
        componentEntitlements: true,
        licenceKeys: true,
        purchases: true
      }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const recipientEmail = (order.guestEmail || order.customer?.email || '').trim().toLowerCase();
    if (!recipientEmail) {
      throw new Error(`Cannot fulfil order ${orderId}: missing recipient email.`);
    }

    const deliveryLinksList: Array<{
      productId: string;
      productName: string;
      downloadUrl: string;
      version?: string;
      licenceKey?: string;
      isBundleComponent?: boolean;
    }> = [];

    // Begin Database Transaction for Atomic Entitlement & Licence Creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Order fulfilment status to PROCESSING
      await tx.order.update({
        where: { id: order.id },
        data: {
          fulfilmentStatus: 'PROCESSING',
          orderStatus: order.orderStatus === 'PAID' ? 'FULFILMENT_PROCESSING' : order.orderStatus,
          lastFulfilmentAttemptAt: new Date()
        }
      });

      // Record Timeline Event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'FULFILMENT_STARTED',
          actorType: actor.role ? 'ADMIN' : 'SYSTEM',
          actorName: actor.name || 'System Fulfilment Engine',
          actorEmail: actor.email,
          status: 'PENDING',
          description: `Fulfilment execution initiated for ${order.items.length} order items.`
        }
      });

      // 2. Process each purchased item
      for (const item of order.items) {
        // CASE A: Standard Digital Product
        if (item.productId && item.product) {
          const product = item.product;
          const targetCustomerId = order.customerId || null;

          // Idempotent Purchase check
          let purchase = order.purchases.find(p => p.productId === product.id);
          if (!purchase && targetCustomerId) {
            purchase = await tx.purchase.create({
              data: {
                customerId: targetCustomerId,
                productId: product.id,
                orderId: order.id,
                accessStatus: 'ACTIVE',
                downloadCount: 0
              }
            });
          }

          // 1. Generate Licence Key if required
          let licenceKeyStr = '';
          let licenceRecord = order.licenceKeys.find(l => l.productId === product.id);

          if (!licenceRecord) {
            const cleanOrderPart = order.orderNumber.replace(/[^A-Z0-9]/g, '');
            const cleanProdPart = (product.slug || product.id).replace(/[^A-Z0-9]/gi, '').substring(0, 6).toUpperCase();
            const rawKey = `KDW-${product.licenceType || 'PERS'}-${cleanOrderPart}-${cleanProdPart || crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

            licenceRecord = await tx.licenceKey.create({
              data: {
                orderId: order.id,
                orderItemId: item.id,
                productId: product.id,
                customerId: targetCustomerId,
                keyMasked: rawKey,
                keyHash,
                licenceType: product.licenceType || 'PERSONAL',
                status: 'ACTIVE',
                activationLimit: product.activationLimit || 1,
                domainLimit: product.domainLimit || 1,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              }
            });
            licenceKeyStr = rawKey;
          } else if (licenceRecord) {
            licenceKeyStr = licenceRecord.keyMasked;
          }

          // 2. Stage 6: Access & Download Policies Evaluation
          const downloadLimit = (product.downloadLimit === 999999 || product.downloadLimit === 0) 
            ? 999999 
            : (product.downloadLimit !== null && product.downloadLimit !== undefined ? product.downloadLimit : 5);

          const accessExpiresAt = (product.accessDurationDays === 999999 || !product.accessDurationDays)
            ? null
            : new Date(Date.now() + product.accessDurationDays * 24 * 60 * 60 * 1000);

          const tokenDurationMinutes = product.tokenDurationMinutes || 60;
          const tokenExpiry = new Date(Date.now() + tokenDurationMinutes * 60 * 1000);

          // 3. Idempotent DigitalEntitlement creation
          let digitalEntitlement = await tx.digitalEntitlement.findFirst({
            where: { orderId: order.id, productId: product.id }
          });

          if (!digitalEntitlement) {
            digitalEntitlement = await tx.digitalEntitlement.create({
              data: {
                orderId: order.id,
                orderItemId: item.id,
                customerId: targetCustomerId,
                customerEmail: recipientEmail,
                productId: product.id,
                productVersion: product.version || '1.0.0',
                status: 'ACTIVE',
                downloadLimit,
                downloadCount: 0,
                accessExpiresAt,
                licenceId: licenceRecord?.id || null
              }
            });
          }

          // 4. Generate Secure Download Token for customer delivery
          const secureToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = crypto.createHash('sha256').update(secureToken).digest('hex');

          await tx.downloadToken.create({
            data: {
              entitlementId: digitalEntitlement.id,
              tokenHash,
              secureToken,
              status: 'ACTIVE',
              expiresAt: tokenExpiry
            }
          });

          // 5. Backwards-compatible AccessToken
          if (purchase) {
            await tx.accessToken.create({
              data: {
                purchaseId: purchase.id,
                secureToken,
                expiresAt: tokenExpiry
              }
            });
          }

          // 6. Build Secure Metered Delivery Link
          const baseAppUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const secureDeliveryUrl = `${baseAppUrl}/api/purchases/download/${secureToken}`;
          const targetDriveUrl = resolveProductDriveUrl(product);

          deliveryLinksList.push({
            productId: product.id,
            productName: product.name,
            downloadUrl: secureDeliveryUrl || targetDriveUrl,
            version: product.version || '1.0.0',
            licenceKey: licenceKeyStr
          });
        }

        // CASE B: Curated Multi-Product Bundle
        if (item.bundleId && item.bundle) {
          const bundle = item.bundle;
          const targetCustomerId = order.customerId || null;

          // 1. Parent Bundle Entitlement & Official Licence Key (Idempotent)
          let parentEntitlement = order.bundleEntitlements.find(be => be.bundleId === bundle.id);
          const bundleToken = crypto.randomBytes(24).toString('hex');
          const tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

          let bundleLicenceRecord = order.licenceKeys.find(l => l.orderItemId === item.id);
          let bundleLicenceKeyStr = '';
          if (!bundleLicenceRecord) {
            const cleanOrderPart = order.orderNumber.replace(/[^A-Z0-9]/g, '');
            const cleanBundlePart = (bundle.slug || bundle.id).replace(/[^A-Z0-9]/gi, '').substring(0, 6).toUpperCase();
            bundleLicenceKeyStr = `KDW-BNDL-${cleanOrderPart}-${cleanBundlePart || crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const keyHash = crypto.createHash('sha256').update(bundleLicenceKeyStr).digest('hex');

            bundleLicenceRecord = await tx.licenceKey.create({
              data: {
                orderId: order.id,
                orderItemId: item.id,
                customerId: targetCustomerId,
                keyMasked: bundleLicenceKeyStr,
                keyHash,
                licenceType: bundle.licenceType || 'PERSONAL',
                status: 'ACTIVE',
                activationLimit: 5,
                domainLimit: 5,
                expiresAt: tokenExpiry
              }
            });
          } else {
            bundleLicenceKeyStr = bundleLicenceRecord.keyMasked;
          }

          if (!parentEntitlement && targetCustomerId) {
            parentEntitlement = await tx.bundleEntitlement.create({
              data: {
                bundleId: bundle.id,
                customerId: targetCustomerId,
                orderId: order.id,
                orderItemId: item.id,
                status: 'ACTIVE',
                licenceType: bundle.licenceType || 'PERSONAL',
                downloadLimit: 20,
                secureDownloadToken: bundleToken,
                tokenExpiresAt: tokenExpiry
              }
            });
          }

          // 2. Child Component Entitlements for all bundled products
          const bundleComponents = bundle.bundleItems || [];
          for (const bi of bundleComponents) {
            const compProduct = bi.product;
            if (!compProduct) continue;

            const compDownloadLimit = (compProduct.downloadLimit === 999999 || compProduct.downloadLimit === 0)
              ? 999999
              : (compProduct.downloadLimit !== null && compProduct.downloadLimit !== undefined ? compProduct.downloadLimit : 10);

            const compAccessExpiresAt = (compProduct.accessDurationDays === 999999 || !compProduct.accessDurationDays)
              ? null
              : new Date(Date.now() + compProduct.accessDurationDays * 24 * 60 * 60 * 1000);

            const compTokenDuration = compProduct.tokenDurationMinutes || 60;
            const compTokenExpiry = new Date(Date.now() + compTokenDuration * 60 * 1000);

            let compDigitalEnt = await tx.digitalEntitlement.findFirst({
              where: { orderId: order.id, productId: compProduct.id, bundleId: bundle.id }
            });

            if (!compDigitalEnt) {
              compDigitalEnt = await tx.digitalEntitlement.create({
                data: {
                  orderId: order.id,
                  orderItemId: item.id,
                  customerId: targetCustomerId,
                  customerEmail: recipientEmail,
                  productId: compProduct.id,
                  bundleId: bundle.id,
                  productVersion: compProduct.version || bi.versionSnapshot || '1.0.0',
                  licenceType: bi.licencePolicySnapshot || 'PERSONAL',
                  downloadLimit: compDownloadLimit,
                  downloadCount: 0,
                  status: 'ACTIVE',
                  accessExpiresAt: compAccessExpiresAt
                }
              });
            }

            const compSecureToken = crypto.randomBytes(32).toString('hex');
            const compTokenHash = crypto.createHash('sha256').update(compSecureToken).digest('hex');

            await tx.downloadToken.create({
              data: {
                entitlementId: compDigitalEnt.id,
                tokenHash: compTokenHash,
                secureToken: compSecureToken,
                status: 'ACTIVE',
                expiresAt: compTokenExpiry
              }
            });

            const baseAppUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const compSecureDeliveryUrl = `${baseAppUrl}/api/purchases/download/${compSecureToken}`;
            const compTargetDriveUrl = resolveProductDriveUrl(compProduct);

            deliveryLinksList.push({
              productId: compProduct.id,
              productName: `${bundle.title} → ${compProduct.name}`,
              downloadUrl: compSecureDeliveryUrl || compTargetDriveUrl,
              version: compProduct.version || '1.0.0',
              licenceKey: bundleLicenceKeyStr,
              isBundleComponent: true
            });
          }
        }
      }

      // 3. Create or Update DigitalDelivery Records
      const existingDelivery = await tx.digitalDelivery.findFirst({
        where: { orderId: order.id }
      });

      if (!existingDelivery) {
        const delivery = await tx.digitalDelivery.create({
          data: {
            orderId: order.id,
            customerId: order.customerId || null,
            customerEmail: recipientEmail,
            deliveryType: 'GOOGLE_DRIVE',
            deliveryLink: deliveryLinksList[0]?.downloadUrl || null,
            bundleProductCount: deliveryLinksList.length,
            deliveryStatus: 'SENT',
            emailStatus: 'PENDING',
            paymentVerifiedAt: new Date()
          }
        });

        for (let idx = 0; idx < deliveryLinksList.length; idx++) {
          const item = deliveryLinksList[idx];
          await tx.digitalDeliveryItem.create({
            data: {
              deliveryId: delivery.id,
              productId: item.productId,
              productName: item.productName,
              deliveryLink: item.downloadUrl,
              displayOrder: idx + 1,
              deliveryStatus: 'SENT'
            }
          });
        }
      }

      // 4. Mark Order as FULFILLED and access ACTIVE
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'FULFILLED',
          fulfilmentStatus: 'FULFILLED',
          accessStatus: 'ACTIVE',
          licenceStatus: deliveryLinksList.some(d => d.licenceKey) ? 'ISSUED' : 'NOT_REQUIRED',
          fulfilledAt: new Date(),
          emailDeliveryStatus: 'SENT',
          emailSentAt: new Date(),
          fulfilmentRetryCount: { increment: 1 }
        }
      });

      // Record Completion Timeline Event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'FULFILMENT_COMPLETED',
          actorType: actor.role ? 'ADMIN' : 'SYSTEM',
          actorName: actor.name || 'System Fulfilment Engine',
          actorEmail: actor.email,
          status: 'SUCCESS',
          description: `Order successfully fulfilled with ${deliveryLinksList.length} deliverable products/components.`
        }
      });

      // Record Audit Log
      await tx.orderAuditLog.create({
        data: {
          orderId: order.id,
          actorId: actor.id || null,
          actorEmail: actor.email || 'system@kdw.com',
          actorRole: actor.role || 'SUPER_ADMIN',
          action: 'FULFILMENT_COMPLETED',
          reason: `Fulfilment executed by ${actor.name || 'System'}`
        }
      });

      return updatedOrder;
    });

    // 5. Send Transactional Access Delivery Email
    try {
      const primaryLicence = deliveryLinksList.find(d => d.licenceKey)?.licenceKey;
      const mailResult = await sendDigitalProductDeliveryEmail({
        recipientEmail,
        customerName: order.guestName || order.customer?.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        licenceKey: primaryLicence,
        items: deliveryLinksList.map(d => ({
          name: d.productName,
          driveUrl: d.downloadUrl,
          licenceKey: d.licenceKey
        })),
        isVerified: false
      });
      if (!mailResult.success && !mailResult.skipped) {
        throw new Error(mailResult.error?.message || 'SMTP delivery failed');
      }
      console.log(`[OrderFulfilmentService] Access email dispatched successfully to ${recipientEmail}`);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          emailDeliveryStatus: 'SENT',
          emailSentAt: new Date(),
          emailLastError: null
        }
      });
    } catch (mailErr: any) {
      console.error(`[OrderFulfilmentService] Email delivery warning for Order ${order.orderNumber}:`, mailErr.message);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          emailDeliveryStatus: 'FAILED',
          emailLastError: mailErr.message || 'Email delivery failed'
        }
      });
    }

    return {
      success: true,
      order: result,
      deliveredItemsCount: deliveryLinksList.length
    };
  }
}
