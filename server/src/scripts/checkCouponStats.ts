import { prisma } from '../database/db';

async function checkCouponStats() {
  const [totalCoupons, activeCoupons, scheduledCoupons, expiredCoupons, disabledCoupons, coupons, redemptions, abuseLogs] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { status: 'ACTIVE' } }),
    prisma.coupon.count({ where: { status: 'SCHEDULED' } }),
    prisma.coupon.count({ where: { status: 'EXPIRED' } }),
    prisma.coupon.count({ where: { status: 'DISABLED' } }),
    prisma.coupon.findMany({
      include: {
        campaign: true,
        _count: { select: { redemptions: true, abuseLogs: true } }
      }
    }),
    prisma.couponRedemption.findMany({
      include: {
        coupon: true,
        customer: true,
        order: true
      }
    }),
    prisma.couponAbuseLog.findMany()
  ]);

  console.log('=== REAL COUPONS DATABASE STATS ===');
  console.log('Total Coupons:', totalCoupons);
  console.log('Active Coupons:', activeCoupons);
  console.log('Scheduled Coupons:', scheduledCoupons);
  console.log('Expired Coupons:', expiredCoupons);
  console.log('Disabled Coupons:', disabledCoupons);
  console.log('Total Redemptions:', redemptions.length);
  console.log('Total Abuse Logs:', abuseLogs.length);

  console.log('\nCoupons in DB:');
  console.table(coupons.map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.internalName,
    discountType: c.discountType,
    discountValue: c.discountValue,
    minOrderValue: c.minOrderValue,
    usedCount: c.usedCount,
    totalUsageLimit: c.totalUsageLimit,
    status: c.status,
    startAt: c.startAt,
    endAt: c.endAt,
    redemptionsCount: c._count.redemptions,
    abuseLogsCount: c._count.abuseLogs
  })));

  if (redemptions.length > 0) {
    console.log('\nSample Redemptions in DB:');
    console.table(redemptions.slice(0, 5).map((r: any) => ({
      id: r.id,
      code: r.coupon?.code,
      orderNumber: r.order?.orderNumber,
      discountAmount: r.discountAmount,
      status: r.status,
      redeemedAt: r.redeemedAt,
      guestEmail: r.guestEmail
    })));
  }

  await prisma.$disconnect();
}

checkCouponStats().catch(err => {
  console.error(err);
  process.exit(1);
});
