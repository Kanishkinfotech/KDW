import { Request, Response } from 'express';
import { prisma } from '../database/db';
import { ReviewService } from '../services/reviewService';
import { logAdminAction } from '../utils/auditLogger';

// 1. Get All Reviews with subview filters & live KPIs (Admin)
export const getAdminReviews = async (req: Request, res: Response) => {
  try {
    const { status, rating, verifiedOnly, productId, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (rating && rating !== 'ALL') {
      where.rating = parseInt(rating as string, 10);
    }
    if (verifiedOnly === 'true') {
      where.verifiedPurchase = true;
    }
    if (productId) {
      where.productId = productId as string;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { comment: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerEmail: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [reviews, total, pendingCount, publishedCount, rejectedCount, reportedCount, verifiedCount] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          customer: { select: { id: true, name: true, email: true } },
          replies: { orderBy: { createdAt: 'desc' } },
          reports: { orderBy: { createdAt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.review.count({ where }),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'PUBLISHED' } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      prisma.review.count({ where: { status: 'REPORTED' } }),
      prisma.review.count({ where: { verifiedPurchase: true } })
    ]);

    // Calculate live average rating
    const ratingAgg = await prisma.review.aggregate({
      where: { status: 'PUBLISHED' },
      _avg: { rating: true },
      _count: { id: true }
    });

    res.status(200).json({
      success: true,
      reviews,
      kpis: {
        totalReviews: total,
        pendingReviews: pendingCount,
        publishedReviews: publishedCount,
        rejectedReviews: rejectedCount,
        reportedReviews: reportedCount,
        verifiedPurchases: verifiedCount,
        averageRating: Math.round((ratingAgg._avg.rating || 5.0) * 10) / 10,
        totalPublishedCount: ratingAgg._count.id || 0
      },
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

// 2. Get Single Review by ID
export const getAdminReviewById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: true,
        order: { select: { id: true, orderNumber: true, totalAmount: true, paymentStatus: true } },
        customer: true,
        reports: true,
        replies: true,
        revisions: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, review });
  } catch (error) {
    console.error('Error fetching review detail:', error);
    res.status(500).json({ success: false, message: 'Server error fetching review' });
  }
};

// 3. Moderation State Triggers (Approve, Reject, Hide, Restore)
export const updateReviewModeration = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, moderationReason } = req.body;
    const adminName = (req as any).user?.name || 'Admin';

    const current = await prisma.review.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Preserve revision history if body or rating changed
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        status,
        moderationReason: moderationReason || current.moderationReason,
        moderatedBy: adminName,
        moderatedAt: new Date(),
        publishedAt: status === 'PUBLISHED' || status === 'APPROVED' ? new Date() : current.publishedAt,
        hiddenAt: status === 'HIDDEN' ? new Date() : null
      }
    });

    const adminId = (req as any).user?.id || 'system';
    await logAdminAction(adminId, 'MODERATE_REVIEW', 'Review', `Changed review ${id} status to ${status}`);

    res.status(200).json({
      success: true,
      review: updatedReview,
      message: `Review marked as ${status}.`
    });
  } catch (error) {
    console.error('Error updating review moderation:', error);
    res.status(500).json({ success: false, message: 'Server error updating moderation' });
  }
};

// 4. Staff Reply to Review
export const replyToReview = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { body } = req.body;
    const authorName = (req as any).user?.name || 'KDW Official Support';
    const authorId = (req as any).user?.id;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be blank.' });
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId: id,
        authorId,
        authorName,
        body: body.trim(),
        status: 'PUBLISHED'
      }
    });

    res.status(201).json({ success: true, reply, message: 'Staff reply published.' });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ success: false, message: 'Server error posting reply' });
  }
};

// 5. Get Review Reports Ledger
export const getReviewReports = async (req: Request, res: Response) => {
  try {
    const { status = 'OPEN', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = status !== 'ALL' ? { status: status as string } : {};

    const [reports, total] = await Promise.all([
      prisma.reviewReport.findMany({
        where,
        include: {
          review: {
            include: { product: { select: { id: true, name: true } } }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.reviewReport.count({ where })
    ]);

    res.status(200).json({
      success: true,
      reports,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching review reports:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reports' });
  }
};

// 6. Resolve Review Report
export const resolveReviewReport = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { resolution, dismissReview } = req.body;
    const adminName = (req as any).user?.name || 'Admin';

    const report = await prisma.reviewReport.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution: resolution || 'Reviewed by admin team',
        resolvedBy: adminName,
        resolvedAt: new Date()
      },
      include: { review: true }
    });

    if (dismissReview && report.reviewId) {
      await prisma.review.update({
        where: { id: report.reviewId },
        data: { status: 'HIDDEN', hiddenAt: new Date() }
      });
    }

    res.status(200).json({ success: true, report, message: 'Report resolved.' });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ success: false, message: 'Server error resolving report' });
  }
};

// 7. Product Version Analytics
export const getProductVersionAnalytics = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const analytics = await ReviewService.getVersionAnalytics(productId);
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching version analytics:', error);
    res.status(500).json({ success: false, message: 'Server error calculating version analytics' });
  }
};

// 8. Public / Customer Review Submission
export const createPublicReview = async (req: Request, res: Response) => {
  try {
    const { productId, productVersion, orderId, rating, title, comment, pros, cons, images, videos, guestReviewToken } = req.body;
    const user = (req as any).user;

    const review = await ReviewService.submitReview({
      productId,
      productVersion: productVersion || '1.0.0',
      orderId,
      customerId: user?.id,
      guestName: user?.name || req.body.customerName || 'KDW Customer',
      guestEmail: user?.email || req.body.customerEmail,
      guestReviewToken,
      rating: parseInt(rating, 10) || 5,
      title,
      comment,
      pros,
      cons,
      images,
      videos
    });

    res.status(201).json({
      success: true,
      review,
      message: review.status === 'PUBLISHED'
        ? 'Thank you! Your review has been published.'
        : 'Thank you! Your review has been submitted for moderation.'
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error submitting review' });
  }
};

// 9. Public Storefront Reviews
export const getPublicProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { sort = 'newest', rating } = req.query;

    const where: any = {
      productId,
      status: { in: ['APPROVED', 'PUBLISHED'] }
    };

    if (rating) {
      where.rating = parseInt(rating as string, 10);
    }

    const orderBy: any = sort === 'highest' ? { rating: 'desc' } : sort === 'lowest' ? { rating: 'asc' } : { createdAt: 'desc' };

    const reviews = await prisma.review.findMany({
      where,
      include: {
        replies: { where: { status: 'PUBLISHED' } }
      },
      orderBy
    });

    const parsedReviews = reviews.map(r => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : [],
      videos: r.videos ? JSON.parse(r.videos) : []
    }));

    // Calculate rating histogram
    const histogram = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    let verifiedCount = 0;

    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        histogram[r.rating as keyof typeof histogram] += 1;
        totalScore += r.rating;
      }
      if (r.verifiedPurchase) verifiedCount++;
    });

    const total = reviews.length;
    const averageRating = total > 0 ? Math.round((totalScore / total) * 10) / 10 : 5.0;
    const verifiedPercentage = total > 0 ? Math.round((verifiedCount / total) * 100) : 100;

    res.status(200).json({
      success: true,
      reviews: parsedReviews,
      summary: {
        averageRating,
        total,
        histogram,
        verifiedPercentage,
        recommendPercentage: total > 0 ? Math.round(((histogram[4] + histogram[5]) / total) * 100) : 100
      }
    });
  } catch (error) {
    console.error('Error fetching public reviews:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};
