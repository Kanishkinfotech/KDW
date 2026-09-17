import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'editorial-admin',
    name: user.name || 'Editorial Staff',
    email: user.email || 'editorial@kdw.com',
    role: user.role || 'ADMIN'
  };
};

const calculateReadingTime = (contentJson: any[]): number => {
  if (!contentJson || !Array.isArray(contentJson)) return 3;
  let wordCount = 0;
  contentJson.forEach(block => {
    if (block.text) wordCount += String(block.text).split(/\s+/).length;
    if (block.title) wordCount += String(block.title).split(/\s+/).length;
    if (block.code) wordCount += String(block.code).split(/\s+/).length;
  });
  return Math.max(1, Math.ceil(wordCount / 200));
};

export const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'ALL', categoryId = 'ALL', isFeatured, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (categoryId && categoryId !== 'ALL') where.categoryId = String(categoryId);
    if (isFeatured !== undefined && isFeatured !== 'ALL') where.isFeatured = isFeatured === 'true';
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { slug: { contains: String(search), mode: 'insensitive' } },
        { excerpt: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        include: { category: true }
      })
    ]);

    res.json({
      success: true,
      data: posts,
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

export const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found.' });
    }

    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const {
      title,
      slug,
      excerpt,
      contentJson,
      categoryId,
      categoryName,
      authorName,
      readingTimeMinutes,
      status = 'DRAFT',
      isFeatured = false,
      tags,
      coverImage,
      relatedProductIds,
      relatedCategoryIds,
      relatedBundleIds,
      relatedCouponIds,
      relatedFaqIds,
      seoTitle,
      seoDescription,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      noindex = false,
      includeInSitemap = true
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ success: false, message: 'Article Title and Slug are required.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_/]/g, '').replace(/^\/+/, '');
    const existing = await prisma.blogPost.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(400).json({ success: false, message: `An article with slug "/${cleanSlug}" already exists.` });
    }

    const readingTime = readingTimeMinutes ? parseInt(readingTimeMinutes, 10) || 5 : calculateReadingTime(contentJson);
    const isPublished = status === 'PUBLISHED';

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: cleanSlug,
        excerpt,
        contentJson: contentJson || [],
        authorId: actor.id,
        authorName: authorName || actor.name,
        categoryId: categoryId || null,
        categoryName: categoryName || null,
        tags: tags || [],
        coverImage,
        readingTimeMinutes: readingTime,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        publishedAt: isPublished ? new Date() : null,
        reviewerId: isPublished ? actor.id : null,
        reviewerName: isPublished ? actor.name : null,
        isFeatured: Boolean(isFeatured),
        relatedProductIds: relatedProductIds || [],
        relatedCategoryIds: relatedCategoryIds || [],
        relatedBundleIds: relatedBundleIds || [],
        relatedCouponIds: relatedCouponIds || [],
        relatedFaqIds: relatedFaqIds || [],
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        canonicalUrl: canonicalUrl || `/blog/${cleanSlug}`,
        ogTitle: ogTitle || title,
        ogDescription: ogDescription || excerpt,
        ogImage: ogImage || coverImage,
        noindex: Boolean(noindex),
        includeInSitemap: Boolean(includeInSitemap)
      }
    });

    // Initial Revision
    await prisma.contentRevision.create({
      data: {
        contentType: 'BLOG',
        contentId: post.id,
        versionNumber: 1,
        contentSnapshot: post,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: isPublished ? 'Article Published Live' : 'Initial Article Draft Created',
        statusSnapshot: post.status
      }
    });

    res.status(201).json({
      success: true,
      post,
      message: isPublished ? 'Article published live to storefront.' : 'Blog draft created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const existing = await prisma.blogPost.findUnique({ where: { id } });

    if (!existing) return res.status(404).json({ success: false, message: 'Article not found.' });

    const {
      title,
      slug,
      excerpt,
      contentJson,
      categoryId,
      categoryName,
      authorName,
      readingTimeMinutes,
      isFeatured,
      status,
      tags,
      coverImage,
      relatedProductIds,
      relatedCategoryIds,
      relatedBundleIds,
      relatedCouponIds,
      relatedFaqIds,
      seoTitle,
      seoDescription,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      noindex,
      includeInSitemap,
      changeSummary
    } = req.body;

    let cleanSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_/]/g, '').replace(/^\/+/, '');
      const conflict = await prisma.blogPost.findFirst({ where: { slug: cleanSlug, NOT: { id } } });
      if (conflict) {
        return res.status(400).json({ success: false, message: `Slug "/${cleanSlug}" is already in use.` });
      }

      if (existing.status === 'PUBLISHED') {
        await prisma.contentRedirect.upsert({
          where: { oldPath: `/blog/${existing.slug}` },
          update: { newPath: `/blog/${cleanSlug}`, status: 'ACTIVE' },
          create: {
            oldPath: `/blog/${existing.slug}`,
            newPath: `/blog/${cleanSlug}`,
            redirectType: '301',
            reason: `Auto-redirect from article slug change: ${existing.title}`,
            status: 'ACTIVE',
            createdById: actor.id,
            createdByName: actor.name
          }
        });
      }
    }

    const calculatedReadingTime = contentJson ? calculateReadingTime(contentJson) : existing.readingTimeMinutes;
    const finalReadingTime = readingTimeMinutes !== undefined ? parseInt(readingTimeMinutes, 10) || 5 : calculatedReadingTime;

    const nextStatus = status !== undefined ? status : (existing.status === 'PUBLISHED' ? 'UPDATED' : existing.status);
    const shouldSetPublishedAt = nextStatus === 'PUBLISHED' && !existing.publishedAt;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        slug: cleanSlug,
        ...(excerpt !== undefined && { excerpt }),
        ...(contentJson !== undefined && { contentJson }),
        ...(categoryId !== undefined && { categoryId }),
        ...(categoryName !== undefined && { categoryName }),
        ...(authorName !== undefined && { authorName }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        readingTimeMinutes: finalReadingTime,
        ...(tags !== undefined && { tags }),
        ...(coverImage !== undefined && { coverImage }),
        ...(relatedProductIds !== undefined && { relatedProductIds }),
        ...(relatedCategoryIds !== undefined && { relatedCategoryIds }),
        ...(relatedBundleIds !== undefined && { relatedBundleIds }),
        ...(relatedCouponIds !== undefined && { relatedCouponIds }),
        ...(relatedFaqIds !== undefined && { relatedFaqIds }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(ogTitle !== undefined && { ogTitle }),
        ...(ogDescription !== undefined && { ogDescription }),
        ...(ogImage !== undefined && { ogImage }),
        ...(noindex !== undefined && { noindex: Boolean(noindex) }),
        ...(includeInSitemap !== undefined && { includeInSitemap: Boolean(includeInSitemap) }),
        status: nextStatus,
        ...(shouldSetPublishedAt && { publishedAt: new Date(), reviewerId: actor.id, reviewerName: actor.name })
      }
    });

    // Record revision
    await prisma.contentRevision.create({
      data: {
        contentType: 'BLOG',
        contentId: id,
        versionNumber: Math.floor(Date.now() / 1000),
        contentSnapshot: updated,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: changeSummary || 'Article Content Updated',
        statusSnapshot: updated.status
      }
    });

    res.json({ success: true, post: updated, message: 'Article updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.blogPost.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    await prisma.contentRevision.deleteMany({
      where: { contentType: 'BLOG', contentId: id }
    });

    await prisma.blogPost.delete({ where: { id } });

    res.json({ success: true, message: 'Article deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const publishBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) return res.status(404).json({ success: false, message: 'Article not found.' });

    // Quality validation
    if (!post.title || !post.excerpt || !post.contentJson) {
      return res.status(400).json({ success: false, message: 'Article title, excerpt, and content blocks are required for publishing.' });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        reviewerId: actor.id,
        reviewerName: actor.name
      }
    });

    res.json({ success: true, post: updated, message: 'Article published live to storefront.' });
  } catch (error) {
    next(error);
  }
};

