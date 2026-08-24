import { Router } from 'express';
import { getBundles, getBundleById, createBundle, updateBundle, deleteBundle } from '../controllers/bundleController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getBundles);
router.get('/:id', getBundleById);

// Admin Routes
router.post('/', authenticate, authorize('ADMIN'), createBundle);
router.put('/:id', authenticate, authorize('ADMIN'), updateBundle);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBundle);

export default router;
