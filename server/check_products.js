const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const productsCount = await prisma.product.count();
  console.log("Total Products in DB:", productsCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
