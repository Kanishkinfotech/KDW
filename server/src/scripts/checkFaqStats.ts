import { prisma } from '../database/db';

async function checkFaqStats() {
  console.log('=== KWD CONTENT MANAGEMENT: FAQs AUDIT ===\n');

  const [totalFaqs, globalFaqs, productFaqs, publishedFaqs, outdatedFaqs, allFaqs] = await Promise.all([
    prisma.contentFaq.count(),
    prisma.contentFaq.count({ where: { scopeType: 'GLOBAL' } }),
    prisma.contentFaq.count({ where: { scopeType: 'PRODUCT' } }),
    prisma.contentFaq.count({ where: { status: 'PUBLISHED' } }),
    prisma.contentFaq.count({ where: { isOutdated: true } }),
    prisma.contentFaq.findMany({ orderBy: { displayOrder: 'asc' } })
  ]);

  console.log(`Total FAQs in DB: ${totalFaqs}`);
  console.log(`Global FAQs: ${globalFaqs}`);
  console.log(`Product FAQs: ${productFaqs}`);
  console.log(`Published FAQs: ${publishedFaqs}`);
  console.log(`Outdated FAQs: ${outdatedFaqs}`);

  console.log('\nConfigured FAQs:');
  allFaqs.forEach((f, idx) => {
    console.log(`[#${f.displayOrder || idx + 1}] Scope: ${f.scopeType}, Status: ${f.status}, Outdated: ${f.isOutdated}`);
    console.log(`     Question: ${f.question}`);
    console.log(`     Answer: ${f.answer.slice(0, 80)}...`);
    console.log(`     Views: ${f.viewsCount}, Helpful: ${f.helpfulCount}, Not Helpful: ${f.unhelpfulCount}\n`);
  });

  await prisma.$disconnect();
}

checkFaqStats().catch(err => {
  console.error(err);
  process.exit(1);
});
