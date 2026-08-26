import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getAdminUsers,
  getStaffProfiles,
  createStaffInvitation,
  suspendUser,
  activateUser,
  updateStaffProfile
} from '../controllers/admin/userStaffController';
import {
  getRoles,
  getPermissions,
  updateRolePermissions,
  grantTemporaryPermission,
  getTemporaryPermissions
} from '../controllers/admin/rolePermissionController';
import {
  getAdminSessions,
  revokeSession,
  revokeAllUserSessions,
  getAccessReviews,
  conductAccessReview
} from '../controllers/admin/sessionAccessReviewController';
import { getStaffActivityLogs } from '../controllers/admin/staffActivityLogController';

const router = express.Router();

// Apply auth & admin authorization
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER', 'AUDITOR'));

// Users & Staff
router.get('/', getAdminUsers);
router.get('/staff', getStaffProfiles);
router.post('/invite', createStaffInvitation);
router.post('/:id/suspend', suspendUser);
router.post('/:id/activate', activateUser);
router.patch('/:id/profile', updateStaffProfile);

// Roles & Permissions
router.get('/roles', getRoles);
router.get('/permissions', getPermissions);
router.patch('/roles/:id', updateRolePermissions);
router.post('/temporary-permission', grantTemporaryPermission);
router.get('/temporary-permissions', getTemporaryPermissions);

// Sessions & Governance
router.get('/sessions', getAdminSessions);
router.post('/sessions/:id/revoke', revokeSession);
router.post('/:userId/revoke-all-sessions', revokeAllUserSessions);
router.get('/access-reviews', getAccessReviews);
router.post('/access-reviews', conductAccessReview);

// Activity Logs
router.get('/activity-logs', getStaffActivityLogs);

export default router;
