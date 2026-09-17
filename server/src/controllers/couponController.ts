import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { CouponService } from '../services/couponService';
import { OfferService } from '../services/offerService';
import { logAdminAction } from '../utils/auditLogger';

// 1. Get All Coupons with multi-filters and live KPIs (Admin)
export const getAdminCoupons = async (req: Request, res: Response) => {
  try {
    const { status, discountType, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (discountType && discountType !== 'ALL') {
      where.discountType = discountType as string;
    }
    if (search) {
      where.OR = [
        { code: { contains: (search as string).trim().toUpperCase(), mode: 'insensitive' } },
        { internalName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [coupons, total, activeCount, scheduledCount, expiredCount, disabledCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true } },
          _count: { select: { redemptions: true, abuseLogs: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.coupon.count({ where }),
      prisma.coupon.count({ where: { status: 'ACTIVE' } }),
      prisma.coupon.count({ where: { status: 'SCHEDULED' } }),
      prisma.coupon.count({ where: { status: 'EXPIRED' } }),
      prisma.coupon.count({ where: { status: 'DISABLED' } })
    ]);

    // Calculate live KPI metrics
    const redemptionsToday = await prisma.couponRedemption.count({
      where: {
        status: 'REDEEMED',
        redeemedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    });

    const totalDiscountAgg = await prisma.couponRedemption.aggregate({
      where: { status: 'REDEEMED' },
      _sum: { discountAmount: true }
    });

    res.status(200).json({
      success: true,
      coupons,
      kpis: {
        totalCoupons: total,
        activeCoupons: activeCount,
        scheduledCoupons: scheduledCount,
        expiredCoupons: expiredCount,
        disabledCoupons: disabledCount,
        redemptionsToday,
        totalDiscountGiven: totalDiscountAgg._sum.discountAmount || 0
      },
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching admin coupons:', error);
    res.status(500).json({ success: false, message: 'Server error fetching coupons' });
  }
};

// 2. Get Single Coupon by ID
export const getAdminCouponById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        campaign: true,
        redemptions: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { id: true, name: true, email: true } }, order: { select: { id: true, orderNumber: true, totalAmount: true } } }
        },
        abuseLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('Error fetching coupon detail:', error);
    res.status(500).json({ success: false, message: 'Server error fetching coupon' });
  }
};

// 3. Create Coupon (Admin)
export const createAdminCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      internalName,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      currency,
      minOrderValue,
      eligibleProducts,
      excludedProducts,
      eligibleCategories,
      eligibleCustomerSegments,
      eligibleBundles,
      freeProductId,
      affiliateId,
      referralSource,
      commissionRate,
      startAt,
      endAt,
      totalUsageLimit,
      perCustomerLimit,
      perEmailLimit,
      perOrderLimit,
      perDayLimit,
      campaignBudget,
      stackingPolicy,
      campaignId,
      internalNote,
      status
    } = req.body;

    const normalizedCode = CouponService.normalizeCode(code);
    if (!normalizedCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code "${normalizedCode}" already exists.` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        internalName: internalName || normalizedCode,
        description,
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue) || 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        currency: currency || 'INR',
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        eligibleProducts: typeof eligibleProducts === 'object' ? JSON.stringify(eligibleProducts) : eligibleProducts,
        excludedProducts: typeof excludedProducts === 'object' ? JSON.stringify(excludedProducts) : excludedProducts,
        eligibleCategories: typeof eligibleCategories === 'object' ? JSON.stringify(eligibleCategories) : eligibleCategories,
        eligibleCustomerSegments: typeof eligibleCustomerSegments === 'object' ? JSON.stringify(eligibleCustomerSegments) : eligibleCustomerSegments,
        eligibleBundles: typeof eligibleBundles === 'object' ? JSON.stringify(eligibleBundles) : eligibleBundles,
        freeProductId,
        affiliateId,
        referralSource,
        commissionRate: commissionRate ? parseFloat(commissionRate) : null,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        totalUsageLimit: totalUsageLimit ? parseInt(totalUsageLimit, 10) : null,
        perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit, 10) : 1,
        perEmailLimit: perEmailLimit ? parseInt(perEmailLimit, 10) : 1,
        perOrderLimit: perOrderLimit ? parseInt(perOrderLimit, 10) : 1,
        perDayLimit: perDayLimit ? parseInt(perDayLimit, 10) : null,
        campaignBudget: campaignBudget ? parseFloat(campaignBudget) : null,
        stackingPolicy: stackingPolicy || 'EXCLUSIVE',
        campaignId: campaignId || null,
        internalNote,
        status: status || 'ACTIVE',
        createdBy: (req as any).user?.name || 'Admin'
      }
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'CREATE_COUPON', 'Coupon', `Created coupon ${coupon.code}`);

    res.status(201).json({ success: true, coupon, message: 'Coupon created successfully.' });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating coupon' });
  }
};

// 4. Update Coupon (Admin)
export const updateAdminCoupon = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = CouponService.normalizeCode(updateData.code);
    }
    if (updateData.discountValue !== undefined) updateData.discountValue = parseFloat(updateData.discountValue);
    if (updateData.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = updateData.maxDiscountAmount ? parseFloat(updateData.maxDiscountAmount) : null;
    if (updateData.minOrderValue !== undefined) updateData.minOrderValue = updateData.minOrderValue ? parseFloat(updateData.minOrderValue) : 0;
    if (updateData.startAt !== undefined) updateData.startAt = updateData.startAt ? new Date(updateData.startAt) : null;
    if (updateData.endAt !== undefined) updateData.endAt = updateData.endAt ? new Date(updateData.endAt) : null;
    if (updateData.totalUsageLimit !== undefined) updateData.totalUsageLimit = updateData.totalUsageLimit ? parseInt(updateData.totalUsageLimit, 10) : null;
    if (updateData.perCustomerLimit !== undefined) updateData.perCustomerLimit = updateData.perCustomerLimit ? parseInt(updateData.perCustomerLimit, 10) : 1;
    if (typeof updateData.eligibleProducts === 'object') updateData.eligibleProducts = JSON.stringify(updateData.eligibleProducts);
    if (typeof updateData.excludedProducts === 'object') updateData.excludedProducts = JSON.stringify(updateData.excludedProducts);
    if (typeof updateData.eligibleCategories === 'object') updateData.eligibleCategories = JSON.stringify(updateData.eligibleCategories);
    if (typeof updateData.eligibleCustomerSegments === 'object') updateData.eligibleCustomerSegments = JSON.stringify(updateData.eligibleCustomerSegments);
    if (typeof updateData.eligibleBundles === 'object') updateData.eligibleBundles = JSON.stringify(updateData.eligibleBundles);
    if (updateData.commissionRate !== undefined) updateData.commissionRate = updateData.commissionRate ? parseFloat(updateData.commissionRate) : null;
    if (updateData.freeProductId !== undefined) updateData.freeProductId = updateData.freeProductId || null;
    if (updateData.affiliateId !== undefined) updateData.affiliateId = updateData.affiliateId || null;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'UPDATE_COUPON', 'Coupon', `Updated coupon ${coupon.code}`);

    res.status(200).json({ success: true, coupon, message: 'Coupon updated successfully.' });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating coupon' });
  }
};

// 5. Update Status (Activate, Pause, Disable)
export const updateCouponStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { status }
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'CHANGE_COUPON_STATUS', 'Coupon', `Changed coupon ${coupon.code} status to ${status}`);

    res.status(200).json({ success: true, coupon, message: `Coupon status changed to ${status}.` });
  } catch (error: any) {
    console.error('Error updating coupon status:', error);
    res.status(500).json({ success: false, message: 'Server error updating coupon status' });
  }
};

// 6. Get Coupon Redemptions
export const getCouponRedemptions = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { page = 1, limit = 25 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    const where = id ? { couponId: id } : {};

    const [redemptions, total] = await Promise.all([
      prisma.couponRedemption.findMany({
        where,
        include: {
          coupon: { select: { id: true, code: true, discountType: true } },
          customer: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, orderNumber: true, totalAmount: true, paymentStatus: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.couponRedemption.count({ where })
    ]);

    res.status(200).json({
      success: true,
      redemptions,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({ success: false, message: 'Server error fetching redemptions' });
  }
};

// 7. Get Coupon Abuse Logs
export const getCouponAbuseLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    const [abuseLogs, total] = await Promise.all([
      prisma.couponAbuseLog.findMany({
        include: {
          coupon: { select: { id: true, code: true, status: true } },
          customer: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.couponAbuseLog.count()
    ]);

    res.status(200).json({
      success: true,
      abuseLogs,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching coupon abuse logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching abuse logs' });
  }
};

// 8. Public / Checkout Coupon Validation API
export const validateCheckoutCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      cartItems,
      cartTotal,
      productId,
      bundleId,
      unitPrice,
      customerId,
      guestEmail,
      guestPhone
    } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';

    // Construct fallback items if cartTotal or single product was sent
    let items = cartItems || [];
    if (items.length === 0 && (productId || bundleId || unitPrice !== undefined || cartTotal !== undefined)) {
      items = [{
        productId,
        bundleId,
        quantity: 1,
        unitPrice: Number(unitPrice ?? cartTotal ?? 0)
      }];
    }

    const resolvedCustomerId = customerId || (req as any).user?.id;
    const resolvedEmail = guestEmail || (req as any).user?.email;

    const result = await CouponService.validateCoupon({
      code,
      cartItems: items,
      customerId: resolvedCustomerId,
      guestEmail: resolvedEmail,
      guestPhone,
      ipAddress
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, data: result, ...result });
    }

    res.status(200).json({
      success: true,
      data: {
        ...result,
        discountPercentage: result.discountType === 'PERCENTAGE' || result.discountType === 'FIRST_ORDER' ? result.discountValue : 0
      },
      ...result,
      discountPercentage: result.discountType === 'PERCENTAGE' || result.discountType === 'FIRST_ORDER' ? result.discountValue : 0
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error validating coupon' });
  }
};

// 9. Customer Available Coupons & "My Coupons" API
export const getCustomerCoupons = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.id || (req.query.customerId as string);
    const email = (req as any).user?.email || (req.query.email as string);

    const now = new Date();

    // Query all coupons that are currently active and within valid date window
    const coupons = await prisma.coupon.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { startAt: null },
          { startAt: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } }
            ]
          }
        ]
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    // Check customer paid order count & first-order redemption history
    let hasPriorPaidOrders = false;
    const redeemedCountMap = new Map<string, number>();

    if (customerId || email) {
      hasPriorPaidOrders = await CouponService.checkPriorPaidOrders(customerId, email);

      const conditions: any[] = [];
      if (customerId) conditions.push({ customerId });
      if (email && email.trim()) conditions.push({ guestEmail: { equals: email.trim(), mode: 'insensitive' } });

      if (conditions.length > 0) {
        const redemptions = await prisma.couponRedemption.findMany({
          where: {
            status: { in: ['REDEEMED', 'RESERVED'] },
            OR: conditions
          },
          select: { couponId: true }
        });

        for (const r of redemptions) {
          redeemedCountMap.set(r.couponId, (redeemedCountMap.get(r.couponId) || 0) + 1);
        }
      }
    }

    const enrichedCoupons = coupons
      .filter(coupon => {
        // Exclude global exhausted coupons
        if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
          return false;
        }
        return true;
      })
      .map(coupon => {
        const isFirstOrder = coupon.discountType === 'FIRST_ORDER';
        const isPermanent = !coupon.endAt;

        let durationBadge = 'Permanent';
        let durationLabel = 'Permanent / No Expiration';
        let daysRemaining: number | null = null;

        if (coupon.endAt) {
          const startMs = coupon.startAt ? new Date(coupon.startAt).getTime() : new Date(coupon.createdAt).getTime();
          const endMs = new Date(coupon.endAt).getTime();
          const totalSpanDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
          daysRemaining = Math.max(0, Math.ceil((endMs - now.getTime()) / (1000 * 60 * 60 * 24)));

          if (totalSpanDays <= 8) {
            durationBadge = '1 Week Limited';
          } else if (totalSpanDays <= 32) {
            durationBadge = '1 Month Limited';
          } else {
            durationBadge = 'Limited Time';
          }

          durationLabel = daysRemaining > 0 
            ? `${durationBadge} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left)`
            : 'Expiring today';
        }

        let formattedDiscount = '';
        if (coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'FIRST_ORDER') {
          formattedDiscount = `${coupon.discountValue}% OFF`;
        } else if (coupon.discountType === 'FIXED') {
          formattedDiscount = `₹${coupon.discountValue} OFF`;
        } else if (coupon.discountType === 'FREE_PRODUCT') {
          formattedDiscount = 'FREE PRODUCT';
        } else {
          formattedDiscount = `${coupon.discountValue}% OFF`;
        }

        let isEligible = true;
        let ineligibilityReason = '';

        // First-order check
        if (isFirstOrder && hasPriorPaidOrders) {
          isEligible = false;
          ineligibilityReason = 'Valid for verified first-time buyers only (Already claimed on prior order)';
        }

        // Per customer usage check
        const customerUsedCount = redeemedCountMap.get(coupon.id) || 0;
        const perCustomerLimit = coupon.perCustomerLimit || 1;
        if (customerUsedCount >= perCustomerLimit) {
          isEligible = false;
          ineligibilityReason = `Already redeemed (Limit: ${perCustomerLimit} per customer)`;
        }

        // Customer segment check
        if (coupon.discountType === 'CUSTOMER_SEGMENT') {
          let eligibleSegments: string[] = [];
          try {
            eligibleSegments = coupon.eligibleCustomerSegments ? JSON.parse(coupon.eligibleCustomerSegments) : [];
          } catch {
            eligibleSegments = coupon.eligibleCustomerSegments ? coupon.eligibleCustomerSegments.split(',').map((s: string) => s.trim()) : [];
          }
          const isTargeted = (customerId && eligibleSegments.includes(customerId)) ||
                             (email && eligibleSegments.some((seg: string) => seg.toLowerCase() === email.toLowerCase()));
          if (!isTargeted) {
            isEligible = false;
            ineligibilityReason = 'Exclusive VIP / segment discount (Not targeted to your account)';
          }
        }

        return {
          id: coupon.id,
          code: coupon.code,
          internalName: coupon.internalName || coupon.code,
          description: coupon.description || (isFirstOrder ? 'Special welcome offer for your first order' : 'Exclusive promotional discount'),
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          formattedDiscount,
          discountPercentage: (coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'FIRST_ORDER') ? coupon.discountValue : 0,
          maxDiscountAmount: coupon.maxDiscountAmount,
          minOrderValue: coupon.minOrderValue || 0,
          startAt: coupon.startAt,
          endAt: coupon.endAt,
          isPermanent,
          durationBadge,
          durationLabel,
          daysRemaining,
          isFirstOrder,
          isEligible,
          ineligibilityReason,
          perCustomerLimit,
          freeProductId: coupon.freeProductId,
          eligibleProducts: coupon.eligibleProducts,
          eligibleCategories: coupon.eligibleCategories,
          eligibleBundles: coupon.eligibleBundles,
          stackingPolicy: coupon.stackingPolicy,
          createdAt: coupon.createdAt
        };
      });

    // Also fetch eligible active Customer-Specific Offers
    let customerOffers: any[] = [];
    if (customerId || email) {
      const activeOffers = await prisma.offer.findMany({
        where: {
          offerType: { in: ['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'] },
          status: 'ACTIVE',
          OR: [{ startAt: null }, { startAt: { lte: now } }],
          AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
        }
      });

      customerOffers = activeOffers
        .filter(offer => OfferService.isCustomerEligibleForOffer(offer, { id: customerId, email }))
        .map(offer => {
          const isPct = offer.discountType === 'PERCENTAGE';
          const daysLeft = offer.endAt ? Math.max(0, Math.ceil((new Date(offer.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

          return {
            id: `offer_${offer.id}`,
            code: offer.slug || offer.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
            internalName: offer.name,
            description: offer.bannerText || 'Special VIP discount targeted exclusively to your account',
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            formattedDiscount: isPct ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`,
            discountPercentage: isPct ? offer.discountValue : 0,
            maxDiscountAmount: null,
            minOrderValue: offer.minOrderValue || 0,
            startAt: offer.startAt,
            endAt: offer.endAt,
            isPermanent: !offer.endAt,
            durationBadge: 'Customer VIP Deal',
            durationLabel: daysLeft !== null ? `${daysLeft} days left` : 'Active Deal',
            daysRemaining: daysLeft,
            isFirstOrder: false,
            isEligible: true,
            ineligibilityReason: '',
            perCustomerLimit: 1,
            isCustomerSpecificOffer: true,
            badgeText: offer.badgeText || 'VIP EXCLUSIVE',
            createdAt: offer.createdAt
          };
        });
    }

    const allCustomerPromotions = [...customerOffers, ...enrichedCoupons];

    res.status(200).json({
      success: true,
      coupons: allCustomerPromotions,
      data: allCustomerPromotions
    });
  } catch (error: any) {
    console.error('Error fetching customer coupons:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching coupons' });
  }
};
