import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get Active Staff Sessions
export const getAdminSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isRevoked, search } = req.query;
    const where: any = {};

    if (isRevoked === 'false') where.isRevoked = false;
    if (isRevoked === 'true') where.isRevoked = true;

    if (search) {
      where.OR = [
        { userEmail: { contains: String(search), mode: 'insensitive' } },
        { userName: { contains: String(search), mode: 'insensitive' } },
        { ipAddress: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const sessions = await prisma.adminSession.findMany({
      where,
      orderBy: { lastActiveAt: 'desc' }
    });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// 2. Revoke Single Session
export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const updated = await prisma.adminSession.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'SESSION_REVOKED',
        resourceType: 'SESSION',
        resourceId: id,
        reason: `Revoked session for ${updated.userEmail}`
      }
    });

    res.json({
      success: true,
      message: `Session for ${updated.userEmail} revoked successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 3. Revoke All Sessions for User
export const revokeAllUserSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const authUser = (req as any).user;

    const count = await prisma.adminSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'ALL_SESSIONS_REVOKED',
        resourceType: 'SESSION',
        resourceId: userId,
        reason: `Revoked all active sessions (${count.count} sessions)`
      }
    });

    res.json({
      success: true,
      message: `Revoked ${count.count} active sessions. User forced to re-authenticate.`
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Access Review Records
export const getAccessReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.accessReviewRecord.findMany({
      orderBy: { reviewDate: 'desc' }
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// 5. Conduct Access Review
export const conductAccessReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetUserId, recommendation, actionTaken, notes } = req.body;
    const authUser = (req as any).user;

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    const review = await prisma.accessReviewRecord.create({
      data: {
        reviewerId: authUser?.id || null,
        reviewerName: authUser?.name || 'Chief Security Auditor',
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        lastLoginAt: targetUser.lastLoginAt,
        recommendation: recommendation || 'MAINTAIN_ACCESS',
        actionTaken: actionTaken || 'APPROVED_NO_CHANGE',
        notes: notes || 'Access permissions certified nominal.'
      }
    });

    if (actionTaken === 'USER_SUSPENDED') {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { status: 'SUSPENDED', blockReason: 'Suspended during Access Review governance audit' }
      });
    }

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'ACCESS_REVIEW_COMPLETED',
        resourceType: 'USER',
        resourceId: targetUserId,
        reason: `Completed governance review for ${targetUser.email} (Recommendation: ${recommendation})`
      }
    });

    res.status(201).json({
      success: true,
      message: `Access review logged for ${targetUser.email}.`,
      data: review
    });
  } catch (error) {
    next(error);
  }
};
