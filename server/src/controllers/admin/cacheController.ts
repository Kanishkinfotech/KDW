import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { cacheService } from './cacheService';

const prisma = new PrismaClient();

// 1. Get Cache Overview & Live Telemetry
export const getCacheOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = cacheService.getStats();
    const [namespacesCount, failedEventsCount, recentMaintenance] = await Promise.all([
      prisma.cacheNamespaceConfig.count(),
      prisma.cacheInvalidationEvent.count({ where: { status: 'FAILED' } }),
      prisma.cacheMaintenanceLog.findFirst({ orderBy: { createdAt: 'desc' } })
    ]);

    res.json({
      success: true,
      data: {
        stats,
        namespacesCount,
        failedEventsCount,
        lastMaintenance: recentMaintenance
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Cache Keys with Namespace & Environment Filter
export const getCacheKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { namespace, environment, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (namespace && namespace !== 'ALL') where.namespace = String(namespace);
    if (environment && environment !== 'ALL') where.environment = String(environment).toUpperCase();

    if (search) {
      where.key = { contains: String(search), mode: 'insensitive' };
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [keys, total] = await Promise.all([
      prisma.cacheEntry.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.cacheEntry.count({ where })
    ]);

    res.json({
      success: true,
      data: keys,
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

// 3. Get Cache Namespaces Configuration & Stats
export const getCacheNamespaces = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const namespaces = await prisma.cacheNamespaceConfig.findMany({
      orderBy: { namespace: 'asc' }
    });

    const namespaceStats = await Promise.all(
      namespaces.map(async (ns) => {
        const keyCount = await prisma.cacheEntry.count({ where: { namespace: ns.namespace } });
        return {
          ...ns,
          keyCount,
          invalidationTriggers: JSON.parse(ns.invalidationTriggers || '[]')
        };
      })
    );

    res.json({
      success: true,
      data: namespaceStats
    });
  } catch (error) {
    next(error);
  }
};

// 4. Invalidation Events & Failed Jobs
export const getInvalidationEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '25' } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status).toUpperCase();

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [events, total] = await Promise.all([
      prisma.cacheInvalidationEvent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cacheInvalidationEvent.count({ where })
    ]);

    res.json({
      success: true,
      data: events,
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

// 5. Retry Invalidation Event
export const retryInvalidationEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const event = await prisma.cacheInvalidationEvent.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Invalidation event not found' });
    }

    // Perform cache clear for keyPattern
    if (event.keyPattern.includes('*')) {
      await cacheService.clearNamespace(event.namespace);
    } else {
      await cacheService.delete(event.keyPattern);
    }

    const updated = await prisma.cacheInvalidationEvent.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        retryCount: event.retryCount + 1,
        processedAt: new Date(),
        failureReason: null
      }
    });

    await prisma.staffActivityLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorEmail: authUser?.email || 'admin@kanishkdigitalworld.com',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        action: 'CACHE_INVALIDATION_REPLAYED',
        resourceType: 'CACHE',
        resourceId: event.id,
        reason: 'Manual admin retry of failed invalidation event'
      }
    });

    res.json({
      success: true,
      message: `Invalidation event '${event.eventType}' reprocessed and cache cleared.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 6. Clear Single Key
export const clearSingleKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.body;
    const authUser = (req as any).user;

    if (!key) {
      return res.status(400).json({ success: false, message: 'Key is required' });
    }

    await cacheService.delete(key);

    await prisma.cacheMaintenanceLog.create({
      data: {
        action: 'CLEAR_KEY',
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        namespace: key.split(':')[0] || 'general',
        keysAffected: 1,
        reason: `Manually cleared key '${key}'`,
        result: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `Cache key '${key}' cleared successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// 7. Clear Namespace
export const clearNamespace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { namespace, reason } = req.body;
    const authUser = (req as any).user;

    if (!namespace) {
      return res.status(400).json({ success: false, message: 'Namespace is required' });
    }

    const clearedCount = await cacheService.clearNamespace(namespace);

    await prisma.cacheMaintenanceLog.create({
      data: {
        action: 'CLEAR_NAMESPACE',
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        namespace,
        keysAffected: clearedCount,
        reason: reason || `Purged namespace '${namespace}'`,
        result: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `Namespace '${namespace}' cleared (${clearedCount} keys evicted).`
    });
  } catch (error) {
    next(error);
  }
};

// 8. Clear All Cache (High-Risk)
export const clearAllCache = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const authUser = (req as any).user;

    const clearedCount = await cacheService.clearAll();

    await prisma.cacheMaintenanceLog.create({
      data: {
        action: 'CLEAR_ALL',
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        keysAffected: clearedCount,
        reason: reason || 'Emergency full cache purge',
        result: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `Complete cache purged (${clearedCount} keys evicted across all namespaces).`
    });
  } catch (error) {
    next(error);
  }
};

// 9. Warm Cache
export const warmCache = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const result = await cacheService.warmCache();

    await prisma.cacheMaintenanceLog.create({
      data: {
        action: 'WARM',
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        keysAffected: result.warmedProducts + result.warmedCategories,
        reason: 'Warmed top products and category listings',
        result: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `Cache warmed successfully (${result.warmedProducts} products, ${result.warmedCategories} categories).`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// 10. Run Cache Maintenance
export const runCacheMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body;
    const authUser = (req as any).user;

    let affected = 0;
    if (action === 'EXPIRED_CLEANUP') {
      affected = cacheService.evictExpired();
    } else if (action === 'REBUILD') {
      const warm = await cacheService.warmCache();
      affected = warm.warmedProducts + warm.warmedCategories;
    } else if (action === 'MEMORY_CLEANUP') {
      affected = cacheService.evictExpired();
    }

    const log = await prisma.cacheMaintenanceLog.create({
      data: {
        action: action || 'EXPIRED_CLEANUP',
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'SUPER_ADMIN',
        keysAffected: affected,
        reason: `Automated maintenance run: ${action}`,
        result: 'SUCCESS'
      }
    });

    res.json({
      success: true,
      message: `Maintenance action '${action}' completed (${affected} keys affected).`,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

// 11. Get Maintenance Logs
export const getMaintenanceLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.cacheMaintenanceLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
