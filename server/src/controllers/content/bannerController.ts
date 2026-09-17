import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { placement = 'ALL', status = 'ALL', search } = req.query;
    const where: any = {};
    if (placement && placement !== 'ALL') {
      if (placement === 'STOREFRONT_PAGE') {
        where.OR = [
          { placement: 'STOREFRONT_PAGE' },
          { placement: { startsWith: 'PAGE_' } },
          { placement: { startsWith: 'PAGE:' } }
        ];
      } else {
        where.placement = String(placement);
      }
    }
    if (status && status !== 'ALL') where.status = String(status);
    if (search) {
      const s = String(search).trim();
      const searchConditions = [
        { name: { contains: s, mode: 'insensitive' } },
        { headline: { contains: s, mode: 'insensitive' } },
        { ctaLabel: { contains: s, mode: 'insensitive' } },
        { placement: { contains: s, mode: 'insensitive' } }
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Automatically check and expire past banners
    const now = new Date();
    await prisma.contentBanner.updateMany({
      where: {
        status: 'ACTIVE',
        endAt: { lt: now }
      },
      data: { status: 'EXPIRED' }
    });

    const banners = await prisma.contentBanner.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }]
    });

    res.json({ success: true, data: banners, banners });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      placement = 'HOMEPAGE_HERO',
      desktopImage,
      tabletImage,
      mobileImage,
      altText,
      headline,
      supportingText,
      ctaLabel,
      ctaUrl,
      productId,
      categoryId,
      offerId,
      campaignId,
      priority = 1,
      audience = 'ALL',
      status = 'ACTIVE',
      startAt,
      endAt
    } = req.body;

    // Strict validation
    if (!name || !desktopImage || !altText) {
      return res.status(400).json({
        success: false,
        message: 'Banner Name, Desktop Image, and Accessibility Alt Text are mandatory.'
      });
    }

    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
      return res.status(400).json({
        success: false,
        message: 'Banner Start Date must be earlier than End Date.'
      });
    }

    const banner = await prisma.contentBanner.create({
      data: {
        name,
        placement,
        desktopImage,
        tabletImage,
        mobileImage: mobileImage || desktopImage,
        altText,
        headline,
        supportingText,
        ctaLabel,
        ctaUrl,
        productId: productId || null,
        categoryId: categoryId || null,
        offerId: offerId || null,
        campaignId: campaignId || null,
        priority: parseInt(priority, 10) || 1,
        audience,
        status,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null
      }
    });

    res.status(201).json({ success: true, banner, message: 'Banner created successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const data = req.body;

    const banner = await prisma.contentBanner.update({
      where: { id },
      data: {
        ...data,
        ...(data.priority !== undefined && { priority: parseInt(data.priority, 10) || 1 }),
        ...(data.startAt !== undefined && { startAt: data.startAt ? new Date(data.startAt) : null }),
        ...(data.endAt !== undefined && { endAt: data.endAt ? new Date(data.endAt) : null })
      }
    });

    res.json({ success: true, banner, message: 'Banner updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const setBannerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body; // 'ACTIVE', 'PAUSED', 'ARCHIVED'

    const banner = await prisma.contentBanner.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, banner, message: `Banner status set to ${status}.` });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await prisma.contentBanner.delete({ where: { id } });
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    next(error);
  }
};

export const getBannerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const banner = await prisma.contentBanner.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        placement: true,
        impressionsCount: true,
        uniqueViewersCount: true,
        clicksCount: true,
        conversionsCount: true,
        revenueAttributed: true,
        couponUsesCount: true
      }
    });

    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });

    const ctr = banner.impressionsCount > 0 ? parseFloat(((banner.clicksCount / banner.impressionsCount) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      analytics: {
        ...banner,
        clickThroughRatePercent: ctr
      }
    });
  } catch (error) {
    next(error);
  }
};
