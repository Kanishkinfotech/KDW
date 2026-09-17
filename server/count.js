const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countAll() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, price: true, categoryId: true, subcategoryId: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true, _count: { select: { products: true, children: true } } },
    orderBy: { createdAt: 'asc' }
  });

  const bundles = await prisma.bundle.findMany({
    include: { products: { select: { id: true, name: true } } }
  });
  console.log('BUNDLES:', bundles.map(b => ({ id: b.id, title: b.title, productCount: b.products.length })));
  
  const orderItems = await prisma.orderItem.findMany({ select: { productId: true } });
  console.log('ORDER ITEM PRODUCT IDS:', orderItems.map(o => o.productId));

  await prisma.$disconnect();
}

countAll().catch(e => {
  console.error(e);
  process.exit(1);
});
