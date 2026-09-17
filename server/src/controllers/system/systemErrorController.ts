import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to sanitize metadata before saving
export const sanitizeErrorMetadata = (body: any, query: any, headers: any): string => {
  const sensitiveKeys = [
    'password',
    'passwordhash',
    'token',
    'authtoken',
    'adminauth',
    'authorization',
    'cookie',
    'razorpay_key_secret',
    'secret',
    'key_secret',
    'apikey',
    'api_key',
    'credit_card',
    'card_number',
    'cvv'
  ];

  const sanitizeObj = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObj);

    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const lowerKey = k.toLowerCase().replace(/[-_]/g, '');
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        clean[k] = '[REDACTED]';
      } else if (typeof v === 'object') {
        clean[k] = sanitizeObj(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  };

  try {
    return JSON.stringify({
      body: sanitizeObj(body),
      query: sanitizeObj(query),
      headers: {
        host: headers?.host,
        referer: headers?.referer,
        origin: headers?.origin,
        'user-agent': headers?.['user-agent']
      }
    });
  } catch {
    return '{}';
  }
};

// Global Error Logger Utility (called by Express error middleware)
export const logSystemError = async (
  err: any,
  req: Request,
  statusCode: number = 500
) => {
  try {
    const message = err.message || (typeof err === 'string' ? err : 'Unknown System Exception');
    const stack = err.stack || (typeof err === 'string' ? err : null);
    const method = req.method || 'GET';
    const path = req.originalUrl || req.url || '';
    const endpoint = `${method} ${path}`.trim();
    const userId = (req as any).user?.id || null;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || req.ip || null;
    const userAgent = (req.headers['user-agent'] as string) || null;
    const metadata = sanitizeErrorMetadata(req.body, req.query, req.headers);

    const severity = statusCode >= 500 ? 'CRITICAL' : 'ERROR';
    const errorCode = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR');

    await prisma.systemErrorLog.create({
      data: {
        errorCode: String(errorCode).slice(0, 100),
        severity,
        service: 'API',
        environment: process.env.NODE_ENV || 'PRODUCTION',
        message: String(message).slice(0, 1000),
        stackTrace: stack,
        stack,
        method,
        path,
        endpoint,
        statusCode,
        status: 'OPEN',
        userId,
        actorId: userId,
        actorName: (req as any).user?.name || null,
        ip,
        userAgent,
        metadata
      }
    });
  } catch (logErr) {
    // Non-blocking: Logging failure must NEVER break error responses
    console.error('Failed to persist SystemErrorLog:', logErr);
  }
};

// 1. Get System Error Logs with Filters and Pagination
export const getSystemErrors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, method, search, page = '1', limit = '20', service, severity } = req.query;
    const where: any = {};

    // Status filtering
    if (status && status !== 'ALL' && status !== 'all') {
      const statusUpper = String(status).toUpperCase();
      if (statusUpper === 'OPEN' || statusUpper === 'UNRESOLVED') {
        where.status = { in: ['OPEN', 'UNRESOLVED', 'ACKNOWLEDGED', 'INVESTIGATING'] };
      } else if (statusUpper === 'RESOLVED') {
        where.status = 'RESOLVED';
      } else {
        where.status = statusUpper;
      }
    }

    // Method filtering
    if (method && method !== 'ALL' && method !== 'all') {
      where.method = { equals: String(method).toUpperCase(), mode: 'insensitive' };
    }

    // Service & Severity filters
    if (service && service !== 'ALL') where.service = String(service).toUpperCase();
    if (severity && severity !== 'ALL') where.severity = String(severity).toUpperCase();

    // Search
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { message: { contains: q, mode: 'insensitive' } },
        { path: { contains: q, mode: 'insensitive' } },
        { endpoint: { contains: q, mode: 'insensitive' } },
        { errorCode: { contains: q, mode: 'insensitive' } },
        { stackTrace: { contains: q, mode: 'insensitive' } },
        { resolutionNote: { contains: q, mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * take;

    const [errors, total] = await Promise.all([
      prisma.systemErrorLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemErrorLog.count({ where })
    ]);

    res.json({
      success: true,
      data: errors,
      errors,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Real Error Statistics
export const getSystemErrorStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, open, resolved, last24h, critical] = await Promise.all([
      // Total count
      prisma.systemErrorLog.count(),

      // Open count
      prisma.systemErrorLog.count({
        where: { status: { in: ['OPEN', 'UNRESOLVED', 'ACKNOWLEDGED', 'INVESTIGATING'] } }
      }),

      // Resolved count
      prisma.systemErrorLog.count({
        where: { status: 'RESOLVED' }
      }),

      // Last 24 Hours count
      prisma.systemErrorLog.count({
        where: { createdAt: { gte: twentyFourHoursAgo } }
      }),

      // Critical Open 5xx count
      prisma.systemErrorLog.count({
        where: {
          status: { in: ['OPEN', 'UNRESOLVED', 'ACKNOWLEDGED', 'INVESTIGATING'] },
          OR: [
            { statusCode: { gte: 500, lt: 600 } },
            { severity: 'CRITICAL' }
          ]
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        open,
        resolved,
        last24h,
        critical
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Error Log Detail
export const getSystemErrorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const errorLog = await prisma.systemErrorLog.findUnique({ where: { id } });

    if (!errorLog) {
      return res.status(404).json({ success: false, message: 'System error record not found' });
    }

    res.json({ success: true, data: errorLog, error: errorLog });
  } catch (error) {
    next(error);
  }
};

// 4. Resolve Error Log (PATCH / POST)
export const resolveSystemError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const note = req.body.note || req.body.resolutionNote || 'Resolved by administrator';
    const authUser = (req as any).user;

    const existing = await prisma.systemErrorLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'System error record not found' });
    }

    const updated = await prisma.systemErrorLog.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedById: authUser?.id || null,
        assignedOwner: authUser?.name || 'Administrator',
        assignedOwnerId: authUser?.id || null,
        resolutionNote: String(note).trim()
      }
    });

    res.json({
      success: true,
      message: 'System error marked as resolved.',
      data: updated,
      error: updated
    });
  } catch (error) {
    next(error);
  }
};

// 5. Reopen Error Log (PATCH)
export const reopenSystemError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.systemErrorLog.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'System error record not found' });
    }

    const updated = await prisma.systemErrorLog.update({
      where: { id },
      data: {
        status: 'OPEN',
        resolvedAt: null,
        resolvedById: null,
        resolutionNote: null
      }
    });

    res.json({
      success: true,
      message: 'System error reopened.',
      data: updated,
      error: updated
    });
  } catch (error) {
    next(error);
  }
};

// 6. Acknowledge Error Log
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

// 7. Escalate Error to Formal Incident
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

// 8. Get Error Trends by Service and Severity
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

// 9. Clear All / Purge Error Logs
export const clearAllSystemErrors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status === 'RESOLVED') {
      where.status = 'RESOLVED';
    } else if (status === 'OPEN') {
      where.status = { in: ['OPEN', 'UNRESOLVED', 'ACKNOWLEDGED', 'INVESTIGATING'] };
    }

    const result = await prisma.systemErrorLog.deleteMany({ where });

    res.json({
      success: true,
      message: `Cleared ${result.count} error log record(s) successfully.`,
      count: result.count
    });
  } catch (error) {
    next(error);
  }
};

// 10. Delete Single Error Log
export const deleteSystemErrorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.systemErrorLog.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Error log record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

