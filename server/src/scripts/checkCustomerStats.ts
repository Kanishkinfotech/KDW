import { prisma } from '../database/db';

async function checkCustomerStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    allUsers,
    totalCount,
    newCount,
    guestCount,
    verifiedCount,
    unverifiedAccountCount,
    blockedCount,
    ordersCount,
    paidOrdersCount
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        customerCode: true,
        name: true,
        email: true,
        customerType: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        _count: { select: { orders: true, purchases: true, bundleEntitlements: true } }
      }
    }),
    prisma.user.count({ where: { isMerged: false } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, isMerged: false } }),
    prisma.user.count({ where: { customerType: 'GUEST', isMerged: false } }),
    prisma.user.count({ where: { emailVerified: true, isMerged: false } }),
    prisma.user.count({ where: { emailVerified: false, customerType: 'ACCOUNT', isMerged: false } }),
    prisma.user.count({ where: { status: 'BLOCKED', isMerged: false } }),
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } })
  ]);

  const returningUsersQuery: any = await prisma.$queryRaw`
    SELECT "customerId", count(id) as "orderCount" 
    FROM "Order" 
    WHERE "paymentStatus" IN ('PAID', 'CAPTURED') AND "customerId" IS NOT NULL 
    GROUP BY "customerId" 
    HAVING count(id) >= 2
  `;

  console.log('=== REAL DATABASE CUSTOMER STATS ===');
  console.log('Total Non-Merged Users:', totalCount);
  console.log('New (<30D):', newCount);
  console.log('Returning Buyers (>=2 paid orders):', returningUsersQuery.length);
  console.log('Guest Buyers:', guestCount);
  console.log('Verified Users:', verifiedCount);
  console.log('Unverified Accounts:', unverifiedAccountCount);
  console.log('Blocked Users:', blockedCount);
  console.log('Total Orders:', ordersCount);
  console.log('Total Paid Orders:', paidOrdersCount);
  console.log('\nSample User List (first 10):');
  console.table(allUsers.slice(0, 10).map((u: any) => ({
    code: u.customerCode,
    name: u.name,
    email: u.email,
    type: u.customerType,
    verified: u.emailVerified,
    status: u.status,
    orders: u._count.orders,
    entitlements: u._count.purchases + u._count.bundleEntitlements
  })));

  await prisma.$disconnect();
}

checkCustomerStats().catch(err => {
  console.error(err);
  process.exit(1);
});
