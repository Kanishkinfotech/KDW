import { prisma } from '../database/db';

async function checkFeedbackStats() {
  console.log('=== KWD CONTENT MANAGEMENT: CUSTOMER FEEDBACK AUDIT ===\n');

  const [totalItems, openItems, resolvedItems, bugReports, downloadIssues, reviews, allItems] = await Promise.all([
    prisma.customerFeedback.count(),
    prisma.customerFeedback.count({ where: { status: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] } } }),
    prisma.customerFeedback.count({ where: { status: 'RESOLVED' } }),
    prisma.customerFeedback.count({ where: { feedbackType: 'BUG_REPORT' } }),
    prisma.customerFeedback.count({ where: { feedbackType: 'DOWNLOAD_ISSUE' } }),
    prisma.customerFeedback.count({ where: { feedbackType: 'PRODUCT_REVIEW' } }),
    prisma.customerFeedback.findMany({ orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }] })
  ]);

  console.log(`Total Feedback in DB: ${totalItems}`);
  console.log(`Open Feedback in DB: ${openItems}`);
  console.log(`Resolved Feedback: ${resolvedItems}`);
  console.log(`Bug Reports: ${bugReports}`);
  console.log(`Download Issues: ${downloadIssues}`);
  console.log(`Customer Reviews: ${reviews}`);

  console.log('\nConfigured Feedback Items:');
  allItems.forEach((it, idx) => {
    console.log(`[#${idx + 1}] Type: ${it.feedbackType}, Priority: ${it.priority}, Status: ${it.status}`);
    console.log(`     Customer: ${it.customerName} (${it.customerEmail})`);
    console.log(`     Title: "${it.title}"`);
    console.log(`     Message: "${it.message.slice(0, 80)}..."`);
    console.log(`     Assigned To: ${it.assignedToName || 'Unassigned'}\n`);
  });

  await prisma.$disconnect();
}

checkFeedbackStats().catch(err => {
  console.error(err);
  process.exit(1);
});
