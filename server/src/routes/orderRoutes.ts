import express from 'express';
import {
  getAdminOrders,
  getOrderAnalytics,
  getAdminOrderById,
  retryOrderFulfilment,
  resendOrderAccess,
  extendOrderAccess,
  resetOrderDownloads,
  revokeOrderAccess,
  processOrderRefund,
  addOrderNote,
  exportOrders
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Apply admin authentication and authorization
router.use(authenticate, authorize('ADMIN'));

// Order Analytics & Export
router.get('/analytics', getOrderAnalytics);
router.get('/export', exportOrders);

// Orders List & Details
router.get('/', getAdminOrders);
router.get('/:id', getAdminOrderById);

// Operational Actions
router.post('/:id/retry-fulfilment', retryOrderFulfilment);
router.post('/:id/resend-access', resendOrderAccess);
router.post('/:id/resend-email', resendOrderAccess); // Compatibility
router.post('/:id/extend-access', extendOrderAccess);
router.post('/:id/reset-downloads', resetOrderDownloads);
router.post('/:id/revoke-access', revokeOrderAccess);
router.post('/:id/refund', processOrderRefund);
router.post('/:id/notes', addOrderNote);

export default router;
