import express from 'express';
import {
  getAdminCustomers,
  getCustomerAnalytics,
  getAdminCustomerById,
  updateCustomer,
  blockCustomer,
  unblockCustomer,
  verifyCustomer,
  resendCustomerVerification,
  addCustomerTag,
  removeCustomerTag,
  updateCustomerConsent,
  addCustomerNote,
  deleteCustomerNote,
  exportCustomers,
  detectDuplicateCustomers,
  executeCustomerMerge,
  getDataRequests,
  processDataRequest,
  getAbandonedCheckouts,
  recoverAbandonedCheckout,
  deleteAbandonedCheckout,
  getCustomerActivityStream,
  searchCustomers
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Enforce admin authentication & authorization
router.use(authenticate, authorize('ADMIN'));

// Analytics, Exports, Duplicates, GDPR, Abandoned Checkouts, & Activity (Registered before dynamic :id)
router.get('/analytics', getCustomerAnalytics);
router.get('/export', exportCustomers);
router.get('/duplicates', detectDuplicateCustomers);
router.post('/merge', executeCustomerMerge);
router.get('/data-requests', getDataRequests);
router.post('/data-requests/:id/process', processDataRequest);
router.get('/abandoned-checkouts', getAbandonedCheckouts);
router.post('/abandoned-checkouts/:id/recover', recoverAbandonedCheckout);
router.delete('/abandoned-checkouts/:id', deleteAbandonedCheckout);
router.get('/activity', getCustomerActivityStream);
router.get('/search', searchCustomers);

// Customer Listing & Deep Profile
router.get('/', getAdminCustomers);
router.get('/:id', getAdminCustomerById);
router.put('/:id', updateCustomer);

// Operational Mutations
router.post('/:id/block', blockCustomer);
router.post('/:id/unblock', unblockCustomer);
router.post('/:id/verify', verifyCustomer);
router.post('/:id/resend-verification', resendCustomerVerification);
router.post('/:id/tags', addCustomerTag);
router.delete('/:id/tags/:tagId', removeCustomerTag);
router.post('/:id/consents', updateCustomerConsent);
router.post('/:id/notes', addCustomerNote);
router.delete('/:id/notes/:noteId', deleteCustomerNote);

export default router;
