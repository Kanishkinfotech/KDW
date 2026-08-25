import express from 'express';
import {
  claimGuestOrders,
  updateAccountConsent,
  createDataRequest
} from '../controllers/accountCustomerController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/claim-guest-orders', claimGuestOrders);
router.post('/consents', updateAccountConsent);
router.post('/data-request', createDataRequest);

export default router;
