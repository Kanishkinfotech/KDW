import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const getStorefrontPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = String(req.params.slug).toLowerCase().replace(/^\/+/, '');
    const page = await prisma.contentPage.findFirst({
      where: {
        slug,
        status: 'PUBLISHED'
      }
    });

    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found or not published.' });
    }

    // Async increment views
    prisma.contentPage.update({
      where: { id: page.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(console.error);

    res.json({ success: true, page });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, tag, limit = '12' } = req.query;
    const where: any = { status: 'PUBLISHED' };

    if (category) where.category = { slug: String(category) };

    const blogs = await prisma.blogPost.findMany({
      where,
      take: parseInt(limit as string, 10) || 12,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      include: { category: true }
    });

    res.json({ success: true, blogs });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { category: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    prisma.blogPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(console.error);

    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scope = 'GLOBAL', productId } = req.query;
    const where: any = { status: 'PUBLISHED' };

    if (scope && scope !== 'ALL') where.scopeType = String(scope);
    if (productId) where.productId = String(productId);

    const faqs = await prisma.contentFaq.findMany({
      where,
      orderBy: { displayOrder: 'asc' }
    });

    res.json({ success: true, faqs });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placement = String(req.params.placement);
    const now = new Date();

    const banners = await prisma.contentBanner.findMany({
      where: {
        placement,
        status: 'ACTIVE',
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: now }, endAt: { gte: now } },
          { startAt: { lte: now }, endAt: null }
        ]
      },
      orderBy: { priority: 'asc' }
    });

    // Record impression asynchronously
    banners.forEach(b => {
      prisma.contentBanner.update({
        where: { id: b.id },
        data: { impressionsCount: { increment: 1 } }
      }).catch(console.error);
    });

    res.json({ success: true, banners });
  } catch (error) {
    next(error);
  }
};

export const trackBannerClick = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await prisma.contentBanner.update({
      where: { id },
      data: { clicksCount: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
