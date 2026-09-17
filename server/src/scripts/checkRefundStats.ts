import { prisma } from '../database/db';

async function checkRefundStats() {
  console.log('=== KWD SUPPORT DESK: REFUND REQUESTS AUDIT ===\n');

  const [totalRefundTickets, pendingFinanceTickets, allRefundTickets, allRefunds] = await Promise.all([
    prisma.supportTicket.count({ where: { type: 'REFUND_REQUEST' } }),
    prisma.supportTicket.count({ where: { type: 'REFUND_REQUEST', status: 'PENDING_FINANCE' } }),
    prisma.supportTicket.findMany({
      where: { type: 'REFUND_REQUEST' },
      include: {
        order: true,
        user: true,
        events: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.refund.findMany({
      include: { order: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  console.log(`Total Refund Request Tickets: ${totalRefundTickets}`);
  console.log(`Pending Finance Tickets: ${pendingFinanceTickets}`);
  console.log(`Total Refund Records in DB: ${allRefunds.length}`);

  console.log('\nConfigured Refund Tickets:');
  allRefundTickets.forEach((t, idx) => {
    console.log(`[#${idx + 1}] Ticket: #${t.ticketNumber}, Customer: ${t.customerName} (${t.customerEmail})`);
    console.log(`     Subject: "${t.subject}", Priority: ${t.priority}, Status: ${t.status}`);
    console.log(`     Assigned: ${t.assignedToName || 'Unassigned'}, Created: ${t.createdAt}`);
    console.log(`     SLA Due: ${t.slaResolutionDueAt || 'N/A'}`);
    console.log(`     Order: #${t.order?.orderNumber || t.orderId || 'N/A'}, Amount: ₹${t.order?.totalAmount || '0.00'}\n`);
  });

  await prisma.$disconnect();
}

checkRefundStats().catch(err => {
  console.error(err);
  process.exit(1);
});
