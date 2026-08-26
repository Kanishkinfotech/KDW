import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'system-admin',
    name: user.name || 'Content Admin',
    email: user.email || 'content@kdw.com',
    role: user.role || 'ADMIN'
  };
};

export const getPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'ALL', template = 'ALL', search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (template && template !== 'ALL') where.template = String(template);
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { slug: { contains: String(search), mode: 'insensitive' } },
        { summary: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, pages] = await Promise.all([
      prisma.contentPage.count({ where }),
      prisma.contentPage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: pages,
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

export const getPageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const page = await prisma.contentPage.findUnique({ where: { id } });

    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found.' });
    }

    res.json({ success: true, page });
  } catch (error) {
    next(error);
  }
};

export const createPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const {
      title,
      slug,
      summary,
      contentJson,
      template = 'STANDARD',
      featuredImage,
      isPolicyPage = false,
      policyOwner,
      effectiveDate,
      reviewDate,
      seoTitle,
      seoDescription,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      noindex = false,
      includeInSitemap = true,
      structuredData
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ success: false, message: 'Title and Slug are required.' });
    }

    // Check slug uniqueness
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_/]/g, '').replace(/^\/+/, '');
    const existing = await prisma.contentPage.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(400).json({ success: false, message: `A page with slug "/${cleanSlug}" already exists.` });
    }

    const page = await prisma.contentPage.create({
      data: {
        title,
        slug: cleanSlug,
        summary,
        contentJson: contentJson || [],
        template,
        status: 'DRAFT',
        authorId: actor.id,
        authorName: actor.name,
        featuredImage,
        isPolicyPage: Boolean(isPolicyPage),
        policyOwner,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        reviewDate: reviewDate ? new Date(reviewDate) : null,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || summary,
        canonicalUrl: canonicalUrl || `/${cleanSlug}`,
        ogTitle: ogTitle || title,
        ogDescription: ogDescription || summary,
        ogImage: ogImage || featuredImage,
        noindex: Boolean(noindex),
        includeInSitemap: Boolean(includeInSitemap),
        structuredData
      }
    });

    // Create Initial Revision
    await prisma.contentRevision.create({
      data: {
        contentType: 'PAGE',
        contentId: page.id,
        versionNumber: 1,
        contentSnapshot: page,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: 'Initial Page Draft Created',
        statusSnapshot: 'DRAFT'
      }
    });

    res.status(201).json({ success: true, page, message: 'Page draft created successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updatePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const existing = await prisma.contentPage.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Page not found.' });
    }

    const {
      title,
      slug,
      summary,
      contentJson,
      template,
      featuredImage,
      isPolicyPage,
      policyOwner,
      effectiveDate,
      reviewDate,
      seoTitle,
      seoDescription,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      noindex,
      includeInSitemap,
      structuredData,
      changeSummary
    } = req.body;

    let cleanSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_/]/g, '').replace(/^\/+/, '');
      const slugConflict = await prisma.contentPage.findFirst({ where: { slug: cleanSlug, NOT: { id } } });
      if (slugConflict) {
        return res.status(400).json({ success: false, message: `Slug "/${cleanSlug}" is already in use.` });
      }

      // Automatically create 301 Redirect if page was published
      if (existing.status === 'PUBLISHED') {
        const oldPath = `/${existing.slug}`;
        const newPath = `/${cleanSlug}`;
        await prisma.contentRedirect.upsert({
          where: { oldPath },
          update: { newPath, status: 'ACTIVE', reason: `Auto-redirect from page slug update: ${existing.title}` },
          create: {
            oldPath,
            newPath,
            redirectType: '301',
            reason: `Auto-redirect from page slug update: ${existing.title}`,
            status: 'ACTIVE',
            createdById: actor.id,
            createdByName: actor.name
          }
        });
      }
    }

    const updated = await prisma.contentPage.update({
      where: { id },
      data: {
        ...(title && { title }),
        slug: cleanSlug,
        ...(summary !== undefined && { summary }),
        ...(contentJson !== undefined && { contentJson }),
        ...(template && { template }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(isPolicyPage !== undefined && { isPolicyPage: Boolean(isPolicyPage) }),
        ...(policyOwner !== undefined && { policyOwner }),
        ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
        ...(reviewDate && { reviewDate: new Date(reviewDate) }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(ogTitle !== undefined && { ogTitle }),
        ...(ogDescription !== undefined && { ogDescription }),
        ...(ogImage !== undefined && { ogImage }),
        ...(noindex !== undefined && { noindex: Boolean(noindex) }),
        ...(includeInSitemap !== undefined && { includeInSitemap: Boolean(includeInSitemap) }),
        ...(structuredData !== undefined && { structuredData }),
        status: existing.status === 'PUBLISHED' ? 'UPDATED' : existing.status,
        revisionNumber: existing.revisionNumber + 1
      }
    });

    // Record Immutable Revision Snapshot
    await prisma.contentRevision.create({
      data: {
        contentType: 'PAGE',
        contentId: id,
        versionNumber: updated.revisionNumber,
        contentSnapshot: updated,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: changeSummary || `Revision ${updated.revisionNumber} saved`,
        statusSnapshot: updated.status
      }
    });

    res.json({ success: true, page: updated, message: 'Page updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const submitPageReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const page = await prisma.contentPage.findUnique({ where: { id } });

    if (!page) return res.status(404).json({ success: false, message: 'Page not found.' });

    // Validate Required Content Quality
    if (!page.title || page.title.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Page title must be at least 3 characters long.' });
    }
    if (!page.contentJson || !Array.isArray(page.contentJson) || page.contentJson.length === 0) {
      return res.status(400).json({ success: false, message: 'Page must contain at least one content block before review submission.' });
    }

    const updated = await prisma.contentPage.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' }
    });

    res.json({ success: true, page: updated, message: 'Page submitted for editorial review.' });
  } catch (error) {
    next(error);
  }
};

