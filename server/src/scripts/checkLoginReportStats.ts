import { prisma } from '../database/db';

async function checkLoginReportStats() {
  console.log('=== KWD CUSTOMER AUTHENTICATION & SECURITY AUDIT ===\n');

  const [
    loginLogsCount,
    successfulLogins,
    failedLogins,
    sessionsCount,
    activeSessions,
    guestClaims,
    securityEvents,
    openSecurityEvents,
    totalUsers
  ] = await Promise.all([
    prisma.customerLoginLog.count(),
    prisma.customerLoginLog.count({ where: { result: 'SUCCESS' } }),
    prisma.customerLoginLog.count({ where: { result: 'FAILED' } }),
    prisma.customerSession.count(),
    prisma.customerSession.count({ where: { isRevoked: false, expiresAt: { gt: new Date() } } }),
    prisma.guestOrderClaim.count(),
    prisma.customerSecurityEvent.count(),
    prisma.customerSecurityEvent.count({ where: { status: 'OPEN' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } })
  ]);

  console.log(`Total Login Logs in DB: ${loginLogsCount}`);
  console.log(`Successful Logins in DB: ${successfulLogins}`);
  console.log(`Failed Logins in DB: ${failedLogins}`);
  console.log(`Total Customer Sessions in DB: ${sessionsCount} (Active: ${activeSessions})`);
  console.log(`Total Guest Order Claims in DB: ${guestClaims}`);
  console.log(`Total Security Events in DB: ${securityEvents} (Open: ${openSecurityEvents})`);
  console.log(`Total Customer Accounts in DB: ${totalUsers}`);

  await prisma.$disconnect();
}

checkLoginReportStats().catch(err => {
  console.error(err);
  process.exit(1);
});
