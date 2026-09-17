import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../database/db';
import { CustomerService } from '../services/customerService';
import { sendGeneralEmail, sendAbandonedCartRecoveryEmail } from '../utils/emailService';

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
      dateRange,
      startDate,
      endDate,
      activity, // 'regular', 'irregular', 'all'
      returningDays, // '1d', '2d', '3d', '7d', '30d', 'custom', 'all'
      returningMode = 'recency', // 'recency', 'gap'
      guestFilter, // 'all', 'paid', 'zero_orders', 'has_phone'
      unverifiedAge, // '24h', '7d', '30d', 'stale'
      unverifiedHasOrders, // 'true', 'false'
      sortBy = 'newest'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      isMerged: false // Exclude previously merged records
    };

    // Calculate Date Range Filter (Supports '1d', 'today', '7d', '1w', '30d', 'custom', or explicit startDate/endDate)
    const now = Date.now();
    let dateFilter: any = null;

    if (dateRange === '1d' || dateRange === 'today') {
      dateFilter = { gte: new Date(now - 24 * 60 * 60 * 1000) };
    } else if (dateRange === '7d' || dateRange === '1w') {
      dateFilter = { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    } else if (dateRange === '30d' || dateRange === '1m') {
      dateFilter = { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    } else if (dateRange === 'custom' || startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    // 1. Regular vs Irregular Activity Filter
    if (activity === 'regular') {
      where.lastLoginAt = { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    } else if (activity === 'irregular') {
      where.OR = [
        { lastLoginAt: { lt: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
        { lastLoginAt: null }
      ];
    }

    // 2. View filter shortcuts
    if (view) {
      switch (view) {
        case 'new':
          where.createdAt = dateFilter || { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
          break;
        case 'returning': {
          let recencyInterval = '';
          if (returningDays === '1d') {
            recencyInterval = `AND max("createdAt") >= NOW() - INTERVAL '1 day'`;
          } else if (returningDays === '2d') {
            recencyInterval = `AND max("createdAt") >= NOW() - INTERVAL '2 days'`;
          } else if (returningDays === '3d') {
            recencyInterval = `AND max("createdAt") >= NOW() - INTERVAL '3 days'`;
          } else if (returningDays === '7d' || returningDays === '1w') {
            recencyInterval = `AND max("createdAt") >= NOW() - INTERVAL '7 days'`;
          } else if (returningDays === '30d' || returningDays === '1m') {
            recencyInterval = `AND max("createdAt") >= NOW() - INTERVAL '30 days'`;
          }

          const returningRows: any = await prisma.$queryRawUnsafe(`
            SELECT "customerId" 
            FROM "Order" 
            WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
            GROUP BY "customerId" 
            HAVING count(id) >= 2 ${recencyInterval}
          `);
          const returningIds = returningRows.map((r: any) => r.customerId).filter(Boolean);
          where.id = { in: returningIds };
          break;
        }
        case 'guest':
          where.customerType = 'GUEST';
          if (guestFilter === 'paid') {
            where.orders = { some: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } };
          } else if (guestFilter === 'zero_orders') {
            where.orders = { none: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } };
          } else if (guestFilter === 'has_phone') {
            where.mobile = { not: null };
          }
          break;
        case 'unverified':
          where.emailVerified = false;
          where.customerType = 'ACCOUNT';
          if (unverifiedAge === '24h') {
            where.createdAt = { gte: new Date(now - 24 * 60 * 60 * 1000) };
          } else if (unverifiedAge === '7d') {
            where.createdAt = { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
          } else if (unverifiedAge === '30d') {
            where.createdAt = { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
          } else if (unverifiedAge === 'stale') {
            where.createdAt = { lt: new Date(now - 30 * 24 * 60 * 60 * 1000) };
          }
          if (unverifiedHasOrders === 'true') {
            where.orders = { some: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } };
          }
          break;
        case 'blocked':
          where.status = 'BLOCKED';
          if (blockScope) where.blockScope = blockScope;
          break;
        case 'high_value':
          where.fraudRisk = { in: ['LOW', 'MEDIUM'] };
          break;
      }
    }

    // Apply dateFilter if view is not 'new' but dateFilter was provided
    if (view !== 'new' && dateFilter) {
      where.createdAt = dateFilter;
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
      countNew30d,
      countNew7d,
      countNew1d,
      returningQueryResult,
      returning1dResult,
      returning2dResult,
      returning3dResult,
      returning7dResult,
      returning30dResult,
      regularCountResult,
      guestPaidResult,
      guestZeroResult
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
            select: { id: true, orderNumber: true, totalAmount: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
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
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          isMerged: false
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          isMerged: false
        }
      }),
      prisma.$queryRaw`
        SELECT count(DISTINCT "customerId")::int as count 
        FROM (
          SELECT "customerId" 
          FROM "Order" 
          WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
          GROUP BY "customerId" 
          HAVING count(id) >= 2
        ) as returning_sub
      `,
      prisma.$queryRaw`
        SELECT count(*)::int as count FROM (
          SELECT "customerId" 
          FROM "Order" 
          WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
          GROUP BY "customerId" 
          HAVING count(id) >= 2 AND max("createdAt") >= NOW() - INTERVAL '1 day'
        ) as sub1d
      `,
      prisma.$queryRaw`
        SELECT count(*)::int as count FROM (
          SELECT "customerId" 
          FROM "Order" 
          WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
          GROUP BY "customerId" 
          HAVING count(id) >= 2 AND max("createdAt") >= NOW() - INTERVAL '2 days'
        ) as sub2d
      `,
      prisma.$queryRaw`
        SELECT count(*)::int as count FROM (
          SELECT "customerId" 
          FROM "Order" 
          WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
          GROUP BY "customerId" 
          HAVING count(id) >= 2 AND max("createdAt") >= NOW() - INTERVAL '3 days'
        ) as sub3d
      `,
      prisma.$queryRaw`
        SELECT count(*)::int as count FROM (
          SELECT "customerId" 
          FROM "Order" 
          WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
          GROUP BY "customerId" 
          HAVING count(id) >= 2 AND max("createdAt") >= NOW() - INTERVAL '7 days'
        ) as sub7d
      `,
      prisma.$queryRaw`
        SELECT count(*)::int as count FROM (
          SELECT "customerId" 
          FROM "Order" 
          WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
          GROUP BY "customerId" 
          HAVING count(id) >= 2 AND max("createdAt") >= NOW() - INTERVAL '30 days'
        ) as sub30d
      `,
      prisma.user.count({
        where: {
          isMerged: false,
          lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.user.count({
        where: {
          customerType: 'GUEST',
          isMerged: false,
          orders: { some: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } }
        }
      }),
      prisma.user.count({
        where: {
          customerType: 'GUEST',
          isMerged: false,
          orders: { none: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } }
        }
      })
    ]);

    const countReturning = (returningQueryResult as any)[0]?.count || 0;
    const countReturning1d = (returning1dResult as any)[0]?.count || 0;
    const countReturning2d = (returning2dResult as any)[0]?.count || 0;
    const countReturning3d = (returning3dResult as any)[0]?.count || 0;
    const countReturning7d = (returning7dResult as any)[0]?.count || 0;
    const countReturning30d = (returning30dResult as any)[0]?.count || 0;
    const countRegular = regularCountResult || 0;
    const countIrregular = Math.max(0, countAll - countRegular);
    const countGuestPaid = guestPaidResult || 0;
    const countGuestZeroOrders = guestZeroResult || 0;

    // Format customers with calculated total spend (CLV), returningData & activityStatus
    let formattedCustomers = customers.map(c => {
      const paidOrders = c.orders || [];
      const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
      const isReturning = paidOrders.length >= 2;

      let lastReturnedDaysAgo: number | null = null;
      let lastReturnedLabel: string | null = null;
      let lastReturnGapDays: number | null = null;
      let returnGapLabel: string | null = null;
      let avgReturnGapDays: number | null = null;
      let firstOrderAt: Date | null = null;
      let lastOrderAt: Date | null = null;

      if (paidOrders.length > 0) {
        firstOrderAt = paidOrders[0].createdAt;
        lastOrderAt = paidOrders[paidOrders.length - 1].createdAt;
      }

      if (isReturning && lastOrderAt) {
        const lastOrderTime = new Date(lastOrderAt).getTime();
        const daysAgo = (now - lastOrderTime) / (1000 * 60 * 60 * 24);
        lastReturnedDaysAgo = Math.round(daysAgo * 10) / 10;
        if (daysAgo < 1) {
          lastReturnedLabel = 'Returned today';
        } else if (daysAgo < 2) {
          lastReturnedLabel = 'Returned 1 day ago';
        } else if (daysAgo < 7) {
          lastReturnedLabel = `Returned ${Math.floor(daysAgo)}d ago`;
        } else {
          lastReturnedLabel = `Returned ${Math.floor(daysAgo)}d ago`;
        }

        const prevOrderAt = paidOrders[paidOrders.length - 2].createdAt;
        const gapDays = (new Date(lastOrderAt).getTime() - new Date(prevOrderAt).getTime()) / (1000 * 60 * 60 * 24);
        lastReturnGapDays = Math.round(gapDays * 10) / 10;
        if (gapDays < 1) {
          returnGapLabel = 'Returned same day';
        } else if (gapDays < 2) {
          returnGapLabel = 'Returned after 1 day';
        } else {
          returnGapLabel = `Returned after ${Math.round(gapDays)} days`;
        }

        let totalGap = 0;
        for (let i = 1; i < paidOrders.length; i++) {
          totalGap += (new Date(paidOrders[i].createdAt).getTime() - new Date(paidOrders[i - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24);
        }
        avgReturnGapDays = Math.round((totalGap / (paidOrders.length - 1)) * 10) / 10;
      }

      // Regular vs Irregular Activity Status based on login telemetry
      let daysSinceLastLogin: number | null = null;
      let activityStatus: 'REGULAR' | 'IRREGULAR' = 'IRREGULAR';
      let activitySummary = 'Infrequent visitor';

      if (c.lastLoginAt) {
        const loginDaysAgo = (now - new Date(c.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
        daysSinceLastLogin = Math.round(loginDaysAgo * 10) / 10;
        if (loginDaysAgo <= 7) {
          activityStatus = 'REGULAR';
          if (loginDaysAgo < 1) {
            activitySummary = 'Active today (Regular)';
          } else if (loginDaysAgo < 2) {
            activitySummary = 'Active 1d ago (Regular)';
          } else {
            activitySummary = `Active ${Math.floor(loginDaysAgo)}d ago (Regular)`;
          }
        } else {
          activityStatus = 'IRREGULAR';
          activitySummary = `Inactive for ${Math.floor(loginDaysAgo)}d (Irregular)`;
        }
      } else {
        activityStatus = 'IRREGULAR';
        activitySummary = 'Never logged in (Irregular)';
      }

      return {
        ...c,
        _count: {
          ...c._count,
          orders: paidOrders.length
        },
        totalSpent,
        paidOrdersCount: paidOrders.length,
        activityStatus,
        activitySummary,
        daysSinceLastLogin,
        returningData: {
          isReturning,
          orderCount: paidOrders.length,
          firstOrderAt,
          lastOrderAt,
          lastReturnedDaysAgo,
          lastReturnedLabel,
          lastReturnGapDays,
          returnGapLabel,
          avgReturnGapDays
        }
      };
    });

    // In-memory sorting for aggregate fields if requested
    if (sortBy === 'highest_spend') {
      formattedCustomers = formattedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sortBy === 'lowest_spend') {
      formattedCustomers = formattedCustomers.sort((a, b) => a.totalSpent - b.totalSpent);
    } else if (sortBy === 'most_orders') {
      formattedCustomers = formattedCustomers.sort((a, b) => b.paidOrdersCount - a.paidOrdersCount);
    } else if (sortBy === 'fewest_orders') {
      formattedCustomers = formattedCustomers.sort((a, b) => a.paidOrdersCount - b.paidOrdersCount);
    }

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
        new: countNew30d,
        new_1d: countNew1d,
        new_7d: countNew7d,
        new_30d: countNew30d,
        returning: countReturning,
        returning_1d: countReturning1d,
        returning_2d: countReturning2d,
        returning_3d: countReturning3d,
        returning_7d: countReturning7d,
        returning_30d: countReturning30d,
        regular: countRegular,
        irregular: countIrregular,
        guest: countGuest,
        guest_paid: countGuestPaid,
        guest_zero_orders: countGuestZeroOrders,
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
      refundedOrdersCount,
      returningQueryResult
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
      prisma.order.count({ where: { paymentStatus: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
      prisma.$queryRaw`
        SELECT count(DISTINCT "customerId")::int as count 
        FROM (
          SELECT "customerId" 
          FROM "Order" 
          WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
          GROUP BY "customerId" 
          HAVING count(id) >= 2
        ) as returning_sub
      `
    ]);

    const totalRevenue = paidOrdersAgg._sum.totalAmount || 0;
    const averageCustomerValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
    const returningCustomers = (returningQueryResult as any)[0]?.count || 0;
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
// 7. VERIFY CUSTOMER & RESEND VERIFICATION
// ============================================================================
export const verifyCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const customer = await prisma.user.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    await prisma.$transaction([
      prisma.customerAuditLog.create({
        data: {
          customerId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'VERIFY',
          reason: `Manually verified by admin ${actor.name}`
        }
      }),
      prisma.customerTimelineEvent.create({
        data: {
          customerId: id,
          eventType: 'EMAIL_VERIFIED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          status: 'SUCCESS',
          description: `Customer email manually verified by ${actor.name}`
        }
      })
    ]);

    res.json({ success: true, message: 'Customer email successfully verified.', customer: updated });
  } catch (error) {
    next(error);
  }
};

export const resendCustomerVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const customer = await prisma.user.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}&email=${encodeURIComponent(customer.email)}`;

    try {
      await sendGeneralEmail({
        to: customer.email,
        subject: 'Verify your KDW Account Email',
        intent: 'SECURITY',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${customer.name},</p>
            <p>Please click the button below to verify your email address and activate all account download privileges:</p>
            <p style="margin: 24px 0;">
              <a href="${verifyUrl}" style="background-color: #5b21b6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Verify Email Address
              </a>
            </p>
            <p style="color: #64748b; font-size: 12px;">If you did not request this verification, you can safely ignore this email.</p>
          </div>
        `
      });
    } catch (mailErr: any) {
      console.warn('[CustomerController] Email verification dispatch note:', mailErr.message);
    }

    await prisma.customerTimelineEvent.create({
      data: {
        customerId: id,
        eventType: 'VERIFICATION_RESENT',
        actorType: 'ADMIN',
        actorName: actor.name,
        actorEmail: actor.email,
        status: 'SUCCESS',
        description: `Verification link dispatched to ${customer.email} by ${actor.name}`
      }
    });

    res.json({ success: true, message: `Verification email dispatched to ${customer.email}` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. MANAGE CUSTOMER TAGS (Add / Remove with Audit Trail)
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
// 9. UPDATE CONSENT REGISTRY
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
// 10. ADD & DELETE CUSTOMER INTERNAL NOTE
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

export const deleteCustomerNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const noteId = String(req.params.noteId);
    const actor = getActor(req);

    await prisma.customerNote.deleteMany({
      where: { id: noteId, customerId: id }
    });

    await prisma.customerTimelineEvent.create({
      data: {
        customerId: id,
        eventType: 'NOTE_DELETED',
        actorType: 'ADMIN',
        actorName: actor.name,
        actorEmail: actor.email,
        description: `Internal note removed by ${actor.name}`
      }
    });

    res.json({ success: true, message: 'Note successfully removed.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 11. DUPLICATE DETECTION & ATOMIC MERGE
// ============================================================================
export const detectDuplicateCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const duplicates = await prisma.$queryRaw`
      SELECT 
        u1.id as "masterId", u1.name as "masterName", u1.email as "masterEmail", u1."customerType" as "masterType", u1."createdAt" as "masterCreatedAt",
        u2.id as "duplicateId", u2.name as "duplicateName", u2.email as "duplicateEmail", u2."customerType" as "duplicateType", u2."createdAt" as "duplicateCreatedAt",
        CASE 
          WHEN LOWER(TRIM(u1.email)) = LOWER(TRIM(u2.email)) THEN 'MATCHING_NORMALIZED_EMAIL'
          WHEN u1.mobile IS NOT NULL AND u1.mobile != '' AND u1.mobile = u2.mobile THEN 'MATCHING_PHONE_NUMBER'
          WHEN REPLACE(LOWER(SPLIT_PART(u1.email, '@', 1)), '.', '') = REPLACE(LOWER(SPLIT_PART(u2.email, '@', 1)), '.', '') 
               AND SPLIT_PART(u1.email, '@', 2) = SPLIT_PART(u2.email, '@', 2) THEN 'MATCHING_GMAIL_ALIAS'
          ELSE 'SIMILAR_PROFILE'
        END as "matchSignal"
      FROM "User" u1
      JOIN "User" u2 ON u1.id != u2.id AND (
        LOWER(TRIM(u1.email)) = LOWER(TRIM(u2.email)) OR
        (u1.mobile IS NOT NULL AND u1.mobile != '' AND u1.mobile = u2.mobile) OR
        (REPLACE(LOWER(SPLIT_PART(u1.email, '@', 1)), '.', '') = REPLACE(LOWER(SPLIT_PART(u2.email, '@', 1)), '.', '') 
         AND SPLIT_PART(u1.email, '@', 2) = SPLIT_PART(u2.email, '@', 2))
      )
      WHERE u1."isMerged" = false AND u2."isMerged" = false AND u1."createdAt" <= u2."createdAt"
      LIMIT 50
    `;

    res.json({ success: true, duplicates });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '').trim();
    const where: any = { isMerged: false };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { customerCode: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        customerCode: true,
        name: true,
        email: true,
        mobile: true,
        customerType: true,
        status: true,
        createdAt: true,
        orders: {
          where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } },
          select: { totalAmount: true }
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      customers: customers.map(c => ({
        ...c,
        totalSpent: c.orders.reduce((sum, o) => sum + o.totalAmount, 0),
        paidOrdersCount: c.orders.length
      }))
    });
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
// 12. PRIVACY DATA REQUESTS & ANONYMIZATION (GDPR)
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
// 13. ABANDONED CHECKOUTS & RECOVERY
// ============================================================================
export const getAbandonedCheckouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;
    const baseExclusions = {
      NOT: [
        { customerEmail: { startsWith: 'test_telemetry_' } },
        { customerEmail: { contains: 'dummy' } },
        { customerName: { contains: 'Telemetry Test' } }
      ]
    };

    const where: any = { ...baseExclusions };
    if (status && status !== 'all' && status !== 'ALL') {
      where.status = String(status).toUpperCase();
    }
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.AND = [
        baseExclusions,
        {
          OR: [
            { customerEmail: { contains: q, mode: 'insensitive' } },
            { customerName: { contains: q, mode: 'insensitive' } },
            { customerPhone: { contains: q, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [checkouts, totalAbandoned, totalRecovered, totalSum] = await Promise.all([
      prisma.abandonedCheckout.findMany({
        where,
        include: {
          customer: { select: { id: true, customerCode: true, name: true, email: true, mobile: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.abandonedCheckout.count({ where: { status: 'ABANDONED', ...baseExclusions } }),
      prisma.abandonedCheckout.count({ where: { status: 'RECOVERED', ...baseExclusions } }),
      prisma.abandonedCheckout.aggregate({
        where: { status: 'ABANDONED', ...baseExclusions },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      checkouts,
      metrics: {
        abandonedCount: totalAbandoned,
        recoveredCount: totalRecovered,
        totalAbandonedRevenue: totalSum._sum.totalAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAbandonedCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await prisma.abandonedCheckout.delete({ where: { id } });
    res.json({ success: true, message: 'Abandoned checkout removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const recoverAbandonedCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const checkout = await prisma.abandonedCheckout.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!checkout) return res.status(404).json({ success: false, message: 'Abandoned checkout not found' });

    const targetEmail = checkout.customerEmail || checkout.customer?.email;
    if (!targetEmail) return res.status(400).json({ success: false, message: 'Recipient email not found on checkout record' });

    // Send Highly Attractive, Persuasive Cart Recovery Email via emailService
    try {
      const cartItems = Array.isArray(checkout.cartData) ? checkout.cartData : [];
      await sendAbandonedCartRecoveryEmail({
        recipientEmail: targetEmail,
        customerName: checkout.customerName || checkout.customer?.name || 'Valued Creator',
        checkoutId: checkout.id,
        cartItems,
        totalAmount: checkout.totalAmount,
        discountCode: 'RECOVER10'
      });
    } catch (mailErr: any) {
      console.warn('[CustomerController] Recovery email dispatch note:', mailErr.message);
    }

    const updated = await prisma.abandonedCheckout.update({
      where: { id },
      data: {
        recoveryEmailSent: true,
        recoveryEmailSentAt: new Date()
      }
    });

    if (checkout.customerId) {
      await prisma.customerTimelineEvent.create({
        data: {
          customerId: checkout.customerId,
          eventType: 'RECOVERY_EMAIL_SENT',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          status: 'SUCCESS',
          description: `Cart recovery email dispatched by ${actor.name}`
        }
      });
    }

    res.json({ success: true, message: `Recovery email dispatched to ${targetEmail}`, checkout: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 14. GLOBAL CUSTOMER ACTIVITY STREAM
// ============================================================================
export const getCustomerActivityStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, dateRange, startDate, endDate } = req.query;

    const where: any = {};

    // 1. Category Filter
    if (category && category !== 'all') {
      switch (category) {
        case 'orders':
          where.eventType = { in: ['ORDER_CREATED', 'PAYMENT_COMPLETED', 'REFUND_COMPLETED'] };
          break;
        case 'auth':
          where.eventType = { in: ['CUSTOMER_LOGIN', 'CUSTOMER_SESSION'] };
          break;
        case 'account':
          where.eventType = { in: ['CUSTOMER_CREATED', 'EMAIL_VERIFIED', 'TAG_ADDED', 'TAG_REMOVED', 'GUEST_CLAIMED', 'MERGED'] };
          break;
        case 'security':
          where.eventType = { in: ['CUSTOMER_BLOCKED', 'CUSTOMER_UNBLOCKED', 'SECURITY_ALERT'] };
          break;
      }
    }

    // 2. Date Range Filter
    const now = Date.now();
    if (dateRange === 'today' || dateRange === '1d') {
      where.createdAt = { gte: new Date(now - 24 * 60 * 60 * 1000) };
    } else if (dateRange === '7d' || dateRange === '1w') {
      where.createdAt = { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    } else if (dateRange === '30d' || dateRange === '1m') {
      where.createdAt = { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    } else if (dateRange === 'custom' || startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 3. Search Filter
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { eventType: { contains: q, mode: 'insensitive' } },
        { referenceId: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [events, countAll, countOrders, countAuth, countAccount, countSecurity] = await Promise.all([
      prisma.customerTimelineEvent.findMany({
        where,
        include: {
          customer: { select: { id: true, customerCode: true, name: true, email: true, status: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.customerTimelineEvent.count(),
      prisma.customerTimelineEvent.count({ where: { eventType: { in: ['ORDER_CREATED', 'PAYMENT_COMPLETED', 'REFUND_COMPLETED'] } } }),
      prisma.customerTimelineEvent.count({ where: { eventType: { in: ['CUSTOMER_LOGIN', 'CUSTOMER_SESSION'] } } }),
      prisma.customerTimelineEvent.count({ where: { eventType: { in: ['CUSTOMER_CREATED', 'EMAIL_VERIFIED', 'TAG_ADDED', 'TAG_REMOVED', 'GUEST_CLAIMED', 'MERGED'] } } }),
      prisma.customerTimelineEvent.count({ where: { eventType: { in: ['CUSTOMER_BLOCKED', 'CUSTOMER_UNBLOCKED', 'SECURITY_ALERT'] } } })
    ]);

    res.json({
      success: true,
      events,
      counters: {
        all: countAll,
        orders: countOrders,
        auth: countAuth,
        account: countAccount,
        security: countSecurity
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 15. EXPORT CUSTOMERS (CSV Engine with Audit Logging)
// ============================================================================
export const exportCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { view, startDate, endDate, search } = req.query;
    const actor = getActor(req);

    const where: any = { isMerged: false };

    if (view) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (view === 'new') where.createdAt = { gte: thirtyDaysAgo };
      if (view === 'guest') where.customerType = 'GUEST';
      if (view === 'unverified') {
        where.emailVerified = false;
        where.customerType = 'ACCOUNT';
      }
      if (view === 'blocked') where.status = 'BLOCKED';
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
        { customerCode: { contains: q, mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      include: {
        orders: { where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    if (customers.length > 0) {
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
    }

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
