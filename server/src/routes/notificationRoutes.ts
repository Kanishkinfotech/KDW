import { Router } from 'express';
import { getNotifications, markAsRead, deleteNotification } from '../controllers/notificationController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// These routes will be mounted under /api/admin/notifications
// Authentication and ADMIN authorization is handled in adminRoutes.ts

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
