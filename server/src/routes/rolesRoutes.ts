import express from 'express';
import { getRoles, createRole, updateRole, deleteRole, getRoleUsers } from '../controllers/rolesController';
import { authenticate, authorize, requirePermission } from '../middleware/authMiddleware';

const router = express.Router();

// Allow ADMIN and SUPER_ADMIN to access role routes initially.
// We also enforce granular permission checks.
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', requirePermission('view_roles'), getRoles);
router.post('/', requirePermission('manage_roles'), createRole);
router.put('/:id', requirePermission('manage_roles'), updateRole);
router.delete('/:id', requirePermission('manage_roles'), deleteRole);
router.get('/:id/users', requirePermission('view_roles'), getRoleUsers);

export default router;
