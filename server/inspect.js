const { prisma } = require('./dist/database/db');

async function check() {
  const orders = await prisma.order.findMany({
    include: { items: true, purchases: true }
  });
  console.log('ORDERS_COUNT:', orders.length);
  for (const o of orders) {
    console.log(`Order: ${o.orderNumber}, Status: ${o.paymentStatus}, Total: ${o.totalAmount}, Email: ${o.guestEmail}, Items: ${o.items.length}, CreatedAt: ${o.createdAt}`);
  }

  const purchases = await prisma.purchase.findMany({
    include: { product: true }
  });
  console.log('PURCHASES_COUNT:', purchases.length);
  for (const p of purchases) {
    console.log(`Purchase: Product="${p.product?.name}", CustomerId=${p.customerId}, Downloads=${p.downloadCount}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
