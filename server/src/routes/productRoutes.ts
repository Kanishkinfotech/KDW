import { Router } from 'express';
import { 
  getProducts, searchProducts, getProductById, getRelatedProducts, createProduct, updateProduct, deleteProduct,
  publishProduct, scheduleProduct, pauseProduct, archiveProduct, restoreProduct,
  duplicateProduct, getProductHealth, getTags, createTag, deleteTag,
  getAttributes, createAttribute, deleteAttribute,
  getLicenceTypes, createLicenceType, deleteLicenceType,
  getProductVersions, createProductVersion, getProductFiles,
  validateDriveLink, previewPurchaseEmail, sendTestPurchaseEmail
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Drive & Email endpoints
router.post('/drive/validate', validateDriveLink);
router.post('/email/preview', previewPurchaseEmail);
router.post('/email/test', sendTestPurchaseEmail);

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/tags', getTags);
router.get('/attributes', getAttributes);
router.get('/licences', getLicenceTypes);
router.get('/versions', getProductVersions);
router.get('/files', getProductFiles);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router.get('/:id/health', getProductHealth);

// Admin-protected routes
router.use(authenticate, authorize('ADMIN'));

router.post('/', createProduct);
router.put('/:id', updateProduct);
router.post('/:id/publish', publishProduct);
router.post('/:id/schedule', scheduleProduct);
router.post('/:id/pause', pauseProduct);
router.post('/:id/archive', archiveProduct);
router.post('/:id/restore', restoreProduct);
router.post('/:id/duplicate', duplicateProduct);
router.delete('/:id', deleteProduct);

// Tags, Attributes, Licences, Versions Admin routes
router.post('/tags', createTag);
router.delete('/tags/:id', deleteTag);
router.post('/attributes', createAttribute);
router.delete('/attributes/:id', deleteAttribute);
router.post('/licences', createLicenceType);
router.delete('/licences/:id', deleteLicenceType);
router.post('/versions', createProductVersion);

export default router;


