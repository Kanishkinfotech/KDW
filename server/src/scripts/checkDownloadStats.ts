import { prisma } from '../database/db';

async function checkDownloadStats() {
  const [
    totalLogs,
    logsSample,
    totalFailures,
    totalEntitlements,
    totalTokens,
    totalOverrides,
    totalFilesHealth
  ] = await Promise.all([
    prisma.downloadLog.count(),
    prisma.downloadLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.downloadFailure.count(),
    prisma.digitalEntitlement.count(),
    prisma.downloadToken.count(),
    prisma.downloadOverride.count(),
    prisma.productFileHealth.count()
  ]);

  console.log('=== KWD DOWNLOAD MANAGEMENT DB AUDIT ===');
  console.log(`Total DownloadLogs in DB: ${totalLogs}`);
  console.log(`Total DownloadFailures in DB: ${totalFailures}`);
  console.log(`Total DigitalEntitlements in DB: ${totalEntitlements}`);
  console.log(`Total DownloadTokens in DB: ${totalTokens}`);
  console.log(`Total DownloadOverrides in DB: ${totalOverrides}`);
  console.log(`Total ProductFileHealth in DB: ${totalFilesHealth}`);

  if (logsSample.length > 0) {
    console.log('\nSample DownloadLogs:');
    console.log(JSON.stringify(logsSample, null, 2));
  } else {
    console.log('\n(No DownloadLog records in DB yet)');
  }

  await prisma.$disconnect();
}

checkDownloadStats().catch(err => {
  console.error(err);
  process.exit(1);
});
