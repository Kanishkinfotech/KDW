import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, priority, subject, description, orderId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId || !category || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.customerId !== userId) {
        return res.status(403).json({ success: false, message: 'Invalid order selected' });
      }
    }

    const count = await prisma.supportTicket.count();
    const ticketNumber = `TKT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        category,
        priority: priority || 'Normal',
        subject,
        description,
        userId,
        orderId: orderId || null
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });

    await prisma.notification.create({
      data: {
        title: `New Support Inquiry (${ticketNumber})`,
        message: `Inquiry from ${user?.name || 'Customer'} (${user?.email || ''}): "${subject}"`,
        type: 'Support',
        link: '/admin/support-page'
      }
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        order: { select: { orderNumber: true } },
        messages: {
          where: { visibility: 'CUSTOMER' },
          include: {
            sender: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

export const getTicketDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    const id = req.params.id as string;

    const userRole = String(role || '').toUpperCase();
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STORE_MANAGER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'CATALOG_MANAGER', 'MANAGER'].includes(userRole);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        order: true,
        user: { select: { name: true, email: true } },
        messages: {
          where: isStaff ? undefined : { visibility: 'CUSTOMER' },
          include: {
            sender: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (!isStaff && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

export const addMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const id = req.params.id as string;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const userRole = String(role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'SUPER_ADMIN';
    
    if (!isAdmin && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const senderType = isAdmin ? 'ADMIN' : 'CUSTOMER';

    const supportMessage = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderType,
        message
      },
      include: {
        sender: { select: { name: true, role: true } }
      }
    });

    // Update ticket status automatically based on who replied
    let newStatus = ticket.status;
    if (isAdmin) {
      newStatus = 'RESOLVED';
    } else {
      if (ticket.status === 'RESOLVED') {
        newStatus = 'IN_PROGRESS';
      }
    }

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: newStatus }
    });

    res.status(201).json({ success: true, message: supportMessage });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.supportMessage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await prisma.supportMessage.delete({ where: { id } });
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auto-update tickets with status WAITING_FOR_CUSTOMER to RESOLVED
    await prisma.supportTicket.updateMany({
      where: { status: 'WAITING_FOR_CUSTOMER' },
      data: { status: 'RESOLVED' }
    });

    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { name: true, email: true } },
        order: { select: { orderNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const id = req.params.id as string;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

const DEFAULT_CATEGORIES = [
  {
    id: "cat-getting-started",
    name: "Getting Started & Downloads",
    slug: "getting-started",
    description: "Learn how to access your purchases, download digital files, and extract asset bundles.",
    _count: { articles: 2 }
  },
  {
    id: "cat-billing-orders",
    name: "Billing, Orders & Refunds",
    slug: "billing-orders",
    description: "Information regarding payment methods, invoices, order receipts, and refund policies.",
    _count: { articles: 2 }
  },
  {
    id: "cat-licensing-terms",
    name: "Licenses & Terms of Use",
    slug: "licensing-terms",
    description: "Understand commercial vs personal use, client project rights, and redistribution rules.",
    _count: { articles: 1 }
  },
  {
    id: "cat-technical-troubleshooting",
    name: "Technical Support & Troubleshooting",
    slug: "technical-troubleshooting",
    description: "Resolving extraction errors, broken links, template compatibility, and file formats.",
    _count: { articles: 1 }
  }
];

const DEFAULT_ARTICLES = [
  {
    id: "art-1",
    title: "How to Access & Download Your Digital Purchases",
    slug: "how-to-access-download-purchases",
    categoryId: "cat-getting-started",
    category: { name: "Getting Started & Downloads", slug: "getting-started" },
    views: 1420,
    createdAt: new Date("2026-08-01").toISOString(),
    updatedAt: new Date("2026-08-10").toISOString(),
    content: `
### Accessing Your Digital Downloads

Thank you for shopping at **Kanishk Digital World**! Once your payment is successfully completed, you can access your digital files in two simple ways:

1. **Instant Download via Email**:
   - Check your inbox for your order confirmation email.
   - Click the secure **"Download Assets"** button inside the email to access your files directly.

2. **Account Dashboard**:
   - Log into your KDW account at [kanishkdigitalworld.com/login](/login).
   - Go to your **Account Dashboard > Downloads** tab.
   - Click the **Download** button next to any purchased item.

