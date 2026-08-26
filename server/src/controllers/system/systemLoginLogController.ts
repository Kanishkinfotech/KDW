import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Query Login Logs with Filters & Pagination
export const getLoginLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userType, result, isSuspicious, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (userType && userType !== 'ALL') where.userType = String(userType).toUpperCase();
    if (result && result !== 'ALL') where.result = String(result).toUpperCase();
    if (isSuspicious === 'true') where.isSuspicious = true;

    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { userName: { contains: String(search), mode: 'insensitive' } },
        { ipAddress: { contains: String(search), mode: 'insensitive' } },
        { failureReason: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.systemLoginLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemLoginLog.count({ where })
    ]);

    res.json({
      success: true,
      data: logs,
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

// 2. Get Login Security Analytics & Failure Rates
export const getLoginSecurityAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalLogins,
      successfulLogins,
      failedLogins,
      suspiciousLogins,
      adminLogins,
      customerLogins,
      mfaChallenges
    ] = await Promise.all([
      prisma.systemLoginLog.count(),
      prisma.systemLoginLog.count({ where: { result: 'SUCCESS' } }),
      prisma.systemLoginLog.count({ where: { result: 'FAILED' } }),
      prisma.systemLoginLog.count({ where: { isSuspicious: true } }),
      prisma.systemLoginLog.count({ where: { userType: 'ADMIN' } }),
      prisma.systemLoginLog.count({ where: { userType: 'CUSTOMER' } }),
      prisma.systemLoginLog.count({ where: { eventType: 'MFA_CHALLENGE' } })
    ]);

    const failureRate = totalLogins > 0 
      ? Number(((failedLogins / totalLogins) * 100).toFixed(2)) 
      : 0;

    res.json({
      success: true,
      data: {
        totalLogins,
        successfulLogins,
        failedLogins,
        failureRate,
        suspiciousLogins,
        adminLogins,
        customerLogins,
        mfaChallenges
      }
    });
  } catch (error) {
    next(error);
  }
};