export const publishPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const page = await prisma.contentPage.findUnique({ where: { id } });

    if (!page) return res.status(404).json({ success: false, message: 'Page not found.' });

    // Policy Page Publishing Validation
    if (page.isPolicyPage) {
      if (!page.policyOwner || !page.effectiveDate) {
        return res.status(400).json({
          success: false,
          message: 'Policy pages require a designated Content Owner and Effective Date before publishing.'
        });
      }
    }

    const updated = await prisma.contentPage.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        reviewerId: actor.id,
        reviewerName: actor.name
      }
    });

    // Mark current revision as published
    await prisma.contentRevision.create({
      data: {
        contentType: 'PAGE',
        contentId: id,
        versionNumber: updated.revisionNumber,
        contentSnapshot: updated,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: `Published revision ${updated.revisionNumber}`,
        statusSnapshot: 'PUBLISHED',
        isPublishedVersion: true,
        publishedAt: new Date()
      }
    });

    res.json({ success: true, page: updated, message: 'Page published live to storefront.' });
  } catch (error) {
    next(error);
  }
};

export const schedulePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { scheduledAt } = req.body;

    if (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid future publication date and time.' });
    }

    const updated = await prisma.contentPage.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
        reviewerId: actor.id,
        reviewerName: actor.name
      }
    });

    res.json({ success: true, page: updated, message: `Page scheduled for publication on ${new Date(scheduledAt).toLocaleString()}.` });
  } catch (error) {
    next(error);
  }
};

export const archivePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const updated = await prisma.contentPage.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
    res.json({ success: true, page: updated, message: 'Page archived from storefront navigation.' });
  } catch (error) {
    next(error);
  }
};

export const restorePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const updated = await prisma.contentPage.update({
      where: { id },
      data: { status: 'DRAFT' }
    });
    res.json({ success: true, page: updated, message: 'Page restored to Draft state.' });
  } catch (error) {
    next(error);
  }
};

export const deletePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const page = await prisma.contentPage.findUnique({ where: { id } });

    if (!page) return res.status(404).json({ success: false, message: 'Page not found.' });
    if (page.status === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'Published pages cannot be deleted directly. Please archive the page first.'
      });
    }

    await prisma.contentPage.delete({ where: { id } });
    res.json({ success: true, message: 'Page deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getPageRevisions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const revisions = await prisma.contentRevision.findMany({
      where: { contentType: 'PAGE', contentId: id },
      orderBy: { versionNumber: 'desc' }
    });
    res.json({ success: true, revisions });
  } catch (error) {
    next(error);
  }
};
