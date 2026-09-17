import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const getSeoAuditReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pages, blogs, faqs, banners, categories] = await Promise.all([
      prisma.contentPage.findMany(),
      prisma.blogPost.findMany(),
      prisma.contentFaq.findMany({ where: { status: 'PUBLISHED' } }),
      prisma.contentBanner.findMany({ where: { status: 'ACTIVE' } }),
      prisma.category.findMany({ where: { status: { in: ['ACTIVE', 'PUBLISHED'] } } })
    ]);

    const issues: any[] = [];

    // Check Categories
    categories.forEach(c => {
      if (!c.seoTitle || c.seoTitle.length < 10) {
        issues.push({ item: `Category: ${c.name}`, issue: 'SEO Title missing or under 10 chars', severity: 'MEDIUM', type: 'CATEGORY', id: c.id });
      }
      if (!c.seoDescription || c.seoDescription.length < 30) {
        issues.push({ item: `Category: ${c.name}`, issue: 'Meta Description missing or under 30 chars', severity: 'HIGH', type: 'CATEGORY', id: c.id });
      }
      if (!c.banner && !c.image) {
        issues.push({ item: `Category: ${c.name}`, issue: 'Category banner/cover image missing', severity: 'MEDIUM', type: 'CATEGORY', id: c.id });
      }
    });

    // Check Pages
    pages.forEach(p => {
      if (p.status === 'PUBLISHED') {
        if (!p.seoTitle || p.seoTitle.length < 10) {
          issues.push({ item: `Page: ${p.title}`, issue: 'SEO Title missing or under 10 chars', severity: 'MEDIUM', type: 'PAGE', id: p.id });
        }
        if (!p.seoDescription || p.seoDescription.length < 30) {
          issues.push({ item: `Page: ${p.title}`, issue: 'Meta Description missing or under 30 chars', severity: 'HIGH', type: 'PAGE', id: p.id });
        }
        if (!p.ogImage) {
          issues.push({ item: `Page: ${p.title}`, issue: 'Open Graph social image not defined', severity: 'LOW', type: 'PAGE', id: p.id });
        }
      }
    });

    // Check Blogs
    blogs.forEach(b => {
      if (b.status === 'PUBLISHED') {
        if (!b.seoTitle) {
          issues.push({ item: `Blog: ${b.title}`, issue: 'Article SEO Title missing', severity: 'MEDIUM', type: 'BLOG', id: b.id });
        }
        if (!b.seoDescription) {
          issues.push({ item: `Blog: ${b.title}`, issue: 'Article Meta Description missing', severity: 'HIGH', type: 'BLOG', id: b.id });
        }
        if (!b.coverImage) {
          issues.push({ item: `Blog: ${b.title}`, issue: 'Featured cover image missing', severity: 'HIGH', type: 'BLOG', id: b.id });
        }
      }
    });

    // Check Banners
    banners.forEach(ban => {
      if (!ban.altText || ban.altText.trim() === '') {
        issues.push({ item: `Banner: ${ban.name}`, issue: 'Accessibility Alt Text missing on active banner', severity: 'HIGH', type: 'BANNER', id: ban.id });
      }
    });

    res.json({
      success: true,
      summary: {
        totalPagesAudited: pages.length,
        totalArticlesAudited: blogs.length,
        totalFaqsAudited: faqs.length,
        totalActiveBannersAudited: banners.length,
        totalIssuesFound: issues.length
      },
      issues
    });
  } catch (error) {
    next(error);
  }
};

export const validateStructuredData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schemaType, data } = req.body;
    let valid = true;
    const errors: string[] = [];

    if (schemaType === 'Article') {
      if (!data.headline) { valid = false; errors.push('Missing headline'); }
      if (!data.author) { valid = false; errors.push('Missing author'); }
      if (!data.datePublished) { valid = false; errors.push('Missing datePublished'); }
    } else if (schemaType === 'FAQPage') {
      if (!data.mainEntity || !Array.isArray(data.mainEntity) || data.mainEntity.length === 0) {
        valid = false;
        errors.push('mainEntity array of Question/Answer objects is required');
      }
    } else if (schemaType === 'Product') {
      if (!data.name) { valid = false; errors.push('Missing product name'); }
      if (!data.offers) { valid = false; errors.push('Missing offers pricing schema'); }
    }

    res.json({
      success: true,
      valid,
      errors,
      structuredDataJsonLd: valid ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": schemaType,
        ...data
      }, null, 2) : null
    });
  } catch (error) {
    next(error);
  }
};
