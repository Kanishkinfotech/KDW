import { Router } from 'express';
import { validateCoupon, getPublicCoupons } from '../controllers/couponController';

const router = Router();

router.get('/', getPublicCoupons);
router.post('/validate', validateCoupon);

export default router;
