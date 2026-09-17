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
import { getWhatsAppSettings, updateWhatsAppSettings, sendTestWhatsAppMessage } from '../controllers/settings/whatsappSettingsController';
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
  testGoogleDriveIntegration,
  testWhatsAppIntegration,
  testEmailIntegration
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
router.get(['/dashboard', '/admin/dashboard'], authenticate, authorize(...ADMIN_ROLES), getSettingsDashboardHealth);

// General Settings
router.get(['/general', '/admin/general'], authenticate, authorize(...ADMIN_ROLES), getGeneralSettings);
router.patch(['/general', '/admin/general'], authenticate, authorize(...ADMIN_ROLES), updateGeneralSettings);

// Store Settings
router.get(['/store', '/admin/store'], authenticate, authorize(...ADMIN_ROLES), getStoreSettings);
router.patch(['/store', '/admin/store'], authenticate, authorize(...ADMIN_ROLES), updateStoreSettings);

// Currency and Tax
router.get(['/currency-tax', '/admin/currency-tax'], authenticate, authorize(...ADMIN_ROLES), getCurrencyTaxSettings);
router.patch(['/currency-tax', '/admin/currency-tax'], authenticate, authorize(...ADMIN_ROLES), updateCurrencyTaxSettings);

// Checkout Settings
router.get(['/checkout', '/admin/checkout'], authenticate, authorize(...ADMIN_ROLES), getCheckoutSettings);
router.patch(['/checkout', '/admin/checkout'], authenticate, authorize(...ADMIN_ROLES), updateCheckoutSettings);

// Download Settings
router.get(['/downloads', '/admin/downloads'], authenticate, authorize(...ADMIN_ROLES), getDownloadSettings);
router.patch(['/downloads', '/admin/downloads'], authenticate, authorize(...ADMIN_ROLES), updateDownloadSettings);

// Email Settings
router.get(['/email', '/admin/email'], authenticate, authorize(...ADMIN_ROLES), getEmailSettings);
router.patch(['/email', '/admin/email'], authenticate, authorize(...ADMIN_ROLES), updateEmailSettings);
router.post(['/email/test', '/admin/email/test'], authenticate, authorize(...ADMIN_ROLES), sendTestEmail);

// WhatsApp Settings
router.get(['/whatsapp', '/admin/whatsapp'], authenticate, authorize(...ADMIN_ROLES), getWhatsAppSettings);
router.patch(['/whatsapp', '/admin/whatsapp'], authenticate, authorize(...ADMIN_ROLES), updateWhatsAppSettings);
router.post(['/whatsapp/test', '/admin/whatsapp/test'], authenticate, authorize(...ADMIN_ROLES), sendTestWhatsAppMessage);

// Security Settings
router.get(['/security', '/admin/security'], authenticate, authorize(...ADMIN_ROLES), getSecuritySettings);
router.patch(['/security', '/admin/security'], authenticate, authorize(...ADMIN_ROLES), updateSecuritySettings);

// Privacy Settings
router.get(['/privacy', '/admin/privacy'], authenticate, authorize(...ADMIN_ROLES), getPrivacySettings);
router.patch(['/privacy', '/admin/privacy'], authenticate, authorize(...ADMIN_ROLES), updatePrivacySettings);

// Legal Documents Management
router.get(['/legal-documents', '/admin/legal-documents'], authenticate, authorize(...ADMIN_ROLES), getLegalDocuments);
router.get(['/legal-documents/:slug', '/admin/legal-documents/:slug'], authenticate, authorize(...ADMIN_ROLES), getLegalDocumentBySlug);
router.post(['/legal-documents/:slug/draft', '/admin/legal-documents/:slug/draft'], authenticate, authorize(...ADMIN_ROLES), saveLegalDocumentDraft);
router.post(['/legal-documents/:slug/publish', '/admin/legal-documents/:slug/publish'], authenticate, authorize(...ADMIN_ROLES), publishLegalDocument);

// Settings Audit History & Rollback
router.get(['/audit', '/admin/audit'], authenticate, authorize(...ADMIN_ROLES), getSettingsAuditLogs);
router.get(['/audit/versions/:key', '/admin/audit/versions/:key'], authenticate, authorize(...ADMIN_ROLES), getSettingVersionHistory);
router.post(['/audit/rollback', '/admin/audit/rollback'], authenticate, authorize(...ADMIN_ROLES), rollbackSetting);

// Integrations Verification Tests
router.post(['/test/razorpay', '/admin/test/razorpay'], authenticate, authorize(...ADMIN_ROLES), testRazorpayIntegration);
router.post(['/test/webhook', '/admin/test/webhook'], authenticate, authorize(...ADMIN_ROLES), testWebhookSignature);
router.post(['/test/drive', '/admin/test/drive'], authenticate, authorize(...ADMIN_ROLES), testGoogleDriveIntegration);
router.post(['/test/whatsapp', '/admin/test/whatsapp'], authenticate, authorize(...ADMIN_ROLES), testWhatsAppIntegration);
router.post(['/test/email', '/admin/test/email'], authenticate, authorize(...ADMIN_ROLES), testEmailIntegration);

export default router;
