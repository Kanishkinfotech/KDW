import { prisma } from '../database/db';

async function checkCouponReportStats() {
  console.log('=== KWD COUPON & PROMOTION INTELLIGENCE AUDIT ===\n');

  const [
    totalCoupons,
    activeCoupons,
    totalRedemptions,
    ordersWithDiscounts,
    couponsList
  ] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { status: 'ACTIVE' } }),
    prisma.couponRedemption.count(),
    prisma.order.count({ where: { discountTotal: { gt: 0 } } }),
    prisma.coupon.findMany({ select: { id: true, code: true, discountType: true, discountValue: true, usedCount: true, totalUsageLimit: true, status: true } })
  ]);

  console.log(`Total Coupons in DB: ${totalCoupons}`);
  console.log(`Active Coupons in DB: ${activeCoupons}`);
  console.log(`Total Coupon Redemptions in DB: ${totalRedemptions}`);
  console.log(`Orders with Discounts in DB: ${ordersWithDiscounts}`);

  console.log('\nCoupons List:');
  couponsList.forEach(c => {
    console.log(` - Code: ${c.code} (${c.discountType}: ${c.discountValue}), Used: ${c.usedCount}/${c.totalUsageLimit || 'unlimited'}, Status: ${c.status}`);
  });

  const remainingQuota = couponsList
    .filter(c => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + ((c.totalUsageLimit || 100) - c.usedCount), 0);

  console.log(`\nRemaining Redemptions Quota across active coupons: ${remainingQuota}`);

  await prisma.$disconnect();
}

checkCouponReportStats().catch(err => {
  console.error(err);
  process.exit(1);
});
