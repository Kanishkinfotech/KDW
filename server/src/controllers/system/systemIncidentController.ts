import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get Incidents List
export const getIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, severity, service, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') where.status = String(status).toUpperCase();
    if (severity && severity !== 'ALL') where.severity = String(severity).toUpperCase();
    if (service && service !== 'ALL') where.service = String(service).toUpperCase();

    if (search) {
      where.OR = [
        { incidentNumber: { contains: String(search), mode: 'insensitive' } },
        { title: { contains: String(search), mode: 'insensitive' } },
        { summary: { contains: String(search), mode: 'insensitive' } },
        { rootCause: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [incidents, total] = await Promise.all([
      prisma.systemIncident.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemIncident.count({ where })
    ]);

    res.json({
      success: true,
      data: incidents,
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

// 2. Create New Incident
export const createIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, severity = 'MEDIUM', service = 'API', summary, affectedCustomersCount = 0 } = req.body;
    const authUser = (req as any).user;

    const count = await prisma.systemIncident.count();
    const incidentNumber = `INC-2026-${String(count + 1).padStart(3, '0')}`;

    const incident = await prisma.systemIncident.create({
      data: {
        incidentNumber,
        title,
        severity,
        service,
        status: 'ACTIVE',
        summary: summary || null,
        affectedCustomersCount: parseInt(String(affectedCustomersCount), 10) || 0,
        ownerId: authUser?.id || null,
        ownerName: authUser?.name || 'Administrator',
        createdById: authUser?.id || null
      }
    });

    await prisma.settingAuditLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'ADMIN',
        action: 'CREATED',
        group: 'INCIDENT',
        details: `Created incident '${incident.incidentNumber} - ${incident.title}' (${severity})`
      }
    });

    res.status(201).json({
      success: true,
      message: `Incident ${incident.incidentNumber} opened successfully.`,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update Incident Status / Resolution / Postmortem
export const updateIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, rootCause, actionsTaken, postmortemReport, affectedCustomersCount, ownerName } = req.body;
    const authUser = (req as any).user;

    const existing = await prisma.systemIncident.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (rootCause !== undefined) updateData.rootCause = rootCause;
    if (actionsTaken !== undefined) updateData.actionsTaken = actionsTaken;
    if (postmortemReport !== undefined) updateData.postmortemReport = postmortemReport;
    if (affectedCustomersCount !== undefined) updateData.affectedCustomersCount = parseInt(String(affectedCustomersCount), 10);
    if (ownerName) updateData.ownerName = ownerName;

    if (status === 'MITIGATED' && !existing.mitigatedAt) {
      updateData.mitigatedAt = new Date();
    }
    if (status === 'RESOLVED' && !existing.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.systemIncident.update({
      where: { id },
      data: updateData
    });

    await prisma.settingAuditLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'ADMIN',
        action: 'UPDATED',
        group: 'INCIDENT',
        details: `Updated incident '${existing.incidentNumber}' to status ${status || existing.status}`
      }
    });

    res.json({
      success: true,
      message: `Incident ${existing.incidentNumber} updated successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
