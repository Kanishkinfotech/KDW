const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const prods = await p.product.findMany({
    select: { id: true, name: true, slug: true, categoryId: true, subcategoryId: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });
  const cats = await p.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { createdAt: 'asc' }
  });
  console.log(JSON.stringify({
    totalProducts: prods.length,
    products: prods,
    totalCategories: cats.length,
    categories: cats
  }, null, 2));
}

run().catch(console.error).finally(() => p.$disconnect());
