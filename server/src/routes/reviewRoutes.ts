import { Router } from 'express';
import {
  getAdminReviews,
  getAdminReviewById,
  updateReviewModeration,
  replyToReview,
  getReviewReports,
  resolveReviewReport,
  getProductVersionAnalytics,
  createPublicReview,
  getPublicProductReviews
} from '../controllers/reviewController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/product/:productId', getPublicProductReviews);
router.post('/', createPublicReview);

// Admin Routes
router.use('/admin', authenticate, authorize('ADMIN'));
router.get('/admin', getAdminReviews);
router.get('/admin/reports', getReviewReports);
router.post('/admin/reports/:id/resolve', resolveReviewReport);
router.get('/admin/version-analytics/:productId', getProductVersionAnalytics);
router.get('/admin/:id', getAdminReviewById);
router.post('/admin/:id/moderation', updateReviewModeration);
router.patch('/admin/:id/moderation', updateReviewModeration);
router.post('/admin/:id/reply', replyToReview);

export default router;
