import express from 'express';
import { getInventoryList, updateInventory } from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

// Inventory list & metrics
router.get('/', getInventoryList);

// Route specifically for updating inventory fields (admin only)
router.patch('/:type/:id', updateInventory);

export default router;
