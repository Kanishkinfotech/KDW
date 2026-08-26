import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'support-agent',
    name: user.name || 'Support Staff',
    email: user.email || 'support@kdw.com'
  };
};

export const getFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'ALL', status = 'ALL', priority = 'ALL', isPublicReview, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type && type !== 'ALL') where.feedbackType = String(type);
    if (status && status !== 'ALL') where.status = String(status);
    if (priority && priority !== 'ALL') where.priority = String(priority);
    if (isPublicReview !== undefined && isPublicReview !== 'ALL') where.isPublicReview = isPublicReview === 'true';
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { message: { contains: String(search), mode: 'insensitive' } },
        { customerEmail: { contains: String(search), mode: 'insensitive' } },
        { customerName: { contains: String(search), mode: 'insensitive' } },
        { productName: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.customerFeedback.count({ where }),
      prisma.customerFeedback.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
      })
    ]);

    res.json({
      success: true,
      data: items,
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

export const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const item = await prisma.customerFeedback.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Feedback record not found.' });
    res.json({ success: true, feedback: item });
  } catch (error) {
    next(error);
  }
};

export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      orderId,
      orderNumber,
      productId,
      productName,
      productVersion,
      feedbackType = 'GENERAL_FEEDBACK',
      rating = 5,
      title,
      message,
      attachmentUrl,
      source = 'STOREFRONT',
      isPublicReview = false
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and Message are required.' });
    }

    // Heuristic: Suggest CRITICAL priority if product inaccessible / payment completed but missing download
    let priority = 'MEDIUM';
    const lowerMsg = (message + ' ' + title).toLowerCase();
    if (lowerMsg.includes('cannot download') || lowerMsg.includes('failed to download') || lowerMsg.includes('payment done but no file') || lowerMsg.includes('error 403') || lowerMsg.includes('broken link')) {
      priority = 'CRITICAL';
    } else if (feedbackType === 'BUG_REPORT' || feedbackType === 'DOWNLOAD_ISSUE' || feedbackType === 'LICENCE_ISSUE') {
      priority = 'HIGH';
    }

    const item = await prisma.customerFeedback.create({
      data: {
        customerId,
        customerName: customerName || 'Valued Customer',
        customerEmail: customerEmail || 'customer@example.com',
        orderId,
        orderNumber,
        productId,
        productName,
        productVersion: productVersion || '1.0.0',
        feedbackType,
        rating: parseInt(rating, 10) || 5,
        title,
        message,
        attachmentUrl,
        status: 'NEW',
        priority,
        source,
        isPublicReview: Boolean(isPublicReview),
        moderationStatus: isPublicReview ? 'PENDING' : 'APPROVED'
      }
    });

    res.status(201).json({ success: true, feedback: item, message: 'Feedback recorded successfully.' });
  } catch (error) {
    next(error);
  }
};

export const assignFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { assignedToId, assignedToName } = req.body;

    const item = await prisma.customerFeedback.update({
      where: { id },
      data: {
        assignedToId,
        assignedToName,
        status: 'OPEN'
      }
    });

    res.json({ success: true, feedback: item, message: `Assigned to ${assignedToName}.` });
  } catch (error) {
    next(error);
  }
};

export const overridePriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { priority, reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Mandatory reason is required to override feedback priority.' });
    }

    const item = await prisma.customerFeedback.update({
      where: { id },
      data: {
        priority,
        priorityOverrideReason: reason
      }
    });

    res.json({ success: true, feedback: item, message: `Priority set to ${priority}.` });
  } catch (error) {
    next(error);
  }
};

export const replyFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { message, isInternalNote = false } = req.body;

    const existing = await prisma.customerFeedback.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Feedback not found.' });

    if (isInternalNote) {
      const notes = (existing.internalNotes as any[]) || [];
      notes.push({ author: actor.name, email: actor.email, note: message, createdAt: new Date() });

      const updated = await prisma.customerFeedback.update({
        where: { id },
        data: { internalNotes: notes }
      });
      return res.json({ success: true, feedback: updated, message: 'Internal note added.' });
    } else {
      const replies = (existing.replies as any[]) || [];
      replies.push({ sender: actor.name, message, sentAt: new Date() });

      const updated = await prisma.customerFeedback.update({
        where: { id },
        data: {
          replies,
          status: 'WAITING_FOR_CUSTOMER'
        }
      });
      return res.json({ success: true, feedback: updated, message: 'Response sent to customer.' });
    }
  } catch (error) {
    next(error);
  }
};

export const resolveFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);

    const item = await prisma.customerFeedback.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: actor.name
      }
    });

    res.json({ success: true, feedback: item, message: 'Feedback marked as resolved.' });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { status, reason } = req.body; // 'APPROVED', 'REJECTED', 'REPORTED'

    const item = await prisma.customerFeedback.update({
      where: { id },
      data: {
        moderationStatus: status,
        moderationReason: reason
      }
    });

    res.json({ success: true, feedback: item, message: `Review moderation status updated to ${status}.` });
  } catch (error) {
    next(error);
  }
};
