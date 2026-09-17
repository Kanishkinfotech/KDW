import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../database/db';
import {
  STAFF_ROLES,
  PERMISSION_CATALOG,
  ROLE_DEFAULT_PERMISSIONS,
  normalizeRole,
  isValidPermissionCode,
  effectivePermissions
} from '../utils/permissionsCatalog';

// Helper for safe audit logging
const logAudit = async (
  adminId: string | undefined,
  action: 'CREATED' | 'UPDATED' | 'SUSPENDED' | 'ACTIVATED' | 'DELETED',
  entity: string,
  details: any,
  req: Request
) => {
  if (!adminId) return;
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || req.ip || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        details: JSON.stringify({
          ...details,
          ip,
          userAgent
        })
      }
    });
  } catch (err) {
    console.error(`Failed to create audit log for ${entity} ${action}:`, err);
  }
};

// Safe user serializer (excludes passwords, hashes, and secrets)
const serializeSafeUser = (user: any) => {
  const normRole = normalizeRole(user.role);
  const permissionsList = Array.isArray(user.permissions) ? user.permissions : [];
  const eff = effectivePermissions({ role: normRole, permissions: permissionsList });

  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: normRole,
    status: user.status || 'ACTIVE',
    isActive: user.status === 'ACTIVE',
    isVerified: user.emailVerified ?? true,
    permissions: permissionsList,
    effectivePermissions: eff,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

// ==========================================
// 1. STAFF LIST
// ==========================================
export const getStaffUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, search } = req.query;

    const where: any = {
      role: {
        notIn: ['CUSTOMER', 'customer', 'guest', 'GUEST']
      }
    };

    if (role && String(role).trim() !== '' && role !== 'ALL') {
      const targetRole = normalizeRole(String(role).trim());
      where.role = {
        equals: targetRole,
        mode: 'insensitive'
      };
    }

    if (status && String(status).trim() !== '' && status !== 'ALL') {
      const s = String(status).trim().toLowerCase();
      if (s === 'active') {
        where.status = 'ACTIVE';
      } else if (s === 'suspended') {
        where.status = { in: ['SUSPENDED', 'BLOCKED'] };
      }
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const safeUsers = users.map(serializeSafeUser);

    res.json({
      success: true,
      data: safeUsers,
      users: safeUsers,
      count: safeUsers.length
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PERMISSIONS CATALOG
// ==========================================
export const getPermissionsCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        roles: STAFF_ROLES,
        permissions: PERMISSION_CATALOG,
        roleDefaults: ROLE_DEFAULT_PERMISSIONS
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. STAFF DETAIL
// ==========================================
export const getStaffUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user || ['CUSTOMER', 'customer', 'guest', 'GUEST'].includes(user.role)) {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    res.json({
      success: true,
      data: serializeSafeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. INVITE STAFF (super_admin only)
// ==========================================
export const inviteStaffUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role } = req.body;
    const actorRole = normalizeRole((req as any).user?.role);
    const actorId = (req as any).user?.id;

    if (actorRole !== 'super_admin' && actorRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only administrators can invite new staff members.'
      });
    }

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'Staff member name is required' });
    }
    if (!email || String(email).trim() === '') {
      return res.status(400).json({ success: false, message: 'Staff member email is required' });
    }

    const normalizedRole = normalizeRole(role);
    if (!STAFF_ROLES.includes(normalizedRole as any)) {
      return res.status(400).json({ success: false, message: `Invalid staff role: "${role}"` });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate cryptographically secure temporary password (e.g. KDW-Temp-xxxxxxxx)
    const rawRandom = crypto.randomBytes(6).toString('hex');
    const temporaryPassword = `KDW-${rawRandom}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        normalizedEmail,
        role: normalizedRole,
        passwordHash,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        customerType: 'ACCOUNT',
        permissions: []
      }
    });

    await logAudit(
      actorId,
      'CREATED',
      'User',
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      req
    );

    const safeUser = serializeSafeUser(newUser);

    // temporaryPassword is ONLY returned once in this invite response
    res.status(201).json({
      success: true,
      data: {
        ...safeUser,
        temporaryPassword
      },
      message: 'Staff member invited successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. UPDATE STAFF ROLE (super_admin only)
// ==========================================
export const updateStaffRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const actorRole = normalizeRole((req as any).user?.role);
    const actorId = (req as any).user?.id;

    if (actorRole !== 'super_admin' && actorRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only administrators can change staff roles.'
      });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || ['CUSTOMER', 'customer', 'guest', 'GUEST'].includes(targetUser.role)) {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    const newRole = normalizeRole(role);
    if (!STAFF_ROLES.includes(newRole as any)) {
      return res.status(400).json({ success: false, message: `Invalid staff role: "${role}"` });
    }

    // Self-demotion protection
    if (targetUser.id === actorId && normalizeRole(targetUser.role) === 'super_admin' && newRole !== 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote your own account'
      });
    }

    const oldRole = targetUser.role;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: newRole }
    });

    await logAudit(
      actorId,
      'UPDATED',
      'User',
      {
        id: updatedUser.id,
        role: { old: oldRole, new: newRole }
      },
      req
    );

    res.json({
      success: true,
      data: serializeSafeUser(updatedUser),
      message: 'Staff role updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. PERMISSION OVERRIDE (super_admin only)
// ==========================================
export const updateStaffPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { permissions } = req.body;
    const actorRole = normalizeRole((req as any).user?.role);
    const actorId = (req as any).user?.id;

    if (actorRole !== 'super_admin' && actorRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only administrators can override staff permissions.'
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions must be an array of strings' });
    }

    // Validate each permission code against catalog
    for (const code of permissions) {
      if (!isValidPermissionCode(code)) {
        return res.status(400).json({ success: false, message: `Invalid permission code: "${code}"` });
      }
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || ['CUSTOMER', 'customer', 'guest', 'GUEST'].includes(targetUser.role)) {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    const oldPermissions = targetUser.permissions || [];
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        permissions: Array.from(new Set(permissions))
      }
    });

    await logAudit(
      actorId,
      'UPDATED',
      'User',
      {
        id: updatedUser.id,
        permissions: { old: oldPermissions, new: updatedUser.permissions }
      },
      req
    );

    res.json({
      success: true,
      data: serializeSafeUser(updatedUser),
      message: 'Staff permissions updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. SUSPEND / REACTIVATE (admin & super_admin)
// ==========================================
export const updateStaffStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isActive, status } = req.body;
    const actorId = (req as any).user?.id;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || ['CUSTOMER', 'customer', 'guest', 'GUEST'].includes(targetUser.role)) {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    // Determine target status
    let targetStatus = 'ACTIVE';
    if (isActive === false || String(status).toUpperCase() === 'SUSPENDED') {
      targetStatus = 'SUSPENDED';
    } else if (isActive === true || String(status).toUpperCase() === 'ACTIVE') {
      targetStatus = 'ACTIVE';
    }

    // Self-suspension protection
    if (targetUser.id === actorId && targetStatus === 'SUSPENDED') {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own account'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: targetStatus }
    });

    await logAudit(
      actorId,
      targetStatus === 'ACTIVE' ? 'ACTIVATED' : 'SUSPENDED',
      'User',
      {
        id: updatedUser.id,
        email: updatedUser.email,
        status: targetStatus
      },
      req
    );

    res.json({
      success: true,
      data: serializeSafeUser(updatedUser),
      message: targetStatus === 'ACTIVE' ? 'Staff account activated' : 'Staff account suspended'
    });
  } catch (error) {
    next(error);
  }
};
