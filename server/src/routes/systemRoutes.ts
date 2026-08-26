import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';

// Controllers
import { getSystemDashboard, getSystemMetricsOverview } from '../controllers/system/systemDashboardController';
import { checkAllSystemHealth } from '../controllers/system/systemHealthService';
import {
  getSystemErrors,
  getSystemErrorById,
  acknowledgeSystemError,
  resolveSystemError,
  escalateErrorToIncident,
  getErrorTrends
} from '../controllers/system/systemErrorController';
import {
  getLoginLogs,
  getLoginSecurityAnalytics
} from '../controllers/system/systemLoginLogController';
import {
  getApiLogs,
  getWebhookLogs,
  replayWebhook
} from '../controllers/system/systemApiWebhookLogController';
import {
  getBackgroundJobs,
  getJobQueueMetrics,
  retryBackgroundJob,
  cancelBackgroundJob
} from '../controllers/system/systemJobController';
import {
  getBackups,
  createOnDemandBackup,
  verifyBackup,
  runRestoreSandboxTest,
  getRestoreTestHistory
} from '../controllers/system/systemBackupController';
import {
  getIncidents,
  createIncident,
  updateIncident
} from '../controllers/system/systemIncidentController';
import {
  getMonitoringAlerts,
  acknowledgeAlert,
  resolveAlert,
  getThresholdRules,
  updateThresholdRule
} from '../controllers/system/systemAlertController';
import { getSystemReportsMaster } from '../controllers/system/systemReportsController';

const router = express.Router();
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER'];

// Dashboard & Health
router.get('/dashboard', authenticate, authorize(...ADMIN_ROLES), getSystemDashboard);
router.get('/metrics', authenticate, authorize(...ADMIN_ROLES), getSystemMetricsOverview);
router.get('/health', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const health = await checkAllSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
});

// Errors Management
router.get('/errors/trends', authenticate, authorize(...ADMIN_ROLES), getErrorTrends);
router.get('/errors', authenticate, authorize(...ADMIN_ROLES), getSystemErrors);
router.get('/errors/:id', authenticate, authorize(...ADMIN_ROLES), getSystemErrorById);
router.post('/errors/:id/acknowledge', authenticate, authorize(...ADMIN_ROLES), acknowledgeSystemError);
router.post('/errors/:id/resolve', authenticate, authorize(...ADMIN_ROLES), resolveSystemError);
router.post('/errors/:id/escalate', authenticate, authorize(...ADMIN_ROLES), escalateErrorToIncident);

// Login Logs & Security
router.get('/logins/analytics', authenticate, authorize(...ADMIN_ROLES), getLoginSecurityAnalytics);
router.get('/logins', authenticate, authorize(...ADMIN_ROLES), getLoginLogs);

// API & Webhook Logs
router.get('/api-logs', authenticate, authorize(...ADMIN_ROLES), getApiLogs);
router.get('/webhook-logs', authenticate, authorize(...ADMIN_ROLES), getWebhookLogs);
router.post('/webhook-logs/:id/replay', authenticate, authorize(...ADMIN_ROLES), replayWebhook);

// Background Jobs
router.get('/jobs/metrics', authenticate, authorize(...ADMIN_ROLES), getJobQueueMetrics);
router.get('/jobs', authenticate, authorize(...ADMIN_ROLES), getBackgroundJobs);
router.post('/jobs/:id/retry', authenticate, authorize(...ADMIN_ROLES), retryBackgroundJob);
router.post('/jobs/:id/cancel', authenticate, authorize(...ADMIN_ROLES), cancelBackgroundJob);

// Backups & Restore Tests
router.get('/backups', authenticate, authorize(...ADMIN_ROLES), getBackups);
router.post('/backups', authenticate, authorize(...ADMIN_ROLES), createOnDemandBackup);
router.post('/backups/:id/verify', authenticate, authorize(...ADMIN_ROLES), verifyBackup);
router.post('/backups/:id/restore-test', authenticate, authorize(...ADMIN_ROLES), runRestoreSandboxTest);
router.get('/restore-tests', authenticate, authorize(...ADMIN_ROLES), getRestoreTestHistory);

// Incidents
router.get('/incidents', authenticate, authorize(...ADMIN_ROLES), getIncidents);
router.post('/incidents', authenticate, authorize(...ADMIN_ROLES), createIncident);
router.patch('/incidents/:id', authenticate, authorize(...ADMIN_ROLES), updateIncident);

// Monitoring Alerts & Thresholds
router.get('/alerts', authenticate, authorize(...ADMIN_ROLES), getMonitoringAlerts);
router.post('/alerts/:id/acknowledge', authenticate, authorize(...ADMIN_ROLES), acknowledgeAlert);
router.post('/alerts/:id/resolve', authenticate, authorize(...ADMIN_ROLES), resolveAlert);
router.get('/thresholds', authenticate, authorize(...ADMIN_ROLES), getThresholdRules);
router.patch('/thresholds/:id', authenticate, authorize(...ADMIN_ROLES), updateThresholdRule);

// Reports
router.get('/reports', authenticate, authorize(...ADMIN_ROLES), getSystemReportsMaster);

export default router;
