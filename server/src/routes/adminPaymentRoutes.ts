import express from 'express';
import {
  getPayments,
  getPaymentAnalytics,
  getPaymentById,
  retryPaymentFulfilment,
  getWebhookEvents,
  replayWebhookEvent,
  testWebhookPing,
  clearStaleWebhooks,
  getRefunds,
  createRefund,
  approveRefundRequest,
  rejectRefundRequest,
  getDisputes,
  getDisputeEvidence,
  submitDisputeEvidence,
  getSettlements,
  syncSettlements,
  getReconciliationRecords,
  runAutoReconciliation,
  resolveReconciliationManually,
  getFraudAndRiskList,
  updatePaymentRiskState,
  getGatewaySettings,
  updateGatewaySettings,
  getGatewayStatus,
  testGatewayConnection,
  createPaymentRetryAttempt,
  getPaymentMethodsAnalytics,
  exportPaymentReport
} from '../controllers/adminPaymentController';
import { cleanupDuplicateFailedPayments } from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Enforce admin authentication & authorization
router.use(authenticate, authorize('ADMIN'));

// Cleanup duplicate unverified failed attempts
router.post('/cleanup-duplicates', cleanupDuplicateFailedPayments);

// Analytics & Aggregate endpoints
router.get('/analytics', getPaymentAnalytics);
router.get('/methods/analytics', getPaymentMethodsAnalytics);
router.get('/export', exportPaymentReport);

// Gateway Status & Testing
router.get('/gateway/status', getGatewayStatus);
router.post('/gateway/test', testGatewayConnection);

// Webhook log, Replay, Test & Cleanup
router.get('/webhooks', getWebhookEvents);
router.post('/webhooks/test', testWebhookPing);
router.post('/webhooks/:id/replay', replayWebhookEvent);
router.delete('/webhooks/clear', clearStaleWebhooks);

// Refunds ledger & process
router.get('/refunds', getRefunds);
router.post('/refunds', createRefund);
router.post('/refunds/:id/approve', approveRefundRequest);
router.post('/refunds/:id/reject', rejectRefundRequest);

// Disputes & Evidence
router.get('/disputes', getDisputes);
router.get('/disputes/:id/evidence', getDisputeEvidence);
router.post('/disputes/:id/submit-evidence', submitDisputeEvidence);

// Settlements & Reconciliation
router.get('/settlements', getSettlements);
router.post('/settlements/sync', syncSettlements);
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
router.post('/:id/retry-attempt', createPaymentRetryAttempt);

export default router;

