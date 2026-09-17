import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { OfferService } from '../services/offerService';
import { logAdminAction } from '../utils/auditLogger';

// 1. Get All Offers with subview filters and live KPIs
export const getAdminOffers = async (req: Request, res: Response) => {
  try {
    const { status, offerType, search, sortBy = 'priority_asc', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const now = new Date();

    // 0. Auto-reconcile statuses in DB
    try {
      // Mark active offers past endAt as EXPIRED
      await prisma.offer.updateMany({
        where: {
          status: 'ACTIVE',
          endAt: { not: null, lt: now }
        },
        data: { status: 'EXPIRED' }
      });

      // Mark scheduled offers whose startAt has arrived as ACTIVE
      await prisma.offer.updateMany({
        where: {
          status: 'SCHEDULED',
          startAt: { not: null, lte: now },
          OR: [{ endAt: null }, { endAt: { gte: now } }]
        },
        data: { status: 'ACTIVE' }
      });
    } catch (reconcileErr) {
      console.warn('Auto-reconciliation warning:', reconcileErr);
    }

    const conditions: any[] = [];

    // 1. Subview / Status filtering
    if (status) {
      const s = String(status).toUpperCase();
      if (s === 'ACTIVE') {
        conditions.push({ status: 'ACTIVE' });
        conditions.push({
          OR: [{ startAt: null }, { startAt: { lte: now } }]
        });
        conditions.push({
          OR: [{ endAt: null }, { endAt: { gte: now } }]
        });
      } else if (s === 'SCHEDULED') {
        conditions.push({
          OR: [
            { status: 'SCHEDULED' },
            { AND: [{ status: 'ACTIVE' }, { startAt: { gt: now } }] }
          ]
        });
        conditions.push({
          status: { notIn: ['DISABLED', 'DRAFT', 'EXPIRED'] }
        });
        conditions.push({
          OR: [{ endAt: null }, { endAt: { gt: now } }]
        });
      } else if (s === 'EXPIRED') {
        conditions.push({
          OR: [
            { status: 'EXPIRED' },
            { AND: [{ endAt: { not: null } }, { endAt: { lt: now } }] }
          ]
        });
      } else if (s !== 'ALL') {
        conditions.push({ status: s });
      }
    }

    // 2. Offer Type filtering
    if (offerType && offerType !== 'ALL') {
      if (offerType === 'FLASH_SALE' || offerType === 'TIME_LIMITED') {
        conditions.push({ offerType: { in: ['FLASH_SALE', 'TIME_LIMITED'] } });
      } else if (offerType === 'BUNDLE_OFFER' || offerType === 'BUNDLE_DEAL') {
        conditions.push({ offerType: { in: ['BUNDLE_OFFER', 'BUNDLE_DEAL'] } });
      } else if (offerType === 'FIRST_ORDER_OFFER' || offerType === 'FIRST_ORDER') {
        conditions.push({ offerType: { in: ['FIRST_ORDER_OFFER', 'FIRST_ORDER'] } });
      } else if (offerType === 'CUSTOMER_SPECIFIC_OFFER' || offerType === 'CUSTOMER_SPECIFIC') {
        conditions.push({ offerType: { in: ['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'] } });
      } else {
        conditions.push({ offerType: offerType as string });
      }
    }

    // 3. Multi-Criteria Search
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      conditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { displayPlacement: { contains: q, mode: 'insensitive' } }
        ]
      });
    }

    const where: any = conditions.length > 0 ? { AND: conditions } : {};

    // 4. Sorting
    let orderBy: any = { priority: 'asc' };
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'revenue_desc':
        orderBy = { revenueGenerated: 'desc' };
        break;
      case 'orders_desc':
        orderBy = { ordersCount: 'desc' };
        break;
      case 'priority_asc':
      default:
        orderBy = { priority: 'asc' };
    }

    const [
      offers,
      total,
      totalCount,
      activeCount,
      scheduledCount,
      flashSalesCount,
      bundleOffersCount,
      customerSpecificCount,
      metricsAgg
    ] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true } },
          rules: true
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.offer.count({ where }),
      prisma.offer.count(),
      prisma.offer.count({
        where: {
          status: 'ACTIVE',
          OR: [{ startAt: null }, { startAt: { lte: now } }],
          AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
        }
      }),
      prisma.offer.count({
        where: {
          OR: [
            { status: 'SCHEDULED' },
            { AND: [{ status: 'ACTIVE' }, { startAt: { gt: now } }] }
          ],
          AND: [
            { status: { notIn: ['DISABLED', 'DRAFT', 'EXPIRED'] } },
            { OR: [{ endAt: null }, { endAt: { gt: now } }] }
          ]
        }
      }),
      prisma.offer.count({
        where: { offerType: { in: ['FLASH_SALE', 'TIME_LIMITED'] } }
      }),
      prisma.offer.count({
        where: { offerType: { in: ['BUNDLE_OFFER', 'BUNDLE_DEAL'] } }
      }),
      prisma.offer.count({
        where: { offerType: { in: ['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'] } }
      }),
      prisma.offer.aggregate({
        _sum: {
          revenueGenerated: true,
          discountGiven: true,
          ordersCount: true,
          viewsCount: true,
          clicksCount: true
        }
      })
    ]);

    // Batch enrich target bundles and products
    const allBundleIds = new Set<string>();
    const allProductIds = new Set<string>();

    offers.forEach((o: any) => {
      try {
        if (o.bundleIds) {
          const parsed = typeof o.bundleIds === 'string' ? JSON.parse(o.bundleIds) : o.bundleIds;
          if (Array.isArray(parsed)) parsed.forEach((id: string) => allBundleIds.add(id));
        }
        if (o.productIds) {
          const parsed = typeof o.productIds === 'string' ? JSON.parse(o.productIds) : o.productIds;
          if (Array.isArray(parsed)) parsed.forEach((id: string) => allProductIds.add(id));
        }
      } catch {}
    });

    const [bundlesMap, productsMap] = await Promise.all([
      allBundleIds.size > 0
        ? prisma.bundle.findMany({
            where: { id: { in: Array.from(allBundleIds) } },
            select: { id: true, title: true, slug: true, price: true }
          }).then(list => new Map(list.map(b => [b.id, b])))
        : new Map(),
      allProductIds.size > 0
        ? prisma.product.findMany({
            where: { id: { in: Array.from(allProductIds) } },
            select: { id: true, name: true, slug: true, price: true }
          }).then(list => new Map(list.map(p => [p.id, p])))
        : new Map()
    ]);

    const enrichedOffers = offers.map((o: any) => {
      let bIds: string[] = [];
      let pIds: string[] = [];
      let targetCustomerList: string[] = [];

      try {
        if (o.bundleIds) bIds = typeof o.bundleIds === 'string' ? JSON.parse(o.bundleIds) : o.bundleIds;
      } catch {}
      try {
        if (o.productIds) pIds = typeof o.productIds === 'string' ? JSON.parse(o.productIds) : o.productIds;
      } catch {}
      try {
        if (o.customerSegment) {
          const parsed = typeof o.customerSegment === 'string' ? JSON.parse(o.customerSegment) : o.customerSegment;
          if (Array.isArray(parsed)) {
            targetCustomerList = parsed.map(String);
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.emails)) targetCustomerList.push(...parsed.emails);
            if (Array.isArray(parsed.customerIds)) targetCustomerList.push(...parsed.customerIds);
          }
        }
      } catch {
        if (typeof o.customerSegment === 'string') {
          targetCustomerList = o.customerSegment.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      return {
        ...o,
        targetBundles: bIds.map(id => bundlesMap.get(id)).filter(Boolean),
        targetProducts: pIds.map(id => productsMap.get(id)).filter(Boolean),
        targetCustomers: targetCustomerList
      };
    });

    res.status(200).json({
      success: true,
      offers: enrichedOffers,
      kpis: {
        totalOffers: totalCount,
        activeOffers: activeCount,
        scheduledOffers: scheduledCount,
        flashSales: flashSalesCount,
        bundleOffers: bundleOffersCount,
        customerSpecificOffers: customerSpecificCount,
        totalViews: metricsAgg._sum.viewsCount || 0,
        totalClicks: metricsAgg._sum.clicksCount || 0,
        totalOrders: metricsAgg._sum.ordersCount || 0,
        totalRevenue: metricsAgg._sum.revenueGenerated || 0,
        totalDiscountGiven: metricsAgg._sum.discountGiven || 0
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching offers' });
  }
};

// 2. Get Single Offer
export const getAdminOfferById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        campaign: true,
        rules: true,
        applications: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            order: { select: { orderNumber: true, totalAmount: true, guestEmail: true, createdAt: true } }
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    res.status(200).json({ success: true, offer });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ success: false, message: 'Server error fetching offer' });
  }
};

