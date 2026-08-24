// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';

// Public endpoint to create review
export const getPublicReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { sort, verified, withImages, withVideos, rating } = req.query;
    
    let rawReviews = await prisma.review.findMany({
      where: {
        productId,
        status: 'APPROVED'
      },
      orderBy: { createdAt: 'desc' }
    });

    let reviews = rawReviews.map(r => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : [],
      videos: r.videos ? JSON.parse(r.videos) : []
    }));

    if (withImages === 'true') {
      reviews = reviews.filter(r => r.images && r.images.length > 0);
    }
    if (withVideos === 'true') {
      reviews = reviews.filter(r => r.videos && r.videos.length > 0);
    }
    
    // Calculate actual stats
    const histogram = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    
    rawReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        histogram[r.rating] = (histogram[r.rating] || 0) + 1;
        totalRating += r.rating;
      }
    });

    const averageRating = rawReviews.length > 0 ? (totalRating / rawReviews.length) : 0;

    const stats = {
      averageRating,
      total: rawReviews.length,
      histogram,
      verifiedPercentage: 100,
      recommendPercentage: 100
    };
    
    res.json({
      success: true,
      data: {
        reviews,
        summary: stats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, customerName, rating, title, comment, images, videos } = req.body;
    const review = await prisma.review.create({
      data: {
        productId,
        customerName,
        rating: Number(rating),
        title,
        comment,
        status: 'APPROVED',
        images: images ? JSON.stringify(images) : null,
        videos: videos ? JSON.stringify(videos) : null
      }
    });
    
    try {
      await prisma.notification.create({
        data: {
          title: `New Product Review (${rating} ⭐)`,
          message: `${customerName} posted a ${rating}-star review: "${title}"`,
          type: 'Review',
          link: '/admin/reviews'
        }
      });
    } catch (e) {
      // Ignore notification creation error silently
    }

    const message = 'Review submitted and approved.';
      
    res.status(201).json({ success: true, data: review, message });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
export const getAdminReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: {
          select: { id: true, name: true, thumbnail: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Map to expected frontend structure
    const mappedReviews = reviews.map(r => ({
      _id: r.id,
      product: r.product ? { _id: r.product.id, name: r.product.name, coverImage: r.product.thumbnail } : null,
      customerName: r.customerName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: r.images ? JSON.parse(r.images) : [],
      videos: r.videos ? JSON.parse(r.videos) : [],
      status: r.status.toLowerCase(),
      createdAt: r.createdAt
    }));
    
    res.json({ success: true, data: mappedReviews });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const review = await prisma.review.update({
      where: { id },
      data: { status: status.toUpperCase() }
    });
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
