import { Router } from 'express';
import { 
  getBundles, 
  getBundleById, 
  createBundle, 
  updateBundle, 
  deleteBundle,
  duplicateBundle,
  archiveBundle,
  restoreBundle,
  validateBundle,
  getBundleVersions,
  createBundleVersion,
  getBundleAnalytics,
  supportOverrideAction,
  secureDownloadBundle
} from '../controllers/bundleController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public Storefront & Secure Download Routes
router.get('/', getBundles);
router.get('/download/:token', secureDownloadBundle);
router.get('/analytics/overview', getBundleAnalytics);
router.get('/:id', getBundleById);

// Admin Routes
router.use(authenticate, authorize('ADMIN'));

router.post('/validate', validateBundle);
router.post('/support/override', supportOverrideAction);

router.post('/', createBundle);
router.put('/:id', updateBundle);
router.delete('/:id', deleteBundle);

router.post('/:id/duplicate', duplicateBundle);
router.post('/:id/archive', archiveBundle);
router.post('/:id/restore', restoreBundle);

router.get('/:id/versions', getBundleVersions);
router.post('/:id/versions', createBundleVersion);

export default router;
