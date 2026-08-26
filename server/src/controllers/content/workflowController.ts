import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'workflow-admin',
    name: user.name || 'Editorial Director',
    email: user.email || 'editor@kdw.com'
  };
};

// ============================================================================
// 1. GLOBAL DRAFTS
// ============================================================================
export const getDrafts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentType = 'ALL', search } = req.query;

    const [pages, blogs, faqs, banners] = await Promise.all([
      prisma.contentPage.findMany({ where: { status: { in: ['DRAFT', 'REJECTED'] } } }),
      prisma.blogPost.findMany({ where: { status: { in: ['DRAFT', 'REJECTED'] } } }),
      prisma.contentFaq.findMany({ where: { status: 'DRAFT' } }),
      prisma.contentBanner.findMany({ where: { status: 'DRAFT' } })
    ]);

    let drafts: any[] = [
      ...pages.map(p => ({ id: p.id, type: 'PAGE', title: p.title, author: p.authorName, updatedAt: p.updatedAt, status: p.status, rejectionReason: p.rejectionReason, editUrl: `/admin/content/pages` })),
      ...blogs.map(b => ({ id: b.id, type: 'BLOG', title: b.title, author: b.authorName, updatedAt: b.updatedAt, status: b.status, rejectionReason: b.rejectionReason, editUrl: `/admin/content/blogs` })),
      ...faqs.map(f => ({ id: f.id, type: 'FAQ', title: f.question, author: f.authorName, updatedAt: f.updatedAt, status: f.status, rejectionReason: null, editUrl: `/admin/content/faqs` })),
      ...banners.map(ban => ({ id: ban.id, type: 'BANNER', title: ban.name, author: 'Marketing', updatedAt: ban.updatedAt, status: ban.status, rejectionReason: null, editUrl: `/admin/content/banners` }))
    ];

    if (contentType && contentType !== 'ALL') {
      drafts = drafts.filter(d => d.type === contentType);
    }
    if (search) {
      const s = String(search).toLowerCase();
      drafts = drafts.filter(d => d.title.toLowerCase().includes(s) || d.author.toLowerCase().includes(s));
    }

    drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json({ success: true, count: drafts.length, drafts });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. SCHEDULED CONTENT & AUTO-PUBLISHER
// ============================================================================
export const getScheduledContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pages, blogs, banners] = await Promise.all([
      prisma.contentPage.findMany({ where: { status: 'SCHEDULED' } }),
      prisma.blogPost.findMany({ where: { status: 'SCHEDULED' } }),
      prisma.contentBanner.findMany({ where: { status: 'SCHEDULED' } })
    ]);

    const scheduled = [
      ...pages.map(p => ({ id: p.id, type: 'PAGE', title: p.title, scheduledAt: p.scheduledAt, author: p.authorName, reviewer: p.reviewerName, status: p.status })),
      ...blogs.map(b => ({ id: b.id, type: 'BLOG', title: b.title, scheduledAt: b.scheduledAt, author: b.authorName, reviewer: b.reviewerName, status: b.status })),
      ...banners.map(ban => ({ id: ban.id, type: 'BANNER', title: ban.name, scheduledAt: ban.startAt, author: 'Marketing', reviewer: 'System', status: ban.status }))
    ];

    scheduled.sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime());

    res.json({ success: true, count: scheduled.length, scheduled });
  } catch (error) {
    next(error);
  }
};

export const runScheduledPublisherNow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    // Auto-publish eligible pages
    const publishedPages = await prisma.contentPage.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now }
      },
      data: { status: 'PUBLISHED', publishedAt: now }
    });

    // Auto-publish eligible blogs
    const publishedBlogs = await prisma.blogPost.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now }
      },
      data: { status: 'PUBLISHED', publishedAt: now }
    });

    // Auto-activate eligible banners
    const activatedBanners = await prisma.contentBanner.updateMany({
      where: {
        status: 'SCHEDULED',
        startAt: { lte: now }
      },
      data: { status: 'ACTIVE' }
    });

    res.json({
      success: true,
      published: {
        pages: publishedPages.count,
        blogs: publishedBlogs.count,
        banners: activatedBanners.count
      },
      message: 'Scheduled content publisher execution complete.'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. APPROVAL QUEUE
// ============================================================================
export const getApprovalQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pages, blogs, faqs] = await Promise.all([
      prisma.contentPage.findMany({ where: { status: 'PENDING_REVIEW' } }),
      prisma.blogPost.findMany({ where: { status: 'PENDING_REVIEW' } }),
      prisma.contentFaq.findMany({ where: { status: 'PENDING_REVIEW' } })
    ]);

    const queue = [
      ...pages.map(p => ({ id: p.id, type: 'PAGE', title: p.title, author: p.authorName, submittedAt: p.updatedAt, priority: p.isPolicyPage ? 'HIGH' : 'NORMAL' })),
      ...blogs.map(b => ({ id: b.id, type: 'BLOG', title: b.title, author: b.authorName, submittedAt: b.updatedAt, priority: 'NORMAL' })),
      ...faqs.map(f => ({ id: f.id, type: 'FAQ', title: f.question, author: f.authorName, submittedAt: f.updatedAt, priority: 'NORMAL' }))
    ];

    queue.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    res.json({ success: true, count: queue.length, queue });
  } catch (error) {
    next(error);
  }
};

