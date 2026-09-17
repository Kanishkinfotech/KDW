const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const prods = await p.product.findMany({
    select: { id: true, name: true, slug: true, categoryId: true, subcategoryId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    skip: 13,
    take: 10
  });
  console.log(JSON.stringify(prods, null, 2));
}

run().catch(console.error).finally(() => p.$disconnect());
