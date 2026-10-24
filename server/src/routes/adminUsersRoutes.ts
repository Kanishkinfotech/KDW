import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getStaffUsers,
  getPermissionsCatalog,
  getStaffUserById,
  inviteStaffUser,
  updateStaffRole,
  updateStaffPermissions,
  updateStaffStatus,
  updateRoleDefaults
} from '../controllers/adminUserController';

const router = Router();

// Staff administration requires staff/admin tokens
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'));

import { getStaffActivityLogs } from '../controllers/admin/staffActivityLogController';

// 1. Static Subpaths (Must be registered before /:id)
router.get('/activity-logs', getStaffActivityLogs);
router.get('/permissions-catalog', getPermissionsCatalog);
router.put('/role-defaults', updateRoleDefaults);
router.put('/permissions-catalog', updateRoleDefaults);
router.post('/invite', inviteStaffUser);

// 2. Collection
router.get('/', getStaffUsers);

// 3. Dynamic ID Subpaths
router.patch('/:id/role', updateStaffRole);
router.put('/:id/permissions', updateStaffPermissions);
router.patch('/:id/status', updateStaffStatus);
router.get('/:id', getStaffUserById);

export default router;
