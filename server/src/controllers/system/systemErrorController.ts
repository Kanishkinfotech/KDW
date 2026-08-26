import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get System Error Logs with Filters and Pagination
export const getSystemErrors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { service, severity, status, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (service && service !== 'ALL') where.service = String(service).toUpperCase();
    if (severity && severity !== 'ALL') where.severity = String(severity).toUpperCase();
    if (status && status !== 'ALL') where.status = String(status).toUpperCase();

    if (search) {
      where.OR = [
        { errorCode: { contains: String(search), mode: 'insensitive' } },
        { message: { contains: String(search), mode: 'insensitive' } },
        { endpoint: { contains: String(search), mode: 'insensitive' } },
        { orderId: { contains: String(search), mode: 'insensitive' } },
        { customerEmail: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [errors, total] = await Promise.all([
      prisma.systemErrorLog.findMany({
        where,
        skip,
        take,
        orderBy: { lastSeenAt: 'desc' }
      }),
      prisma.systemErrorLog.count({ where })
    ]);

    res.json({
      success: true,
      data: errors,
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

// 2. Get Single Error Log Detail
export const getSystemErrorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const errorLog = await prisma.systemErrorLog.findUnique({ where: { id } });

    if (!errorLog) {
      return res.status(404).json({ success: false, message: 'System error record not found' });
    }

    res.json({ success: true, data: errorLog });
  } catch (error) {
    next(error);
  }
};

// 3. Acknowledge Error Log
export const acknowledgeSystemError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const updated = await prisma.systemErrorLog.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        assignedOwner: authUser?.name || 'Administrator',
        assignedOwnerId: authUser?.id || null
      }
    });

    res.json({
      success: true,
      message: `Error acknowledged by ${authUser?.name || 'Staff'}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Resolve Error Log
export const resolveSystemError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { resolutionNote } = req.body;
    const authUser = (req as any).user;

    const updated = await prisma.systemErrorLog.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || 'Resolved by engineering staff'
      }
    });

    res.json({
      success: true,
      message: 'System error marked as resolved.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 5. Escalate Error to Formal Incident
export const escalateErrorToIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { title, severity = 'HIGH' } = req.body;
    const authUser = (req as any).user;

    const errorLog = await prisma.systemErrorLog.findUnique({ where: { id } });
    if (!errorLog) {
      return res.status(404).json({ success: false, message: 'Error log not found' });
    }

    const count = await prisma.systemIncident.count();
    const incidentNumber = `INC-2026-${String(count + 1).padStart(3, '0')}`;

    const incident = await prisma.$transaction(async (tx) => {
      const inc = await tx.systemIncident.create({
        data: {
          incidentNumber,
          title: title || `Incident: ${errorLog.errorCode} (${errorLog.service})`,
          severity,
          service: errorLog.service,
          status: 'ACTIVE',
          summary: errorLog.message,
          ownerId: authUser?.id || null,
          ownerName: authUser?.name || 'Staff Lead',
          createdById: authUser?.id || null
        }
      });

      await tx.systemErrorLog.update({
        where: { id },
        data: { status: 'INVESTIGATING', assignedOwner: authUser?.name || 'Incident Response' }
      });

      return inc;
    });

    res.status(201).json({
      success: true,
      message: `Incident ${incident.incidentNumber} created from error record.`,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get Error Trends by Service and Severity
export const getErrorTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [byService, bySeverity, recentErrors] = await Promise.all([
      prisma.systemErrorLog.groupBy({
        by: ['service'],
        _count: { id: true },
        _sum: { occurrenceCount: true }
      }),
      prisma.systemErrorLog.groupBy({
        by: ['severity'],
        _count: { id: true }
      }),
      prisma.systemErrorLog.findMany({
        take: 10,
        orderBy: { occurrenceCount: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: {
        byService,
        bySeverity,
        topRecurringErrors: recentErrors
      }
    });
  } catch (error) {
    next(error);
  }
};