export const approveContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const { id, contentType } = req.body; // 'PAGE', 'BLOG', 'FAQ'

    if (contentType === 'PAGE') {
      await prisma.contentPage.update({
        where: { id },
        data: { status: 'APPROVED', reviewerId: actor.id, reviewerName: actor.name }
      });
    } else if (contentType === 'BLOG') {
      await prisma.blogPost.update({
        where: { id },
        data: { status: 'APPROVED', reviewerId: actor.id, reviewerName: actor.name }
      });
    } else if (contentType === 'FAQ') {
      await prisma.contentFaq.update({
        where: { id },
        data: { status: 'APPROVED', reviewerId: actor.id }
      });
    }

    res.json({ success: true, message: `${contentType} approved for publication.` });
  } catch (error) {
    next(error);
  }
};

export const rejectContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const { id, contentType, reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'A mandatory rejection reason is required when rejecting submitted content.' });
    }

    if (contentType === 'PAGE') {
      await prisma.contentPage.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason, reviewerId: actor.id, reviewerName: actor.name }
      });
    } else if (contentType === 'BLOG') {
      await prisma.blogPost.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason, reviewerId: actor.id, reviewerName: actor.name }
      });
    } else if (contentType === 'FAQ') {
      await prisma.contentFaq.update({
        where: { id },
        data: { status: 'DRAFT' }
      });
    }

    res.json({ success: true, message: `${contentType} rejected and sent back to author with feedback.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. REVISION CENTER & ROLLBACK
// ============================================================================
export const getRevisions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentType = 'ALL', contentId } = req.query;
    const where: any = {};
    if (contentType && contentType !== 'ALL') where.contentType = String(contentType);
    if (contentId) where.contentId = String(contentId);

    const revisions = await prisma.contentRevision.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ success: true, count: revisions.length, revisions });
  } catch (error) {
    next(error);
  }
};

export const restoreRevision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);

    const revision = await prisma.contentRevision.findUnique({ where: { id } });
    if (!revision) return res.status(404).json({ success: false, message: 'Revision snapshot not found.' });

    const snapshot = revision.contentSnapshot as any;

    if (revision.contentType === 'PAGE') {
      await prisma.contentPage.update({
        where: { id: revision.contentId },
        data: {
          title: snapshot.title,
          summary: snapshot.summary,
          contentJson: snapshot.contentJson,
          template: snapshot.template,
          featuredImage: snapshot.featuredImage,
          seoTitle: snapshot.seoTitle,
          seoDescription: snapshot.seoDescription,
          canonicalUrl: snapshot.canonicalUrl,
          status: 'UPDATED'
        }
      });
    } else if (revision.contentType === 'BLOG') {
      await prisma.blogPost.update({
        where: { id: revision.contentId },
        data: {
          title: snapshot.title,
          excerpt: snapshot.excerpt,
          contentJson: snapshot.contentJson,
          categoryId: snapshot.categoryId,
          tags: snapshot.tags,
          coverImage: snapshot.coverImage,
          seoTitle: snapshot.seoTitle,
          seoDescription: snapshot.seoDescription,
          status: 'UPDATED'
        }
      });
    }

    // Record rollback action
    await prisma.contentRevision.create({
      data: {
        contentType: revision.contentType,
        contentId: revision.contentId,
        versionNumber: Math.floor(Date.now() / 1000),
        contentSnapshot: snapshot,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: `Restored back to revision v${revision.versionNumber}`,
        statusSnapshot: 'RESTORED'
      }
    });

    res.json({ success: true, message: `Successfully rolled back to revision v${revision.versionNumber}.` });
  } catch (error) {
    next(error);
  }
};
