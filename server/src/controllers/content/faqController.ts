import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'support-admin',
    name: user.name || 'Support Lead',
    email: user.email || 'support@kdw.com'
  };
};

export const getFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scope = 'ALL', status = 'ALL', isOutdated, search, page = '1', limit = '25' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (scope && scope !== 'ALL') where.scopeType = String(scope);
    if (status && status !== 'ALL') where.status = String(status);
    if (isOutdated !== undefined && isOutdated !== 'ALL') where.isOutdated = isOutdated === 'true';
    if (search) {
      where.OR = [
        { question: { contains: String(search), mode: 'insensitive' } },
        { answer: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, faqs] = await Promise.all([
      prisma.contentFaq.count({ where }),
      prisma.contentFaq.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }]
      })
    ]);

    res.json({
      success: true,
      data: faqs,
      faqs,
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

export const createFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const { question, answer, scopeType = 'GLOBAL', productId, categoryName, campaignName, tags, displayOrder = 0, expiresAt } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and Answer are required.' });
    }

    // Duplicate Question Detection Check
    const cleanQuestion = question.trim().toLowerCase();
    const existing = await prisma.contentFaq.findFirst({
      where: {
        question: { equals: cleanQuestion, mode: 'insensitive' },
        scopeType
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A similar question already exists under ${scopeType} scope: "${existing.question}" (ID: ${existing.id}).`
      });
    }

    const faq = await prisma.contentFaq.create({
      data: {
        question,
        answer,
        scopeType,
        productId,
        categoryName,
        campaignName,
        tags: tags || [],
        displayOrder: parseInt(displayOrder, 10) || 0,
        status: 'PUBLISHED',
        authorId: actor.id,
        authorName: actor.name,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Record revision
    await prisma.contentRevision.create({
      data: {
        contentType: 'FAQ',
        contentId: faq.id,
        versionNumber: 1,
        contentSnapshot: faq,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: 'Initial FAQ Created',
        statusSnapshot: 'PUBLISHED'
      }
    });

    res.status(201).json({ success: true, faq, message: 'FAQ created and published.' });
  } catch (error) {
    next(error);
  }
};

export const updateFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { question, answer, scopeType, productId, categoryName, campaignName, tags, displayOrder, status, expiresAt, changeSummary } = req.body;

    const existing = await prisma.contentFaq.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'FAQ not found.' });

    const updated = await prisma.contentFaq.update({
      where: { id },
      data: {
        ...(question && { question }),
        ...(answer && { answer }),
        ...(scopeType && { scopeType }),
        ...(productId !== undefined && { productId }),
        ...(categoryName !== undefined && { categoryName }),
        ...(campaignName !== undefined && { campaignName }),
        ...(tags !== undefined && { tags }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder, 10) || 0 }),
        ...(status && { status }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        lastReviewedAt: new Date(),
        isOutdated: false,
        outdatedReason: null
      }
    });

    await prisma.contentRevision.create({
      data: {
        contentType: 'FAQ',
        contentId: id,
        versionNumber: Math.floor(Date.now() / 1000),
        contentSnapshot: updated,
        changedById: actor.id,
        changedByName: actor.name,
        changeSummary: changeSummary || 'FAQ Answer Updated & Cleared Outdated Flag',
        statusSnapshot: updated.status
      }
    });

    res.json({ success: true, faq: updated, message: 'FAQ updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const markFaqOutdated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a descriptive reason for marking this FAQ as outdated.' });
    }

    const updated = await prisma.contentFaq.update({
      where: { id },
      data: {
        isOutdated: true,
        outdatedReason: reason,
        status: 'OUTDATED'
      }
    });

    res.json({ success: true, faq: updated, message: 'FAQ marked as outdated.' });
  } catch (error) {
    next(error);
  }
};

export const deleteFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await prisma.contentFaq.delete({ where: { id } });
    res.json({ success: true, message: 'FAQ deleted.' });
  } catch (error) {
    next(error);
  }
};

export const voteFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { vote } = req.body; // 'helpful' or 'unhelpful'

    const updated = await prisma.contentFaq.update({
      where: { id },
      data: {
        ...(vote === 'helpful' && { helpfulCount: { increment: 1 } }),
        ...(vote === 'unhelpful' && { unhelpfulCount: { increment: 1 } }),
        viewsCount: { increment: 1 }
      }
    });

    res.json({ success: true, helpfulCount: updated.helpfulCount, unhelpfulCount: updated.unhelpfulCount });
  } catch (error) {
    next(error);
  }
};