// 3. Create Offer with Conflict Check and Duplicate Prevention
export const createAdminOffer = async (req: Request, res: Response) => {
  try {
    const {
      name,
      offerType,
      discountType,
      discountValue,
      productIds,
      categoryIds,
      bundleIds,
      bundleId,
      customerSegment,
      buyQuantity,
      getQuantity,
      freeProductId,
      minOrderValue,
      startAt,
      endAt,
      priority,
      stackingPolicy,
      displayPlacement,
      badgeText,
      bannerText,
      campaignId,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Offer name is required' });
    }

    const trimmedName = name.trim();

    // Prevent duplicate offer names
    const existingSameName = await prisma.offer.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } }
    });
    if (existingSameName) {
      return res.status(409).json({
        success: false,
        message: `An offer named "${trimmedName}" already exists. Please choose a distinct name or edit the existing offer.`
      });
    }

    if (!endAt) {
      return res.status(400).json({
        success: false,
        message: 'Offer expiration date (endAt) is required. Promotional offers must have an expiration date.'
      });
    }

    const startDate = startAt ? new Date(startAt) : null;
    const endDate = new Date(endAt);

    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
    }

    // Auto-schedule if start date is in the future
    let finalStatus = status || 'ACTIVE';
    if (startDate && startDate > new Date() && finalStatus !== 'DRAFT' && finalStatus !== 'DISABLED') {
      finalStatus = 'SCHEDULED';
    }

    const parsedProductIds = Array.isArray(productIds) ? productIds : (productIds ? [productIds] : []);

    let finalBundleIds = bundleIds;
    if (!finalBundleIds && bundleId) finalBundleIds = [bundleId];
    if (typeof finalBundleIds === 'string') {
      try {
        finalBundleIds = JSON.parse(finalBundleIds);
      } catch {
        finalBundleIds = finalBundleIds ? [finalBundleIds] : [];
      }
    }

    // Conflict Check
    const conflicts = await OfferService.detectConflicts({
      productIds: parsedProductIds,
      categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
      startAt: startDate || undefined,
      endAt: endDate || undefined,
      discountType,
      discountValue: parseFloat(discountValue)
    });

    const rawMinOrder = minOrderValue !== undefined ? parseFloat(minOrderValue) : 0;
    const cleanMinOrder = isNaN(rawMinOrder) || rawMinOrder < 0 ? 0 : rawMinOrder;

    const offer = await prisma.offer.create({
      data: {
        name: trimmedName,
        slug: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        offerType: offerType || 'PRODUCT_DISCOUNT',
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue) || 0,
        productIds: JSON.stringify(parsedProductIds),
        categoryIds: typeof categoryIds === 'object' ? JSON.stringify(categoryIds) : (categoryIds || null),
        bundleIds: Array.isArray(finalBundleIds) ? JSON.stringify(finalBundleIds) : (finalBundleIds ? JSON.stringify([finalBundleIds]) : null),
        customerSegment: customerSegment ? (typeof customerSegment === 'object' ? JSON.stringify(customerSegment) : String(customerSegment)) : null,
        buyQuantity: buyQuantity ? parseInt(buyQuantity, 10) : null,
        getQuantity: getQuantity ? parseInt(getQuantity, 10) : null,
        freeProductId: freeProductId || null,
        minOrderValue: cleanMinOrder,
        startAt: startDate,
        endAt: endDate,
        priority: priority ? parseInt(priority, 10) : 1,
        stackingPolicy: stackingPolicy || 'EXCLUSIVE',
        displayPlacement: displayPlacement || 'STOREFRONT_BANNER',
        badgeText:
          badgeText ||
          (discountType === 'PERCENTAGE'
            ? `${discountValue}% OFF`
            : discountType === 'FLAT_PRICE'
            ? `₹${discountValue} ONLY`
            : `₹${discountValue} OFF`),
        bannerText: bannerText || null,
        campaignId: campaignId || null,
        status: finalStatus,
        createdBy: (req as any).user?.name || 'Admin'
      }
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'CREATE_OFFER', 'Offer', `Created offer ${offer.name}`);

    res.status(201).json({
      success: true,
      offer,
      conflicts,
      message: 'Offer created successfully.'
    });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating offer' });
  }
};

