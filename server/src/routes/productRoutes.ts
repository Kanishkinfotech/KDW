import { Router } from 'express';
import { 
  getProducts, searchProducts, getProductById, getRelatedProducts, createProduct, updateProduct, deleteProduct,
  publishProduct, scheduleProduct, pauseProduct, archiveProduct, restoreProduct,
  duplicateProduct, getProductHealth, getTags, createTag, deleteTag,
  getAttributes, createAttribute, deleteAttribute,
  getLicenceTypes, createLicenceType, deleteLicenceType,
  getProductVersions, createProductVersion, getProductFiles,
  validateDriveLink, previewPurchaseEmail, sendTestPurchaseEmail,
  bulkProductAction, submitProductForReview, approveProduct, rejectProduct,
  getProductOrders, getProductDownloads, getProductLicences, getProductAnalytics, getProductAuditLogs
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Drive & Email endpoints
router.post('/drive/validate', validateDriveLink);
router.post('/email/preview', previewPurchaseEmail);
router.post('/email/test', sendTestPurchaseEmail);

// Public static discovery routes (Registered before dynamic :id)
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/tags', getTags);
router.get('/attributes', getAttributes);
router.get('/licences', getLicenceTypes);
router.get('/versions', getProductVersions);
router.get('/files', getProductFiles);

// Admin-protected static management & bulk routes (Registered before dynamic :id)
router.post('/bulk-action', authenticate, authorize('ADMIN'), bulkProductAction);
router.post('/bulk', authenticate, authorize('ADMIN'), bulkProductAction);
router.post('/', authenticate, authorize('ADMIN'), createProduct);

// Tags, Attributes, Licences, Versions Admin routes (Registered before dynamic :id)
router.post('/tags', authenticate, authorize('ADMIN'), createTag);
router.delete('/tags/:id', authenticate, authorize('ADMIN'), deleteTag);
router.post('/attributes', authenticate, authorize('ADMIN'), createAttribute);
router.delete('/attributes/:id', authenticate, authorize('ADMIN'), deleteAttribute);
router.post('/licences', authenticate, authorize('ADMIN'), createLicenceType);
router.delete('/licences/:id', authenticate, authorize('ADMIN'), deleteLicenceType);
router.post('/versions', authenticate, authorize('ADMIN'), createProductVersion);

// Dynamic Single Product Operations (After all static routes)
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router.get('/:id/health', getProductHealth);

// Product Detail Hub Drilldown Endpoints
router.get('/:id/orders', authenticate, authorize('ADMIN'), getProductOrders);
router.get('/:id/downloads', authenticate, authorize('ADMIN'), getProductDownloads);
router.get('/:id/licences', authenticate, authorize('ADMIN'), getProductLicences);
router.get('/:id/analytics', authenticate, authorize('ADMIN'), getProductAnalytics);
router.get('/:id/audit-logs', authenticate, authorize('ADMIN'), getProductAuditLogs);

// Single Product Mutations
router.put('/:id', authenticate, authorize('ADMIN'), updateProduct);
router.post('/:id/publish', authenticate, authorize('ADMIN'), publishProduct);
router.post('/:id/schedule', authenticate, authorize('ADMIN'), scheduleProduct);
router.post('/:id/pause', authenticate, authorize('ADMIN'), pauseProduct);
router.post('/:id/archive', authenticate, authorize('ADMIN'), archiveProduct);
router.post('/:id/restore', authenticate, authorize('ADMIN'), restoreProduct);
router.post('/:id/duplicate', authenticate, authorize('ADMIN'), duplicateProduct);
router.post('/:id/submit-review', authenticate, authorize('ADMIN'), submitProductForReview);
router.post('/:id/approve', authenticate, authorize('ADMIN'), approveProduct);
router.post('/:id/reject', authenticate, authorize('ADMIN'), rejectProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

export default router;


