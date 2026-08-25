import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { OfferService } from '../services/offerService';
import { logAdminAction } from '../utils/auditLogger';

// 1. Get All Offers with subview filters and live KPIs
export const getAdminOffers = async (req: Request, res: Response) => {
  try {
    const { status, offerType, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (offerType && offerType !== 'ALL') {
      where.offerType = offerType as string;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [offers, total, activeCount, scheduledCount, flashSalesCount, bundleOffersCount] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true } },
          rules: true
        },
        orderBy: { priority: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.offer.count({ where }),
      prisma.offer.count({ where: { status: 'ACTIVE' } }),
      prisma.offer.count({ where: { status: 'SCHEDULED' } }),
      prisma.offer.count({ where: { offerType: 'TIME_LIMITED' } }),
      prisma.offer.count({ where: { offerType: 'BUNDLE_OFFER' } })
    ]);

    // Live aggregated revenue generated through offers
    const metricsAgg = await prisma.offer.aggregate({
      _sum: { revenueGenerated: true, discountGiven: true, ordersCount: true }
    });

    res.status(200).json({
      success: true,
      offers,
      kpis: {
        totalOffers: total,
        activeOffers: activeCount,
        scheduledOffers: scheduledCount,
        flashSales: flashSalesCount,
        bundleOffers: bundleOffersCount,
        totalRevenue: metricsAgg._sum.revenueGenerated || 0,
        totalDiscountGiven: metricsAgg._sum.discountGiven || 0,
        totalOrders: metricsAgg._sum.ordersCount || 0
      },
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
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
      include: { campaign: true, rules: true }
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

// 3. Create Offer with Conflict Check
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
      campaignId,
      status
    } = req.body;

    const parsedProductIds = Array.isArray(productIds) ? productIds : (productIds ? [productIds] : []);

    // Conflict Check
    const conflicts = await OfferService.detectConflicts({
      productIds: parsedProductIds,
      categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      discountType,
      discountValue: parseFloat(discountValue)
    });

    const offer = await prisma.offer.create({
      data: {
        name,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        offerType: offerType || 'SALE_PRICE',
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue) || 0,
        productIds: JSON.stringify(parsedProductIds),
        categoryIds: typeof categoryIds === 'object' ? JSON.stringify(categoryIds) : categoryIds,
        bundleIds: typeof bundleIds === 'object' ? JSON.stringify(bundleIds) : bundleIds,
        customerSegment,
        buyQuantity: buyQuantity ? parseInt(buyQuantity, 10) : null,
        getQuantity: getQuantity ? parseInt(getQuantity, 10) : null,
        freeProductId,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        priority: priority ? parseInt(priority, 10) : 1,
        stackingPolicy: stackingPolicy || 'EXCLUSIVE',
        displayPlacement: displayPlacement || 'BANNER_AND_PRODUCT',
        campaignId: campaignId || null,
        status: status || 'ACTIVE',
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

    if (updateData.discountValue !== undefined) updateData.discountValue = parseFloat(updateData.discountValue);
    if (updateData.priority !== undefined) updateData.priority = parseInt(updateData.priority, 10);
    if (typeof updateData.productIds === 'object') updateData.productIds = JSON.stringify(updateData.productIds);
    if (typeof updateData.categoryIds === 'object') updateData.categoryIds = JSON.stringify(updateData.categoryIds);
    if (updateData.startAt !== undefined) updateData.startAt = updateData.startAt ? new Date(updateData.startAt) : null;
    if (updateData.endAt !== undefined) updateData.endAt = updateData.endAt ? new Date(updateData.endAt) : null;

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

    const offer = await prisma.offer.update({
      where: { id },
      data: { status }
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'CHANGE_OFFER_STATUS', 'Offer', `Changed offer ${offer.name} status to ${status}`);

    res.status(200).json({ success: true, offer, message: `Offer status updated to ${status}.` });
  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ success: false, message: 'Server error updating offer status' });
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
      discountValue: parseFloat(discountValue)
    });

    res.status(200).json({ success: true, conflicts });
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

    res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error('Error fetching active offers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching active offers' });
  }
};
