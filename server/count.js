const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countAll() {
  const users = await prisma.user.count();
  const products = await prisma.product.count();
  const bundles = await prisma.bundle.count();
  const categories = await prisma.category.count();
  const orders = await prisma.order.count();
  const payments = await prisma.purchase.count();
  const supportTickets = await prisma.supportTicket.count();
  const faqs = await prisma.fAQ.count();

  console.log(`BEFORE IMPLEMENTATION\n`);
  console.log(`Users: ${users}`);
  console.log(`Products: ${products}`);
  console.log(`Bundles: ${bundles}`);
  console.log(`Categories: ${categories}`);
  console.log(`Orders: ${orders}`);
  console.log(`Payments (Purchases): ${payments}`);
  console.log(`SupportTickets: ${supportTickets}`);
  console.log(`FAQs: ${faqs}`);
  
  await prisma.$disconnect();
}

countAll().catch(e => {
  console.error(e);
  process.exit(1);
});
