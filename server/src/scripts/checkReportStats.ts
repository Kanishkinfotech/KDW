import { prisma } from '../database/db';

async function checkReportStats() {
  console.log('=== KWD REPORTS & ANALYTICS DATABASE AUDIT ===\n');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    allOrdersCount,
    paidOrdersCount,
    ordersInRange,
    refundsCount,
    refundsSum,
    couponsCount,
    productsCount,
    categoriesCount,
    usersCount
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: { in: ['PAID', 'COMPLETED'] } } }),
    prisma.order.findMany({
      where: {
        paymentStatus: { in: ['PAID', 'COMPLETED'] },
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
        refunds: true,
        customer: true
      }
    }),
    prisma.refund.count(),
    prisma.refund.aggregate({ _sum: { amount: true } }),
    prisma.coupon.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count()
  ]);

  console.log(`Total Orders in DB: ${allOrdersCount}`);
  console.log(`Paid Orders in DB (All Time): ${paidOrdersCount}`);
  console.log(`Paid Orders in Last 30 Days: ${ordersInRange.length}`);
  console.log(`Total Refunds in DB: ${refundsCount}, Sum: ₹${refundsSum._sum.amount || 0}`);
  console.log(`Total Coupons in DB: ${couponsCount}`);
  console.log(`Total Products in DB: ${productsCount}`);
  console.log(`Total Categories in DB: ${categoriesCount}`);
  console.log(`Total Users/Customers in DB: ${usersCount}`);

  let gross = 0;
  let discount = 0;
  let refunded = 0;
  let units = 0;
  const customers = new Set<string>();

  ordersInRange.forEach(o => {
    gross += (o.totalAmount + (o.discountTotal || 0));
    discount += (o.discountTotal || 0);
    refunded += (o.refundedAmount || 0);
    units += o.items.reduce((s, it) => s + it.quantity, 0);
    if (o.customerId) customers.add(o.customerId);
    else if (o.guestEmail) customers.add(o.guestEmail);
  });

  const net = gross - discount - refunded;
  const aovOrder = ordersInRange.length > 0 ? (net / ordersInRange.length) : 0;
  const aovCustomer = customers.size > 0 ? (net / customers.size) : 0;

  console.log('\n--- Calculated Last 30 Days Financial Metrics ---');
  console.log(`Gross Sales Volume: ₹${gross.toFixed(2)}`);
  console.log(`Discounts: ₹${discount.toFixed(2)}`);
  console.log(`Refunds: ₹${refunded.toFixed(2)}`);
  console.log(`Net Commercial Sales: ₹${net.toFixed(2)}`);
  console.log(`Paid Orders Fulfilled: ${ordersInRange.length}`);
  console.log(`Digital Units Delivered: ${units}`);
  console.log(`Unique Paying Customers: ${customers.size}`);
  console.log(`AOV (per order): ₹${aovOrder.toFixed(2)}`);
  console.log(`AOV (per customer): ₹${aovCustomer.toFixed(2)}`);

  await prisma.$disconnect();
}

checkReportStats().catch(err => {
  console.error(err);
  process.exit(1);
});
