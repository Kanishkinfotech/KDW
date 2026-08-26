import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';

// Controllers
import { getSettingsDashboardHealth } from '../controllers/settings/settingsDashboardController';
import { getGeneralSettings, updateGeneralSettings } from '../controllers/settings/generalSettingsController';
import { getStoreSettings, updateStoreSettings } from '../controllers/settings/storeSettingsController';
import { getCurrencyTaxSettings, updateCurrencyTaxSettings } from '../controllers/settings/currencyTaxController';
import { getCheckoutSettings, updateCheckoutSettings } from '../controllers/settings/checkoutSettingsController';
import { getDownloadSettings, updateDownloadSettings } from '../controllers/settings/downloadSettingsController';
import { getEmailSettings, updateEmailSettings, sendTestEmail } from '../controllers/settings/emailSettingsController';
import { getSecuritySettings, updateSecuritySettings } from '../controllers/settings/securitySettingsController';
import { getPrivacySettings, updatePrivacySettings } from '../controllers/settings/privacySettingsController';
import {
  getLegalDocuments,
  getLegalDocumentBySlug,
  saveLegalDocumentDraft,
  publishLegalDocument,
  getPublicLegalDocument,
  recordPolicyAcceptance
} from '../controllers/settings/legalDocumentsController';
import {
  getSettingsAuditLogs,
  getSettingVersionHistory,
  rollbackSetting
} from '../controllers/settings/settingsAuditController';
import {
  testRazorpayIntegration,
  testWebhookSignature,
  testGoogleDriveIntegration
} from '../controllers/settings/integrationsTestController';

// Legacy public controller fallback
import { getPublicSettings } from '../controllers/settingsController';

const router = express.Router();
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER'];

// ==========================================
// 1. PUBLIC STOREFRONT ENDPOINTS
// ==========================================
router.get('/public', getPublicSettings);
router.get('/legal/:slug', getPublicLegalDocument);
router.post('/legal/accept', recordPolicyAcceptance);

// ==========================================
// 2. ADMIN SETTINGS WORKSPACE (PROTECTED)
// ==========================================

// Dashboard Health Overview
router.get('/admin/dashboard', authenticate, authorize(...ADMIN_ROLES), getSettingsDashboardHealth);

// General Settings
router.get('/admin/general', authenticate, authorize(...ADMIN_ROLES), getGeneralSettings);
router.patch('/admin/general', authenticate, authorize(...ADMIN_ROLES), updateGeneralSettings);

// Store Settings
router.get('/admin/store', authenticate, authorize(...ADMIN_ROLES), getStoreSettings);
router.patch('/admin/store', authenticate, authorize(...ADMIN_ROLES), updateStoreSettings);

// Currency and Tax
router.get('/admin/currency-tax', authenticate, authorize(...ADMIN_ROLES), getCurrencyTaxSettings);
router.patch('/admin/currency-tax', authenticate, authorize(...ADMIN_ROLES), updateCurrencyTaxSettings);

// Checkout Settings
router.get('/admin/checkout', authenticate, authorize(...ADMIN_ROLES), getCheckoutSettings);
router.patch('/admin/checkout', authenticate, authorize(...ADMIN_ROLES), updateCheckoutSettings);

// Download Settings
router.get('/admin/downloads', authenticate, authorize(...ADMIN_ROLES), getDownloadSettings);
router.patch('/admin/downloads', authenticate, authorize(...ADMIN_ROLES), updateDownloadSettings);

// Email Settings
router.get('/admin/email', authenticate, authorize(...ADMIN_ROLES), getEmailSettings);
router.patch('/admin/email', authenticate, authorize(...ADMIN_ROLES), updateEmailSettings);
router.post('/admin/email/test', authenticate, authorize(...ADMIN_ROLES), sendTestEmail);

// Security Settings
router.get('/admin/security', authenticate, authorize(...ADMIN_ROLES), getSecuritySettings);
router.patch('/admin/security', authenticate, authorize(...ADMIN_ROLES), updateSecuritySettings);

// Privacy Settings
router.get('/admin/privacy', authenticate, authorize(...ADMIN_ROLES), getPrivacySettings);
router.patch('/admin/privacy', authenticate, authorize(...ADMIN_ROLES), updatePrivacySettings);

// Legal Documents Management
router.get('/admin/legal-documents', authenticate, authorize(...ADMIN_ROLES), getLegalDocuments);
router.get('/admin/legal-documents/:slug', authenticate, authorize(...ADMIN_ROLES), getLegalDocumentBySlug);
router.post('/admin/legal-documents/:slug/draft', authenticate, authorize(...ADMIN_ROLES), saveLegalDocumentDraft);
router.post('/admin/legal-documents/:slug/publish', authenticate, authorize(...ADMIN_ROLES), publishLegalDocument);

// Settings Audit History & Rollback
router.get('/admin/audit', authenticate, authorize(...ADMIN_ROLES), getSettingsAuditLogs);
router.get('/admin/audit/versions/:key', authenticate, authorize(...ADMIN_ROLES), getSettingVersionHistory);
router.post('/admin/audit/rollback', authenticate, authorize(...ADMIN_ROLES), rollbackSetting);

// Integrations Verification Tests
router.post('/admin/test/razorpay', authenticate, authorize(...ADMIN_ROLES), testRazorpayIntegration);
router.post('/admin/test/webhook', authenticate, authorize(...ADMIN_ROLES), testWebhookSignature);
router.post('/admin/test/drive', authenticate, authorize(...ADMIN_ROLES), testGoogleDriveIntegration);

export default router;
