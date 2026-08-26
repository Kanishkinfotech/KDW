import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getAutomationDashboard } from '../controllers/automation/automationDashboardController';
import {
  getAutomationRules,
  getAutomationRuleById,
  createAutomationRule,
  updateAutomationRule,
  testAutomationRule,
  activateAutomationRule,
  pauseAutomationRule,
  deleteAutomationRule
} from '../controllers/automation/automationRuleController';
import {
  getAutomationRuns,
  getAutomationRunById,
  replayAutomationRun,
  cancelAutomationRun
} from '../controllers/automation/automationRunController';
import {
  getDeadLetterJobs,
  getDeadLetterSafetyReport,
  replayDeadLetterJob,
  cancelDeadLetterJob
} from '../controllers/automation/automationDeadLetterController';
import {
  getWebhookEndpoints,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  testWebhookDelivery,
  deleteWebhookEndpoint
} from '../controllers/automation/automationWebhookController';
import {
  getSchedules,
  createSchedule,
  toggleScheduleStatus,
  deleteSchedule
} from '../controllers/automation/automationScheduleController';
import {
  getAutomationSettings,
  updateAutomationSettings
} from '../controllers/automation/automationSettingsController';

const router = Router();

// Apply auth and staff/admin role checks
router.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'DEVELOPER_OPS', 'SUPPORT_AGENT', 'FINANCE_MANAGER'));

// 1. Dashboard
router.get('/dashboard', getAutomationDashboard);

// 2. Rules / Workflows
router.get('/rules', getAutomationRules);
router.post('/rules', createAutomationRule);
router.get('/rules/:id', getAutomationRuleById);
router.patch('/rules/:id', updateAutomationRule);
router.post('/rules/:id/test', testAutomationRule);
router.post('/rules/:id/activate', activateAutomationRule);
router.post('/rules/:id/pause', pauseAutomationRule);
router.delete('/rules/:id', deleteAutomationRule);

// 3. Runs
router.get('/runs', getAutomationRuns);
router.get('/runs/:id', getAutomationRunById);
router.post('/runs/:id/replay', replayAutomationRun);
router.post('/runs/:id/cancel', cancelAutomationRun);

// 4. Dead-Letter Queue
router.get('/dead-letter', getDeadLetterJobs);
router.get('/dead-letter/:id/safety-report', getDeadLetterSafetyReport);
router.post('/dead-letter/:id/replay', replayDeadLetterJob);
router.post('/dead-letter/:id/cancel', cancelDeadLetterJob);

// 5. Webhooks
router.get('/webhooks/endpoints', getWebhookEndpoints);
router.post('/webhooks/endpoints', createWebhookEndpoint);
router.patch('/webhooks/endpoints/:id', updateWebhookEndpoint);
router.post('/webhooks/endpoints/:id/test', testWebhookDelivery);
router.delete('/webhooks/endpoints/:id', deleteWebhookEndpoint);

// 6. Schedules
router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.post('/schedules/:id/toggle', toggleScheduleStatus);
router.delete('/schedules/:id', deleteSchedule);

// 7. Settings
router.get('/settings', getAutomationSettings);
router.patch('/settings', updateAutomationSettings);

export default router;
