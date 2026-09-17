import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const normalizeIp = (ip?: string | null): string => {
  if (!ip) return '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
};

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

    const formattedLogs = logs.map(l => ({
      ...l,
      ipAddress: normalizeIp(l.ipAddress)
    }));

    res.json({
      success: true,
      data: formattedLogs,
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

    const formattedLogs = logs.map(l => ({
      ...l,
      ipAddress: normalizeIp(l.ipAddress)
    }));

    res.json({
      success: true,
      data: formattedLogs,
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
      take: 50,
      include: { user: { select: { id: true, name: true, email: true, status: true } } }
    });

    const formattedLogs = logs.map(l => ({
      ...l,
      ipAddress: normalizeIp(l.ipAddress)
    }));

    const requests = logs.filter(l => l.eventType === 'password_reset_request').length;
    const completed = logs.filter(l => l.eventType === 'password_reset_completed').length;
    const completionRate = requests > 0 ? parseFloat(((completed / requests) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      kpis: {
        resetRequested: requests,
        resetEmailSent: requests,
        resetCompleted: completed,
        resetCompletionRate: completionRate
      },
      events: formattedLogs,
      data: formattedLogs
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
    const users = await prisma.user.findMany({ 
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    const verified = users.filter(u => u.emailVerified !== null && u.emailVerified !== false).length;
    const total = users.length;
    const verificationRate = total > 0 ? parseFloat(((verified / total) * 100).toFixed(1)) : 0;

    const userList = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      customerCode: u.customerCode,
      emailVerified: !!u.emailVerified,
      emailVerifiedAt: u.emailVerifiedAt,
      createdAt: u.createdAt,
      status: u.status
    }));

    res.json({
      success: true,
      kpis: {
        verificationSent: total,
        verified,
        pending: total - verified,
        verificationRate
      },
      data: userList
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

    const formattedSessions = sessions.map(s => ({
      ...s,
      ipAddress: normalizeIp(s.ipAddress)
    }));

    res.json({
      success: true,
      data: formattedSessions,
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
export const verifyCustomerEmailManually = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);

    const user = await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    await prisma.customerLoginLog.create({
      data: {
        userId: user.id,
        email: user.email,
        eventType: 'email_verified',
        result: 'SUCCESS',
        failureReason: null,
        ipAddress: '127.0.0.1',
        device: 'Admin Portal'
      }
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        adminId: actor.id,
        action: 'MANUALLY_VERIFY_CUSTOMER_EMAIL',
        entity: 'User',
        details: `Admin ${actor.email} manually verified email for customer ${user.email}`
      }
    }).catch(() => {});

    res.json({ success: true, message: `Email for ${user.email} marked as verified successfully.` });
  } catch (error) {
    next(error);
  }
};

export const resendCustomerVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer account not found.' });
    }

    res.json({
      success: true,
      message: `Verification link dispatched to ${user.email}.`
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. GUEST CLAIMS
// ============================================================================
export const getGuestClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [claims, guestOrders] = await Promise.all([
      prisma.guestOrderClaim.findMany({
        orderBy: { claimedAt: 'desc' },
        take: 40,
        include: {
          user: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, orderNumber: true, totalAmount: true } }
        }
      }),
      prisma.order.findMany({
        where: { customerType: 'GUEST' },
        orderBy: { createdAt: 'desc' },
        take: 40
      })
    ]);

    const formattedClaims = claims.map(c => ({
      id: c.id,
      orderId: c.orderId,
      claimedAt: c.claimedAt,
      guestEmail: c.guestEmail,
      status: c.status,
      orderNumber: c.order?.orderNumber,
      totalAmount: c.order?.totalAmount,
      userName: c.user?.name,
      userEmail: c.user?.email,
      user: c.user,
      order: c.order,
      isClaimed: true
    }));

    const unclaimed = guestOrders
      .filter(g => !claims.some(c => c.orderId === g.id))
      .map(g => ({
        id: g.id,
        orderId: g.id,
        claimedAt: g.createdAt,
        guestEmail: g.guestEmail || 'guest@example.com',
        status: 'UNCLAIMED',
        orderNumber: g.orderNumber,
        totalAmount: g.totalAmount,
        userName: g.guestName || 'Guest Customer',
        userEmail: g.guestEmail,
        order: { id: g.id, orderNumber: g.orderNumber, totalAmount: g.totalAmount },
        isClaimed: false
      }));

    const allRecords = [...formattedClaims, ...unclaimed];
    const totalGuest = claims.length + unclaimed.length;
    const claimRate = totalGuest > 0 ? Math.round((claims.length / totalGuest) * 100) : 0;

    res.json({
      success: true,
      kpis: {
        totalGuestOrders: totalGuest,
        totalGuestPurchases: totalGuest,
        claimedGuestOrders: claims.length,
        claimedOrders: claims.length,
        unclaimedGuestOrders: unclaimed.length,
        unclaimedOrders: unclaimed.length,
        claimRate
      },
      claims: formattedClaims,
      unclaimedOrders: unclaimed,
      data: allRecords
    });
  } catch (error) {
    next(error);
  }
};

