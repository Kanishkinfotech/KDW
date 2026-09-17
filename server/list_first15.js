const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const prods = await p.product.findMany({
    select: { id: true, name: true, slug: true, categoryId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 15
  });
  console.log(JSON.stringify(prods, null, 2));
}

run().catch(console.error).finally(() => p.$disconnect());