### Extracting Compressed Files (.ZIP / .RAR)
Most of our template bundles and digital resources are delivered in compressed archives:
- **Windows**: Right-click the downloaded \`.zip\` file and select **Extract All...**
- **Mac**: Double-click the \`.zip\` file to automatically uncompress it.
- **Mobile**: Use a file manager app such as Files (iOS) or ZArchiver (Android) to extract compressed files.

If you encounter any issues accessing your download link, please contact our support team at [support@kanishkdigital.com](mailto:support@kanishkdigital.com).
`
  },
  {
    id: "art-2",
    title: "Understanding Commercial vs Personal Product Licenses",
    slug: "understanding-commercial-vs-personal-licenses",
    categoryId: "cat-licensing-terms",
    category: { name: "Licenses & Terms of Use", slug: "licensing-terms" },
    views: 980,
    createdAt: new Date("2026-08-02").toISOString(),
    updatedAt: new Date("2026-08-11").toISOString(),
    content: `
### KDW Licensing Overview

All digital products available on Kanishk Digital World come with clear license terms designed to protect creators while giving you maximum flexibility.

#### 1. Personal License
- Allowed for non-commercial personal projects, personal social media, and portfolio showcases.
- Cannot be used in client work or monetized products.

#### 2. Commercial License (Standard)
- Allowed for **unlimited client projects**, commercial websites, social media marketing, and business collaterals.
- End products can be sold to single end-users or clients.

#### Prohibited Actions (Applies to All Licenses):
- You **may not** resell, redistribute, sub-license, share, or offer raw source assets to third parties.
- You **may not** re-upload templates to public file-sharing platforms or competing digital marketplaces.
`
  },
  {
    id: "art-3",
    title: "Refund Policy & Eligibility Criteria",
    slug: "refund-policy-eligibility-criteria",
    categoryId: "cat-billing-orders",
    category: { name: "Billing, Orders & Refunds", slug: "billing-orders" },
    views: 890,
    createdAt: new Date("2026-08-03").toISOString(),
    updatedAt: new Date("2026-08-12").toISOString(),
    content: `
### Digital Refund Guidelines

Because digital products are non-tangible and delivered instantly upon payment, all purchases are generally non-refundable once files have been accessed or downloaded.

#### Exceptions & Refund Approval Criteria:
We process full refunds or store credits under the following eligible conditions:
1. **Duplicate Charges**: You were accidentally charged multiple times for a single order.
2. **Corrupted / Broken Files**: A file is proven corrupted or missing essential assets, and our technical team is unable to provide a working replacement within 48 hours.
3. **Product Not Delivered**: You did not receive access links and have not downloaded any assets.

To request a refund review, please email **support@kanishkdigital.com** with your Order ID (e.g. \`ORD-12345678\`) and details of the issue.
`
  },
  {
    id: "art-4",
    title: "Troubleshooting File Extraction & Missing Fonts",
    slug: "troubleshooting-file-extraction-fonts",
    categoryId: "cat-technical-troubleshooting",
    category: { name: "Technical Support & Troubleshooting", slug: "technical-troubleshooting" },
    views: 650,
    createdAt: new Date("2026-08-04").toISOString(),
    updatedAt: new Date("2026-08-12").toISOString(),
    content: `
### Technical Troubleshooting Guide

If you experience issues opening downloaded graphics, code templates, or UI kits, follow these common fixes:

#### 1. "Archive Corrupted" or "Header Error"
- Clear your browser cache and re-download the file.
- Use **WinRAR** or **7-Zip** on Windows, or **Keka** on macOS.

#### 2. Missing Fonts in Photoshop / Figma / Illustrator
- Many templates use Google Fonts. Check the included \`Fonts.txt\` or \`Readme.txt\` file inside the folder for direct font download links.
- Install the required font files on your system before opening the template file.

#### 3. Large Asset Packs & Google Drive Links
- For large bundles exceeding 1 GB, download files individually or in smaller batches to prevent browser download timeouts.
`
  },
  {
    id: "art-5",
    title: "How to View Order Receipts and Download Invoices",
    slug: "view-order-receipts-invoices",
    categoryId: "cat-billing-orders",
    category: { name: "Billing, Orders & Refunds", slug: "billing-orders" },
    views: 520,
    createdAt: new Date("2026-08-05").toISOString(),
    updatedAt: new Date("2026-08-11").toISOString(),
    content: `
### Order Receipts & Invoices

Every purchase on Kanishk Digital World generates an official GST tax receipt and order invoice.

#### How to Retrieve Your Invoice:
1. Log in to your account at [kanishkdigitalworld.com](/login).
2. Go to **Dashboard > Purchases / Orders**.
3. Click **View Receipt** or **Download PDF Invoice** next to your order.

Your invoice contains item breakdown, GST calculation (if applicable), transaction reference ID, and payment timestamp.
`
  },
  {
    id: "art-6",
    title: "Updating Purchased Products to the Latest Version",
    slug: "updating-purchased-products-latest-version",
    categoryId: "cat-getting-started",
    category: { name: "Getting Started & Downloads", slug: "getting-started" },
    views: 430,
    createdAt: new Date("2026-08-06").toISOString(),
    updatedAt: new Date("2026-08-10").toISOString(),
    content: `
### Free Product Updates

When a creator updates a template, code bundle, or asset pack on Kanishk Digital World, existing buyers get free access to updated versions!

#### How to Download Updates:
- Go to your **Account Dashboard > Downloads**.
- Look for the **"Version Update Available"** tag.
- Click **Download Latest Version** to get the updated archive.
`
  }
];

