import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedRoles = await Promise.all(
      roles.map(async (role) => {
        const usersCount = await prisma.user.count({ where: { role: role.name } });
        let parsedPermissions = [];
        try {
          parsedPermissions = JSON.parse(role.permissions);
        } catch {
          parsedPermissions = [];
        }
        return {
          ...role,
          permissions: parsedPermissions,
          usersCount
        };
      })
    );

    res.json({ success: true, roles: formattedRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Server error fetching roles' });
  }
};

// Create a new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid role name' });
    }

    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role name already exists' });
    }

    let parsedPermissions: string[];
    try {
      parsedPermissions = Array.isArray(permissions) ? permissions : JSON.parse(permissions);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid permissions format' });
    }

    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        permissions: JSON.stringify(parsedPermissions),
        isSystem: false
      }
    });

    res.json({ success: true, role: { ...newRole, permissions: parsedPermissions } });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, message: 'Server error creating role' });
  }
};

// Update an existing role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const name = req.body.name as string | undefined;
    const description = req.body.description as string | undefined;
    const permissionsRaw = req.body.permissions;

    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    let newPermissionsString = existingRole.permissions;
    if (permissionsRaw !== undefined) {
      const permsArray = Array.isArray(permissionsRaw) ? permissionsRaw : JSON.parse(permissionsRaw as string);
      newPermissionsString = JSON.stringify(permsArray);
    }

    if (existingRole.isSystem) {
      // For system roles, only allow updating permissions (and prevent removing 'all' from SUPER_ADMIN)
      if (existingRole.name === 'SUPER_ADMIN') {
        const perms = JSON.parse(newPermissionsString) as string[];
        if (!perms.includes('all')) {
          return res.status(403).json({ success: false, message: 'Cannot remove full access from SUPER_ADMIN' });
        }
      }
      
      const updatedRole = await prisma.role.update({
        where: { id },
        data: { permissions: newPermissionsString }
      });
      return res.json({ success: true, role: { ...updatedRole, permissions: JSON.parse(updatedRole.permissions) } });
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
        permissions: newPermissionsString
      }
    });

    res.json({ success: true, role: { ...updatedRole, permissions: JSON.parse(updatedRole.permissions) } });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: 'Server error updating role' });
  }
};

// Delete a role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existingRole = await prisma.role.findUnique({ 
      where: { id }
    });
    
    if (!existingRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (existingRole.isSystem) {
      return res.status(403).json({ success: false, message: 'Cannot delete a system role' });
    }

    const assignedCount = await prisma.user.count({ where: { role: existingRole.name } });
    if (assignedCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete role with assigned users' });
    }

    await prisma.role.delete({ where: { id } });
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, message: 'Server error deleting role' });
  }
};

// Get users assigned to a role
export const getRoleUsers = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const users = await prisma.user.findMany({
      where: { role: role.name },
      select: { id: true, name: true, email: true, profileImage: true, createdAt: true }
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching role users:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};
