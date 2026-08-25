import crypto from 'crypto';
import { prisma } from '../database/db';
import { sendDigitalProductDeliveryEmail } from '../utils/emailService';

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

          // Generate or retrieve Secure Download Token
          const secureToken = crypto.randomBytes(24).toString('hex');
          const tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 Year Access
          
          if (purchase) {
            await tx.accessToken.create({
              data: {
                purchaseId: purchase.id,
                secureToken,
                expiresAt: tokenExpiry
              }
            });
          }

          // Generate Licence Key if required
          let licenceKeyStr = '';
          const needsLicence = product.licenceKeyRequired || Boolean(product.licenceType);
          const existingLicence = order.licenceKeys.find(l => l.productId === product.id);

          if (!existingLicence && needsLicence) {
            const rawKey = `KDW-${product.licenceType || 'COMM'}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            const keyMasked = `${rawKey.substring(0, 8)}****-****-${rawKey.slice(-4)}`;
            const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

            await tx.licenceKey.create({
              data: {
                orderId: order.id,
                orderItemId: item.id,
                productId: product.id,
                customerId: targetCustomerId,
                keyMasked,
                keyHash,
                licenceType: product.licenceType || 'COMMERCIAL',
                status: 'ACTIVE',
                activationLimit: product.activationLimit || 1,
                domainLimit: product.domainLimit || 1,
                expiresAt: tokenExpiry
              }
            });
            licenceKeyStr = keyMasked;
          } else if (existingLicence) {
            licenceKeyStr = existingLicence.keyMasked;
          }

          // Build digital delivery link
          let finalLink = '';
          if (product.googleDriveFileId && product.googleDriveFileId.trim() !== '') {
            finalLink = `https://drive.google.com/file/d/${product.googleDriveFileId}/view?usp=sharing`;
          } else if (Array.isArray(product.googleDriveLinks) && product.googleDriveLinks.length > 0) {
            finalLink = String(product.googleDriveLinks[0]);
          }

          deliveryLinksList.push({
            productId: product.id,
            productName: product.name,
            downloadUrl: finalLink || `http://localhost:5173/account/downloads?order=${order.orderNumber}`,
            version: product.version || '1.0.0',
            licenceKey: licenceKeyStr
          });
        }

        // CASE B: Curated Multi-Product Bundle
        if (item.bundleId && item.bundle) {
          const bundle = item.bundle;
          const targetCustomerId = order.customerId || null;

          // 1. Parent Bundle Entitlement (Idempotent)
          let parentEntitlement = order.bundleEntitlements.find(be => be.bundleId === bundle.id);
          const bundleToken = crypto.randomBytes(24).toString('hex');
          const tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

          if (!parentEntitlement && targetCustomerId) {
            parentEntitlement = await tx.bundleEntitlement.create({
              data: {
                bundleId: bundle.id,
                customerId: targetCustomerId,
                orderId: order.id,
                orderItemId: item.id,
                status: 'ACTIVE',
                licenceType: bundle.licenceType || 'COMMERCIAL',
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

            const existingCompEntitlement = order.componentEntitlements.find(
              ce => ce.bundleId === bundle.id && ce.productId === compProduct.id
            );

            const compToken = crypto.randomBytes(24).toString('hex');

            if (!existingCompEntitlement && parentEntitlement && targetCustomerId) {
              await tx.componentEntitlement.create({
                data: {
                  parentEntitlementId: parentEntitlement.id,
                  bundleId: bundle.id,
                  productId: compProduct.id,
                  customerId: targetCustomerId,
                  orderId: order.id,
                  orderItemId: item.id,
                  productVersion: compProduct.version || bi.versionSnapshot || '1.0.0',
                  licenceType: bi.licencePolicySnapshot || 'COMMERCIAL',
                  downloadLimit: 10,
                  status: 'ACTIVE',
                  secureDownloadToken: compToken,
                  tokenExpiresAt: tokenExpiry
                }
              });
            }

            // Link for component product
            let compLink = '';
            if (compProduct.googleDriveFileId && compProduct.googleDriveFileId.trim() !== '') {
              compLink = `https://drive.google.com/file/d/${compProduct.googleDriveFileId}/view?usp=sharing`;
            } else if (Array.isArray(compProduct.googleDriveLinks) && compProduct.googleDriveLinks.length > 0) {
              compLink = String(compProduct.googleDriveLinks[0]);
            }

            deliveryLinksList.push({
              productId: compProduct.id,
              productName: `${bundle.title} → ${compProduct.name}`,
              downloadUrl: compLink || `http://localhost:5173/account/downloads?order=${order.orderNumber}`,
              version: compProduct.version || '1.0.0',
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
      await sendDigitalProductDeliveryEmail({
        recipientEmail,
        customerName: order.guestName || order.customer?.name || 'Valued Customer',
        orderNumber: order.orderNumber,
        items: deliveryLinksList.map(d => ({
          name: d.productName,
          driveUrl: d.downloadUrl
        }))
      });
      console.log(`[OrderFulfilmentService] Access email dispatched successfully to ${recipientEmail}`);
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
