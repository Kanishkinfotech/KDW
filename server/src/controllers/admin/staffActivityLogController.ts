import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStaffActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, resourceType, riskLevel, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (action && action !== 'ALL') where.action = String(action);
    if (resourceType && resourceType !== 'ALL') where.resourceType = String(resourceType);
    if (riskLevel && riskLevel !== 'ALL') where.riskLevel = String(riskLevel).toUpperCase();

    if (search) {
      where.OR = [
        { actorEmail: { contains: String(search), mode: 'insensitive' } },
        { actorName: { contains: String(search), mode: 'insensitive' } },
        { reason: { contains: String(search), mode: 'insensitive' } },
        { action: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.staffActivityLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.staffActivityLog.count({ where })
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
