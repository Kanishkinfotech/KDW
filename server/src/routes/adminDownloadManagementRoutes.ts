import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
  getDownloadOverrides,
  getFilesList,
  uploadDigitalFile,
  updateFilePermissions,
  generateSecureTokenLink,
  deleteDigitalFile
} from '../controllers/adminDownloadManagementController';

const router = Router();

// Multer storage for digital asset uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.cwd(), 'uploads', 'digital_assets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

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

// 9. File Storage & Uploads (Pillar 1, 2, 4, 5, 6)
router.get('/files', getFilesList);
router.post('/files/upload', upload.single('file'), uploadDigitalFile);
router.patch('/files/:id/permissions', updateFilePermissions);
router.post('/files/:id/token', generateSecureTokenLink);
router.delete('/files/:id', deleteDigitalFile);

export default router;
