import { Router } from 'express';
import {
  checkOwnership,
  generateDownloadToken,
  downloadProduct,
  getPurchases,
  getInvoices,
  downloadInvoice,
  resendDeliveryEmail,
  getCustomerRefunds,
  submitCustomerRefundRequest
} from '../controllers/purchaseController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getPurchases);
router.get('/refunds', authenticate, getCustomerRefunds);
router.post('/refund-request', authenticate, submitCustomerRefundRequest);
router.get('/invoices', authenticate, getInvoices);
router.get('/invoices/:orderId/download', authenticate, downloadInvoice);
router.post('/resend-email/:orderId', authenticate, resendDeliveryEmail);
router.post('/check-ownership', authenticate, checkOwnership);
router.get('/:productId/download-token', authenticate, generateDownloadToken);
router.get('/download/:token', downloadProduct);

export default router;
