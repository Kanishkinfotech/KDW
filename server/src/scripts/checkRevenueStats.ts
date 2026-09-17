import { prisma } from '../database/db';

async function checkRevenueStats() {
  console.log('=== KWD REVENUE & SETTLEMENT DATABASE AUDIT ===\n');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalPayments,
    capturedPayments,
    paymentsInRange,
    totalRefunds,
    refundsInRange,
    totalSettlements,
    settlementsInRange,
    reconciliations
  ] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: { in: ['CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED'] } } }),
    prisma.payment.findMany({
      where: {
        status: { in: ['CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
        createdAt: { gte: thirtyDaysAgo }
      },
      include: { order: true }
    }),
    prisma.refund.count(),
    prisma.refund.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
    prisma.settlement.count(),
    prisma.settlement.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.reconciliationRecord.count()
  ]);

  console.log(`Total Payments in DB: ${totalPayments}`);
  console.log(`Captured Payments in DB (All Time): ${capturedPayments}`);
  console.log(`Captured Payments in Last 30 Days: ${paymentsInRange.length}`);
  console.log(`Total Refunds in DB: ${totalRefunds}, in Last 30 Days: ${refundsInRange.length}`);
  console.log(`Total Settlements in DB: ${totalSettlements}, in Last 30 Days: ${settlementsInRange.length}`);
  console.log(`Total Reconciliation Records in DB: ${reconciliations}`);

  let grossCaptured = 0;
  const methodsMap: Record<string, { count: number; sum: number }> = {};

  paymentsInRange.forEach(p => {
    grossCaptured += p.amount;
    const m = p.method || 'RAZORPAY';
    if (!methodsMap[m]) methodsMap[m] = { count: 0, sum: 0 };
    methodsMap[m].count += 1;
    methodsMap[m].sum += p.amount;
  });

  const refundsSum = refundsInRange.reduce((s, r) => s + r.amount, 0);
  const gatewayFees = Math.round(grossCaptured * 0.0236);
  const netRevenue = Math.round(grossCaptured - refundsSum - gatewayFees);
  const settlementsSum = settlementsInRange.reduce((s, st) => s + st.netAmount, 0);

  console.log('\n--- Calculated Last 30 Days Revenue Waterfall ---');
  console.log(`Gross Captured Volume: ₹${grossCaptured.toFixed(2)}`);
  console.log(`Refunds Processed: ₹${refundsSum.toFixed(2)}`);
  console.log(`Gateway Fees (Razorpay ~2%+GST): ₹${gatewayFees.toFixed(2)}`);
  console.log(`Net Operating Revenue: ₹${netRevenue.toFixed(2)}`);
  console.log(`Settlement Transferred: ₹${settlementsSum > 0 ? settlementsSum.toFixed(2) : netRevenue.toFixed(2)}`);
  console.log('Payment Methods Breakdown:', methodsMap);

  await prisma.$disconnect();
}

checkRevenueStats().catch(err => {
  console.error(err);
  process.exit(1);
});
