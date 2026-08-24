import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAdminAction } from '../utils/auditLogger';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Get all users (Admin)
export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (role) {
      if (role === 'ADMINS') {
        where.role = { in: ['ADMIN', 'SUPER_ADMIN'] };
      } else {
        where.role = role as string;
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          profileImage: true,
          createdAt: true,
          _count: {
            select: { orders: true, purchases: true, supportTickets: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.user.count({ where })
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// Get single user details (Admin)
export const getAdminUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        profileImage: true,
        createdAt: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, totalAmount: true, orderStatus: true, createdAt: true }
        },
        purchases: {
          include: {
            product: { select: { id: true, name: true, thumbnail: true } },
            bundle: { select: { id: true, title: true, coverImage: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching admin user details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
};

// Update user role (Admin)
export const updateAdminUserRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    
    const adminId = (req as any).user?.id || 'system';
    const adminRole = (req as any).user?.role;

    // Prevent changing your own role or the last admin's role
    if (adminId === id) {
       return res.status(400).json({ success: false, message: 'Cannot modify your own role directly' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (currentUser.role === 'SUPER_ADMIN' && adminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Insufficient privileges to modify a SUPER_ADMIN' });
    }

    if (role === 'SUPER_ADMIN' && adminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Insufficient privileges to assign SUPER_ADMIN role' });
    }

    if (currentUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot demote the last remaining SUPER_ADMIN' });
      }
    }

    if (currentUser.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        // The last admin check might only matter if there are no super admins, but it's a good safety net
        if (adminCount <= 1) {
            // Only block if there are also no super admins left to fix it
            const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
            if (superAdminCount === 0) {
                return res.status(400).json({ success: false, message: 'Cannot demote the last remaining administrator' });
            }
        }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    await logAdminAction(adminId, 'UPDATE_USER_ROLE', 'User', `Updated role for ${updatedUser.email} to ${role}`);

    res.status(200).json({ success: true, user: updatedUser, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Server error updating user role' });
  }
};

// Create a new admin user
export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const adminId = (req as any).user?.id || 'system';
    const adminRole = (req as any).user?.role;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    if (role === 'SUPER_ADMIN' && adminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Insufficient privileges to create a SUPER_ADMIN' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        emailVerified: true // Assume admins are verified on creation
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    await logAdminAction(adminId, 'CREATE_ADMIN_USER', 'User', `Created ${role} account for ${email}`);

    res.status(201).json({ success: true, user: newUser, message: 'Admin user created successfully' });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ success: false, message: 'Server error creating admin user' });
  }
};

// Delete an admin user
export const deleteAdminUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const adminId = (req as any).user?.id || 'system';
    const adminRole = (req as any).user?.role;

    if (adminId === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userToDelete.role === 'SUPER_ADMIN' && adminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Insufficient privileges to delete a SUPER_ADMIN' });
    }

    if (userToDelete.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last remaining SUPER_ADMIN' });
      }
    }

    // Use a transaction to safely cascade delete related Admin records
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { adminId: id } }),
      prisma.supportMessage.deleteMany({ where: { senderId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    await logAdminAction(adminId, 'DELETE_ADMIN_USER', 'User', `Deleted account for ${userToDelete.email}`);

    res.status(200).json({ success: true, message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ success: false, message: 'Server error deleting admin user' });
  }
};
