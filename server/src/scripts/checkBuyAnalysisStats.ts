import { prisma } from '../database/db';

async function checkBuyAnalysisStats() {
  console.log('=== KWD CUSTOMER BUYING & BASKET INTELLIGENCE AUDIT ===\n');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const paidOrders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ['PAID', 'COMPLETED'] },
      createdAt: { gte: thirtyDaysAgo }
    },
    include: {
      items: { include: { product: true, bundle: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total Paid Orders in Last 30 Days: ${paidOrders.length}`);

  let gross = 0;
  let refunds = 0;
  let totalItems = 0;
  const customerOrders = new Map<string, typeof paidOrders>();

  paidOrders.forEach(o => {
    gross += o.totalAmount;
    refunds += (o.refundedAmount || 0);
    totalItems += o.items.reduce((s, it) => s + it.quantity, 0);

    const key = o.customerId || o.guestEmail;
    if (key) {
      if (!customerOrders.has(key)) customerOrders.set(key, []);
      customerOrders.get(key)!.push(o);
    }
  });

  const net = gross - refunds;
  const aov = paidOrders.length > 0 ? (net / paidOrders.length) : 0;
  const itemsPerOrder = paidOrders.length > 0 ? (totalItems / paidOrders.length) : 0;

  let repeatBuyers = 0;
  const secondPurchaseIntervals: number[] = [];

  customerOrders.forEach(orders => {
    if (orders.length >= 2) {
      repeatBuyers++;
      const first = orders[0].createdAt.getTime();
      const second = orders[1].createdAt.getTime();
      secondPurchaseIntervals.push(Math.round((second - first) / (24 * 60 * 60 * 1000)));
    }
  });

  const uniqueBuyers = customerOrders.size;
  const repeatRate = uniqueBuyers > 0 ? ((repeatBuyers / uniqueBuyers) * 100) : 0;
  const avgTimeToSecond = secondPurchaseIntervals.length > 0
    ? (secondPurchaseIntervals.reduce((a, b) => a + b, 0) / secondPurchaseIntervals.length)
    : 0;

  const bundleOrders = paidOrders.filter(o => o.items.some(it => it.bundleId !== null)).length;
  const bundleAdoption = paidOrders.length > 0 ? ((bundleOrders / paidOrders.length) * 100) : 0;

  const guestOrders = paidOrders.filter(o => !o.customerId && o.guestEmail).length;
  const guestRatio = paidOrders.length > 0 ? ((guestOrders / paidOrders.length) * 100) : 0;
  const revenuePerBuyer = uniqueBuyers > 0 ? (net / uniqueBuyers) : 0;

  console.log(`Gross Sales: ₹${gross.toFixed(2)}`);
  console.log(`Refunds: ₹${refunds.toFixed(2)}`);
  console.log(`Net Revenue: ₹${net.toFixed(2)}`);
  console.log(`Average Order Value (AOV): ₹${aov.toFixed(2)}`);
  console.log(`Items Per Order: ${itemsPerOrder.toFixed(2)} (${totalItems} total items across ${paidOrders.length} orders)`);
  console.log(`Unique Buyers: ${uniqueBuyers}, Repeat Buyers: ${repeatBuyers}`);
  console.log(`Repeat Purchase Rate: ${repeatRate.toFixed(1)}%`);
  console.log(`Time to Second Purchase: ${avgTimeToSecond.toFixed(1)} Days`);
  console.log(`Bundle Adoption Rate: ${bundleAdoption.toFixed(1)}%`);
  console.log(`Guest Buying Ratio: ${guestRatio.toFixed(1)}% (${guestOrders} guest orders)`);
  console.log(`Revenue Per Buyer: ₹${revenuePerBuyer.toFixed(2)}`);

  await prisma.$disconnect();
}

checkBuyAnalysisStats().catch(err => {
  console.error(err);
  process.exit(1);
});
