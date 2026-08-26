import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// 1. Get Admin & Staff Users
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, search, page = '1', limit = '25' } = req.query;
    const where: any = {
      role: { not: 'CUSTOMER' }
    };

    if (role && role !== 'ALL') where.role = String(role);
    if (status && status !== 'ALL') where.status = String(status).toUpperCase();

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          staffProfile: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Sanitize password hash before returning
    const sanitized = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    res.json({
      success: true,
      data: sanitized,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Staff Profiles
export const getStaffProfiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profiles = await prisma.staffProfile.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Staff Invitation
export const createStaffInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, roleName = 'Support Agent', department = 'SUPPORT', team = 'CORE' } = req.body;
    const authUser = (req as any).user;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Work email is required' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48 hours TTL

    const invitation = await prisma.staffInvitation.upsert({
      where: { email },
      update: {
        roleName,
        department,
        team,
        tokenHash,
        expiresAt,
        status: 'PENDING',
        invitedById: authUser?.id || null,
        invitedByName: authUser?.name || 'Administrator'
      },
      create: {
        email,
        roleName,
        department,
        team,
        tokenHash,
        expiresAt,
        status: 'PENDING',
        invitedById: authUser?.id || null,
        invitedByName: authUser?.name || 'Administrator'
      }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'STAFF_INVITED',
        resourceType: 'INVITATION',
        resourceId: invitation.id,
        reason: `Invited ${email} with role ${roleName} (${department})`
      }
    });

    res.status(201).json({
      success: true,
      message: `Invitation generated for ${email} (Expires in 48 hours).`,
      data: {
        ...invitation,
        invitationLink: `http://localhost:5173/admin/accept-invite?token=${rawToken}`
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Suspend User & Revoke Sessions Immediately
export const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const authUser = (req as any).user;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { status: 'SUSPENDED', blockReason: reason || 'Suspended by administrator' }
      }),
      prisma.adminSession.updateMany({
        where: { userId: id, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() }
      })
    ]);

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'USER_SUSPENDED',
        resourceType: 'USER',
        resourceId: id,
        riskLevel: 'HIGH',
        reason: reason || 'Administrative suspension'
      }
    });

    res.json({
      success: true,
      message: `User ${user.email} suspended and all active sessions revoked.`
    });
  } catch (error) {
    next(error);
  }
};

// 5. Activate User
export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE', blockReason: null }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'USER_ACTIVATED',
        resourceType: 'USER',
        resourceId: id,
        reason: 'Reactivated account status'
      }
    });

    res.json({
      success: true,
      message: `User ${user.email} is now ACTIVE.`
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update Staff Profile
export const updateStaffProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { department, team, timezone, phone, employeeReference, role } = req.body;
    const authUser = (req as any).user;

    if (role) {
      await prisma.user.update({
        where: { id },
        data: { role }
      });
    }

    const profile = await prisma.staffProfile.upsert({
      where: { userId: id },
      update: {
        department,
        team,
        timezone: timezone || 'Asia/Kolkata',
        phone,
        employeeReference
      },
      create: {
        userId: id,
        department: department || 'MANAGEMENT',
        team: team || 'CORE',
        timezone: timezone || 'Asia/Kolkata',
        phone,
        employeeReference
      }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'STAFF_PROFILE_UPDATED',
        resourceType: 'USER',
        resourceId: id,
        reason: 'Updated department and team assignment'
      }
    });

    res.json({
      success: true,
      message: 'Staff profile updated successfully.',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
