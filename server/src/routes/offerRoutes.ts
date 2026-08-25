import { Router } from 'express';
import {
  getAdminOffers,
  getAdminOfferById,
  createAdminOffer,
  updateAdminOffer,
  updateOfferStatus,
  checkOfferConflicts,
  getActiveStorefrontOffers
} from '../controllers/offerController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public / Storefront Active Promotions
router.get('/active', getActiveStorefrontOffers);

// Admin Routes
router.use('/admin', authenticate, authorize('ADMIN'));
router.get('/admin', getAdminOffers);
router.post('/admin', createAdminOffer);
router.post('/admin/conflicts', checkOfferConflicts);
router.get('/admin/:id', getAdminOfferById);
router.put('/admin/:id', updateAdminOffer);
router.patch('/admin/:id/status', updateOfferStatus);
router.post('/admin/:id/status', updateOfferStatus);

export default router;
