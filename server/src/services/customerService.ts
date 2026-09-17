import crypto from 'crypto';
import { prisma } from '../database/db';

export interface CustomerActor {
  id?: string | null;
  name?: string;
  email?: string;
  role?: string;
}

export class CustomerService {
  /**
   * Generates a standard Customer Code (e.g. CUST-20260826-58291)
   */
  static generateCustomerCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    return `CUST-${year}${month}${day}-${randomSuffix}`;
  }

  /**
   * Sanitizes and normalizes an email address
   */
  static normalizeEmail(email?: string | null): string {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  /**
   * Normalizes a phone number to digits only
   */
  static normalizePhone(phone?: string | null): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }

  /**
   * Finds an existing customer or creates a new GUEST customer profile atomically.
   */
  static async findOrCreateGuestCustomer(data: {
    email: string;
    name?: string;
    phone?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const normalized = this.normalizeEmail(data.email);
    if (!normalized) {
      throw new Error('Valid email is required to resolve guest customer');
    }

    let customer = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalized },
          { normalizedEmail: normalized }
        ]
      }
    });

    if (!customer) {
      const customerCode = this.generateCustomerCode();
      customer = await prisma.user.create({
        data: {
          customerCode,
          customerType: 'GUEST',
          email: normalized,
          normalizedEmail: normalized,
          name: data.name?.trim() || 'Guest Customer',
          mobile: data.phone?.trim() || null,
          normalizedPhone: this.normalizePhone(data.phone),
          passwordHash: null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          consents: {
            create: [
              {
                consentType: 'TRANSACTIONAL_EMAIL',
                status: 'OPTED_IN',
                source: 'CHECKOUT',
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
              },
              {
                consentType: 'MARKETING_EMAIL',
                status: 'NOT_REQUESTED',
                source: 'CHECKOUT',
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
              }
            ]
          },
          timelineEvents: {
            create: {
              eventType: 'CUSTOMER_CREATED',
              actorType: 'GUEST',
              actorName: data.name || 'Guest User',
              actorEmail: normalized,
              description: `Guest customer profile established at checkout (${customerCode})`
            }
          }
        }
      });
    }

    return customer;
  }

  /**
   * Claims all eligible guest orders, entitlements, and licences into an authenticated user account.
   */
  static async claimGuestPurchases(authenticatedUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: authenticatedUserId }
    });

    if (!user) {
      throw new Error('Authenticated user account not found');
    }

    if (!user.emailVerified) {
      throw new Error('Email verification is required before claiming guest orders.');
    }

    const normalized = this.normalizeEmail(user.email);

    // Find any guest user accounts with the same email
    const guestAccounts = await prisma.user.findMany({
      where: {
        OR: [{ email: normalized }, { normalizedEmail: normalized }],
        customerType: 'GUEST',
        id: { not: user.id }
      }
    });

    const guestIds = guestAccounts.map(g => g.id);

    // Find all guest orders matching normalized email
    const eligibleOrders = await prisma.order.findMany({
      where: {
        OR: [
          { guestEmail: normalized },
          ...(guestIds.length > 0 ? [{ customerId: { in: guestIds } }] : [])
        ],
        customerId: { not: user.id }
      }
    });

    if (eligibleOrders.length === 0) {
      return {
        success: true,
        claimedOrdersCount: 0,
        message: 'No unclaimed guest orders found for your verified email.'
      };
    }

    const orderIds = eligibleOrders.map(o => o.id);

    // Execute atomic claim transaction
    await prisma.$transaction(async (tx) => {
      // 1. Link Orders to User
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { customerId: user.id, customerType: 'ACCOUNT' }
      });

      // 2. Link Purchases
      await tx.purchase.updateMany({
        where: { orderId: { in: orderIds } },
        data: { customerId: user.id }
      });

      // 3. Link Bundle Entitlements
      await tx.bundleEntitlement.updateMany({
        where: { orderId: { in: orderIds } },
        data: { customerId: user.id }
      });

      // 4. Link Component Entitlements
      await tx.componentEntitlement.updateMany({
        where: { orderId: { in: orderIds } },
        data: { customerId: user.id }
      });

      // 5. Link Licence Keys
      await tx.licenceKey.updateMany({
        where: { orderId: { in: orderIds } },
        data: { customerId: user.id }
      });

      // 6. Link Download History
      await tx.downloadHistory.updateMany({
        where: { orderId: { in: orderIds } },
        data: { customerId: user.id }
      });

      // 7. Link Support Tickets
      await tx.supportTicket.updateMany({
        where: { orderId: { in: orderIds } },
        data: { userId: user.id }
      });

      // 8. Mark guest accounts merged if any
      if (guestIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: guestIds } },
          data: {
            status: 'ANONYMIZED',
            isMerged: true,
            masterCustomerId: user.id,
            anonymizedAt: new Date()
          }
        });
      }

      // 9. Record Timeline Event on Master User
      await tx.customerTimelineEvent.create({
        data: {
          customerId: user.id,
          eventType: 'GUEST_CLAIMED',
          actorType: 'CUSTOMER',
          actorName: user.name,
          actorEmail: user.email,
          description: `Successfully claimed ${eligibleOrders.length} previous guest order(s) and associated entitlements into account.`
        }
      });

      // 10. Record Customer Audit Log
      await tx.customerAuditLog.create({
        data: {
          customerId: user.id,
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'GUEST_CLAIM',
          reason: `Customer verified email and claimed ${eligibleOrders.length} guest orders.`,
          newValue: { claimedOrderIds: orderIds }
        }
      });
    });

    return {
      success: true,
      claimedOrdersCount: eligibleOrders.length,
      message: `Successfully linked ${eligibleOrders.length} guest order(s) to your verified account.`
    };
  }

  /**
   * Merges a duplicate customer profile into a master customer profile atomically.
   */
  static async mergeCustomers(
    masterCustomerId: string,
    duplicateCustomerId: string,
    actor: CustomerActor,
    reason: string
  ) {
    if (masterCustomerId === duplicateCustomerId) {
      throw new Error('Master and Duplicate customer IDs cannot be the same');
    }

    const [master, duplicate] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [
            { id: masterCustomerId },
            { customerCode: masterCustomerId },
            { email: masterCustomerId.trim().toLowerCase() }
          ]
        }
      }),
      prisma.user.findFirst({
        where: {
          OR: [
            { id: duplicateCustomerId },
            { customerCode: duplicateCustomerId },
            { email: duplicateCustomerId.trim().toLowerCase() }
          ]
        }
      })
    ]);

    if (!master || !duplicate) {
      throw new Error('Master or Duplicate customer profile not found');
    }

    if (master.id === duplicate.id) {
      throw new Error('Resolved Master and Duplicate records are the same customer');
    }

    if (duplicate.isMerged) {
      throw new Error('The selected duplicate record has already been merged previously');
    }

    // Atomic Database Merge Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Transfer Orders
      await tx.order.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 2. Transfer Purchases
      await tx.purchase.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 3. Transfer Bundle Entitlements
      await tx.bundleEntitlement.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 4. Transfer Component Entitlements
      await tx.componentEntitlement.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 5. Transfer Licences
      await tx.licenceKey.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 6. Transfer Download History
      await tx.downloadHistory.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 7. Transfer Support Tickets
      await tx.supportTicket.updateMany({
        where: { userId: duplicate.id },
        data: { userId: master.id }
      });

      // 8. Transfer Consents
      await tx.customerConsent.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 9. Transfer Customer Notes
      await tx.customerNote.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 10. Transfer Timeline Events
      await tx.customerTimelineEvent.updateMany({
        where: { customerId: duplicate.id },
        data: { customerId: master.id }
      });

      // 11. Create Customer Alias
      await tx.customerAlias.create({
        data: {
          masterCustomerId: master.id,
          mergedCustomerId: duplicate.id,
          mergedEmail: duplicate.email,
          mergedPhone: duplicate.mobile,
          mergeReason: reason,
          actorId: actor.id || null,
          actorEmail: actor.email || 'admin@kdw.com'
        }
      });

      // 12. Mark duplicate as merged and anonymized
      await tx.user.update({
        where: { id: duplicate.id },
        data: {
          isMerged: true,
          masterCustomerId: master.id,
          status: 'ANONYMIZED',
          anonymizedAt: new Date()
        }
      });

      // 13. Audit Log on Master
      await tx.customerAuditLog.create({
        data: {
          customerId: master.id,
          actorId: actor.id || null,
          actorEmail: actor.email || 'admin@kdw.com',
          actorRole: actor.role || 'SUPER_ADMIN',
          action: 'MERGE',
          reason,
          newValue: { mergedDuplicateId: duplicate.id, duplicateEmail: duplicate.email }
        }
      });

      // 14. Timeline Event on Master
      await tx.customerTimelineEvent.create({
        data: {
          customerId: master.id,
          eventType: 'MERGED',
          actorType: 'ADMIN',
          actorName: actor.name || 'Admin',
          actorEmail: actor.email,
          description: `Merged duplicate profile (${duplicate.customerCode || duplicate.email}) into this master account. Reason: ${reason}`
        }
      });
    });

    return {
      success: true,
      message: `Customer ${duplicate.name} (${duplicate.email}) successfully merged into ${master.name} (${master.email}).`
    };
  }

  /**
   * Safely anonymizes customer personal identifiers in compliance with privacy regulations
   * while preserving transaction and order integrity for accounting/tax compliance.
   */
  static async anonymizeCustomer(customerId: string, actor: CustomerActor, reason: string) {
    const customer = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const anonId = crypto.randomBytes(6).toString('hex');
    const anonymizedEmail = `deleted_customer_${anonId}@kdw-anonymized.invalid`;

    await prisma.$transaction(async (tx) => {
      // Anonymize user profile
      await tx.user.update({
        where: { id: customerId },
        data: {
          name: 'Deleted Customer',
          email: anonymizedEmail,
          normalizedEmail: anonymizedEmail,
          mobile: null,
          normalizedPhone: null,
          businessName: null,
          businessType: null,
          gstNumber: null,
          profileImage: null,
          status: 'ANONYMIZED',
          anonymizedAt: new Date()
        }
      });

      // Revoke and suppress marketing consents
      await tx.customerConsent.updateMany({
        where: { customerId },
        data: { status: 'SUPPRESSED', withdrawnAt: new Date() }
      });

      // Log Privacy Deletion in Audit Trail
      await tx.customerAuditLog.create({
        data: {
          customerId,
          actorId: actor.id || null,
          actorEmail: actor.email || 'admin@kdw.com',
          actorRole: actor.role || 'SUPER_ADMIN',
          action: 'ANONYMIZE',
          reason,
          oldValue: { name: customer.name, email: customer.email },
          newValue: { status: 'ANONYMIZED', anonymizedAt: new Date() }
        }
      });

      // Record Timeline Event
      await tx.customerTimelineEvent.create({
        data: {
          customerId,
          eventType: 'ANONYMIZED',
          actorType: 'ADMIN',
          actorName: actor.name || 'Admin',
          actorEmail: actor.email,
          description: `Personal data safely erased and anonymized. Financial & entitlement records retained per retention policy. Reason: ${reason}`
        }
      });
    });

    return {
      success: true,
      message: 'Customer personally identifiable data anonymized successfully.'
    };
  }
}
