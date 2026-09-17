import { Router } from 'express';
import {
  getAdminReviews,
  getAdminReviewById,
  updateReviewModeration,
  replyToReview,
  getReviewReports,
  resolveReviewReport,
  getProductVersionAnalytics,
  checkReviewEligibility,
  createPublicReview,
  getPublicProductReviews,
  createReviewReport,
  voteReview,
  deleteAdminReview
} from '../controllers/reviewController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Public / Customer Routes
router.get('/eligibility/:productId', optionalAuthenticate, checkReviewEligibility);
router.get('/product/:productId', getPublicProductReviews);
router.post('/', optionalAuthenticate, createPublicReview);
router.post('/:id/report', optionalAuthenticate, createReviewReport);
router.post('/:id/vote', voteReview);

// Admin Routes
router.use('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'STAFF', 'STORE_MANAGER'));
router.get('/admin', getAdminReviews);
router.get('/admin/reports', getReviewReports);
router.post('/admin/reports/:id/resolve', resolveReviewReport);
router.get('/admin/version-analytics/:productId', getProductVersionAnalytics);
router.get('/admin/:id', getAdminReviewById);
router.post('/admin/:id/moderation', updateReviewModeration);
router.patch('/admin/:id/moderation', updateReviewModeration);
router.post('/admin/:id/reply', replyToReview);
router.delete('/admin/:id', deleteAdminReview);

export default router;

