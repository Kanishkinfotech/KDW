import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const getContentOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      publishedPages,
      draftPages,
      scheduledPages,
      publishedBlogs,
      draftBlogs,
      pendingFaqs,
      publishedFaqs,
      outdatedFaqs,
      activeBanners,
      scheduledBanners,
      expiredBanners,
      pendingFeedback,
      reportedFeedback,
      allRedirects,
      allPages,
      allBlogs,
      allMedia,
      recentUpdates
    ] = await Promise.all([
      prisma.contentPage.count({ where: { status: 'PUBLISHED' } }),
      prisma.contentPage.count({ where: { status: 'DRAFT' } }),
      prisma.contentPage.count({ where: { status: 'SCHEDULED' } }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      prisma.contentFaq.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.contentFaq.count({ where: { status: 'PUBLISHED' } }),
      prisma.contentFaq.count({ where: { isOutdated: true } }),
      prisma.contentBanner.count({ where: { status: 'ACTIVE' } }),
      prisma.contentBanner.count({ where: { status: 'SCHEDULED' } }),
      prisma.contentBanner.count({ where: { status: 'EXPIRED' } }),
      prisma.customerFeedback.count({ where: { status: { in: ['NEW', 'OPEN', 'UNDER_REVIEW'] } } }),
      prisma.customerFeedback.count({ where: { moderationStatus: 'REPORTED' } }),
      prisma.contentRedirect.findMany({ where: { status: 'ACTIVE' } }),
      prisma.contentPage.findMany({ select: { id: true, title: true, slug: true, seoTitle: true, seoDescription: true, canonicalUrl: true, status: true } }),
      prisma.blogPost.findMany({ select: { id: true, title: true, slug: true, seoTitle: true, seoDescription: true, canonicalUrl: true, status: true, relatedProductIds: true } }),
      prisma.mediaAsset.findMany({ select: { id: true, fileName: true, altText: true, isUsed: true } }),
      prisma.contentRevision.count({ where: { createdAt: { gte: startOfMonth } } })
    ]);

    // Detect SEO & Content Health Issues
    const seoIssuesCount = allPages.filter(p => p.status === 'PUBLISHED' && (!p.seoTitle || !p.seoDescription)).length +
      allBlogs.filter(b => b.status === 'PUBLISHED' && (!b.seoTitle || !b.seoDescription)).length;

    const missingAltMediaCount = allMedia.filter(m => !m.altText || m.altText.trim() === '').length;
    const unusedMediaCount = allMedia.filter(m => !m.isUsed).length;

    // Detect redirect loops or broken redirects
    const brokenRedirects = allRedirects.filter(r => r.oldPath.toLowerCase() === r.newPath.toLowerCase()).length;

    res.json({
      success: true,
      kpis: {
        publishedPages,
        draftPages,
        scheduledPages,
        publishedBlogs,
        draftBlogs,
        pendingFaqs,
        publishedFaqs,
        outdatedFaqs,
        activeBanners,
        scheduledBanners,
        expiredBanners,
        pendingFeedback,
        reportedFeedback,
        brokenLinks: brokenRedirects,
        seoIssues: seoIssuesCount,
        missingAltMedia: missingAltMediaCount,
        unusedMedia: unusedMediaCount,
        contentUpdatesThisMonth: recentUpdates
      },
      metadata: {
        timestamp: new Date(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getContentHealthAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts: any[] = [];

    // 1. Check Published Pages with missing SEO metadata
    const pagesWithMissingSeo = await prisma.contentPage.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ seoTitle: null }, { seoTitle: '' }, { seoDescription: null }, { seoDescription: '' }]
      },
      take: 10
    });

    pagesWithMissingSeo.forEach(p => {
      alerts.push({
        id: `page-seo-${p.id}`,
        type: 'SEO_ISSUE',
        severity: 'MEDIUM',
        title: `Page "${p.title}" is missing SEO meta tags`,
        description: 'Published page has empty SEO title or description which impacts organic search ranking.',
        link: `/admin/content/pages`,
        targetId: p.id,
        entity: 'Page'
      });
    });

    // 2. Check Expired Banners still active
    const now = new Date();
    const expiredActiveBanners = await prisma.contentBanner.findMany({
      where: {
        status: 'ACTIVE',
        endAt: { lt: now }
      },
      take: 5
    });

    expiredActiveBanners.forEach(b => {
      alerts.push({
        id: `banner-expired-${b.id}`,
        type: 'EXPIRED_BANNER',
        severity: 'HIGH',
        title: `Banner "${b.name}" has passed end date but is still ACTIVE`,
        description: `Scheduled end date was ${b.endAt?.toLocaleDateString()}. Please deactivate or archive.`,
        link: `/admin/content/banners`,
        targetId: b.id,
        entity: 'Banner'
      });
    });

    // 3. Check Outdated FAQs
    const outdatedFaqs = await prisma.contentFaq.findMany({
      where: { isOutdated: true },
      take: 5
    });

    outdatedFaqs.forEach(f => {
      alerts.push({
        id: `faq-outdated-${f.id}`,
        type: 'OUTDATED_FAQ',
        severity: 'HIGH',
        title: `FAQ "${f.question.slice(0, 45)}..." marked outdated`,
        description: f.outdatedReason || 'Requires revision following product or policy changes.',
        link: `/admin/content/faqs`,
        targetId: f.id,
        entity: 'FAQ'
      });
    });

    // 4. Check Pending Critical Feedback
    const criticalFeedback = await prisma.customerFeedback.findMany({
      where: {
        priority: 'CRITICAL',
        status: { in: ['NEW', 'OPEN', 'UNDER_REVIEW'] }
      },
      take: 5
    });

    criticalFeedback.forEach(fb => {
      alerts.push({
        id: `feedback-critical-${fb.id}`,
        type: 'CRITICAL_FEEDBACK',
        severity: 'CRITICAL',
        title: `Critical Feedback: ${fb.title}`,
        description: `Customer submitted high-priority ${fb.feedbackType}: ${fb.message.slice(0, 80)}...`,
        link: `/admin/content/feedback`,
        targetId: fb.id,
        entity: 'Feedback'
      });
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    next(error);
  }
};
