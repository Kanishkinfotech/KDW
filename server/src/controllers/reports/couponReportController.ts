import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const parseDateRange = (range: string | undefined, from?: string, to?: string) => {
  const now = new Date();
  let start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let end = new Date(now.getTime());

  if (from && to) {
    return { start: new Date(from), end: new Date(to) };
  }

  if (range === 'today' || range === '24h') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7d' || range === '7days') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d' || range === '30days') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '90d' || range === '90days') {
    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (range === 'year' || range === 'this_year') {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return { start, end };
};

// ============================================================================
// 1. COUPON OVERVIEW
// ============================================================================
export const getCouponOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range = '30d', from, to } = req.query;
    const { start, end } = parseDateRange(String(range), from as string, to as string);

    const [coupons, redemptions, orders, totalPaidOrdersCount] = await Promise.all([
      prisma.coupon.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.couponRedemption.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'REDEEMED'
        },
        include: { order: true, coupon: true }
      }),
      prisma.order.findMany({
        where: {
          discountTotal: { gt: 0 },
          paymentStatus: { in: ['PAID', 'COMPLETED'] },
          createdAt: { gte: start, lte: end }
        },
        include: { refunds: true }
      }),
      prisma.order.count({
        where: {
          paymentStatus: { in: ['PAID', 'COMPLETED'] },
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    const activeCouponsCount = coupons.length;
    const totalRedemptions = redemptions.length;
    const discountValue = orders.reduce((sum, o) => sum + (o.discountTotal || 0), 0);
    const grossSales = orders.reduce((sum, o) => sum + o.totalAmount + (o.discountTotal || 0), 0);
    const refundValue = orders.reduce((sum, o) => sum + (o.refundedAmount || 0), 0);

    // Coupon Net Revenue = Coupon Order Sales - Coupon Discounts - Refunds
    const netSales = grossSales - discountValue - refundValue;
    const avgCouponAov = orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length) : 0;

    // Remaining redemptions calculation without fake 100 assumption
    let limitedCouponsRemaining = 0;
    let unlimitedCount = 0;
    coupons.forEach(c => {
      if (c.totalUsageLimit !== null && c.totalUsageLimit !== undefined) {
        limitedCouponsRemaining += Math.max(0, c.totalUsageLimit - c.usedCount);
      } else {
        unlimitedCount += 1;
      }
    });

    const remainingRedemptionsLabel = unlimitedCount > 0 && limitedCouponsRemaining === 0
      ? 'Unlimited'
      : unlimitedCount > 0
        ? `${limitedCouponsRemaining} (+${unlimitedCount} unl.)`
        : `${limitedCouponsRemaining}`;

    const couponConversionRate = totalPaidOrdersCount > 0
      ? parseFloat(((orders.length / totalPaidOrdersCount) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      kpis: {
        activeCoupons: activeCouponsCount,
        redemptionsCount: totalRedemptions,
        totalDiscountValue: Math.round(discountValue),
        ordersUsingCoupons: orders.length,
        grossSales: Math.round(grossSales),
        netSales: Math.round(netSales),
        averageCouponOrderValue: avgCouponAov,
        refundValue: Math.round(refundValue),
        couponConversionRate,
        remainingRedemptions: limitedCouponsRemaining,
        remainingRedemptionsLabel
      },
      coupons: coupons.map(c => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        usedCount: c.usedCount,
        maxUses: c.totalUsageLimit !== null && c.totalUsageLimit !== undefined ? c.totalUsageLimit : 'Unlimited',
        status: c.status
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. COUPON USAGE (6-STATE LIFECYCLE) - Preserved for API backward compatibility
// ============================================================================
export const getCouponUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redemptions = await prisma.couponRedemption.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        coupon: true,
        order: { include: { customer: { select: { id: true, name: true, email: true } } } }
      }
    });

    const statusCounts: Record<string, number> = {
      Applied: 0,
      Reserved: 0,
      Redeemed: 0,
      Released: 0,
      Reversed: 0,
      Expired: 0
    };

    redemptions.forEach(r => {
      const st = r.status === 'CONFIRMED' ? 'Redeemed' : (r.status || 'Redeemed');
      if (statusCounts[st] !== undefined) statusCounts[st]++;
      else statusCounts['Redeemed']++;
    });

    res.json({
      success: true,
      statusBreakdown: statusCounts,
      redemptions: redemptions.map(r => ({
        id: r.id,
        couponCode: r.coupon?.code || 'COUPON',
        discountAmount: r.discountAmount,
        orderNumber: r.order?.orderNumber || 'N/A',
        customerEmail: r.order?.customer?.email || r.order?.guestEmail || 'customer@example.com',
        state: r.status === 'CONFIRMED' ? 'Redeemed' : (r.status || 'Redeemed'),
        timestamp: r.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. COUPON REVENUE & PROFITABILITY (NET REVENUE IMPACT)
// ============================================================================
export const getCouponRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range = '30d', from, to } = req.query;
    const { start, end } = parseDateRange(String(range), from as string, to as string);

    const coupons = await prisma.coupon.findMany({
      include: {
        redemptions: {
          where: {
            createdAt: { gte: start, lte: end },
            status: 'REDEEMED'
          },
          include: { order: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalGross = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    let totalNet = 0;
    let totalUses = 0;

    const couponProfits = coupons.map(c => {
      const validRedemptions = c.redemptions.filter(r => r.order && (r.order.paymentStatus === 'PAID' || r.order.paymentStatus === 'COMPLETED'));
      const gross = validRedemptions.reduce((sum, r) => sum + (r.order?.totalAmount || 0) + (r.discountAmount || 0), 0);
      const discounts = validRedemptions.reduce((sum, r) => sum + (r.discountAmount || 0), 0);
      const refunds = validRedemptions.reduce((sum, r) => sum + (r.order?.refundedAmount || 0), 0);
      const net = gross - discounts - refunds;

      totalGross += gross;
      totalDiscounts += discounts;
      totalRefunds += refunds;
      totalNet += net;
      totalUses += validRedemptions.length;

      return {
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountRate: c.discountValue,
        status: c.status,
        uses: validRedemptions.length,
        discountValue: Math.round(discounts),
        grossSales: Math.round(gross),
        refunds: Math.round(refunds),
        netSales: Math.round(net),
        roi: discounts > 0 ? parseFloat((net / discounts).toFixed(2)) : (net > 0 ? parseFloat(net.toFixed(2)) : 0)
      };
    });

    res.json({
      success: true,
      summary: {
        grossSales: Math.round(totalGross),
        discountValue: Math.round(totalDiscounts),
        refunds: Math.round(totalRefunds),
        netSales: Math.round(totalNet),
        totalUses
      },
      data: couponProfits.sort((a, b) => b.netSales - a.netSales || b.uses - a.uses)
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. COUPON CUSTOMERS - Preserved for API backward compatibility
// ============================================================================
export const getCouponCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redemptions = await prisma.couponRedemption.findMany({
      include: {
        order: { include: { customer: { include: { orders: true } } } }
      }
    });

    let newCustUses = 0;
    let returningCustUses = 0;
    let guestUses = 0;

    redemptions.forEach(r => {
      if (!r.order?.customerId) {
        guestUses++;
      } else if (r.order.customer && r.order.customer.orders.length > 1) {
        returningCustUses++;
      } else {
        newCustUses++;
      }
    });

    const totalRedemptions = redemptions.length;
    const repeatUsers = returningCustUses;
    const secondPurchaseRate = totalRedemptions > 0 ? parseFloat(((repeatUsers / totalRedemptions) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      metrics: {
        newCustomerRedemptions: newCustUses,
        returningCustomerRedemptions: returningCustUses,
        guestRedemptions: guestUses,
        secondPurchaseRateOfCouponUsers: secondPurchaseRate,
        couponCustomerRefundRate: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. COUPON PRODUCTS (DISCOUNTED PRODUCTS)
// ============================================================================
export const getCouponProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range = '30d', from, to } = req.query;
    const { start, end } = parseDateRange(String(range), from as string, to as string);

    const orders = await prisma.order.findMany({
      where: {
        discountTotal: { gt: 0 },
        paymentStatus: { in: ['PAID', 'COMPLETED'] },
        createdAt: { gte: start, lte: end }
      },
      include: {
        items: {
          include: { product: true }
        },
        couponRedemptions: {
          include: { coupon: true }
        }
      }
    });

    const productMap: Record<string, {
      productId: string;
      name: string;
      discountedOrdersCount: number;
      unitsSold: number;
      revenue: number;
      usedCoupons: Set<string>;
    }> = {};

    orders.forEach(o => {
      const couponCodes = o.couponRedemptions.map(cr => cr.coupon?.code).filter(Boolean);
      o.items.forEach(it => {
        const prodId = it.productId || it.product?.id || 'unknown';
        const name = it.product?.name || it.productName || 'Digital Product';
        if (!productMap[prodId]) {
          productMap[prodId] = {
            productId: prodId,
            name,
            discountedOrdersCount: 0,
            unitsSold: 0,
            revenue: 0,
            usedCoupons: new Set()
          };
        }
        productMap[prodId].discountedOrdersCount += 1;
        productMap[prodId].unitsSold += (it.quantity || 1);
        productMap[prodId].revenue += (it.totalAmount || (it.unitPrice * (it.quantity || 1)));
        couponCodes.forEach(c => productMap[prodId].usedCoupons.add(c as string));
      });
    });

    const productList = Object.values(productMap).map(p => ({
      productId: p.productId,
      name: p.name,
      discountedOrdersCount: p.discountedOrdersCount,
      unitsSold: p.unitsSold,
      revenue: Math.round(p.revenue),
      avgDiscountedPrice: p.unitsSold > 0 ? Math.round(p.revenue / p.unitsSold) : 0,
      couponsApplied: Array.from(p.usedCoupons)
    }));

    res.json({
      success: true,
      products: productList.sort((a, b) => b.discountedOrdersCount - a.discountedOrdersCount || b.revenue - a.revenue)
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. COUPON ABUSE DETECTION - Preserved for API backward compatibility
// ============================================================================
export const getCouponAbuse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const abuseLogs = await prisma.couponAbuseLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40
    });

    res.json({
      success: true,
      logs: abuseLogs,
      kpis: {
        totalIncidents: abuseLogs.length,
        flaggedAccounts: 0,
        preventedDiscountLoss: 0
      }
    });
  } catch (error) {
    next(error);
  }
};
