import { Router } from 'express';
import { 
  getAdminDigitalDeliveries, 
  getOrderDeliveryDetails, 
  resendOrderDelivery, 
  getCustomerDeliveryLinks 
} from '../controllers/digitalDeliveryController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Customer secure access route
router.get('/customer/orders/:orderId', authenticate, getCustomerDeliveryLinks);

// Admin delivery management routes
router.get('/admin/all', authenticate, authorize('ADMIN'), getAdminDigitalDeliveries);
router.get('/admin/orders/:orderId', authenticate, authorize('ADMIN'), getOrderDeliveryDetails);
router.post('/admin/orders/:orderId/resend', authenticate, authorize('ADMIN'), resendOrderDelivery);

export default router;