const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "How do I receive my digital files after payment?",
    answer: "As soon as your payment is processed, you will receive an instant email containing your secure download links. You can also log into your account and navigate to Dashboard > Downloads to access all your purchased items 24/7.",
    category: "Getting Started",
    sortOrder: 1,
    status: "ACTIVE"
  },
  {
    id: "faq-2",
    question: "What payment methods are supported?",
    answer: "We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Razorpay wallet options.",
    category: "Billing & Orders",
    sortOrder: 2,
    status: "ACTIVE"
  },
  {
    id: "faq-3",
    question: "Can I use the templates for commercial client projects?",
    answer: "Yes! Products purchased with a Commercial License allow you to use the assets in unlimited commercial client projects, personal work, and marketing campaigns. Reselling or redistributing raw source files is strictly prohibited.",
    category: "Licenses",
    sortOrder: 3,
    status: "ACTIVE"
  },
  {
    id: "faq-4",
    question: "What is your refund policy for digital goods?",
    answer: "Due to the digital nature of our products, all sales are final once files have been downloaded. However, if you experienced a duplicate payment, corrupted file, or incorrect item delivery, please reach out to support@kanishkdigital.com for prompt assistance.",
    category: "Billing & Orders",
    sortOrder: 4,
    status: "ACTIVE"
  },
  {
    id: "faq-5",
    question: "What if a download link expires or fails?",
    answer: "Don't worry! Your purchases are permanently tied to your account. Simply log into your KDW account, head to Dashboard > Downloads, and generate a fresh download link anytime.",
    category: "Technical Support",
    sortOrder: 5,
    status: "ACTIVE"
  },
  {
    id: "faq-6",
    question: "Are future updates included with my purchase?",
    answer: "Yes! For products that offer version updates, all future minor and major updates are provided to existing buyers completely free of charge.",
    category: "Getting Started",
    sortOrder: 6,
    status: "ACTIVE"
  }
];

export const getFAQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    
    let where: any = {};
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { answer: { contains: q, mode: 'insensitive' } }
      ];
    }
    if (category && String(category).trim() !== '') {
      where.OR = [
        { categoryId: String(category).trim() },
        { category: { slug: String(category).trim() } },
        { category: { name: { contains: String(category).trim(), mode: 'insensitive' } } }
      ];
    }

    const dbFaqs = await prisma.supportFAQ.findMany({
      where,
      include: { category: true },
      orderBy: { sortOrder: 'asc' }
    });

    if (dbFaqs && dbFaqs.length > 0) {
      const formatted = dbFaqs.map(f => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category?.name || 'General',
        categoryId: f.categoryId,
        sortOrder: f.sortOrder,
        status: 'ACTIVE'
      }));
      return res.json({ success: true, faqs: formatted, data: formatted });
    }

    // Fallback to default FAQs if DB is empty
    let filtered = DEFAULT_FAQS;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }
    if (category) {
      filtered = filtered.filter(f => f.category === category);
    }

    res.json({ success: true, faqs: filtered, data: filtered });
  } catch (error) {
    next(error);
  }
};

