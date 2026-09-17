import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  createNotification, 
  getNotificationTemplates, 
  updateNotificationTemplate 
} from '../controllers/notificationController';

const router = Router();

// Notification Templates (Must precede /:id)
router.get('/templates', getNotificationTemplates);
router.patch('/templates/:id', updateNotificationTemplate);

// Routes mounted under /api/admin/notifications
router.get('/', getNotifications);
router.post('/', createNotification);
router.post('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

