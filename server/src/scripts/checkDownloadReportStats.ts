import { prisma } from '../database/db';

async function checkDownloadReportStats() {
  console.log('=== KWD DIGITAL ASSET DELIVERY & DOWNLOAD INTELLIGENCE AUDIT ===\n');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalLogs,
    periodLogs,
    successLogs,
    failedLogs,
    entitlements,
    failures
  ] = await Promise.all([
    prisma.downloadLog.count(),
    prisma.downloadLog.findMany({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.downloadLog.count({ where: { result: 'SUCCESS', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.downloadLog.count({ where: { result: 'FAILED', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.digitalEntitlement.findMany(),
    prisma.downloadFailure.findMany()
  ]);

  const attempts = periodLogs.length;
  const successRate = attempts > 0 ? ((successLogs / attempts) * 100) : 0;

  const validDurations = periodLogs.filter(l => l.durationMs && l.durationMs > 0).map(l => l.durationMs || 0);
  const avgLatency = validDurations.length > 0 ? ((validDurations.reduce((a, b) => a + b, 0) / validDurations.length) / 1000) : 0;

  const paidWithNoDownload = entitlements.filter(e => e.downloadCount === 0 && e.status !== 'REVOKED').length;
  const expiredTokens = entitlements.filter(e => e.status === 'EXPIRED').length;

  console.log(`Total Download Logs in DB: ${totalLogs}`);
  console.log(`Download Attempts (30d): ${attempts}`);
  console.log(`Completed Streams (30d): ${successLogs}`);
  console.log(`Failed Streams (30d): ${failedLogs}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Avg Stream Latency: ${avgLatency.toFixed(2)}s`);
  console.log(`Paid With No Download: ${paidWithNoDownload} Customers`);
  console.log(`Expired Access Tokens: ${expiredTokens}`);
  console.log(`Total Entitlements in DB: ${entitlements.length}`);
  console.log(`Total Download Failures Recorded: ${failures.length}`);

  await prisma.$disconnect();
}

checkDownloadReportStats().catch(err => {
  console.error(err);
  process.exit(1);
});