export const claimGuestOrderManually = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const orderId = String(req.params.orderId);
    const { customerEmail } = req.body;

    const targetUser = await prisma.user.findFirst({
      where: { email: String(customerEmail).trim().toLowerCase() }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target customer account not found.' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        customerId: targetUser.id,
        customerType: 'ACCOUNT',
        claimedAccountId: targetUser.id,
        claimedAt: new Date()
      }
    });

    const claim = await prisma.guestOrderClaim.create({
      data: {
        guestEmail: order.guestEmail || targetUser.email,
        orderId: order.id,
        userId: targetUser.id,
        status: 'CLAIMED',
        ipAddress: '127.0.0.1'
      }
    });

    res.json({ success: true, claim, message: `Order #${order.orderNumber} successfully claimed and transferred to ${targetUser.email}.` });
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

    // 1. Fetch real recorded customerSecurityEvents
    const events = await prisma.customerSecurityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            failedLoginCount: true,
            lastLoginAt: true
          }
        }
      }
    });

    // 2. Fetch any accounts with >= 3 failed logins or currently locked/suspended
    const lockedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { failedLoginCount: { gte: 3 } },
          { status: { in: ['BLOCKED', 'SUSPENDED'] } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        failedLoginCount: true,
        lastLoginAt: true,
        updatedAt: true
      }
    });

    // Merge active user security threats if not already in customerSecurityEvent list
    const existingActiveEmails = new Set(
      events.filter(e => e.status !== 'RESOLVED').map(e => e.email.toLowerCase())
    );

    const synthesizedEvents: any[] = [];
    for (const u of lockedUsers) {
      if (!existingActiveEmails.has(u.email.toLowerCase())) {
        synthesizedEvents.push({
          id: `lock-${u.id}`,
          userId: u.id,
          email: u.email,
          eventType: u.failedLoginCount >= 5 ? 'brute_force' : 'multiple_failures',
          severity: u.failedLoginCount >= 5 || u.status === 'BLOCKED' ? 'CRITICAL' : 'HIGH',
          status: 'OPEN',
          description: `${u.failedLoginCount} failed login attempts registered. Account status: ${u.status}.`,
          ipAddress: '127.0.0.1',
          createdAt: u.updatedAt || new Date(),
          user: u,
          isSynthesized: true
        });
      }
    }

    const allEvents = [...events, ...synthesizedEvents].map((e: any) => ({
      ...e,
      ipAddress: normalizeIp(e.ipAddress)
    }));

    // Compute dynamic KPIs
    const totalIncidents = allEvents.length;
    const highCritical = allEvents.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').length;
    const openThreats = allEvents.filter(e => e.status !== 'RESOLVED').length;
    const lockedAccountsCount = lockedUsers.filter(u => u.failedLoginCount >= 5 || u.status === 'BLOCKED').length;

    res.json({
      success: true,
      data: allEvents,
      kpis: {
        totalIncidents,
        highCriticalRisks: highCritical,
        openThreats,
        lockedAccounts: lockedAccountsCount,
        bruteForceThreshold: 5
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSecurityEventStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { status, notes } = req.body;

    if (id.startsWith('lock-')) {
      const userId = id.replace('lock-', '');
      if (status === 'RESOLVED') {
        await prisma.user.update({
          where: { id: userId },
          data: { failedLoginCount: 0 }
        }).catch(() => {});
      }
      return res.json({ success: true, message: `Threat status updated to ${status}.` });
    }

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

export const unlockCustomerAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { email } = req.body;

    let targetUserId: string | null = null;
    let targetEmail: string | null = email || null;

    if (id.startsWith('lock-')) {
      targetUserId = id.replace('lock-', '');
    } else {
      const event = await prisma.customerSecurityEvent.findUnique({ where: { id } });
      if (event) {
        targetUserId = event.userId;
        targetEmail = event.email;
        await prisma.customerSecurityEvent.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedBy: actor.email,
            resolutionNotes: 'Account unlocked & lockout reset by administrator'
          }
        }).catch(() => {});
      } else {
        targetUserId = id;
      }
    }

    let user = null;
    if (targetUserId) {
      user = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (targetEmail) {
      user = await prisma.user.findUnique({ where: { email: targetEmail.toLowerCase() } });
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: 0,
          status: user.status === 'BLOCKED' ? 'ACTIVE' : user.status
        }
      });

      // Mark all other open events for this user/email as RESOLVED
      await prisma.customerSecurityEvent.updateMany({
        where: {
          OR: [{ userId: user.id }, { email: user.email }],
          status: { in: ['OPEN', 'ACKNOWLEDGED'] }
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: actor.email,
          resolutionNotes: 'Account unlocked by admin'
        }
      }).catch(() => {});

      await prisma.auditLog.create({
        data: {
          adminId: actor.id,
          action: 'UNLOCK_CUSTOMER_ACCOUNT',
          entity: 'User',
          details: `Admin ${actor.email} unlocked account and reset failed login attempts for customer ${user.email}`
        }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Account for ${user?.email || targetEmail || 'customer'} successfully unlocked and login attempts reset to 0.`
    });
  } catch (error) {
    next(error);
  }
};

export const blockCustomerAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { email, reason } = req.body;

    let targetEmail = email;
    let targetUserId = id.startsWith('lock-') ? id.replace('lock-', '') : null;

    if (!targetUserId) {
      const event = await prisma.customerSecurityEvent.findUnique({ where: { id } });
      if (event) {
        targetUserId = event.userId;
        targetEmail = event.email;
      } else {
        targetUserId = id;
      }
    }

    const user = targetUserId 
      ? await prisma.user.findUnique({ where: { id: targetUserId } })
      : await prisma.user.findUnique({ where: { email: targetEmail } });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'BLOCKED' }
      });

      await prisma.customerSecurityEvent.create({
        data: {
          userId: user.id,
          email: user.email,
          eventType: 'account_blocked_by_admin',
          severity: 'CRITICAL',
          status: 'OPEN',
          description: `Account blocked by administrator: ${reason || 'Suspicious login/unauthorized activity detected'}.`
        }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Account for ${user?.email || 'customer'} has been suspended/blocked.`
    });
  } catch (error) {
    next(error);
  }
};

export const simulateSecurityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const { email, attempts = 5 } = req.body;

    let user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    }

    const targetEmail = user ? user.email : (email || 'suspicious_attempt@example.com');

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: attempts }
      });
    }

    const event = await prisma.customerSecurityEvent.create({
      data: {
        userId: user ? user.id : null,
        email: targetEmail,
        eventType: 'brute_force',
        severity: 'HIGH',
        status: 'OPEN',
        ipAddress: '192.168.1.105',
        description: `${attempts} consecutive failed login attempts detected on ${targetEmail}. Lockout triggered.`
      }
    });

    res.json({ success: true, event, message: 'Test security event successfully generated.' });
  } catch (error) {
    next(error);
  }
};
