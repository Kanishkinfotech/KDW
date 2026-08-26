import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'system-admin',
    name: user.name || 'Administrator',
    email: user.email || 'admin@kdw.com'
  };
};

export const getReportAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category = 'ALL', status = 'ALL', severity = 'ALL' } = req.query;

    const where: any = {};
    if (category && category !== 'ALL') where.category = String(category);
    if (status && status !== 'ALL') where.status = String(status);
    if (severity && severity !== 'ALL') where.severity = String(severity);

    const alerts = await prisma.reportAlert.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take: 50
    });

    const openCount = await prisma.reportAlert.count({ where: { status: 'OPEN' } });

    res.json({
      success: true,
      openCount,
      alerts
    });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);

    const alert = await prisma.reportAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: actor.email
      }
    });

    res.json({ success: true, alert, message: 'Alert acknowledged.' });
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);
    const { notes } = req.body;

    const alert = await prisma.reportAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: actor.email,
        resolutionNotes: notes || 'Resolved by administrator'
      }
    });

    res.json({ success: true, alert, message: 'Alert resolved.' });
  } catch (error) {
    next(error);
  }
};

export const dismissAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const id = String(req.params.id);

    const alert = await prisma.reportAlert.update({
      where: { id },
      data: { status: 'DISMISSED' }
    });

    res.json({ success: true, alert, message: 'Alert dismissed.' });
  } catch (error) {
    next(error);
  }
};
