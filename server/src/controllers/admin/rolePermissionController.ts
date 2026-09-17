import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get Roles with Scoped Permission Mappings
export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissionMappings: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get All System Permissions Catalog
export const getPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await prisma.systemPermission.findMany({
      orderBy: [{ resource: 'asc' }, { code: 'asc' }]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update Role Scoped Permissions
export const updateRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roleId = req.params.id as string;
    const { permissionIds = [], scopeType = 'ALL', description } = req.body;
    const authUser = (req as any).user;

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Clear existing mappings
      await tx.rolePermissionMapping.deleteMany({ where: { roleId } });

      // Insert new mappings
      for (const pId of permissionIds) {
        await tx.rolePermissionMapping.create({
          data: {
            roleId,
            permissionId: pId,
            scopeType
          }
        });
      }

      if (description !== undefined) {
        await tx.role.update({
          where: { id: roleId },
          data: { description }
        });
      }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'ROLE_PERMISSIONS_UPDATED',
        resourceType: 'ROLE',
        resourceId: roleId,
        riskLevel: 'HIGH',
        reason: `Updated permissions for role ${role.name} (${permissionIds.length} permissions)`
      }
    });

    res.json({
      success: true,
      message: `Permissions updated for role ${role.name}.`
    });
  } catch (error) {
    next(error);
  }
};

// 4. Grant Temporary Elevated Permission
export const grantTemporaryPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, permissionCode, durationHours = 2, reason, scope = 'ALL' } = req.body;
    const authUser = (req as any).user;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const startsAt = new Date();
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

    const grant = await prisma.temporaryPermissionGrant.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        permissionCode,
        scope,
        startsAt,
        expiresAt,
        reason: reason || 'Temporary elevated task execution',
        approvedById: authUser?.id || null,
        approvedByName: authUser?.name || 'Super Admin',
        status: 'ACTIVE'
      }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'TEMPORARY_PERMISSION_GRANTED',
        resourceType: 'PERMISSION',
        resourceId: grant.id,
        riskLevel: 'HIGH',
        reason: `Granted ${permissionCode} to ${user.email} for ${durationHours} hours`
      }
    });

    res.status(201).json({
      success: true,
      message: `Temporary permission '${permissionCode}' granted to ${user.email} for ${durationHours} hours.`,
      data: grant
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Temporary Permissions List
export const getTemporaryPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    // Auto expire outdated grants
    await prisma.temporaryPermissionGrant.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' }
    });

    const grants = await prisma.temporaryPermissionGrant.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: grants
    });
  } catch (error) {
    next(error);
  }
};

// 6. Revoke Temporary Permission Grant
export const revokeTemporaryPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const grant = await prisma.temporaryPermissionGrant.findUnique({ where: { id } });
    if (!grant) {
      return res.status(404).json({ success: false, message: 'Temporary grant not found' });
    }

    const updated = await prisma.temporaryPermissionGrant.update({
      where: { id },
      data: { status: 'REVOKED' }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'TEMPORARY_PERMISSION_REVOKED',
        resourceType: 'PERMISSION',
        resourceId: id,
        riskLevel: 'HIGH',
        reason: `Revoked temporary elevation ${grant.permissionCode} for ${grant.userEmail}`
      }
    });

    res.json({
      success: true,
      message: `Temporary permission '${grant.permissionCode}' for ${grant.userEmail} has been revoked.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
