import { Router } from 'express';
import { createReview, getPublicReviews, getAdminReviews, updateReviewStatus, deleteReview } from '../controllers/reviewController';

const router = Router();

// Public route to submit a review
router.post('/', createReview);
router.get('/:productId', getPublicReviews);
router.get('/product/:productId', getPublicReviews);

// Admin routes for moderation (mounted under /api/admin/reviews usually)
router.get('/admin', getAdminReviews);
router.put('/admin/:id/status', updateReviewStatus);
router.delete('/admin/:id', deleteReview);

export default router;
