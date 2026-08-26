import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getDownloadOverview,
  getAdminEntitlements,
  getEntitlementDetails,
  resendEntitlementEmail,
  generateEntitlementToken,
  extendEntitlementExpiry,
  resetEntitlementDownloadCount,
  revokeEntitlementAccess,
  restoreEntitlementAccess,
  assignNewProductVersion,
  createEntitlementSupportTicket,
  getAdminTokens,
  revokeToken,
  replaceToken,
  getDownloadActivity,
  getFailedDownloadsQueue,
  resolveDownloadFailure,
  retryDownloadFailure,
  getExpiredAccess,
  getRevokedAccess,
  getProductFilesHealth,
  testProductFileDriveHealth,
  repairProductFileMapping,
  getDownloadOverrides
} from '../controllers/adminDownloadManagementController';

const router = Router();

// Protect all download management admin routes
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'STAFF', 'EDITOR'));

// 1. Overview
router.get('/overview', getDownloadOverview);

// 2. Entitlements
router.get('/entitlements', getAdminEntitlements);
router.get('/entitlements/:id', getEntitlementDetails);
router.post('/entitlements/:id/resend-email', resendEntitlementEmail);
router.post('/entitlements/:id/generate-token', generateEntitlementToken);
router.post('/entitlements/:id/extend-expiry', extendEntitlementExpiry);
router.post('/entitlements/:id/reset-count', resetEntitlementDownloadCount);
router.post('/entitlements/:id/revoke', revokeEntitlementAccess);
router.post('/entitlements/:id/restore', restoreEntitlementAccess);
router.post('/entitlements/:id/assign-version', assignNewProductVersion);
router.post('/entitlements/:id/create-ticket', createEntitlementSupportTicket);

// 3. Tokens
router.get('/tokens', getAdminTokens);
router.post('/tokens/:id/revoke', revokeToken);
router.post('/tokens/:id/replace', replaceToken);

// 4. Download Activity Logs
router.get('/activity', getDownloadActivity);

// 5. Failed Downloads Operational Queue
router.get('/failed-downloads', getFailedDownloadsQueue);
router.post('/failed-downloads/:id/resolve', resolveDownloadFailure);
router.post('/failed-downloads/:id/retry', retryDownloadFailure);

// 6. Expired & Revoked Access
router.get('/expired-access', getExpiredAccess);
router.get('/revoked-access', getRevokedAccess);

// 7. Product Files / Google Drive Health
router.get('/product-files', getProductFilesHealth);
router.post('/product-files/:id/test', testProductFileDriveHealth);
router.post('/product-files/:id/repair', repairProductFileMapping);

// 8. Overrides Audit Log
router.get('/overrides', getDownloadOverrides);

export default router;
