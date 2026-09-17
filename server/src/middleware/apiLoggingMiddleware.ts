import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const apiTelemetryLogger = (req: Request, res: Response, next: NextFunction) => {
  // Only capture /api requests, skip static files and health ping to avoid clutter
  if (!req.originalUrl.startsWith('/api') || req.originalUrl === '/api/health') {
    return next();
  }

  const startHrTime = process.hrtime();
  const requestId = 'req_' + crypto.randomBytes(6).toString('hex');
  (req as any).requestId = requestId;

  // Intercept response finish
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const latencyMs = Math.round((elapsedHrTime[0] * 1000) + (elapsedHrTime[1] / 1e6));
    const statusCode = res.statusCode;

    // Do not record high-frequency polling calls if successful to preserve performance
    if (req.originalUrl.includes('/api/admin/system/api-logs')) {
      return;
    }

    const rawIp = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '127.0.0.1';
    const clientIp = rawIp.split(',')[0].trim().replace(/^.*:/, '') || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || null;
    const authUser = (req as any).user;
    const responseSizeBytes = parseInt(String(res.getHeader('content-length') || '0'), 10);

    // Non-blocking asynchronous log creation
    prisma.systemApiLog.create({
      data: {
        requestId,
        method: req.method,
        endpoint: req.originalUrl.split('?')[0],
        statusCode,
        latencyMs: Math.max(1, latencyMs),
        actorId: authUser?.id || null,
        actorRole: authUser?.role || (req.originalUrl.startsWith('/api/admin') ? 'ADMIN' : 'ANONYMOUS'),
        ipAddress: clientIp,
        userAgent: userAgent ? userAgent.slice(0, 255) : null,
        responseSizeBytes: isNaN(responseSizeBytes) ? 0 : responseSizeBytes
      }
    }).catch(err => {
      // Never throw or affect the response lifecycle
      console.error('Failed to log SystemApiLog:', err.message);
    });
  });

  next();
};
