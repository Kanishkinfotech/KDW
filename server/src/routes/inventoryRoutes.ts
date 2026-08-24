import express from 'express';
import { updateInventory } from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Route specifically for updating inventory fields (admin only)
router.patch('/:type/:id', authenticate, authorize('ADMIN'), updateInventory);

export default router;
