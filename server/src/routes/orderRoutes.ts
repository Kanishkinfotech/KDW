import express from 'express';
import {
  getAdminOrders,
  getOrderAnalytics,
  getAdminOrderById,
  getMyOrders,
  getPublicOrderById,
  retryOrderFulfilment,
  resendOrderAccess,
  extendOrderAccess,
  resetOrderDownloads,
  revokeOrderAccess,
  processOrderRefund,
  addOrderNote,
  exportOrders,
  batchFulfilOrders,
  triggerReconcileStaleOrders
} from '../controllers/orderController';
import { createOrder } from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Public / Customer Storefront Routes
router.post('/checkout', createOrder);
router.get('/status/:id', getPublicOrderById);
router.get('/public/:id', getPublicOrderById);
router.get('/lookup', getPublicOrderById);
router.get('/my-orders', authenticate, getMyOrders);

// Admin Protected Routes
router.use(authenticate, authorize('ADMIN'));

// Order Analytics, Export & Batch Actions (Registered before dynamic :id)
router.get('/analytics', getOrderAnalytics);
router.get('/export', exportOrders);
router.post('/batch-fulfil', batchFulfilOrders);
router.post('/reconcile-stale', triggerReconcileStaleOrders);

// Orders List & Single Order Drilldown
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
