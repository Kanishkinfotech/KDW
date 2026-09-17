import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getWebhookEndpoints,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  testWebhookDelivery,
  deleteWebhookEndpoint,
  getWebhookLogs
} from '../controllers/automation/adminWebhooksController';

const router = Router();

// Apply auth and staff/admin role checks
router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'DEVELOPER_OPS'));

router.get('/endpoints', getWebhookEndpoints);
router.post('/endpoints', createWebhookEndpoint);
router.patch('/endpoints/:id', updateWebhookEndpoint);
router.post('/endpoints/:id/test', testWebhookDelivery);
router.delete('/endpoints/:id', deleteWebhookEndpoint);
router.get('/logs', getWebhookLogs);

export default router;
