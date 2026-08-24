import { Router } from 'express';
import { checkOwnership, generateDownloadToken, downloadProduct, getPurchases, getInvoices, downloadInvoice, resendDeliveryEmail } from '../controllers/purchaseController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getPurchases);
router.get('/invoices', authenticate, getInvoices);
router.get('/invoices/:orderId/download', authenticate, downloadInvoice);
router.post('/resend-email/:orderId', authenticate, resendDeliveryEmail);
router.post('/check-ownership', authenticate, checkOwnership);
router.get('/:productId/download-token', authenticate, generateDownloadToken);
router.get('/download/:token', downloadProduct);

export default router;