// 4. Update Offer
export const updateAdminOffer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = { ...req.body };

    if (updateData.name && updateData.name.trim()) {
      const trimmed = updateData.name.trim();
      const duplicate = await prisma.offer.findFirst({
        where: {
          id: { not: id },
          name: { equals: trimmed, mode: 'insensitive' }
        }
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another offer named "${trimmed}" already exists.`
        });
      }
      updateData.name = trimmed;
    }

    if (updateData.discountValue !== undefined) updateData.discountValue = parseFloat(updateData.discountValue);
    if (updateData.minOrderValue !== undefined) {
      const parsedMin = parseFloat(updateData.minOrderValue);
      updateData.minOrderValue = isNaN(parsedMin) || parsedMin < 0 ? 0 : parsedMin;
    }
    if (updateData.priority !== undefined) updateData.priority = parseInt(updateData.priority, 10);
    if (typeof updateData.productIds === 'object') updateData.productIds = JSON.stringify(updateData.productIds);
    if (typeof updateData.categoryIds === 'object') updateData.categoryIds = JSON.stringify(updateData.categoryIds);
    if (typeof updateData.bundleIds === 'object') updateData.bundleIds = JSON.stringify(updateData.bundleIds);
    if (updateData.bundleId && !updateData.bundleIds) {
      updateData.bundleIds = JSON.stringify([updateData.bundleId]);
    }
    if (updateData.customerSegment !== undefined) {
      updateData.customerSegment = updateData.customerSegment
        ? (typeof updateData.customerSegment === 'object' ? JSON.stringify(updateData.customerSegment) : String(updateData.customerSegment))
        : null;
    }
    delete updateData.bundleId;
    delete updateData.targetBundles;
    delete updateData.targetProducts;
    delete updateData.targetCustomers;
    delete updateData.campaign;
    delete updateData.rules;
    delete updateData.applications;
    if (updateData.badgeText !== undefined) updateData.badgeText = updateData.badgeText || null;
    if (updateData.bannerText !== undefined) updateData.bannerText = updateData.bannerText || null;
    
    if (updateData.startAt !== undefined) {
      updateData.startAt = updateData.startAt ? new Date(updateData.startAt) : null;
      if (updateData.startAt && updateData.startAt > new Date() && updateData.status !== 'DRAFT' && updateData.status !== 'DISABLED') {
        updateData.status = 'SCHEDULED';
      }
    }
    if (updateData.endAt !== undefined) {
      if (!updateData.endAt) {
        return res.status(400).json({
          success: false,
          message: 'Offer expiration date (endAt) is required. Promotional offers cannot be permanent.'
        });
      }
      updateData.endAt = new Date(updateData.endAt);
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'UPDATE_OFFER', 'Offer', `Updated offer ${offer.name}`);

    res.status(200).json({ success: true, offer, message: 'Offer updated successfully.' });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating offer' });
  }
};

// 5. Update Offer Status
export const updateOfferStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updatePayload: any = { status };

    // If activating an offer that had a future start date, set startAt to now for immediate activation
    if (status === 'ACTIVE') {
      const current = await prisma.offer.findUnique({ where: { id } });
      if (current?.startAt && current.startAt > new Date()) {
        updatePayload.startAt = new Date();
      }
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updatePayload
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'CHANGE_OFFER_STATUS', 'Offer', `Changed offer ${offer.name} status to ${status}`);

    res.status(200).json({ success: true, offer, message: `Offer status updated to ${status}.` });
  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ success: false, message: 'Server error updating offer status' });
  }
};

// 5b. Delete Offer
export const deleteAdminOffer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    // Cascade delete rules and applications
    await prisma.offerRule.deleteMany({ where: { offerId: id } });
    await prisma.offerApplication.deleteMany({ where: { offerId: id } });
    await prisma.offer.delete({ where: { id } });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'DELETE_OFFER', 'Offer', `Deleted offer ${offer.name} (${id})`);

    res.status(200).json({ success: true, message: `Offer "${offer.name}" deleted successfully.` });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error deleting offer' });
  }
};

// 6. Check Conflicts Endpoint
export const checkOfferConflicts = async (req: Request, res: Response) => {
  try {
    const { id, productIds, categoryIds, startAt, endAt, discountType, discountValue } = req.body;
    const conflicts = await OfferService.detectConflicts({
      id,
      productIds: Array.isArray(productIds) ? productIds : [],
      categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      discountType,
      discountValue: parseFloat(discountValue) || 0
    });

    res.status(200).json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error: any) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error checking conflicts' });
  }
};

// 7. Storefront Active Offers (Public)
export const getActiveStorefrontOffers = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
      },
      orderBy: { priority: 'asc' }
    });

    const currentUser = (req as any).user;
    // Filter out customer-specific offers for users who are not targeted
    const visibleOffers = offers.filter(offer => {
      if (['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'].includes(offer.offerType)) {
        return OfferService.isCustomerEligibleForOffer(offer, currentUser);
      }
      return true;
    });

    // Batch enrich target bundles and products for clickable links and headline details
    const allBundleIds = new Set<string>();
    const allProductIds = new Set<string>();

    visibleOffers.forEach((o: any) => {
      try {
        if (o.bundleIds) {
          const parsed = typeof o.bundleIds === 'string' ? JSON.parse(o.bundleIds) : o.bundleIds;
          if (Array.isArray(parsed)) parsed.forEach((id: string) => allBundleIds.add(id));
        }
        if (o.productIds) {
          const parsed = typeof o.productIds === 'string' ? JSON.parse(o.productIds) : o.productIds;
          if (Array.isArray(parsed)) parsed.forEach((id: string) => allProductIds.add(id));
        }
      } catch {}
    });

    const [bundlesMap, productsMap] = await Promise.all([
      allBundleIds.size > 0
        ? prisma.bundle.findMany({
            where: { id: { in: Array.from(allBundleIds) } },
            select: { id: true, title: true, slug: true, price: true, coverImage: true }
          }).then(list => new Map(list.map(b => [b.id, b])))
        : new Map(),
      allProductIds.size > 0
        ? prisma.product.findMany({
            where: { id: { in: Array.from(allProductIds) } },
            select: { id: true, name: true, slug: true, price: true, thumbnail: true }
          }).then(list => new Map(list.map(p => [p.id, p])))
        : new Map()
    ]);

    const enrichedOffers = visibleOffers.map((o: any) => {
      let bIds: string[] = [];
      let pIds: string[] = [];
      try {
        if (o.bundleIds) bIds = typeof o.bundleIds === 'string' ? JSON.parse(o.bundleIds) : o.bundleIds;
      } catch {}
      try {
        if (o.productIds) pIds = typeof o.productIds === 'string' ? JSON.parse(o.productIds) : o.productIds;
      } catch {}

      return {
        ...o,
        targetBundles: bIds.map(id => bundlesMap.get(id)).filter(Boolean),
        targetProducts: pIds.map(id => productsMap.get(id)).filter(Boolean)
      };
    });

    res.status(200).json({ success: true, offers: enrichedOffers });
  } catch (error) {
    console.error('Error fetching active offers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching active offers' });
  }
};

// 8. Public / Cart Real-Time Offer Evaluation Endpoint
export const evaluateCartOffers = async (req: Request, res: Response) => {
  try {
    const { items, customerId, guestEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(200).json({
        success: true,
        appliedOffers: [],
        totalPromotionDiscount: 0,
        itemDiscounts: {},
        isExclusive: false
      });
    }

    const evaluationItems = items.map((i: any) => ({
      productId: i.productId || (i.type !== 'bundle' ? i.id : undefined),
      bundleId: i.bundleId || (i.type === 'bundle' ? i.id : undefined),
      categoryId: i.categoryId,
      quantity: i.quantity || 1,
      unitPrice: parseFloat(i.unitPrice || i.price || 0)
    }));

    const result = await OfferService.evaluateCartOffers({
      items: evaluationItems,
      customerId: customerId || (req as any).user?.id,
      guestEmail
    });

    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error evaluating cart offers:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate cart offers' });
  }
};

// 9. Public Interaction Tracker (Views & Clicks)
export const trackOfferInteraction = async (req: Request, res: Response) => {
  try {
    const { offerId, type } = req.body;
    if (!offerId || !type || !['VIEW', 'CLICK'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Valid offerId and type (VIEW or CLICK) required' });
    }

    await OfferService.recordInteraction(offerId, type);
    res.status(200).json({ success: true, message: 'Interaction recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recording interaction' });
  }
};

// 10. Server-Side CSV Export
export const exportOffersCSV = async (req: Request, res: Response) => {
  try {
    const { status, offerType } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status as string;
    if (offerType && offerType !== 'ALL') where.offerType = offerType as string;

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { priority: 'asc' }
    });

    const headers = [
      'Offer ID',
      'Name',
      'Type',
      'Discount Type',
      'Discount Value',
      'Priority',
      'Stacking Policy',
      'Status',
      'Views',
      'Clicks',
      'Orders',
      'Revenue Boosted (INR)',
      'Start Date',
      'End Date'
    ];

    const rows = offers.map(o => [
      `"${o.id}"`,
      `"${(o.name || '').replace(/"/g, '""')}"`,
      `"${o.offerType}"`,
      `"${o.discountType}"`,
      o.discountValue,
      o.priority,
      `"${o.stackingPolicy}"`,
      `"${o.status}"`,
      o.viewsCount,
      o.clicksCount,
      o.ordersCount,
      o.revenueGenerated,
      o.startAt ? new Date(o.startAt).toISOString() : 'Immediate',
      o.endAt ? new Date(o.endAt).toISOString() : 'No expiry'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=kwd_offers_export_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting offers CSV:', error);
    res.status(500).json({ success: false, message: 'Error exporting offers CSV' });
  }
};
