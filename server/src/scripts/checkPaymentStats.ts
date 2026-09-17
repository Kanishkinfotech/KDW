import { prisma } from '../database/db';

async function checkPaymentStats() {
  const [
    paymentsCount,
    capturedCount,
    failedCount,
    refundsCount,
    disputesCount,
    settlementsCount,
    reconciliationsCount,
    webhooksCount,
    paidOrdersCount,
    unlinkedPaidOrdersCount
  ] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'CAPTURED' } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.refund.count(),
    prisma.dispute.count(),
    prisma.settlement.count(),
    prisma.reconciliationRecord.count(),
    prisma.paymentEvent.count(),
    prisma.order.count({ where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } }),
    prisma.order.count({
      where: {
        paymentStatus: { in: ['PAID', 'CAPTURED'] },
        payments: { none: {} }
      }
    })
  ]);

  const capturedSum = await prisma.payment.aggregate({
    where: { status: 'CAPTURED' },
    _sum: { amount: true }
  });

  const ordersSum = await prisma.order.aggregate({
    where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } },
    _sum: { totalAmount: true }
  });

  console.log('=== REAL DATABASE PAYMENT STATS ===');
  console.log('Total Payments Records:', paymentsCount);
  console.log('Captured Payments:', capturedCount, 'Sum:', capturedSum._sum.amount);
  console.log('Failed Payments:', failedCount);
  console.log('Refunds:', refundsCount);
  console.log('Disputes:', disputesCount);
  console.log('Settlements:', settlementsCount);
  console.log('Reconciliations:', reconciliationsCount);
  console.log('Webhook Events:', webhooksCount);
  console.log('Paid Orders Total in DB:', paidOrdersCount, 'Sum:', ordersSum._sum.totalAmount);
  console.log('Paid Orders without linked Payment record:', unlinkedPaidOrdersCount);

  const samplePayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { orderNumber: true } } }
  });
  console.log('\nSample Payments:');
  console.table(samplePayments.map((p: any) => ({
    id: p.id,
    order: p.order?.orderNumber,
    amount: p.amount,
    method: p.method,
    status: p.status,
    verification: p.verificationStatus,
    fulfilment: p.fulfilmentStatus,
    reconciled: p.reconciliationStatus
  })));

  await prisma.$disconnect();
}

checkPaymentStats().catch(err => {
  console.error(err);
  process.exit(1);
});
