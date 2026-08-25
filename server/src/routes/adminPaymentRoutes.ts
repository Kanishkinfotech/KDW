import express from 'express';
import {
  getPayments,
  getPaymentAnalytics,
  getPaymentById,
  retryPaymentFulfilment,
  getWebhookEvents,
  replayWebhookEvent,
  getRefunds,
  createRefund,
  getDisputes,
  getDisputeEvidence,
  submitDisputeEvidence,
  getSettlements,
  getReconciliationRecords,
  runAutoReconciliation,
  resolveReconciliationManually,
  getFraudAndRiskList,
  updatePaymentRiskState,
  getGatewaySettings,
  updateGatewaySettings,
  exportPaymentReport
} from '../controllers/adminPaymentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Enforce admin authentication & authorization
router.use(authenticate, authorize('ADMIN'));

// Analytics & Aggregate endpoints
router.get('/analytics', getPaymentAnalytics);
router.get('/export', exportPaymentReport);

// Webhook log & Replay
router.get('/webhooks', getWebhookEvents);
router.post('/webhooks/:id/replay', replayWebhookEvent);

// Refunds ledger & process
router.get('/refunds', getRefunds);
router.post('/refunds', createRefund);

// Disputes & Evidence
router.get('/disputes', getDisputes);
router.get('/disputes/:id/evidence', getDisputeEvidence);
router.post('/disputes/:id/submit-evidence', submitDisputeEvidence);

// Settlements & Reconciliation
router.get('/settlements', getSettlements);
router.get('/reconciliation', getReconciliationRecords);
router.post('/reconciliation/auto', runAutoReconciliation);
router.post('/reconciliation/:id/resolve', resolveReconciliationManually);

// Fraud & Risk
router.get('/fraud-risk', getFraudAndRiskList);
router.post('/fraud-risk/:id/state', updatePaymentRiskState);

// Gateway Settings
router.get('/settings', getGatewaySettings);
router.put('/settings', updateGatewaySettings);

// Transactions / Payment Profiles
router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.post('/:id/retry-fulfilment', retryPaymentFulfilment);

export default router;
