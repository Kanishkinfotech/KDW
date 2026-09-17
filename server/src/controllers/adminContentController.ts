import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate URL-safe slugs
export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper for safe audit logging
const logAudit = async (
  adminId: string | undefined,
  action: 'CREATED' | 'UPDATED' | 'DELETED',
  entity: 'SupportCategory' | 'SupportArticle' | 'SupportFAQ',
  details: any,
  req: Request
) => {
  if (!adminId) return;
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || req.ip || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        details: JSON.stringify({
          ...details,
          ip,
          userAgent
        })
      }
    });
  } catch (err) {
    console.error(`Failed to create audit log for ${entity} ${action}:`, err);
  }
};

// Role Check Helper for Deletions (Admin only)
const isDeleteAuthorized = (role?: string): boolean => {
  if (!role) return false;
  const normalized = role.toLowerCase().replace(/[\s_-]+/g, '');
  return normalized === 'admin' || normalized === 'superadmin';
};

// ==========================================
// 1. OVERVIEW
// ==========================================
export const getContentOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [categories, articles, faqs, articleStats] = await Promise.all([
      prisma.supportCategory.count(),
      prisma.supportArticle.count(),
      prisma.supportFAQ.count(),
      prisma.supportArticle.aggregate({
        _sum: {
          views: true,
          helpfulVotes: true,
          unhelpfulVotes: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        categories,
        articles,
        faqs,
        publishedArticles: articles,
        totalViews: articleStats._sum.views || 0,
        totalHelpful: articleStats._sum.helpfulVotes || 0,
        totalUnhelpful: articleStats._sum.unhelpfulVotes || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CATEGORIES CRUD
// ==========================================
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const where: any = {};

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } }
      ];
    }

    const categories = await prisma.supportCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            articles: true,
            faqs: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = categories.map(cat => ({
      ...cat,
      articlesCount: cat._count.articles,
      faqsCount: cat._count.faqs
    }));

    res.json({ success: true, data: formatted, categories: formatted });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = String(name).trim();
    let generatedSlug = slugify(trimmedName);
    if (!generatedSlug) generatedSlug = `category-${Date.now()}`;

    // Check for duplicate name or slug
    const existing = await prisma.supportCategory.findFirst({
      where: {
        OR: [
          { name: { equals: trimmedName, mode: 'insensitive' } },
          { slug: generatedSlug }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with that name already exists' });
    }

    const category = await prisma.supportCategory.create({
      data: {
        name: trimmedName,
        slug: generatedSlug,
        description: description ? String(description).trim() : null,
        icon: icon ? String(icon).trim() : null
      },
      include: {
        _count: {
          select: { articles: true, faqs: true }
        }
      }
    });

    await logAudit(
      (req as any).user?.id,
      'CREATED',
      'SupportCategory',
      { id: category.id, name: category.name, slug: category.slug },
      req
    );

    res.status(201).json({
      success: true,
      data: {
        ...category,
        articlesCount: category._count.articles,
        faqsCount: category._count.faqs
      },
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description, icon } = req.body;

    const existing = await prisma.supportCategory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const dataToUpdate: any = {};
    if (description !== undefined) dataToUpdate.description = description ? String(description).trim() : null;
    if (icon !== undefined) dataToUpdate.icon = icon ? String(icon).trim() : null;

    if (name && String(name).trim() !== '' && String(name).trim() !== existing.name) {
      const trimmedName = String(name).trim();
      const newSlug = slugify(trimmedName);

      // Check duplicate
      const duplicate = await prisma.supportCategory.findFirst({
        where: {
          id: { not: id },
          OR: [
            { name: { equals: trimmedName, mode: 'insensitive' } },
            { slug: newSlug }
          ]
        }
      });

      if (duplicate) {
        return res.status(400).json({ success: false, message: 'A category with that name already exists' });
      }

      dataToUpdate.name = trimmedName;
      dataToUpdate.slug = newSlug;
    }

    const updated = await prisma.supportCategory.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: {
          select: { articles: true, faqs: true }
        }
      }
    });

    await logAudit(
      (req as any).user?.id,
      'UPDATED',
      'SupportCategory',
      {
        id,
        oldValues: { name: existing.name, slug: existing.slug },
        newValues: { name: updated.name, slug: updated.slug }
      },
      req
    );

    res.json({
      success: true,
      data: {
        ...updated,
        articlesCount: updated._count.articles,
        faqsCount: updated._count.faqs
      },
      message: 'Category updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user?.role;

    if (!isDeleteAuthorized(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only administrators can delete knowledge base categories.'
      });
    }

    const existing = await prisma.supportCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true, faqs: true }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const articleCount = existing._count.articles;
    const faqCount = existing._count.faqs;

    if (articleCount > 0 || faqCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${articleCount} article(s) and ${faqCount} FAQ(s) still reference this category. Move or delete them first.`
      });
    }

    await prisma.supportCategory.delete({ where: { id } });

    await logAudit(
      (req as any).user?.id,
      'DELETED',
      'SupportCategory',
      { id, name: existing.name, slug: existing.slug },
      req
    );

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. ARTICLES CRUD
// ==========================================
export const getArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search } = req.query;
    const where: any = {};

    if (categoryId && String(categoryId).trim() !== '' && categoryId !== 'ALL') {
      where.categoryId = String(categoryId).trim();
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } }
      ];
    }

    const articles = await prisma.supportArticle.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: articles, articles });
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const article = await prisma.supportArticle.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: article, article });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, categoryId, tags } = req.body;
    const authUser = (req as any).user;

    if (!title || String(title).trim() === '') {
      return res.status(400).json({ success: false, message: 'Article title is required' });
    }
    if (!content || String(content).trim() === '') {
      return res.status(400).json({ success: false, message: 'Article content is required' });
    }
    if (!categoryId || String(categoryId).trim() === '') {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    // Verify category existence
    const category = await prisma.supportCategory.findUnique({ where: { id: String(categoryId).trim() } });
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid categoryId: Category does not exist' });
    }

    const trimmedTitle = String(title).trim();
    let generatedSlug = slugify(trimmedTitle);
    if (!generatedSlug) generatedSlug = `article-${Date.now()}`;

    // Handle slug collision
    const existingSlug = await prisma.supportArticle.findUnique({ where: { slug: generatedSlug } });
    if (existingSlug) {
      generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Format tags
    let formattedTags: string | null = null;
    if (Array.isArray(tags)) {
      formattedTags = JSON.stringify(tags.map(t => String(t).trim()).filter(Boolean));
    } else if (typeof tags === 'string' && tags.trim() !== '') {
      formattedTags = JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean));
    }

    const article = await prisma.supportArticle.create({
      data: {
        title: trimmedTitle,
        slug: generatedSlug,
        content: String(content).trim(),
        categoryId: category.id,
        authorId: authUser?.id || null,
        authorName: authUser?.name || 'Support Team',
        tags: formattedTags
      },
      include: {
        category: true
      }
    });

    await logAudit(
      authUser?.id,
      'CREATED',
      'SupportArticle',
      { id: article.id, title: article.title, slug: article.slug, categoryId: category.id },
      req
    );

    res.status(201).json({
      success: true,
      data: article,
      article,
      message: 'Article created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { title, content, categoryId, tags } = req.body;
    const authUser = (req as any).user;

    const existing = await prisma.supportArticle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const dataToUpdate: any = {};

    if (categoryId && String(categoryId).trim() !== existing.categoryId) {
      const category = await prisma.supportCategory.findUnique({ where: { id: String(categoryId).trim() } });
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId: Category does not exist' });
      }
      dataToUpdate.categoryId = category.id;
    }

    if (content !== undefined && String(content).trim() !== '') {
      dataToUpdate.content = String(content).trim();
    }

    if (title && String(title).trim() !== '' && String(title).trim() !== existing.title) {
      const trimmedTitle = String(title).trim();
      let newSlug = slugify(trimmedTitle);
      if (!newSlug) newSlug = `article-${Date.now()}`;

      // Check unique slug
      const slugCollision = await prisma.supportArticle.findFirst({
        where: {
          id: { not: id },
          slug: newSlug
        }
      });
      if (slugCollision) {
        newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
      }

      dataToUpdate.title = trimmedTitle;
      dataToUpdate.slug = newSlug;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        dataToUpdate.tags = JSON.stringify(tags.map(t => String(t).trim()).filter(Boolean));
      } else if (typeof tags === 'string') {
        dataToUpdate.tags = JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean));
      } else {
        dataToUpdate.tags = null;
      }
    }

    const updated = await prisma.supportArticle.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: true
      }
    });

    await logAudit(
      authUser?.id,
      'UPDATED',
      'SupportArticle',
      {
        id,
        oldValues: { title: existing.title, slug: existing.slug, categoryId: existing.categoryId },
        newValues: { title: updated.title, slug: updated.slug, categoryId: updated.categoryId }
      },
      req
    );

    res.json({
      success: true,
      data: updated,
      article: updated,
      message: 'Article updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user?.role;

    if (!isDeleteAuthorized(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only administrators can delete knowledge base articles.'
      });
    }

    const existing = await prisma.supportArticle.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    await prisma.supportArticle.delete({ where: { id } });

    await logAudit(
      (req as any).user?.id,
      'DELETED',
      'SupportArticle',
      { id, title: existing.title, slug: existing.slug },
      req
    );

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. FAQS CRUD
// ==========================================
export const getFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search } = req.query;
    const where: any = {};

    if (categoryId && String(categoryId).trim() !== '' && categoryId !== 'ALL') {
      where.categoryId = String(categoryId).trim();
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { answer: { contains: q, mode: 'insensitive' } }
      ];
    }

    const faqs = await prisma.supportFAQ.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });

    res.json({ success: true, data: faqs, faqs });
  } catch (error) {
    next(error);
  }
};

export const createFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, answer, categoryId, sortOrder } = req.body;
    const authUser = (req as any).user;

    if (!question || String(question).trim() === '') {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }
    if (!answer || String(answer).trim() === '') {
      return res.status(400).json({ success: false, message: 'Answer is required' });
    }
    if (!categoryId || String(categoryId).trim() === '') {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const category = await prisma.supportCategory.findUnique({ where: { id: String(categoryId).trim() } });
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid categoryId: Category does not exist' });
    }

    const faq = await prisma.supportFAQ.create({
      data: {
        question: String(question).trim(),
        answer: String(answer).trim(),
        categoryId: category.id,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0
      },
      include: {
        category: true
      }
    });

    await logAudit(
      authUser?.id,
      'CREATED',
      'SupportFAQ',
      { id: faq.id, question: faq.question, categoryId: category.id },
      req
    );

    res.status(201).json({
      success: true,
      data: faq,
      faq,
      message: 'FAQ created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { question, answer, categoryId, sortOrder } = req.body;
    const authUser = (req as any).user;

    const existing = await prisma.supportFAQ.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    const dataToUpdate: any = {};

    if (categoryId && String(categoryId).trim() !== existing.categoryId) {
      const category = await prisma.supportCategory.findUnique({ where: { id: String(categoryId).trim() } });
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId: Category does not exist' });
      }
      dataToUpdate.categoryId = category.id;
    }

    if (question !== undefined && String(question).trim() !== '') {
      dataToUpdate.question = String(question).trim();
    }

    if (answer !== undefined && String(answer).trim() !== '') {
      dataToUpdate.answer = String(answer).trim();
    }

    if (sortOrder !== undefined && typeof sortOrder === 'number') {
      dataToUpdate.sortOrder = sortOrder;
    }

    const updated = await prisma.supportFAQ.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: true
      }
    });

    await logAudit(
      authUser?.id,
      'UPDATED',
      'SupportFAQ',
      {
        id,
        oldValues: { question: existing.question, categoryId: existing.categoryId },
        newValues: { question: updated.question, categoryId: updated.categoryId }
      },
      req
    );

    res.json({
      success: true,
      data: updated,
      faq: updated,
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user?.role;

    if (!isDeleteAuthorized(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only administrators can delete knowledge base FAQs.'
      });
    }

    const existing = await prisma.supportFAQ.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    await prisma.supportFAQ.delete({ where: { id } });

    await logAudit(
      (req as any).user?.id,
      'DELETED',
      'SupportFAQ',
      { id, question: existing.question },
      req
    );

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};
