import { Router } from 'express';
import { createOrder, verifyPayment, handleWebhook } from '../controllers/paymentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Endpoint to create a new Razorpay order
router.post('/create-order', createOrder);

// Endpoint to verify payment
router.post('/verify-payment', verifyPayment);

// Server-authoritative webhook endpoint
router.post('/webhook', handleWebhook);

export default router;
