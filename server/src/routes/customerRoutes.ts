import express from 'express';
import {
  getAdminCustomers,
  getCustomerAnalytics,
  getAdminCustomerById,
  updateCustomer,
  blockCustomer,
  unblockCustomer,
  addCustomerTag,
  removeCustomerTag,
  updateCustomerConsent,
  addCustomerNote,
  exportCustomers,
  detectDuplicateCustomers,
  executeCustomerMerge,
  getDataRequests,
  processDataRequest,
  getAbandonedCheckouts,
  getCustomerActivityStream
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Enforce admin authentication & authorization
router.use(authenticate, authorize('ADMIN'));

// Analytics & Aggregate views
router.get('/analytics', getCustomerAnalytics);
router.get('/export', exportCustomers);
router.get('/duplicates', detectDuplicateCustomers);
router.post('/merge', executeCustomerMerge);
router.get('/data-requests', getDataRequests);
router.post('/data-requests/:id/process', processDataRequest);
router.get('/abandoned-checkouts', getAbandonedCheckouts);
router.get('/activity', getCustomerActivityStream);

// Customer Listing & Deep Profile
router.get('/', getAdminCustomers);
router.get('/:id', getAdminCustomerById);
router.put('/:id', updateCustomer);

// Operational Mutations
router.post('/:id/block', blockCustomer);
router.post('/:id/unblock', unblockCustomer);
router.post('/:id/tags', addCustomerTag);
router.delete('/:id/tags/:tagId', removeCustomerTag);
router.post('/:id/consents', updateCustomerConsent);
router.post('/:id/notes', addCustomerNote);

export default router;
