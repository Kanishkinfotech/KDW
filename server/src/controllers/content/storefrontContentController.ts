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

export const getStorefrontBlogCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { posts: { where: { status: 'PUBLISHED' } } } }
      }
    });

    const mapped = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      postCount: c._count?.posts || 0
    }));

    res.json({ success: true, categories: mapped });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, tag, search, q, isFeatured, page = '1', limit = '12' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'PUBLISHED' };

    // Category Filter (by slug or name or ID)
    if (category && category !== 'ALL' && category !== 'all') {
      const catStr = String(category).toLowerCase();
      where.OR = [
        { category: { slug: { equals: catStr, mode: 'insensitive' } } },
        { category: { name: { equals: String(category), mode: 'insensitive' } } },
        { categoryName: { equals: String(category), mode: 'insensitive' } },
        { categoryId: String(category) }
      ];
    }

    // Search Query (Title, Excerpt, Slug, Category Name)
    const searchQuery = String(search || q || '').trim();
    if (searchQuery) {
      const searchWhere = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { excerpt: { contains: searchQuery, mode: 'insensitive' } },
        { slug: { contains: searchQuery, mode: 'insensitive' } },
        { categoryName: { contains: searchQuery, mode: 'insensitive' } },
        { authorName: { contains: searchQuery, mode: 'insensitive' } }
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchWhere }];
        delete where.OR;
      } else {
        where.OR = searchWhere;
      }
    }

    if (isFeatured !== undefined && isFeatured !== 'ALL') {
      where.isFeatured = String(isFeatured) === 'true';
    }

    const [total, blogs, featuredBlog, categories] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: { category: true }
      }),
      prisma.blogPost.findFirst({
        where: { status: 'PUBLISHED', isFeatured: true },
        orderBy: [{ featuredOrder: 'asc' }, { publishedAt: 'desc' }],
        include: { category: true }
      }),
      prisma.blogCategory.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: { select: { posts: { where: { status: 'PUBLISHED' } } } }
        }
      })
    ]);

    const mappedCategories = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      postCount: c._count?.posts || 0
    }));

    res.json({
      success: true,
      blogs,
      featuredBlog: featuredBlog || (blogs.length > 0 ? blogs[0] : null),
      categories: mappedCategories,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ],
        status: 'PUBLISHED'
      },
      include: { category: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    // Async increment views
    prisma.blogPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(console.error);

    // Resolve Related Products
    let relatedProducts: any[] = [];
    const relatedIds = Array.isArray(post.relatedProductIds) ? (post.relatedProductIds as string[]) : [];

    if (relatedIds.length > 0) {
      relatedProducts = await prisma.product.findMany({
        where: {
          status: { in: ['ACTIVE', 'PUBLISHED'] },
          OR: [
            { id: { in: relatedIds } },
            { slug: { in: relatedIds } }
          ]
        },
        include: {
          category: true,
          reviews: { where: { status: 'APPROVED' } }
        }
      });
    }

    // Fallback related products if none explicitly linked
    if (relatedProducts.length === 0) {
      relatedProducts = await prisma.product.findMany({
        where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
          reviews: { where: { status: 'APPROVED' } }
        }
      });
    }

    const mappedProducts = relatedProducts.map(p => {
      const reviewCount = p.reviews ? p.reviews.length : 0;
      const avgRating = reviewCount > 0 
        ? p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewCount 
        : 5.0;
      return {
        ...p,
        title: p.name,
        category: p.category?.name || 'Digital Tool',
        rating: avgRating,
        reviews: reviewCount
      };
    });

    // Resolve Related Articles (same category first, then other latest articles, excluding current)
    let relatedArticles = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {})
      },
      take: 3,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      include: { category: true }
    });

    if (relatedArticles.length < 3) {
      const existingIds = [post.id, ...relatedArticles.map(a => a.id)];
      const fillArticles = await prisma.blogPost.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: existingIds }
        },
        take: 3 - relatedArticles.length,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
        include: { category: true }
      });
      relatedArticles = [...relatedArticles, ...fillArticles];
    }

    res.json({
      success: true,
      post,
      relatedProducts: mappedProducts,
      relatedArticles
    });
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
      orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }]
    });

    res.json({ success: true, faqs, data: faqs });
  } catch (error) {
    next(error);
  }
};

export const getStorefrontBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawPlacement = String(req.params.placement || req.query.placement || '').trim();
    const pageSlug = String(req.params.slug || req.query.page || req.query.slug || '').trim().toLowerCase().replace(/^\/+/, '');
    const now = new Date();

    const where: any = {
      status: 'ACTIVE',
      OR: [
        { startAt: null, endAt: null },
        { startAt: { lte: now }, endAt: { gte: now } },
        { startAt: { lte: now }, endAt: null }
      ]
    };

    if (pageSlug) {
      where.placement = {
        in: [
          `PAGE_${pageSlug}`,
          `PAGE:/pages/${pageSlug}`,
          `PAGE:${pageSlug}`,
          'STOREFRONT_PAGE'
        ]
      };
    } else if (rawPlacement && rawPlacement !== 'ALL') {
      if (rawPlacement === 'HOMEPAGE') {
        where.placement = { in: ['HOMEPAGE', 'HOMEPAGE_HERO', 'HOMEPAGE_PROMO_STRIP'] };
      } else {
        where.placement = rawPlacement;
      }
    }

    const banners = await prisma.contentBanner.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }]
    });

    // Record impression asynchronously
    banners.forEach(b => {
      prisma.contentBanner.update({
        where: { id: b.id },
        data: { impressionsCount: { increment: 1 } }
      }).catch(console.error);
    });

    res.json({ success: true, banners, data: banners });
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
