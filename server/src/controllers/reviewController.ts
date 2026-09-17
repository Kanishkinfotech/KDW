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
      if (status === 'PENDING') {
        where.status = { in: ['PENDING', 'SUBMITTED'] };
      } else if (status === 'PUBLISHED') {
        where.status = { in: ['PUBLISHED', 'APPROVED'] };
      } else if (status === 'REPORTED') {
        where.OR = [
          { status: 'REPORTED' },
          { reportCount: { gt: 0 } }
        ];
      } else {
        where.status = status as string;
      }
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
      const searchOR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { comment: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerEmail: { contains: search as string, mode: 'insensitive' } }
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const [
      reviews,
      filteredTotal,
      grandTotal,
      pendingCount,
      publishedCount,
      rejectedCount,
      reportedCount,
      verifiedCount
    ] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          customer: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, orderNumber: true, totalAmount: true, paymentStatus: true } },
          replies: { orderBy: { createdAt: 'desc' } },
          reports: { orderBy: { createdAt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.review.count({ where }),
      prisma.review.count(),
      prisma.review.count({ where: { status: { in: ['PENDING', 'SUBMITTED'] } } }),
      prisma.review.count({ where: { status: { in: ['PUBLISHED', 'APPROVED'] } } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      prisma.review.count({
        where: {
          OR: [
            { status: 'REPORTED' },
            { reportCount: { gt: 0 } }
          ]
        }
      }),
      prisma.review.count({ where: { verifiedPurchase: true } })
    ]);

    // Calculate live average rating & rating distribution across published reviews
    const [ratingAgg, ratingDistribution, productGroup] = await Promise.all([
      prisma.review.aggregate({
        where: { status: { in: ['PUBLISHED', 'APPROVED'] } },
        _avg: { rating: true },
        _count: { id: true }
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { status: { in: ['PUBLISHED', 'APPROVED'] } },
        _count: { id: true }
      }),
      prisma.review.groupBy({
        by: ['productId'],
        where: { status: { in: ['PUBLISHED', 'APPROVED'] } },
        _avg: { rating: true },
        _count: { id: true },
        take: 10,
        orderBy: { _count: { id: 'desc' } }
      })
    ]);

    const productIds = productGroup.map(p => p.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, thumbnail: true }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const histogram: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let positiveCount = 0;
    ratingDistribution.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        histogram[r.rating] = r._count.id;
        if (r.rating >= 4) {
          positiveCount += r._count.id;
        }
      }
    });

    const totalPublished = ratingAgg._count.id || 0;
    const recommendationRate = totalPublished > 0 ? Math.round((positiveCount / totalPublished) * 100) : 100;
    const verifiedRate = totalPublished > 0 ? Math.round((verifiedCount / Math.max(grandTotal, 1)) * 100) : 100;

    const topProducts = productGroup.map(pg => {
      const prod = productMap.get(pg.productId);
      return {
        id: pg.productId,
        name: prod?.name || 'Unknown Product',
        slug: prod?.slug || '',
        coverImage: prod?.thumbnail || null,
        averageRating: Math.round(((pg._avg.rating || 5.0) * 10)) / 10,
        totalReviews: pg._count.id
      };
    });

    res.status(200).json({
      success: true,
      reviews,
      kpis: {
        totalReviews: grandTotal,
        pendingModeration: pendingCount,
        pendingReviews: pendingCount,
        publishedReviews: publishedCount,
        rejectedReviews: rejectedCount,
        reportedReviews: reportedCount,
        verifiedPurchases: verifiedCount,
        averageRating: Math.round((ratingAgg._avg.rating || 5.0) * 10) / 10,
        totalPublishedCount: totalPublished,
        histogram,
        recommendationRate,
        verifiedRate,
        topProducts
      },
      pagination: { total: filteredTotal, page: pageNum, pages: Math.ceil(filteredTotal / limitNum) }
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

export const checkReviewEligibility = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const user = (req as any).user;

    if (!user) {
      return res.status(200).json({
        success: true,
        eligible: false,
        verified: false,
        reason: 'NOT_LOGGED_IN'
      });
    }

    const verification = await ReviewService.verifyPurchase({
      productId,
      customerId: user.id,
      guestEmail: user.email
    });

    const existing = await prisma.review.findFirst({
      where: {
        productId,
        OR: [
          { customerId: user.id },
          { customerEmail: { equals: user.email, mode: 'insensitive' } }
        ]
      }
    });

    res.status(200).json({
      success: true,
      eligible: verification.verified && !existing,
      verified: verification.verified,
      alreadyReviewed: !!existing,
      orderId: verification.orderId
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPublicReview = async (req: Request, res: Response) => {
  try {
    const { productId, productVersion, orderId, rating, title, comment, pros, cons, images, videos, guestReviewToken } = req.body;
    const user = (req as any).user;

    const review = await ReviewService.submitReview({
      productId,
      productVersion: productVersion || '1.0.0',
      orderId,
      customerId: user?.id,
      guestName: user?.name || req.body.customerName || req.body.guestName || 'KDW Customer',
      guestEmail: user?.email || req.body.customerEmail || req.body.guestEmail,
      guestReviewToken,
      rating: parseInt(rating, 10) || 5,
      title: title || 'Product Review',
      comment,
      pros,
      cons,
      images,
      videos
    });

    const isReported = review.status === 'REPORTED';
    res.status(201).json({
      success: true,
      review,
      isFlagged: isReported,
      message: isReported
        ? 'Your review contains flagged content and has been routed to our moderation team for manual review before appearing.'
        : 'Thank you! Your verified review has been published to the storefront.'
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    const isVerificationError = error.message?.includes('Only verified buyers');
    res.status(isVerificationError ? 403 : 400).json({
      success: false,
      message: error.message || 'Server error submitting review'
    });
  }
};

// 9. Public Storefront Reviews
export const getPublicProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const { sort = 'newest', rating } = req.query;

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { slug: productId }
        ]
      },
      select: { id: true }
    });

    const canonicalProductId = product ? product.id : productId;

    const where: any = {
      productId: canonicalProductId,
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

    const parsedReviews = reviews.map(r => {
      let images = [];
      let videos = [];
      try {
        images = r.images ? (typeof r.images === 'string' ? JSON.parse(r.images) : r.images) : [];
      } catch (e) {
        images = r.images ? [r.images] : [];
      }
      try {
        videos = r.videos ? (typeof r.videos === 'string' ? JSON.parse(r.videos) : r.videos) : [];
      } catch (e) {
        videos = r.videos ? [r.videos] : [];
      }
      return {
        ...r,
        images,
        videos,
        creatorReply: r.replies && r.replies.length > 0 ? {
          text: r.replies[0].body,
          authorName: r.replies[0].authorName,
          repliedAt: r.replies[0].createdAt
        } : undefined
      };
    });

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

// 10. Public / Customer Report Review
export const createReviewReport = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id as string;
    const { reason = 'OTHER', details, reporterEmail } = req.body;
    const user = (req as any).user;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const report = await prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId: user?.id || null,
        reporterEmail: user?.email || reporterEmail || null,
        reason: String(reason).toUpperCase(),
        details: details || null,
        status: 'OPEN'
      }
    });

    const newReportCount = (review.reportCount || 0) + 1;
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        reportCount: newReportCount,
        status: 'REPORTED'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted to the moderation team.',
      reportId: report.id
    });
  } catch (error: any) {
    console.error('Error reporting review:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error submitting report' });
  }
};

// 11. Public / Customer Vote Review (Helpful)
export const voteReview = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id as string;
    const { vote = 'UP' } = req.body;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      message: vote === 'UP' ? 'Marked as helpful' : 'Vote recorded'
    });
  } catch (error: any) {
    console.error('Error voting review:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error recording vote' });
  }
};

// 12. Delete Review Permanently (Admin)
export const deleteAdminReview = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.reviewReport.deleteMany({ where: { reviewId: id } });
    await prisma.reviewReply.deleteMany({ where: { reviewId: id } });
    await prisma.reviewRevision.deleteMany({ where: { reviewId: id } });
    await prisma.review.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Review permanently removed.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Server error deleting review' });
  }
};

