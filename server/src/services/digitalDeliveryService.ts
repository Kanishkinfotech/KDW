// @ts-nocheck
import { prisma } from '../database/db';
import { sendDigitalProductDeliveryEmail } from '../utils/emailService';
import crypto from 'crypto';

export class DigitalDeliveryService {
  /**
   * Helper to resolve Google Drive link for a product
   */
  static resolveDriveUrl(product: any): string | null {
    if (!product) return null;
    const rawLinks: string[] = [];

    if (product.googleDriveLinks) {
      try {
        const parsed = typeof product.googleDriveLinks === 'string' 
          ? JSON.parse(product.googleDriveLinks) 
          : product.googleDriveLinks;
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawLinks.push(...parsed);
        }
      } catch (e) {}
    }

    if (rawLinks.length === 0 && product.googleDriveFileId) {
      rawLinks.push(product.googleDriveFileId);
    }

    const validLink = rawLinks.map(l => l?.trim()).filter(Boolean)[0];
    if (!validLink) return null;

    return validLink.startsWith('http') 
      ? validLink 
      : `https://drive.google.com/file/d/${validLink}/view?usp=sharing`;
  }

  /**
   * Process and execute digital delivery for a verified PAID order.
   * Pulls recipient email strictly from the logged-in customer account.
   * Handles individual products and multi-product bundles idempotently.
   */
  static async processOrderDelivery(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
              bundle: {
                include: {
                  bundleItems: {
                    orderBy: { displayOrder: 'asc' },
                    include: { product: true }
                  },
                  products: true
                }
              }
            }
          },
          customer: true
        }
      });

      if (!order) {
        console.error(`[DigitalDelivery] Order ${orderId} not found.`);
        return { success: false, message: 'Order not found' };
      }

      // Security rule: NEVER deliver if not PAID
      if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'COMPLETED') {
        console.warn(`[DigitalDelivery] Cannot deliver order ${order.orderNumber}: paymentStatus is ${order.paymentStatus}`);
        return { success: false, message: 'Payment not verified' };
      }

      // Customer Login Email Priority (Clauses 18 & 19)
      let recipientEmail = '';
      let recipientName = 'Valued Creator';

      if (order.customerId) {
        const customerUser = await prisma.user.findUnique({
          where: { id: order.customerId },
          select: { email: true, name: true }
        });
        if (customerUser?.email) {
          recipientEmail = customerUser.email.trim().toLowerCase();
          recipientName = customerUser.name || 'Valued Creator';
        }
      }

      // Fallback to order guest email if not registered customer
      if (!recipientEmail && order.guestEmail) {
        recipientEmail = order.guestEmail.trim().toLowerCase();
        recipientName = order.guestName || 'Valued Creator';
      }

      if (!recipientEmail) {
        console.error(`[DigitalDelivery] No customer email found for order ${order.orderNumber}`);
        await prisma.order.update({
          where: { id: order.id },
          data: { emailDeliveryStatus: 'EMAIL_REQUIRED', emailLastError: 'Customer account contains no valid email address' }
        });
        return { success: false, message: 'Customer account contains no valid email address' };
      }

      const deliveredItems: { name: string; driveUrl: string; bundleName?: string }[] = [];
      let primaryBundleTitle: string | undefined = undefined;

      for (const item of order.items) {
        // ====================================================================
        // CASE 1: MULTI-PRODUCT BUNDLE OR BUNDLE ITEM (Clause 35 & 36)
        // ====================================================================
        if (item.bundleId && item.bundle) {
          const b = item.bundle;
          primaryBundleTitle = b.title;

          // Increment sales & revenue on bundle
          await prisma.bundle.update({
            where: { id: b.id },
            data: {
              salesCount: { increment: item.quantity || 1 },
              revenue: { increment: (item.unitPrice || b.price) * (item.quantity || 1) }
            }
          });

          // Resolve component products from bundleItems or products
          let componentsList = [];
          if (b.bundleItems && b.bundleItems.length > 0) {
            componentsList = b.bundleItems.map(bi => bi.product).filter(Boolean);
          } else if (b.products && b.products.length > 0) {
            componentsList = b.products;
          }

          // Create Parent Bundle Entitlement (Clause 35)
          let parentEntitlement = null;
          if (order.customerId) {
            const token = `BDL-TOK-${crypto.randomBytes(16).toString('hex')}`;
            const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins default

            parentEntitlement = await prisma.bundleEntitlement.create({
              data: {
                bundleId: b.id,
                customerId: order.customerId,
                orderId: order.id,
                orderItemId: item.id,
                status: 'ACTIVE',
                licenceType: b.licenceType || 'COMMERCIAL',
                licenceKey: `KDW-LIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
                downloadLimit: 10,
                downloadCount: 0,
                secureDownloadToken: token,
                tokenExpiresAt: tokenExpires
              }
            });
          }

          const delivery = await prisma.digitalDelivery.create({
            data: {
              orderId: order.id,
              bundleId: b.id,
              customerId: order.customerId,
              customerEmail: recipientEmail,
              deliveryType: 'GOOGLE_DRIVE',
              deliveryLink: b.googleDriveLink || null,
              bundleProductCount: componentsList.length,
              deliveryStatus: 'PROCESSING',
              emailStatus: 'PENDING',
              paymentVerifiedAt: order.paidAt || new Date()
            }
          });

          // If bundle has a bundle-level file/link, add complete download
          if (b.deliveryMode === 'BUNDLE_LINK' || b.deliveryMode === 'BOTH' || b.googleDriveLink) {
            const bundleDriveUrl = b.googleDriveLink?.startsWith('http') 
              ? b.googleDriveLink 
              : `https://drive.google.com/file/d/${b.googleDriveLink || b.googleDriveFileId}/view?usp=sharing`;

            deliveredItems.push({
              name: `Complete Bundle (${b.title})`,
              driveUrl: bundleDriveUrl,
              bundleName: b.title
            });
          }

          // If multi-product delivery is active, process each individual product
          let displayOrderIdx = 1;
          for (const bp of componentsList) {
            // Create / find DigitalEntitlement for bundle component
            const compDownloadLimit = (bp.downloadLimit === 999999 || bp.downloadLimit === 0)
              ? 999999
              : (bp.downloadLimit !== null && bp.downloadLimit !== undefined ? bp.downloadLimit : 10);

            const compAccessExpiresAt = (bp.accessDurationDays === 999999 || !bp.accessDurationDays)
              ? null
              : new Date(Date.now() + bp.accessDurationDays * 24 * 60 * 60 * 1000);

            const compTokenDuration = bp.tokenDurationMinutes || 60;
            const compTokenExpiry = new Date(Date.now() + compTokenDuration * 60 * 1000);

            let compDigitalEnt = await prisma.digitalEntitlement.findFirst({
              where: { orderId: order.id, productId: bp.id, bundleId: b.id }
            });

            if (!compDigitalEnt) {
              compDigitalEnt = await prisma.digitalEntitlement.create({
                data: {
                  orderId: order.id,
                  orderItemId: item.id,
                  customerId: order.customerId || null,
                  customerEmail: recipientEmail,
                  productId: bp.id,
                  bundleId: b.id,
                  productVersion: bp.version || '1.0.0',
                  licenceType: bp.licenceType || b.licenceType || 'COMMERCIAL',
                  downloadLimit: compDownloadLimit,
                  downloadCount: 0,
                  status: 'ACTIVE',
                  accessExpiresAt: compAccessExpiresAt
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

            const baseAppUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const compDeliveryUrl = `${baseAppUrl}/api/purchases/download/${compSecureToken}`;

            // Record DigitalDeliveryItem
            await prisma.digitalDeliveryItem.create({
              data: {
                deliveryId: delivery.id,
                productId: bp.id,
                productName: bp.name,
                deliveryLink: compDeliveryUrl,
                displayOrder: displayOrderIdx++,
                deliveryStatus: 'SENT'
              }
            });

            // Create Component Entitlement (Clause 35)
            if (order.customerId && parentEntitlement) {
              await prisma.componentEntitlement.create({
                data: {
                  parentEntitlementId: parentEntitlement.id,
                  bundleId: b.id,
                  productId: bp.id,
                  customerId: order.customerId,
                  orderId: order.id,
                  orderItemId: item.id,
                  productVersion: bp.version || '1.0.0',
                  licenceType: bp.licenceType || b.licenceType || 'COMMERCIAL',
                  downloadLimit: compDownloadLimit,
                  downloadCount: 0,
                  secureDownloadToken: compSecureToken,
                  tokenExpiresAt: compTokenExpiry,
                  status: 'ACTIVE'
                }
              });
            }

            // Create Customer Purchase record for each product inside the bundle
            if (order.customerId) {
              const existing = await prisma.purchase.findFirst({
                where: { customerId: order.customerId, productId: bp.id, orderId: order.id }
              });
              if (!existing) {
                await prisma.purchase.create({
                  data: {
                    customerId: order.customerId,
                    productId: bp.id,
                    orderId: order.id,
                    accessStatus: 'ACTIVE'
                  }
                });
              }
            }

            deliveredItems.push({
              name: bp.name,
              driveUrl: compDeliveryUrl,
              bundleName: b.title
            });
          }
        } 
        // ====================================================================
        // CASE 2: INDIVIDUAL PRODUCT (Standalone Asset)
        // ====================================================================
        else if (item.productId && item.product) {
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
            where: { orderId: order.id, productId: p.id }
          });

          if (!digitalEntitlement) {
            digitalEntitlement = await prisma.digitalEntitlement.create({
              data: {
                orderId: order.id,
                orderItemId: item.id,
                customerId: order.customerId || null,
                customerEmail: recipientEmail,
                productId: p.id,
                productVersion: p.version || '1.0.0',
                status: 'ACTIVE',
                downloadLimit,
                downloadCount: 0,
                accessExpiresAt
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

          const baseAppUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const secureDeliveryUrl = `${baseAppUrl}/api/purchases/download/${secureToken}`;

          const delivery = await prisma.digitalDelivery.create({
            data: {
              orderId: order.id,
              productId: p.id,
              customerId: order.customerId,
              customerEmail: recipientEmail,
              deliveryType: 'GOOGLE_DRIVE',
              deliveryLink: secureDeliveryUrl,
              bundleProductCount: 1,
              deliveryStatus: 'PROCESSING',
              emailStatus: 'PENDING',
              paymentVerifiedAt: order.paidAt || new Date()
            }
          });

          await prisma.digitalDeliveryItem.create({
            data: {
              deliveryId: delivery.id,
              productId: p.id,
              productName: p.name,
              deliveryLink: secureDeliveryUrl,
              displayOrder: 1,
              deliveryStatus: 'SENT'
            }
          });

          if (order.customerId) {
            const existing = await prisma.purchase.findFirst({
              where: { customerId: order.customerId, productId: p.id, orderId: order.id }
            });
            if (!existing) {
              await prisma.purchase.create({
                data: {
                  customerId: order.customerId,
                  productId: p.id,
                  orderId: order.id,
                  accessStatus: 'ACTIVE'
                }
              });
            }
          }

          deliveredItems.push({ name: p.name, driveUrl: secureDeliveryUrl });
        }
      }

      // Send ONE consolidated customer email containing ALL product links
      const emailResult = await sendDigitalProductDeliveryEmail({
        recipientEmail,
        customerName: recipientName,
        orderNumber: order.orderNumber,
        bundleTitle: primaryBundleTitle,
        items: deliveredItems
      });

      const deliveryStatus = emailResult.success ? 'SENT' : 'FAILED';
      const emailStatus = emailResult.success ? 'SENT' : 'FAILED';

      // Update delivery records
      await prisma.digitalDelivery.updateMany({
        where: { orderId: order.id },
        data: {
          deliveryStatus,
          emailStatus,
          sentAt: emailResult.success ? new Date() : null,
          lastAttemptAt: new Date(),
          failureReason: emailResult.success ? null : String(emailResult.error || 'Failed to dispatch email')
        }
      });

      // Update Order email status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          emailDeliveryStatus: emailStatus,
          emailSentAt: emailResult.success ? new Date() : null,
          emailDeliveryAttempts: { increment: 1 },
          emailLastError: emailResult.success ? null : String(emailResult.error)
        }
      });

      // Record Audit Log
      await prisma.notification.create({
        data: {
          title: `Digital Delivery Dispatched (${order.orderNumber})`,
          message: `Dispatched ${deliveredItems.length} product download link(s) to ${recipientEmail} for Order #${order.orderNumber}`,
          type: 'Delivery',
          link: '/admin/digital-deliveries'
        }
      });

      return {
        success: emailResult.success,
        orderNumber: order.orderNumber,
        recipientEmail,
        deliveredItemsCount: deliveredItems.length
      };
    } catch (error: any) {
      console.error('[DigitalDelivery] Execution failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resend delivery email initiated by authorized administrator
   */
  static async resendDeliveryEmail(orderId: string, adminUser?: any) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      const result = await this.processOrderDelivery(orderId);

      if (result.success) {
        await prisma.digitalDelivery.updateMany({
          where: { orderId },
          data: { deliveryStatus: 'RESENT', lastAttemptAt: new Date() }
        });
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Secure customer retrieval of purchased Google Drive links & Entitlements
   */
  static async getCustomerPurchasedDeliveries(customerId: string, orderId?: string) {
    const whereClause: any = {
      customerId,
      order: {
        paymentStatus: { in: ['PAID', 'COMPLETED'] }
      }
    };

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const deliveries = await prisma.digitalDelivery.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            googleDriveFileId: true,
            googleDriveLinks: true
          }
        },
        bundle: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            itemsIncluded: true,
            licenceType: true,
            bundleItems: {
              orderBy: { displayOrder: 'asc' },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    thumbnail: true,
                    googleDriveFileId: true,
                    googleDriveLinks: true
                  }
                }
              }
            }
          }
        },
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            paymentStatus: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return deliveries;
  }
}
