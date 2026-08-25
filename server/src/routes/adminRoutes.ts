import express from 'express';
import { getSystemHealth, resendOrderEmail, getAdminSettings, updateAdminSettings, getAdminAuditLogs, getAdminDashboard, searchGlobalAdmin } from '../controllers/adminController';
import { getAdminReviews, updateReviewModeration } from '../controllers/reviewController';
import { getAdminOrders, getAdminOrderById, updateAdminOrderStatus, refundAdminOrder } from '../controllers/orderController';
import { 
  getAdminUsers, 
  getAdminUserById, 
  updateAdminUserRole,
  createAdminUser,
  deleteAdminUser 
} from '../controllers/userController';
import { getAdminCoupons, createAdminCoupon, updateAdminCoupon, updateCouponStatus } from '../controllers/couponController';
import { getDriveFiles, linkDriveFile, deleteDriveFile } from '../controllers/driveController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Apply admin protection to all routes
router.use(authenticate, authorize('ADMIN'));

// Main Admin Dashboard Consolidated Endpoint
router.get('/dashboard', getAdminDashboard);

// Global Search Endpoint
router.get('/search', searchGlobalAdmin);

router.get('/health', getSystemHealth);

// System Settings
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);

// Audit Logs
router.get('/audit-logs', getAdminAuditLogs);

// Admin Reviews
router.get('/reviews', getAdminReviews);
router.put('/reviews/:id/status', updateReviewModeration);
router.post('/reviews/:id/moderation', updateReviewModeration);

// Orders
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.put('/orders/:id/status', updateAdminOrderStatus);
router.post('/orders/:id/resend-email', resendOrderEmail);
router.post('/orders/:id/refund', refundAdminOrder);

// Users
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id/role', updateAdminUserRole);
router.delete('/users/:id', deleteAdminUser);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createAdminCoupon);
router.put('/coupons/:id', updateAdminCoupon);
router.patch('/coupons/:id/status', updateCouponStatus);

// Media / Drive Manager
router.get('/drive', getDriveFiles);
router.post('/drive', linkDriveFile);
router.delete('/drive/:id', deleteDriveFile);

import rolesRoutes from './rolesRoutes';
router.use('/roles', rolesRoutes);

import notificationRoutes from './notificationRoutes';
router.use('/notifications', notificationRoutes);

export default router;