export const scheduleBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { scheduledAt } = req.body;

    if (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid future publication date and time.' });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
        reviewerId: actor.id,
        reviewerName: actor.name
      }
    });

    res.json({ success: true, post: updated, message: `Article scheduled for publication on ${new Date(scheduledAt).toLocaleString()}.` });
  } catch (error) {
    next(error);
  }
};

export const archiveBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { status: 'ARCHIVED', isFeatured: false }
    });
    res.json({ success: true, post: updated, message: 'Article archived from storefront.' });
  } catch (error) {
    next(error);
  }
};

export const toggleFeaturedPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { isFeatured, featuredOrder = 0, featuredStartAt, featuredEndAt } = req.body;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        isFeatured: Boolean(isFeatured),
        featuredOrder: parseInt(featuredOrder, 10) || 0,
        featuredStartAt: featuredStartAt ? new Date(featuredStartAt) : null,
        featuredEndAt: featuredEndAt ? new Date(featuredEndAt) : null
      }
    });

    res.json({ success: true, post: updated, message: `Featured status updated to ${isFeatured ? 'Active' : 'Disabled'}.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// BLOG CATEGORIES
// ============================================================================
export const getBlogCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { posts: true } } }
    });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const createBlogCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, displayOrder = 0 } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'Category name and slug are required.' });

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const category = await prisma.blogCategory.create({
      data: { name, slug: cleanSlug, description, displayOrder: parseInt(displayOrder, 10) || 0 }
    });

    res.status(201).json({ success: true, category, message: 'Category created.' });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const postCount = await prisma.blogPost.count({ where: { categoryId: id } });

    if (postCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category because ${postCount} articles are assigned to it. Please reassign the articles first.`
      });
    }

    await prisma.blogCategory.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// BLOG TAGS & AUTHORS
// ============================================================================
export const getBlogTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await prisma.blogTag.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, tags });
  } catch (error) {
    next(error);
  }
};

export const createBlogTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, color = 'blue' } = req.body;
    const cleanSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, '') : name.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const tag = await prisma.blogTag.create({ data: { name, slug: cleanSlug, color } });
    res.status(201).json({ success: true, tag });
  } catch (error) {
    next(error);
  }
};

export const getBlogAuthors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authors = await prisma.blogAuthor.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, authors });
  } catch (error) {
    next(error);
  }
};

export const createBlogAuthor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, avatar, bio, roleTitle = 'Writer' } = req.body;
    const cleanSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9-_]/g, '') : name.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const author = await prisma.blogAuthor.create({
      data: { name, slug: cleanSlug, avatar, bio, roleTitle }
    });
    res.status(201).json({ success: true, author });
  } catch (error) {
    next(error);
  }
};

export const getBlogAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        viewsCount: true,
        uniqueVisitorsCount: true,
        readingTimeAvgSeconds: true,
        scrollDepthAvgPercent: true,
        productClicksCount: true,
        addToCartCount: true,
        purchasesCount: true,
        revenueAttributed: true
      }
    });

    if (!post) return res.status(404).json({ success: false, message: 'Article not found.' });

    res.json({ success: true, analytics: post });
  } catch (error) {
    next(error);
  }
};
