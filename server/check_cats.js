const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const cats = await p.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { createdAt: 'asc' }
  });
  console.log('Categories:', cats);
}

run().catch(console.error).finally(() => p.$disconnect());
