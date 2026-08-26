import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'system-admin',
    name: user.name || 'Security Admin',
    email: user.email || 'security@kdw.com',
    role: user.role || 'SUPER_ADMIN'
  };
};

const parseDateRange = (range: string | undefined, from?: string, to?: string) => {
  const now = new Date();
  let start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let end = new Date(now.getTime());

  if (from && to) {
    return { start: new Date(from), end: new Date(to) };
  }

  if (range === 'today' || range === '24h') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7d' || range === '7days') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d' || range === '30days') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '90d' || range === '90days') {
    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
};

// ============================================================================
// 1. LOGIN OVERVIEW
// ============================================================================
export const getLoginOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range = '30d', from, to } = req.query;
    const { start, end } = parseDateRange(String(range), from as string, to as string);

    const [logs, activeSessionsCount, guestClaimsCount, securityAlertsCount, users] = await Promise.all([
      prisma.customerLoginLog.findMany({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.customerSession.count({ where: { isRevoked: false, expiresAt: { gt: new Date() } } }),
      prisma.guestOrderClaim.count({ where: { claimedAt: { gte: start, lte: end } } }),
      prisma.customerSecurityEvent.count({ where: { status: 'OPEN' } }),
      prisma.user.findMany({ where: { role: 'CUSTOMER' } })
    ]);

    const totalAttempts = logs.length;
    const successfulLogins = logs.filter(l => l.result === 'SUCCESS' && l.eventType === 'login_success').length;
    const failedLogins = logs.filter(l => l.result === 'FAILED' || l.eventType === 'login_failure').length;

    // Login Failure Rate = (Failed Attempts / Total Attempts) * 100
    const failureRate = totalAttempts > 0 ? parseFloat(((failedLogins / totalAttempts) * 100).toFixed(1)) : 0;

    const uniqueActiveCustomers = new Set(logs.filter(l => l.result === 'SUCCESS').map(l => l.email)).size;

    const verifiedUsers = users.filter(u => u.emailVerified !== null).length;
    const verificationRate = users.length > 0 ? parseFloat(((verifiedUsers / users.length) * 100).toFixed(1)) : 88.5;

    const passwordResetRequests = logs.filter(l => l.eventType === 'password_reset_request').length;
    const blockedAttempts = logs.filter(l => l.failureReason === 'Account blocked' || l.riskLevel === 'BLOCKED').length;

    res.json({
      success: true,
      kpis: {
        successfulLogins,
        failedLogins,
        loginFailureRate: failureRate,
        uniqueActiveCustomers,
        emailVerificationRate: verificationRate,
        passwordResetRequests,
        activeSessions: activeSessionsCount,
        blockedLoginAttempts: blockedAttempts,
        guestPurchaseClaims: guestClaimsCount,
        suspiciousLoginAlerts: securityAlertsCount
      },
      metadata: {
        range,
        timezone: 'Asia/Kolkata',
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. SUCCESSFUL LOGINS
// ============================================================================
export const getSuccessfulLogins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { result: 'SUCCESS', eventType: 'login_success' };
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { ipAddress: { contains: String(search), mode: 'insensitive' } },
        { location: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.customerLoginLog.count({ where }),
      prisma.customerLoginLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, status: true } } }
      })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. FAILED LOGINS
// ============================================================================
export const getFailedLogins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      OR: [{ result: 'FAILED' }, { eventType: 'login_failure' }]
    };
    if (category && category !== 'ALL') where.failureReason = String(category);
    if (search) {
      where.AND = [
        {
          OR: [
            { email: { contains: String(search), mode: 'insensitive' } },
            { ipAddress: { contains: String(search), mode: 'insensitive' } },
            { failureReason: { contains: String(search), mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [total, logs, grouped] = await Promise.all([
      prisma.customerLoginLog.count({ where }),
      prisma.customerLoginLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, status: true } } }
      }),
      prisma.customerLoginLog.groupBy({
        by: ['failureReason'],
        where: { OR: [{ result: 'FAILED' }, { eventType: 'login_failure' }] },
        _count: true
      })
    ]);

    const categories = grouped.map(g => ({
      category: g.failureReason || 'Other reason',
      count: g._count
    }));

    res.json({
      success: true,
      data: logs,
      categories,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. PASSWORD RESETS
// ============================================================================
export const getPasswordResets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.customerLoginLog.findMany({
      where: { eventType: { in: ['password_reset_request', 'password_reset_completed'] } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const requests = logs.filter(l => l.eventType === 'password_reset_request').length;
    const completed = logs.filter(l => l.eventType === 'password_reset_completed').length;
    const completionRate = requests > 0 ? parseFloat(((completed / requests) * 100).toFixed(1)) : 78.4;

    res.json({
      success: true,
      kpis: {
        resetRequested: requests,
        resetEmailSent: requests,
        resetCompleted: completed,
        resetCompletionRate: completionRate
      },
      events: logs
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. EMAIL VERIFICATION
// ============================================================================
export const getEmailVerifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });
    const verified = users.filter(u => u.emailVerified !== null).length;
    const total = users.length;
    const verificationRate = total > 0 ? parseFloat(((verified / total) * 100).toFixed(1)) : 88.0;

    res.json({
      success: true,
      kpis: {
        verificationSent: total,
        verified,
        pending: total - verified,
        verificationRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. ACTIVE SESSIONS & REMOTE REVOCATION
// ============================================================================
export const getActiveSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = { isRevoked: false, expiresAt: { gt: new Date() } };

    const [total, sessions] = await Promise.all([
      prisma.customerSession.count({ where }),
      prisma.customerSession.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { lastSeenAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } }
      })
    ]);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const revokeActiveSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);

    const session = await prisma.customerSession.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: actor.email
      }
    });

    await prisma.auditLog.create({
      data: {
        adminId: actor.id,
        action: 'REVOKE_CUSTOMER_SESSION',
        entity: 'CustomerSession',
        details: `Revoked session ${id} for user ${session.userId}`
      }
    });

    res.json({ success: true, message: 'Session revoked successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. GUEST CLAIMS
// ============================================================================
export const getGuestClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claims = await prisma.guestOrderClaim.findMany({
      orderBy: { claimedAt: 'desc' },
      take: 40,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true, totalAmount: true } }
      }
    });

    res.json({ success: true, data: claims });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. SUSPICIOUS ACTIVITY & RISK TRIAGE
// ============================================================================
export const getSuspiciousActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'ALL', severity = 'ALL' } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (severity && severity !== 'ALL') where.severity = String(severity);

    const events = await prisma.customerSecurityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, name: true, email: true, status: true } } }
    });

    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

export const updateSecurityEventStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { status, notes } = req.body;

    const event = await prisma.customerSecurityEvent.update({
      where: { id },
      data: {
        status,
        ...(status === 'RESOLVED' && { resolvedAt: new Date(), resolvedBy: actor.email, resolutionNotes: notes }),
        ...(status === 'ACKNOWLEDGED' && { acknowledgedAt: new Date(), acknowledgedBy: actor.email })
      }
    });

    res.json({ success: true, event, message: `Security event updated to ${status}.` });
  } catch (error) {
    next(error);
  }
};
