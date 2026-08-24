const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.category.updateMany({
    where: { name: { contains: 'Agency Kits' } },
    data: { image: '/images/products/agent_kits.jpg' }
  });
  await prisma.product.updateMany({
    where: { name: { contains: 'Agency Starter Pack' } },
    data: { thumbnail: '/images/products/agent_kits.jpg' }
  });
  console.log('Database updated successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
