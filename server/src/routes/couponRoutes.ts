import { Router } from 'express';
import {
  getAdminCoupons,
  getAdminCouponById,
  createAdminCoupon,
  updateAdminCoupon,
  updateCouponStatus,
  getCouponRedemptions,
  getCouponAbuseLogs,
  validateCheckoutCoupon,
  getCustomerCoupons
} from '../controllers/couponController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Customer / Public Routes (with optional customer authentication)
router.get('/', optionalAuthenticate, getCustomerCoupons);
router.get('/my-coupons', optionalAuthenticate, getCustomerCoupons);
router.post('/validate', optionalAuthenticate, validateCheckoutCoupon);

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
