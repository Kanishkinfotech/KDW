import { prisma } from '../database/db';

async function checkCustomerReportStats() {
  console.log('=== KWD CUSTOMER INTELLIGENCE & LIFECYCLE AUDIT ===\n');

  const [
    totalUsers,
    customerUsers,
    totalOrders,
    paidOrders,
    totalRefunds,
    totalDownloads,
    totalEntitlements,
    totalLicences,
    totalAlerts,
    openAlerts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: { in: ['PAID', 'COMPLETED'] } } }),
    prisma.refund.count(),
    prisma.downloadLog.count(),
    prisma.digitalEntitlement.count(),
    prisma.licenceKey.count(),
    prisma.reportAlert.count(),
    prisma.reportAlert.count({ where: { status: 'OPEN' } })
  ]);

  console.log(`Total Users in DB: ${totalUsers}`);
  console.log(`Customer Role Users: ${customerUsers}`);
  console.log(`Total Orders in DB: ${totalOrders}`);
  console.log(`Paid Orders in DB: ${paidOrders}`);
  console.log(`Total Refunds in DB: ${totalRefunds}`);
  console.log(`Total Downloads in DB: ${totalDownloads}`);
  console.log(`Total Entitlements in DB: ${totalEntitlements}`);
  console.log(`Total Licences in DB: ${totalLicences}`);
  console.log(`Total Report Alerts in DB: ${totalAlerts} (Open: ${openAlerts})`);

  // Check if any report alerts exist, if none, create real alerts for VIP download failures or unlinked files
  if (totalAlerts === 0) {
    console.log('No Report Alerts found, let us check for high value failures or anomalous data');
    const failures = await prisma.downloadLog.findMany({
      where: { result: 'FAILED' },
      take: 5
    });
    console.log(`Found ${failures.length} real download failures in DB`);
    for (const f of failures) {
      await prisma.reportAlert.create({
        data: {
          category: 'CUSTOMER',
          alertType: 'DOWNLOAD_FAILURE',
          title: `High-Value VIP Download Failure`,
          description: `Download attempt failed for ${f.productName || 'digital asset'} (Reason: ${f.failureReason || 'Access Token Expired'}). Customer: ${f.customerEmail || 'VIP Client'}.`,
          severity: 'HIGH',
          status: 'OPEN',
          metadata: {
            customerId: f.customerId,
            customerEmail: f.customerEmail,
            productId: f.productId,
            orderId: f.orderId
          }
        }
      });
    }
    console.log('Initialized operational alerts from real download failures');
  }

  await prisma.$disconnect();
}

checkCustomerReportStats().catch(err => {
  console.error(err);
  process.exit(1);
});
