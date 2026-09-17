import { Router } from 'express';
import {
  getAdminOffers,
  getAdminOfferById,
  createAdminOffer,
  updateAdminOffer,
  updateOfferStatus,
  deleteAdminOffer,
  checkOfferConflicts,
  getActiveStorefrontOffers,
  evaluateCartOffers,
  trackOfferInteraction,
  exportOffersCSV
} from '../controllers/offerController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// 1. Public Storefront Endpoints
router.get('/active', optionalAuthenticate, getActiveStorefrontOffers);
router.post('/evaluate-cart', evaluateCartOffers);
router.post('/track', trackOfferInteraction);

// 2. Admin Operational Endpoints (Static routes strictly before /:id)
router.get('/admin/export', authenticate, authorize('ADMIN'), exportOffersCSV);
router.get('/admin/conflicts', authenticate, authorize('ADMIN'), checkOfferConflicts);
router.post('/admin/conflicts', authenticate, authorize('ADMIN'), checkOfferConflicts);

// 3. Admin CRUD Endpoints
router.get('/admin', authenticate, authorize('ADMIN'), getAdminOffers);
router.post('/admin', authenticate, authorize('ADMIN'), createAdminOffer);
router.get('/admin/:id', authenticate, authorize('ADMIN'), getAdminOfferById);
router.put('/admin/:id', authenticate, authorize('ADMIN'), updateAdminOffer);
router.patch('/admin/:id/status', authenticate, authorize('ADMIN'), updateOfferStatus);
router.post('/admin/:id/status', authenticate, authorize('ADMIN'), updateOfferStatus);
router.delete('/admin/:id', authenticate, authorize('ADMIN'), deleteAdminOffer);

export default router;
