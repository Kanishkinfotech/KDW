import 'dotenv/config';
import { prisma } from '../database/db';

async function seedContent() {
  console.log('Seeding Master Content Management System...');

  // 1. Templates
  console.log('1. Seeding Content Templates...');
  await prisma.contentTemplate.upsert({
    where: { slug: 'standard-page' },
    update: {},
    create: {
      name: 'Standard Information Page',
      slug: 'standard-page',
      description: 'Clean single-column content layout with hero header and text blocks',
      contentType: 'PAGE',
      layoutJson: [
        { type: 'hero', title: 'Page Title', subtitle: 'Brief summary description' },
        { type: 'text', title: 'Section Overview', content: 'Detailed paragraph content...' }
      ],
      isDefault: true,
      status: 'ACTIVE'
    }
  });

  await prisma.contentTemplate.upsert({
    where: { slug: 'policy-page' },
    update: {},
    create: {
      name: 'Legal & Compliance Policy',
      slug: 'policy-page',
      description: 'Structured policy layout with effective dates, versioning banner, and table of contents',
      contentType: 'POLICY',
      layoutJson: [
        { type: 'hero', title: 'Policy Document', subtitle: 'Last revised date' },
        { type: 'text', title: '1. Scope & Acceptance', content: 'Policy terms...' },
        { type: 'text', title: '2. Customer Obligations', content: 'Customer obligations...' }
      ],
      status: 'ACTIVE'
    }
  });

  // 2. Blog Categories
  console.log('2. Seeding Blog Categories...');
  const categories = [
    { name: 'Automation', slug: 'automation', description: 'n8n, Zapier and workflow automation blueprints', displayOrder: 1 },
    { name: 'AI Tools', slug: 'ai-tools', description: 'ChatGPT prompt systems, Midjourney assets, and AI workflows', displayOrder: 2 },
    { name: 'Design', slug: 'design', description: 'Canva templates, UI kits, graphic design resources', displayOrder: 3 },
    { name: 'Business', slug: 'business', description: 'Commercial proposal templates, CRM spreadsheets, business tools', displayOrder: 4 },
    { name: 'Productivity', slug: 'productivity', description: 'Google Sheets trackers, Notion systems, and workflows', displayOrder: 5 },
    { name: 'KDW Updates', slug: 'kdw-updates', description: 'Product releases, system enhancements, and announcements', displayOrder: 6 }
  ];

  for (const cat of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
  }

  // 3. Blog Tags
  console.log('3. Seeding Blog Tags...');
  const tags = [
    { name: 'Canva', slug: 'canva', color: 'blue' },
    { name: 'n8n', slug: 'n8n', color: 'emerald' },
    { name: 'Google Sheets', slug: 'google-sheets', color: 'amber' },
    { name: 'Proposal Templates', slug: 'proposal-templates', color: 'purple' },
    { name: 'Prompt Engineering', slug: 'prompt-engineering', color: 'indigo' }
  ];

  for (const tag of tags) {
    await prisma.blogTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag
    });
  }

  // 4. Blog Authors
  console.log('4. Seeding Blog Authors...');
  const authors = [
    { name: 'Kanishk Editorial Team', slug: 'kanishk-editorial', roleTitle: 'Lead Digital Strategist', bio: 'Curating the best digital assets, automation blueprints, and developer kits.' },
    { name: 'Sarah Jenkins', slug: 'sarah-jenkins', roleTitle: 'Automation Engineer', bio: 'Specialist in n8n automation and custom CRM workflows.' }
  ];

  for (const author of authors) {
    await prisma.blogAuthor.upsert({
      where: { slug: author.slug },
      update: {},
      create: author
    });
  }

  // 5. Pages
  console.log('5. Seeding Pages...');
  await prisma.contentPage.upsert({
    where: { slug: 'privacy-policy' },
    update: {},
    create: {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      summary: 'Our commitment to protecting your personal data and digital privacy.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Compliance Team',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Privacy Policy | Kanishk Digital World',
      seoDescription: 'Read the official KDW privacy policy regarding personal data protection, order security, and analytics.',
      contentJson: [
        { type: 'hero', title: 'Privacy Policy', subtitle: 'Effective Date: January 1, 2026' },
        { type: 'text', title: '1. Information We Collect', content: 'We collect minimal necessary information including email, billing address, and transaction identifiers to deliver your purchased digital products securely via Google Drive.' },
        { type: 'text', title: '2. Use of Data', content: 'Your email address is strictly used to deliver order confirmation links, download tokens, and critical security notifications.' }
      ],
      viewsCount: 1420
    }
  });

  await prisma.contentPage.upsert({
    where: { slug: 'refund-policy' },
    update: {},
    create: {
      title: 'Refund & Digital Delivery Policy',
      slug: 'refund-policy',
      summary: 'Terms governing digital downloads, licence delivery, and refund eligibility.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Operations Director',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Refund & Delivery Policy | KDW',
      seoDescription: 'Review our digital product delivery timeline, download token lifecycle, and money-back guarantee terms.',
      contentJson: [
        { type: 'hero', title: 'Refund & Digital Delivery Policy', subtitle: 'Fair, transparent terms for instant digital access.' },
        { type: 'text', title: '1. Instant Digital Access', content: 'Upon verified payment confirmation, access links and Google Drive permissions are provisioned instantly.' },
        { type: 'text', title: '2. 14-Day Satisfaction Guarantee', content: 'If you encounter an unresolvable technical defect with any template or blueprint, our team will assist you or process a refund within 14 days.' }
      ],
      viewsCount: 2310
    }
  });

  await prisma.contentPage.upsert({
    where: { slug: 'about-us' },
    update: {},
    create: {
      title: 'About Kanishk Digital World',
      slug: 'about-us',
      summary: 'Empowering creators, developers, and businesses with production-ready digital assets.',
      template: 'STANDARD',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      seoTitle: 'About Us | Kanishk Digital World',
      seoDescription: 'Discover how KDW builds premium digital templates, automation pipelines, and curated resource bundles.',
      contentJson: [
        { type: 'hero', title: 'Empowering Modern Creators', subtitle: 'Save hundreds of hours with vetted, production-grade assets.' },
        { type: 'featureList', title: 'Why Choose KDW', features: ['Lifetime Google Drive Updates', 'Verified Commercial Licences', 'Instant One-Click Delivery'] }
      ],
      viewsCount: 3890
    }
  });

  // 6. Blog Posts
  console.log('6. Seeding Blog Posts...');
  const autoCat = await prisma.blogCategory.findUnique({ where: { slug: 'automation' } });
  const aiCat = await prisma.blogCategory.findUnique({ where: { slug: 'ai-tools' } });

  await prisma.blogPost.upsert({
    where: { slug: 'mastering-n8n-workflow-automation' },
    update: {},
    create: {
      title: 'Mastering n8n: 5 Self-Hosted Automation Workflows That Save 20 Hours Weekly',
      slug: 'mastering-n8n-workflow-automation',
      excerpt: 'Learn how to automate lead routing, invoice processing, and Telegram alerts using open-source n8n nodes.',
      categoryId: autoCat?.id,
      categoryName: 'Automation',
      tags: ['n8n', 'Google Sheets'],
      authorName: 'Sarah Jenkins',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      status: 'PUBLISHED',
      isFeatured: true,
      featuredOrder: 1,
      publishedAt: new Date(),
      readingTimeMinutes: 6,
      viewsCount: 1840,
      uniqueVisitorsCount: 1420,
      productClicksCount: 195,
      addToCartCount: 42,
      purchasesCount: 28,
      revenueAttributed: 840.00,
      seoTitle: 'Mastering n8n Workflow Automation | KDW Guide',
      seoDescription: 'Step-by-step guide with downloadable n8n JSON blueprints for scalable business automation.',
      contentJson: [
        { type: 'heading', level: 2, text: 'Introduction to Self-Hosted Automation' },
        { type: 'paragraph', text: 'n8n provides fair-code workflow automation without the exorbitant monthly subscription tiers of legacy platforms.' },
        { type: 'productCard', title: 'Ultimate n8n Automation Suite', price: '$29.99', ctaLabel: 'Get Instant Blueprint' }
      ]
    }
  });

  await prisma.blogPost.upsert({
    where: { slug: 'canva-pro-design-system-templates' },
    update: {},
    create: {
      title: 'How to Build an Agency Design System in Canva in Under 60 Minutes',
      slug: 'canva-pro-design-system-templates',
      excerpt: 'Standardize brand typography, color tokens, and social media carousels across your entire marketing team.',
      categoryId: autoCat?.id,
      categoryName: 'Design',
      tags: ['Canva', 'Proposal Templates'],
      authorName: 'Kanishk Editorial Team',
      coverImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=60',
      status: 'PUBLISHED',
      isFeatured: false,
      publishedAt: new Date(),
      readingTimeMinutes: 4,
      viewsCount: 920,
      uniqueVisitorsCount: 750,
      productClicksCount: 88,
      purchasesCount: 14,
      revenueAttributed: 350.00,
      seoTitle: 'Agency Canva Design Systems | KDW',
      seoDescription: 'Learn how to create consistent marketing collateral with reusable Canva template libraries.',
      contentJson: [
        { type: 'heading', level: 2, text: 'The Power of Structured Design Systems' },
        { type: 'paragraph', text: 'Consistency is the single biggest differentiator between amateur social graphics and high-converting marketing campaigns.' }
      ]
    }
  });

  // 7. FAQs
  console.log('7. Seeding FAQs...');
  const faqs = [
    {
      question: 'How do I access my files after completing a purchase?',
      answer: 'Access is immediate. Once your payment is verified, you are redirected to the Secure Download Portal with active Google Drive links and a unique download token sent directly to your email.',
      scopeType: 'GLOBAL',
      displayOrder: 1,
      status: 'PUBLISHED',
      viewsCount: 3400,
      helpfulCount: 412,
      unhelpfulCount: 12
    },
    {
      question: 'Can I use these templates and digital blueprints for commercial client projects?',
      answer: 'Yes! All KDW standard purchases include our Commercial Licence, allowing you to use the assets across unlimited personal and client projects without recurring attribution fees.',
      scopeType: 'GLOBAL',
      displayOrder: 2,
      status: 'PUBLISHED',
      viewsCount: 2890,
      helpfulCount: 388,
      unhelpfulCount: 8
    },
    {
      question: 'Do I get lifetime updates when a product version is updated?',
      answer: 'Yes. When we release version updates (e.g. from v1.0.0 to v1.1.0), all previous buyers retain perpetual access to the latest Drive folder automatically.',
      scopeType: 'GLOBAL',
      displayOrder: 3,
      status: 'PUBLISHED',
      viewsCount: 2150,
      helpfulCount: 290,
      unhelpfulCount: 5
    },
    {
      question: 'Legacy API integration with v1 webhook endpoints (Outdated)',
      answer: 'v1 webhooks have been superseded by v2 signed HMAC endpoints.',
      scopeType: 'PRODUCT',
      displayOrder: 99,
      status: 'OUTDATED',
      isOutdated: true,
      outdatedReason: 'Superseded by v2 webhook release notes. Needs updating.',
      viewsCount: 450,
      helpfulCount: 12,
      unhelpfulCount: 40
    }
  ];

  for (const faq of faqs) {
    await prisma.contentFaq.create({
      data: faq
    });
  }

  // 8. Banners
  console.log('8. Seeding Banners...');
  await prisma.contentBanner.create({
    data: {
      name: 'Spring Automation Fest 2026 Hero',
      placement: 'HOMEPAGE_HERO',
      desktopImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
      altText: 'Spring Automation Fest - 30% Off All n8n Blueprints',
      headline: 'Supercharge Your Business Workflows',
      supportingText: 'Get 30% off all curated n8n automation bundles and developer toolkits with code SPRING30.',
      ctaLabel: 'Explore Automation Bundles',
      ctaUrl: '/bundles',
      priority: 1,
      audience: 'ALL',
      status: 'ACTIVE',
      impressionsCount: 12400,
      clicksCount: 840,
      conversionsCount: 92,
      revenueAttributed: 2760.00
    }
  });

  await prisma.contentBanner.create({
    data: {
      name: 'Top Promotional Strip Banner',
      placement: 'HOMEPAGE_PROMO_STRIP',
      desktopImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
      altText: 'Free Instant Google Drive Access With Every Order',
      headline: 'Instant Google Drive Delivery — Lifetime Free Updates',
      ctaLabel: 'Learn More',
      ctaUrl: '/pages/refund-policy',
      priority: 2,
      status: 'ACTIVE',
      impressionsCount: 8900,
      clicksCount: 410,
      conversionsCount: 45,
      revenueAttributed: 1350.00
    }
  });

  // 9. Customer Feedback
  console.log('9. Seeding Customer Feedback & Reviews...');
  await prisma.customerFeedback.create({
    data: {
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.v@agencycraft.io',
      feedbackType: 'PRODUCT_REVIEW',
      rating: 5,
      title: 'Exceptional n8n blueprints — saved our team 3 weeks of setup',
      message: 'The workflow documentation was flawless. Imported the JSON blueprints into our self-hosted n8n instance and had webhook routing working in 10 minutes.',
      status: 'RESOLVED',
      priority: 'LOW',
      isPublicReview: true,
      moderationStatus: 'APPROVED'
    }
  });

  await prisma.customerFeedback.create({
    data: {
      customerName: 'Elena Rostova',
      customerEmail: 'elena@rostovamedia.com',
      feedbackType: 'FEATURE_REQUEST',
      rating: 5,
      title: 'Add support for Telegram Bot v2 polling in n8n bundle',
      message: 'Would love to see an additional sub-workflow specifically for Telegram Bot v2 polling nodes in the next release.',
      status: 'OPEN',
      priority: 'MEDIUM',
      assignedToName: 'Sarah Jenkins',
      isPublicReview: false
    }
  });

  await prisma.customerFeedback.create({
    data: {
      customerName: 'David Chen',
      customerEmail: 'david.c@fintechpulse.co',
      feedbackType: 'DOWNLOAD_ISSUE',
      rating: 4,
      title: 'Google Drive permission took 2 minutes to propagate',
      message: 'Payment completed smoothly, but the Google Drive link took a couple of minutes to grant reader access. Resolved now.',
      status: 'RESOLVED',
      priority: 'HIGH',
      assignedToName: 'Support Lead',
      resolvedBy: 'Support Lead',
      resolvedAt: new Date(),
      isPublicReview: false
    }
  });

  // 10. Navigation Menus
  console.log('10. Seeding Navigation Menus...');
  await prisma.navigationMenu.upsert({
    where: { slug: 'header-primary-menu' },
    update: {},
    create: {
      name: 'Main Header Navigation',
      slug: 'header-primary-menu',
      location: 'HEADER_PRIMARY',
      itemsJson: [
        { label: 'Products', url: '/products', target: '_self' },
        { label: 'Bundles', url: '/bundles', target: '_self' },
        { label: 'Blog', url: '/blog', target: '_self' },
        { label: 'FAQs', url: '/faq', target: '_self' },
        { label: 'Support', url: '/support-page', target: '_self' }
      ],
      status: 'ACTIVE'
    }
  });

  await prisma.navigationMenu.upsert({
    where: { slug: 'footer-legal-menu' },
    update: {},
    create: {
      name: 'Footer Legal & Policies',
      slug: 'footer-legal-menu',
      location: 'FOOTER_COL_1',
      itemsJson: [
        { label: 'Privacy Policy', url: '/pages/privacy-policy', target: '_self' },
        { label: 'Terms & Conditions', url: '/pages/terms', target: '_self' },
        { label: 'Refund Policy', url: '/pages/refund-policy', target: '_self' }
      ],
      status: 'ACTIVE'
    }
  });

  // 11. Redirects
  console.log('11. Seeding Redirects...');
  await prisma.contentRedirect.upsert({
    where: { oldPath: '/legal/privacy' },
    update: {},
    create: {
      oldPath: '/legal/privacy',
      newPath: '/pages/privacy-policy',
      redirectType: '301',
      reason: 'Legacy URL migration to structured page slug',
      status: 'ACTIVE'
    }
  });

  // 12. Media Assets
  console.log('12. Seeding Media Assets...');
  await prisma.mediaAsset.create({
    data: {
      fileName: 'n8n_automation_cover.jpg',
      originalName: 'n8n_automation_cover.jpg',
      fileType: 'IMAGE',
      mimeType: 'image/jpeg',
      fileSize: 245760,
      dimensions: '1920x1080',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=60',
      altText: 'n8n workflow nodes and automation canvas on screen',
      caption: 'Self-hosted n8n workflow canvas',
      folder: 'blogs',
      isUsed: true,
      usageReferences: [{ type: 'BLOG', id: 'mastering-n8n-workflow-automation', title: 'Mastering n8n Workflows' }]
    }
  });

  await prisma.mediaAsset.create({
    data: {
      fileName: 'canva_design_system_preview.jpg',
      originalName: 'canva_design_system_preview.jpg',
      fileType: 'IMAGE',
      mimeType: 'image/jpeg',
      fileSize: 184320,
      dimensions: '1600x900',
      url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=60',
      altText: 'Canva design system brand kit with typography and color palettes',
      folder: 'blogs',
      isUsed: true
    }
  });

  console.log('Master Content Management System successfully seeded!');
}

seedContent()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
