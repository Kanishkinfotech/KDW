import { Router } from 'express';
import {
  getAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  updateCouponStatus,
  getCouponRedemptions,
  getCouponAbuseLogs,
  validateCheckoutCoupon
} from '../controllers/couponController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public / Checkout Validation
router.post('/validate', validateCheckoutCoupon);

// Admin Routes
router.use('/admin', authenticate, authorize('ADMIN'));
router.get('/admin', getAdminCoupons);
router.post('/admin', createAdminCoupon);
router.get('/admin/abuse', getCouponAbuseLogs);
router.get('/admin/:id', getAdminCouponById);
router.put('/admin/:id', updateAdminCoupon);
router.patch('/admin/:id/status', updateCouponStatus);
router.post('/admin/:id/status', updateCouponStatus);
router.get('/admin/:id/redemptions', getCouponRedemptions);

export default router;
