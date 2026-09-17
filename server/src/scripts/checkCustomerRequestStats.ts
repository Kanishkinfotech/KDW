import { prisma } from '../database/db';

async function checkCustomerRequestStats() {
  console.log('=== KWD SUPPORT DESK: CUSTOMER REQUESTS AUDIT ===\n');

  const [totalRequests, verifiedRequests, underReviewRequests, completedRequests, rejectedRequests, allRequests] = await Promise.all([
    prisma.customerRequest.count(),
    prisma.customerRequest.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.customerRequest.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.customerRequest.count({ where: { status: 'COMPLETED' } }),
    prisma.customerRequest.count({ where: { status: 'REJECTED' } }),
    prisma.customerRequest.findMany({
      include: {
        customer: true,
        ticket: true
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  console.log(`Total Customer Requests in DB: ${totalRequests}`);
  console.log(`Verified Requests: ${verifiedRequests}`);
  console.log(`Under Review Requests: ${underReviewRequests}`);
  console.log(`Completed Requests: ${completedRequests}`);
  console.log(`Rejected Requests: ${rejectedRequests}`);

  console.log('\nConfigured Customer Requests:');
  allRequests.forEach((r, idx) => {
    console.log(`[#${idx + 1}] Type: ${r.requestType}, Verification: ${r.verificationStatus}, Status: ${r.status}`);
    console.log(`     Customer: ${r.customer?.name || 'N/A'} (${r.customer?.email || 'N/A'})`);
    console.log(`     Requested At: ${r.requestedAt}`);
    console.log(`     Ticket: #${r.ticket?.ticketNumber || r.ticketId} - ${r.ticket?.subject || 'N/A'}`);
    console.log(`     Action Taken: ${r.actionTaken || 'None'}, Rejection Reason: ${r.rejectionReason || 'None'}\n`);
  });

  await prisma.$disconnect();
}

checkCustomerRequestStats().catch(err => {
  console.error(err);
  process.exit(1);
});
