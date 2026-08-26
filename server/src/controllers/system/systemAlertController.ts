import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get Monitoring Alerts
export const getMonitoringAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, severity, source, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') where.status = String(status).toUpperCase();
    if (severity && severity !== 'ALL') where.severity = String(severity).toUpperCase();
    if (source && source !== 'ALL') where.source = String(source).toUpperCase();

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { message: { contains: String(search), mode: 'insensitive' } },
        { alertType: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [alerts, total] = await Promise.all([
      prisma.systemMonitoringAlert.findMany({
        where,
        skip,
        take,
        orderBy: { lastDetectedAt: 'desc' }
      }),
      prisma.systemMonitoringAlert.count({ where })
    ]);

    res.json({
      success: true,
      data: alerts,
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

// 2. Acknowledge Alert
export const acknowledgeAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const updated = await prisma.systemMonitoringAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        ownerId: authUser?.id || null,
        ownerName: authUser?.name || 'Administrator'
      }
    });

    res.json({
      success: true,
      message: 'Monitoring alert acknowledged.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 3. Resolve Alert
export const resolveAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const updated = await prisma.systemMonitoringAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Monitoring alert resolved.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get System Threshold Rules
export const getThresholdRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await prisma.systemThresholdRule.findMany({
      orderBy: { category: 'asc' }
    });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update Threshold Rule
export const updateThresholdRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { warningThreshold, criticalThreshold, isEnabled } = req.body;
    const authUser = (req as any).user;

    const updated = await prisma.systemThresholdRule.update({
      where: { id },
      data: {
        warningThreshold: parseFloat(String(warningThreshold)),
        criticalThreshold: parseFloat(String(criticalThreshold)),
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        updatedByName: authUser?.name || 'Administrator'
      }
    });

    await prisma.settingAuditLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'ADMIN',
        action: 'UPDATED',
        group: 'SYSTEM',
        details: `Updated threshold rule '${updated.metricName}' (Warn: ${warningThreshold}${updated.unit}, Crit: ${criticalThreshold}${updated.unit})`
      }
    });

    res.json({
      success: true,
      message: `Threshold rule '${updated.metricName}' saved successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
