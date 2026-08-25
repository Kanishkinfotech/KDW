import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { CustomerService } from '../services/customerService';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : null,
    name: user.name || 'Admin Staff',
    email: user.email || 'admin@kdw.com',
    role: user.role || 'SUPER_ADMIN'
  };
};

// ============================================================================
// 1. GET ALL CUSTOMERS (Multi-Criteria, Multi-Identifier Search, Counters, Pagination)
// ============================================================================
export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      view,
      customerType,
      emailVerified,
      status,
      blockScope,
      minSpent,
      maxSpent,
      minOrders,
      tag,
      startDate,
      endDate,
      sortBy = 'newest'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      isMerged: false // Exclude previously merged records
    };

    // 1. View filter shortcuts
    if (view) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      switch (view) {
        case 'new':
          where.createdAt = { gte: thirtyDaysAgo };
          break;
        case 'returning':
          where.orders = { some: {} }; // refined in count logic
          break;
        case 'guest':
          where.customerType = 'GUEST';
          break;
        case 'unverified':
          where.emailVerified = false;
          where.customerType = 'ACCOUNT';
          break;
        case 'blocked':
          where.status = 'BLOCKED';
          break;
        case 'high_value':
          where.fraudRisk = { in: ['LOW', 'MEDIUM'] };
          break;
      }
    }

    // 2. Direct filter params
    if (customerType) where.customerType = String(customerType).toUpperCase();
    if (emailVerified !== undefined && emailVerified !== '') {
      where.emailVerified = String(emailVerified) === 'true';
    }
    if (status) where.status = String(status).toUpperCase();
    if (blockScope) where.blockScope = String(blockScope).toUpperCase();

    // 3. Tag Filter
    if (tag) {
      where.customerTags = {
        some: {
          tag: { name: String(tag).toLowerCase() }
        }
      };
    }

    // 4. Date Range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 5. Multi-Identifier Search
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { normalizedEmail: { contains: q.toLowerCase(), mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
        { customerCode: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
        { businessName: { contains: q, mode: 'insensitive' } },
        { orders: { some: { orderNumber: { contains: q, mode: 'insensitive' } } } }
      ];
    }

    // 6. Sorting
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'last_login':
        orderBy = { lastLoginAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute queries in parallel
    const [
      customers,
      total,
      countAll,
      countGuest,
      countVerified,
      countUnverified,
      countBlocked,
      countNew
    ] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          customerCode: true,
          customerType: true,
          name: true,
          email: true,
          mobile: true,
          emailVerified: true,
          status: true,
          blockScope: true,
          fraudRisk: true,
          supportPriority: true,
          businessName: true,
          country: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              orders: true,
              purchases: true,
              bundleEntitlements: true,
              supportTickets: true,
              customerTags: true
            }
          },
          orders: {
            where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } },
            select: { totalAmount: true }
          },
          consents: {
            select: { consentType: true, status: true }
          },
          customerTags: {
            include: { tag: true }
          }
        },
        orderBy,
        skip,
        take: limitNumber
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { isMerged: false } }),
      prisma.user.count({ where: { customerType: 'GUEST', isMerged: false } }),
      prisma.user.count({ where: { emailVerified: true, isMerged: false } }),
      prisma.user.count({ where: { emailVerified: false, customerType: 'ACCOUNT', isMerged: false } }),
      prisma.user.count({ where: { status: 'BLOCKED', isMerged: false } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isMerged: false
        }
      })
    ]);

    // Format customers with calculated total spend (CLV)
    const formattedCustomers = customers.map(c => {
      const totalSpent = (c.orders || []).reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        ...c,
        totalSpent,
        paidOrdersCount: c.orders.length
      };
    });

    res.json({
      success: true,
      customers: formattedCustomers,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      },
      counters: {
        all: countAll,
        new: countNew,
        returning: Math.max(0, countAll - countNew),
        guest: countGuest,
        verified: countVerified,
        unverified: countUnverified,
        blocked: countBlocked,
        active_access: countVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. GET CUSTOMER ANALYTICS / KPIS (Live Formulas)
// ============================================================================
export const getCustomerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      newCustomers,
      guestCustomers,
      verifiedCustomers,
      blockedCustomers,
      paidOrdersAgg,
      refundedOrdersCount
    ] = await Promise.all([
      prisma.user.count({ where: { isMerged: false } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, isMerged: false } }),
      prisma.user.count({ where: { customerType: 'GUEST', isMerged: false } }),
      prisma.user.count({ where: { emailVerified: true, isMerged: false } }),
      prisma.user.count({ where: { status: 'BLOCKED', isMerged: false } }),
      prisma.order.aggregate({
        where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.order.count({ where: { paymentStatus: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } })
    ]);

    const totalRevenue = paidOrdersAgg._sum.totalAmount || 0;
    const averageCustomerValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
    const returningCustomers = Math.max(0, totalCustomers - newCustomers);
    const repeatPurchaseRate = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        guestCustomers,
        verifiedCustomers,
        blockedCustomers,
        totalRevenue,
        averageCustomerValue,
        repeatPurchaseRate,
        refundedOrdersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. GET SINGLE CUSTOMER DETAILS (Deep 15-Section Comprehensive Diagnostics)
// ============================================================================
export const getAdminCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const customer = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { customerCode: id }, { email: id }]
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            payments: { take: 1, orderBy: { createdAt: 'desc' } }
          }
        },
        purchases: {
          include: {
            product: { select: { id: true, name: true, thumbnail: true, price: true, version: true } },
            bundle: { select: { id: true, title: true, coverImage: true, price: true } },
            accessTokens: true
          }
        },
        bundleEntitlements: {
          include: {
            bundle: { select: { id: true, title: true, coverImage: true } },
            componentEntitlements: {
              include: { product: { select: { id: true, name: true, thumbnail: true } } }
            }
          }
        },
        componentEntitlements: {
          include: { product: { select: { id: true, name: true, thumbnail: true } } }
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } }
        },
        consents: { orderBy: { createdAt: 'desc' } },
        customerTags: { include: { tag: true } },
        customerNotes: { orderBy: { createdAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        customerAuditLogs: { orderBy: { createdAt: 'desc' } },
        dataRequests: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Licences & Downloads associated with customer
    const [licenceKeys, downloadHistory] = await Promise.all([
      prisma.licenceKey.findMany({
        where: { customerId: customer.id },
        orderBy: { issuedAt: 'desc' }
      }),
      prisma.downloadHistory.findMany({
        where: { customerId: customer.id },
        orderBy: { downloadedAt: 'desc' },
        take: 50
      })
    ]);

    // Financial Lifetime Value Aggregates
    const paidOrders = (customer.orders || []).filter(o => ['PAID', 'CAPTURED'].includes(o.paymentStatus));
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalRefunded = (customer.orders || []).reduce((sum, o) => sum + (o.refundedAmount || 0), 0);
    const netRevenue = Math.max(0, totalSpent - totalRefunded);

    res.json({
      success: true,
      customer: {
        ...customer,
        licenceKeys,
        downloadHistory,
        metrics: {
          totalOrders: customer.orders.length,
          paidOrdersCount: paidOrders.length,
          totalSpent,
          totalRefunded,
          netRevenue,
          activeEntitlementsCount: customer.purchases.filter(p => p.accessStatus === 'ACTIVE').length + customer.bundleEntitlements.filter(b => b.status === 'ACTIVE').length,
          activeLicencesCount: licenceKeys.filter(l => l.status === 'ACTIVE').length,
          openTicketsCount: customer.supportTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. UPDATE CUSTOMER PROFILE & B2B FIELDS
// ============================================================================
export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);
    const {
      name,
      mobile,
      businessName,
      businessType,
      gstNumber,
      country,
      state,
      language,
      timezone,
      fraudRisk,
      supportPriority,
      assignedStaffId
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Customer not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(mobile !== undefined && { mobile: mobile ? String(mobile).trim() : null, normalizedPhone: CustomerService.normalizePhone(mobile) }),
        ...(businessName !== undefined && { businessName: businessName ? String(businessName).trim() : null }),
        ...(businessType !== undefined && { businessType: businessType ? String(businessType).trim() : null }),
        ...(gstNumber !== undefined && { gstNumber: gstNumber ? String(gstNumber).trim().toUpperCase() : null }),
        ...(country !== undefined && { country: String(country) }),
        ...(state !== undefined && { state: String(state) }),
        ...(language !== undefined && { language: String(language) }),
        ...(timezone !== undefined && { timezone: String(timezone) }),
        ...(fraudRisk !== undefined && { fraudRisk: String(fraudRisk).toUpperCase() }),
        ...(supportPriority !== undefined && { supportPriority: String(supportPriority).toUpperCase() }),
        ...(assignedStaffId !== undefined && { assignedStaffId: assignedStaffId || null })
      }
    });

    // Record Audit & Timeline Log
    await prisma.$transaction([
      prisma.customerAuditLog.create({
        data: {
          customerId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'EDIT',
          reason: 'Administrative profile update',
          oldValue: { name: existing.name, mobile: existing.mobile, businessName: existing.businessName },
          newValue: { name: updated.name, mobile: updated.mobile, businessName: updated.businessName }
        }
      }),
      prisma.customerTimelineEvent.create({
        data: {
          customerId: id,
          eventType: 'CUSTOMER_UPDATED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          description: `Customer profile updated by ${actor.name}`
        }
      })
    ]);

    res.json({ success: true, message: 'Customer profile updated successfully', customer: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. BLOCK CUSTOMER (Multi-Scope Enforcement)
// ============================================================================
export const blockCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { scope = 'FULL', reason } = req.body;
    const actor = getActor(req);

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Block reason is mandatory.' });
    }

    const customer = await prisma.user.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          status: 'BLOCKED',
          blockScope: String(scope).toUpperCase(),
          blockReason: String(reason).trim()
        }
      }),
      prisma.customerAuditLog.create({
        data: {
          customerId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'BLOCK',
          reason,
          newValue: { scope, reason }
        }
      }),
      prisma.customerTimelineEvent.create({
        data: {
          customerId: id,
          eventType: 'CUSTOMER_BLOCKED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          status: 'WARNING',
          description: `Customer account blocked (Scope: ${scope}). Reason: ${reason}`
        }
      })
    ]);

    res.json({ success: true, message: `Customer account blocked under scope ${scope}.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. UNBLOCK CUSTOMER
// ============================================================================
export const unblockCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { reason = 'Administrative account unblock' } = req.body;
    const actor = getActor(req);

    const customer = await prisma.user.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          blockScope: 'NONE',
          blockReason: null
        }
      }),
      prisma.customerAuditLog.create({
        data: {
          customerId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'UNBLOCK',
          reason
        }
      }),
      prisma.customerTimelineEvent.create({
        data: {
          customerId: id,
          eventType: 'CUSTOMER_UNBLOCKED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          status: 'SUCCESS',
          description: `Customer account unblocked and restrictions lifted. Reason: ${reason}`
        }
      })
    ]);

    res.json({ success: true, message: 'Customer account unblocked successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. MANAGE CUSTOMER TAGS (Add / Remove with Audit Trail)
// ============================================================================
export const addCustomerTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { tagName, reason = 'Administrative tagging' } = req.body;
    const actor = getActor(req);

    if (!tagName || !tagName.trim()) {
      return res.status(400).json({ success: false, message: 'Tag name is required.' });
    }

    const cleanTagName = tagName.trim().toLowerCase().replace(/\s+/g, '-');

    // Find or create standardized tag
    let tag = await prisma.customerTag.findUnique({ where: { name: cleanTagName } });
    if (!tag) {
      tag = await prisma.customerTag.create({
        data: { name: cleanTagName, description: `Tag for ${cleanTagName}` }
      });
    }

    // Check if already mapped
    const existingMap = await prisma.customerTagMapping.findUnique({
      where: { customerId_tagId: { customerId: id, tagId: tag.id } }
    });

    if (existingMap) {
      return res.status(400).json({ success: false, message: 'Tag already assigned to this customer.' });
    }

    await prisma.$transaction([
      prisma.customerTagMapping.create({
        data: {
          customerId: id,
          tagId: tag.id,
          assignedBy: actor.name,
          assignedById: actor.id,
          reason
        }
      }),
      prisma.customerTimelineEvent.create({
        data: {
          customerId: id,
          eventType: 'TAG_ADDED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          description: `Tag "${cleanTagName}" added. Reason: ${reason}`
        }
      }),
      prisma.customerAuditLog.create({
        data: {
          customerId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'TAG_CHANGE',
          reason: `Added tag ${cleanTagName}`
        }
      })
    ]);

    res.json({ success: true, message: `Tag "${cleanTagName}" successfully added.` });
  } catch (error) {
    next(error);
  }
};

export const removeCustomerTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const tagId = String(req.params.tagId);
    const actor = getActor(req);

    await prisma.$transaction([
      prisma.customerTagMapping.deleteMany({
        where: { customerId: id, tagId }
      }),
      prisma.customerTimelineEvent.create({
        data: {
          customerId: id,
          eventType: 'TAG_REMOVED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          description: `Tag removed by ${actor.name}`
        }
      })
    ]);

    res.json({ success: true, message: 'Tag successfully removed.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. UPDATE CONSENT REGISTRY
// ============================================================================
export const updateCustomerConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { consentType, status, reason = 'Consent updated by admin' } = req.body;
    const actor = getActor(req);

    if (!consentType || !status) {
      return res.status(400).json({ success: false, message: 'consentType and status are required.' });
    }

    const consent = await prisma.customerConsent.upsert({
      where: { id: `${id}_${consentType}` },
      update: {
        status: String(status).toUpperCase(),
        withdrawnAt: status === 'OPTED_OUT' || status === 'WITHDRAWN' ? new Date() : null
      },
      create: {
        id: `${id}_${consentType}`,
        customerId: id,
        consentType: String(consentType).toUpperCase(),
        status: String(status).toUpperCase(),
        source: 'ADMIN_CONSOLE',
        withdrawnAt: status === 'OPTED_OUT' || status === 'WITHDRAWN' ? new Date() : null
      }
    });

    await prisma.customerTimelineEvent.create({
      data: {
        customerId: id,
        eventType: status === 'OPTED_IN' ? 'CONSENT_GRANTED' : 'CONSENT_WITHDRAWN',
        actorType: 'ADMIN',
        actorName: actor.name,
        actorEmail: actor.email,
        description: `Consent for ${consentType} updated to ${status}. Reason: ${reason}`
      }
    });

    res.json({ success: true, message: 'Consent record updated successfully', consent });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 9. ADD CUSTOMER INTERNAL NOTE
// ============================================================================
export const addCustomerNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { content, noteType = 'INTERNAL' } = req.body;
    const actor = getActor(req);

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    const note = await prisma.customerNote.create({
      data: {
        customerId: id,
        authorId: actor.id,
        authorName: actor.name,
        authorEmail: actor.email,
        noteType: String(noteType).toUpperCase(),
        content: content.trim()
      }
    });

    await prisma.customerTimelineEvent.create({
      data: {
        customerId: id,
        eventType: 'NOTE_ADDED',
        actorType: 'ADMIN',
        actorName: actor.name,
        actorEmail: actor.email,
        description: `Internal note added (${noteType})`
      }
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. DUPLICATE DETECTION & ATOMIC MERGE
// ============================================================================
export const detectDuplicateCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Find all customers with matching normalized email, phone, or guest checkouts
    const duplicates = await prisma.$queryRaw`
      SELECT 
        u1.id as "masterId", u1.name as "masterName", u1.email as "masterEmail", u1."customerType" as "masterType", u1."createdAt" as "masterCreatedAt",
        u2.id as "duplicateId", u2.name as "duplicateName", u2.email as "duplicateEmail", u2."customerType" as "duplicateType", u2."createdAt" as "duplicateCreatedAt",
        'MATCHING_NORMALIZED_EMAIL' as "matchSignal"
      FROM "User" u1
      JOIN "User" u2 ON LOWER(TRIM(u1.email)) = LOWER(TRIM(u2.email)) AND u1.id != u2.id
      WHERE u1."isMerged" = false AND u2."isMerged" = false AND u1."createdAt" <= u2."createdAt"
      LIMIT 50
    `;

    res.json({ success: true, duplicates });
  } catch (error) {
    next(error);
  }
};

export const executeCustomerMerge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { masterCustomerId, duplicateCustomerId, reason = 'Duplicate customer merge' } = req.body;
    const actor = getActor(req);

    if (!masterCustomerId || !duplicateCustomerId) {
      return res.status(400).json({ success: false, message: 'masterCustomerId and duplicateCustomerId are required.' });
    }

    const result = await CustomerService.mergeCustomers(masterCustomerId, duplicateCustomerId, actor, reason);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

// ============================================================================
// 11. PRIVACY DATA REQUESTS & ANONYMIZATION (GDPR)
// ============================================================================
export const getDataRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.customerDataRequest.findMany({
      include: {
        customer: { select: { id: true, customerCode: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

export const processDataRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { action, resolutionNotes } = req.body; // COMPLETE, REJECT, ANONYMIZE
    const actor = getActor(req);

    const request = await prisma.customerDataRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ success: false, message: 'Data request not found' });

    if (action === 'ANONYMIZE' || request.requestType === 'DELETION') {
      await CustomerService.anonymizeCustomer(request.customerId, actor, resolutionNotes || 'Data deletion request executed');
    }

    const updated = await prisma.customerDataRequest.update({
      where: { id },
      data: {
        status: action === 'REJECT' ? 'REJECTED' : 'COMPLETED',
        processedBy: actor.name,
        resolutionNotes: resolutionNotes || 'Processed successfully',
        completedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Data request processed successfully', request: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 12. ABANDONED CHECKOUTS
// ============================================================================
export const getAbandonedCheckouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checkouts = await prisma.abandonedCheckout.findMany({
      include: {
        customer: { select: { id: true, customerCode: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, checkouts });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 13. GLOBAL CUSTOMER ACTIVITY STREAM
// ============================================================================
export const getCustomerActivityStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.customerTimelineEvent.findMany({
      include: {
        customer: { select: { id: true, customerCode: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 14. EXPORT CUSTOMERS (CSV Engine with Audit Logging)
// ============================================================================
export const exportCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { view, startDate, endDate } = req.query;
    const actor = getActor(req);

    const where: any = { isMerged: false };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const customers = await prisma.user.findMany({
      where,
      include: {
        orders: { where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    await prisma.customerAuditLog.create({
      data: {
        customerId: customers[0]?.id || 'bulk',
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'EXPORT',
        reason: `Customers export downloaded (${customers.length} rows)`
      }
    });

    const csvRows = [
      ['Customer Code', 'Name', 'Email', 'Phone', 'Customer Type', 'Status', 'Email Verified', 'Paid Orders', 'Total Spent (INR)', 'Created Date'].join(',')
    ];

    for (const c of customers) {
      const totalSpent = (c.orders || []).reduce((sum, o) => sum + o.totalAmount, 0);
      csvRows.push([
        c.customerCode || c.id,
        `"${(c.name || 'Guest').replace(/"/g, '""')}"`,
        c.email,
        c.mobile || '',
        c.customerType,
        c.status,
        c.emailVerified ? 'YES' : 'NO',
        c.orders.length,
        totalSpent,
        new Date(c.createdAt).toISOString()
      ].join(','));
    }

    const csvData = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=kwd_customers_export_${Date.now()}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
