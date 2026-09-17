import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const parseDateRange = (range: string | undefined, from?: string, to?: string) => {
  const now = new Date();
  let start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let end = new Date(now.getTime());

  if (from && to) {
    return { start: new Date(from), end: new Date(to) };
  }

  if (range === 'today' || range === '24h') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === '7d' || range === '7days') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d' || range === '30days') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '90d' || range === '90days') {
    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (range === 'year' || range === 'this_year') {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return { start, end };
};

// ============================================================================
// 1. DOWNLOAD OVERVIEW
// ============================================================================
// 1. DOWNLOAD OVERVIEW
// ============================================================================
export const getDownloadOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range = '30d', from, to } = req.query;
    const { start, end } = parseDateRange(String(range), from as string, to as string);

    const [logs, entitlements, failures, driveErrors, expiredTokensCount] = await Promise.all([
      prisma.downloadLog.findMany({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.digitalEntitlement.findMany({ where: { createdAt: { lte: end } } }),
      prisma.downloadFailure.count({ where: { isResolved: false } }),
      prisma.downloadFailure.count({
        where: {
          failureCategory: { in: ['Drive file missing', 'Drive permission denied', 'Drive quota exceeded'] },
          isResolved: false
        }
      }),
      prisma.downloadToken.count({
        where: {
          OR: [
            { status: 'EXPIRED' },
            { expiresAt: { lt: new Date() } }
          ]
        }
      })
    ]);

    const attempts = logs.length;
    const successes = logs.filter(l => l.result === 'SUCCESS').length;
    const failedDownloads = logs.filter(l => l.result === 'FAILED').length;
    const successRate = attempts > 0 ? parseFloat(((successes / attempts) * 100).toFixed(1)) : 0;

    const activeEntitlements = entitlements.filter(e => e.status === 'ACTIVE' || e.status === 'PARTIALLY_DOWNLOADED' || e.status === 'DOWNLOADED');
    const customersWithNoDownload = entitlements.filter(e => e.downloadCount === 0 && e.status !== 'REVOKED').length;

    // Real unique customers who hold entitlements vs who completed >= 1 download
    const uniqueEntitlementHolders = new Set(activeEntitlements.map(e => e.customerEmail || e.customerId).filter(Boolean));
    const uniqueDownloadedHolders = new Set(
      activeEntitlements.filter(e => e.downloadCount > 0).map(e => e.customerEmail || e.customerId).filter(Boolean)
    );

    const customerCompletionRate = uniqueEntitlementHolders.size > 0
      ? parseFloat(((uniqueDownloadedHolders.size / uniqueEntitlementHolders.size) * 100).toFixed(1))
      : 0;

    const expiredEntitlementsCount = entitlements.filter(e => e.status === 'EXPIRED' || (e.accessExpiresAt && new Date(e.accessExpiresAt) < new Date())).length;
    const totalExpiredAccess = expiredTokensCount + expiredEntitlementsCount;
    const limitReachedAttempts = logs.filter(l => l.eventType === 'limit_reached').length;

    const validDurations = logs.filter(l => l.durationMs && l.durationMs > 0).map(l => l.durationMs || 0);
    const avgDuration = validDurations.length > 0
      ? (validDurations.reduce((a, b) => a + b, 0) / validDurations.length) / 1000
      : 0;

    const driveHealthStatus = driveErrors > 0
      ? `${Math.max(0, 100 - driveErrors * 10)}% DEGRADED`
      : '100% OPERATIONAL';

    res.json({
      success: true,
      kpis: {
        totalDownloadAttempts: attempts,
        successfulDownloads: successes,
        failedDownloads,
        downloadSuccessRate: successRate,
        customerCompletionRate,
        uniqueDownloadingCustomers: uniqueDownloadedHolders.size,
        customersWithNoDownload,
        expiredAccess: totalExpiredAccess,
        limitReachedAttempts,
        drivePermissionErrors: driveErrors,
        driveServiceHealth: driveHealthStatus,
        averageDownloadDurationSeconds: parseFloat(avgDuration.toFixed(2))
      },
      metadata: {
        range,
        timezone: 'Asia/Kolkata',
        formulas: {
          successRate: attempts > 0 ? '(Successful Downloads / Total Download Attempts) * 100' : '0% (No stream attempts)',
          customerCompletion: uniqueEntitlementHolders.size > 0
            ? '(Entitlement Holders With >= 1 Download / Total Entitlement Holders) * 100'
            : '0% (No active entitlement holders)'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. DOWNLOADS BY PRODUCT
// ============================================================================
export const getDownloadsByProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range = '30d', from, to } = req.query;
    const { start, end } = parseDateRange(String(range), from as string, to as string);

    const [products, entitlements, logs] = await Promise.all([
      prisma.product.findMany({
        select: { id: true, name: true, slug: true, status: true, version: true },
        orderBy: { name: 'asc' }
      }),
      prisma.digitalEntitlement.findMany({
        where: {
          status: { in: ['ACTIVE', 'PARTIALLY_DOWNLOADED', 'DOWNLOADED'] }
        }
      }),
      prisma.downloadLog.findMany({
        where: { createdAt: { gte: start, lte: end } }
      })
    ]);

    const productStats = products.map(p => {
      const prodEnts = entitlements.filter(e => e.productId === p.id);
      const prodLogs = logs.filter(l => l.productId === p.id);
      const successes = prodLogs.filter(l => l.result === 'SUCCESS').length;
      const failed = prodLogs.filter(l => l.result === 'FAILED').length;
      const totalAttempts = prodLogs.length;
      const successRate = totalAttempts > 0 ? parseFloat(((successes / totalAttempts) * 100).toFixed(1)) : 0;

      return {
        id: p.id,
        name: p.name,
        entitlementsCount: prodEnts.length,
        attemptsCount: totalAttempts,
        successfulDownloads: successes,
        failedDownloads: failed,
        successRate
      };
    });

    res.json({
      success: true,
      data: productStats.sort((a, b) => b.entitlementsCount - a.entitlementsCount || b.attemptsCount - a.attemptsCount)
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. DOWNLOADS BY VERSION & REGRESSION DETECTION
// ============================================================================
export const getDownloadsByVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { range = '30d', from, to } = req.query;
    const { start, end } = parseDateRange(String(range), from as string, to as string);

    const [logs, products] = await Promise.all([
      prisma.downloadLog.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.findMany({
        select: { id: true, name: true, version: true, status: true }
      })
    ]);

    const versionMap: Record<string, {
      productName: string;
      version: string;
      attempts: number;
      successes: number;
      failed: number;
      totalDurationMs: number;
      durationSamplesCount: number;
    }> = {};

    // 1. Populate catalog products with configured version
    products.forEach(p => {
      const v = p.version || '1.0.0';
      const key = `${p.name}__v${v}`;
      if (!versionMap[key]) {
        versionMap[key] = {
          productName: p.name,
          version: v,
          attempts: 0,
          successes: 0,
          failed: 0,
          totalDurationMs: 0,
          durationSamplesCount: 0
        };
      }
    });

    // 2. Aggregate logs
    logs.forEach(l => {
      const v = l.productVersion || '1.0.0';
      const key = `${l.productName}__v${v}`;
      if (!versionMap[key]) {
        versionMap[key] = {
          productName: l.productName,
          version: v,
          attempts: 0,
          successes: 0,
          failed: 0,
          totalDurationMs: 0,
          durationSamplesCount: 0
        };
      }
      versionMap[key].attempts += 1;
      if (l.result === 'SUCCESS') {
        versionMap[key].successes += 1;
      } else {
        versionMap[key].failed += 1;
      }
      if (l.durationMs && l.durationMs > 0) {
        versionMap[key].totalDurationMs += l.durationMs;
        versionMap[key].durationSamplesCount += 1;
      }
    });

    const versionStats = Object.values(versionMap).map(v => ({
      productName: v.productName,
      version: v.version,
      attempts: v.attempts,
      successes: v.successes,
      failed: v.failed,
      successRate: v.attempts > 0 ? parseFloat(((v.successes / v.attempts) * 100).toFixed(1)) : 0,
      avgDurationSeconds: v.durationSamplesCount > 0
        ? parseFloat(((v.totalDurationMs / v.durationSamplesCount) / 1000).toFixed(2))
        : 0
    }));

    res.json({
      success: true,
      data: versionStats.sort((a, b) => b.attempts - a.attempts || a.productName.localeCompare(b.productName))
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. GUEST DOWNLOADS LIFECYCLE
// ============================================================================
export const getGuestDownloads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guestOrders = await prisma.order.findMany({
      where: {
        OR: [
          { customerType: 'GUEST' },
          { customerId: null, guestEmail: { not: null } }
        ],
        paymentStatus: 'PAID'
      },
      include: {
        digitalEntitlements: {
          include: {
            tokens: true,
            logs: true
          }
        },
        guestClaims: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalGuestOrders = guestOrders.length;
    const emailsDelivered = guestOrders.filter(o =>
      o.emailDeliveryStatus === 'DELIVERED' || o.emailDeliveryStatus === 'SENT' || (o.fulfilledAt && o.emailDeliveryStatus !== 'FAILED')
    ).length;

    let linkOpens = 0;
    let downloadsStarted = 0;
    let downloadsCompleted = 0;
    let expiredTokens = 0;
    const now = new Date();

    guestOrders.forEach(o => {
      let orderHasDownload = false;
      let orderHasOpen = false;

      o.digitalEntitlements.forEach(e => {
        if (e.downloadCount > 0) orderHasDownload = true;

        e.tokens.forEach(t => {
          if (t.lastUsedAt || t.status === 'USED') orderHasOpen = true;
          if (t.status === 'EXPIRED' || (t.expiresAt && t.expiresAt < now)) expiredTokens += 1;
        });

        if (e.logs && e.logs.length > 0) {
          orderHasOpen = true;
          downloadsStarted += e.logs.length;
        }
      });

      if (orderHasOpen) linkOpens += 1;
      if (orderHasDownload) downloadsCompleted += 1;
    });

    const ordersLaterClaimed = guestOrders.filter(o =>
      (o.guestClaims && o.guestClaims.length > 0) || o.claimedAccountId !== null || o.claimedAt !== null
    ).length;

    const guestOrderList = guestOrders.map(o => {
      const allTokens = o.digitalEntitlements.flatMap(e => e.tokens);
      const allLogs = o.digitalEntitlements.flatMap(e => e.logs);
      const isDownloaded = o.digitalEntitlements.some(e => e.downloadCount > 0);
      const isClaimed = (o.guestClaims && o.guestClaims.length > 0) || Boolean(o.claimedAccountId);

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        guestEmail: o.guestEmail,
        amount: o.totalAmount,
        createdAt: o.createdAt,
        entitlementsCount: o.digitalEntitlements.length,
        tokensGenerated: allTokens.length,
        downloadsCount: allLogs.filter(l => l.result === 'SUCCESS').length,
        status: isClaimed ? 'CLAIMED' : isDownloaded ? 'DOWNLOADED' : 'PENDING_DOWNLOAD'
      };
    });

    res.json({
      success: true,
      lifecycle: {
        paidGuestOrders: totalGuestOrders,
        accessEmailsDelivered: emailsDelivered,
        linkOpens,
        downloadsStarted,
        downloadsCompleted,
        expiredTokens,
        ordersLaterClaimed
      },
      orders: guestOrderList
    });
  } catch (error) {
    next(error);
  }
};
