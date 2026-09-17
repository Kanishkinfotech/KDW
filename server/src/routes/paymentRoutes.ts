import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  trackCheckout,
  recordClientPaymentFailure,
  getAbandonedCheckoutById,
  cleanupDuplicateFailedPayments
} from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Endpoint to restore an abandoned checkout session
router.get('/restore-checkout/:id', getAbandonedCheckoutById);

// Endpoint to track checkout visits and cart abandonment telemetry
router.post('/track-checkout', trackCheckout);

// Endpoint to create a new Razorpay order
router.post('/create-order', createOrder);

// Endpoint to verify payment
router.post('/verify-payment', verifyPayment);

// Endpoint to record client-side payment failure (declined, cancelled, aborted)
router.post('/fail-order', recordClientPaymentFailure);

// Endpoint to cleanup duplicate unverified failed payment records
router.post('/cleanup-duplicates', cleanupDuplicateFailedPayments);

// Server-authoritative webhook endpoint
router.post('/webhook', handleWebhook);

export default router;
