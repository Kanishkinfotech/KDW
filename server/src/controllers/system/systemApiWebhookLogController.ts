import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get API Request Telemetry Logs
export const getApiLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, statusCode, minLatency, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (endpoint) where.endpoint = { contains: String(endpoint), mode: 'insensitive' };
    if (statusCode) where.statusCode = parseInt(String(statusCode), 10);
    if (minLatency) where.latencyMs = { gte: parseInt(String(minLatency), 10) };

    if (search) {
      where.OR = [
        { requestId: { contains: String(search), mode: 'insensitive' } },
        { endpoint: { contains: String(search), mode: 'insensitive' } },
        { ipAddress: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.systemApiLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemApiLog.count({ where })
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

// 2. Get Webhook Delivery Logs
export const getWebhookLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, status, eventType, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (provider && provider !== 'ALL') where.provider = String(provider).toUpperCase();
    if (status && status !== 'ALL') where.status = String(status).toUpperCase();
    if (eventType) where.eventType = { contains: String(eventType), mode: 'insensitive' };

    if (search) {
      where.OR = [
        { externalEventId: { contains: String(search), mode: 'insensitive' } },
        { relatedOrderId: { contains: String(search), mode: 'insensitive' } },
        { eventType: { contains: String(search), mode: 'insensitive' } },
        { errorMessage: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.systemWebhookLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemWebhookLog.count({ where })
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

// 3. Replay Webhook Event
export const replayWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const webhookLog = await prisma.systemWebhookLog.findUnique({ where: { id } });
    if (!webhookLog) {
      return res.status(404).json({ success: false, message: 'Webhook record not found' });
    }

    const updated = await prisma.systemWebhookLog.update({
      where: { id },
      data: {
        status: 'REPLAYED',
        retryCount: webhookLog.retryCount + 1,
        processedAt: new Date(),
        errorMessage: null
      }
    });

    // Create Audit Record
    await prisma.settingAuditLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'ADMIN',
        action: 'UPDATED',
        group: 'SYSTEM',
        details: `Replayed webhook event '${webhookLog.eventType}' (ID: ${webhookLog.id})`
      }
    });

    res.json({
      success: true,
      message: `Webhook event '${webhookLog.eventType}' replayed successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