export const getSupportCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbCategories = await prisma.supportCategory.findMany({
      include: {
        _count: {
          select: { articles: true, faqs: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    if (dbCategories && dbCategories.length > 0) {
      return res.json({
        success: true,
        data: dbCategories.map(c => ({
          ...c,
          articlesCount: c._count.articles,
          faqsCount: c._count.faqs
        }))
      });
    }

    res.json({ success: true, data: DEFAULT_CATEGORIES });
  } catch (error) {
    next(error);
  }
};

export const getSupportArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search || req.query.q) as string;
    const categorySlug = req.query.category as string;

    const where: any = {};
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (categorySlug && String(categorySlug).trim() !== '') {
      where.OR = [
        { categoryId: String(categorySlug).trim() },
        { category: { slug: String(categorySlug).trim() } }
      ];
    }

    const dbArticles = await prisma.supportArticle.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (dbArticles && dbArticles.length > 0) {
      return res.json({ success: true, data: dbArticles });
    }

    // Fallback to default articles if DB is empty
    let filtered = DEFAULT_ARTICLES;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
    }
    if (categorySlug) {
      const cat = DEFAULT_CATEGORIES.find(c => c.slug === categorySlug || c.id === categorySlug);
      if (cat) {
        filtered = filtered.filter(a => a.categoryId === cat.id);
      }
    }

    res.json({ success: true, data: filtered });
  } catch (error) {
    next(error);
  }
};

export const getArticleBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = String(req.params.slug || '');

    const dbArticle = await prisma.supportArticle.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      },
      include: {
        category: true
      }
    });

    if (dbArticle) {
      // Increment view count asynchronously
      prisma.supportArticle.update({
        where: { id: dbArticle.id },
        data: { views: { increment: 1 } }
      }).catch(() => {});

      const related = await prisma.supportArticle.findMany({
        where: {
          categoryId: dbArticle.categoryId,
          id: { not: dbArticle.id }
        },
        include: { category: true },
        take: 4
      });

      return res.json({
        success: true,
        data: { ...dbArticle, views: dbArticle.views + 1 },
        relatedArticles: related
      });
    }

    // Fallback to DEFAULT_ARTICLES
    const article = DEFAULT_ARTICLES.find(a => a.slug === slug || a.id === slug);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    (article as any).views = ((article as any).views || 0) + 1;
    const related = DEFAULT_ARTICLES
      .filter(a => a.categoryId === article.categoryId && a.id !== article.id)
      .slice(0, 4);

    res.json({ success: true, data: article, relatedArticles: related });
  } catch (error) {
    next(error);
  }
};

export const voteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id || '');
    const { helpful } = req.body;

    const dbArticle = await prisma.supportArticle.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    });

    if (dbArticle) {
      await prisma.supportArticle.update({
        where: { id: dbArticle.id },
        data: helpful ? { helpfulVotes: { increment: 1 } } : { unhelpfulVotes: { increment: 1 } }
      });
      return res.json({ success: true, message: 'Thank you for your feedback!' });
    }

    const article = DEFAULT_ARTICLES.find(a => a.id === id || a.slug === id);
    if (article) {
      if (helpful) {
        (article as any).helpful = ((article as any).helpful || 0) + 1;
      } else {
        (article as any).unhelpful = ((article as any).unhelpful || 0) + 1;
      }
    }
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    next(error);
  }
};

export const searchSupport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string || req.query.search as string || '').toLowerCase().trim();
    if (!q) {
      return res.json({ success: true, data: { articles: [], faqs: [] } });
    }

    const [dbArticles, dbFaqs] = await Promise.all([
      prisma.supportArticle.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: { category: true }
      }),
      prisma.supportFAQ.findMany({
        where: {
          OR: [
            { question: { contains: q, mode: 'insensitive' } },
            { answer: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: { category: true }
      })
    ]);

    if (dbArticles.length > 0 || dbFaqs.length > 0) {
      return res.json({
        success: true,
        data: {
          articles: dbArticles,
          faqs: dbFaqs.map(f => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            category: f.category?.name || 'General'
          }))
        }
      });
    }

    // Fallback to default
    const articles = DEFAULT_ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.category && a.category.name.toLowerCase().includes(q))
    );

    const faqs = DEFAULT_FAQS.filter(f =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      (f.category && f.category.toLowerCase().includes(q))
    );

    res.json({
      success: true,
      data: {
        articles,
        faqs
      }
    });
  } catch (error) {
    next(error);
  }
};
