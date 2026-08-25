const { prisma } = require('./dist/database/db');

async function cleanTestOrders() {
  console.log("Cleaning up fake/mock test orders...");

  // Find test orders
  const testOrders = await prisma.order.findMany({
    where: {
      OR: [
        { guestEmail: { contains: 'test@example.com' } },
        { razorpayOrderId: { startsWith: 'FREE_CLAIM_' } },
        { razorpayOrderId: { startsWith: 'mock_order_' } }
      ]
    },
    include: { items: true, purchases: true }
  });

  console.log(`Found ${testOrders.length} test orders to clean.`);

  for (const order of testOrders) {
    // Delete associated purchases
    await prisma.purchase.deleteMany({
      where: { orderId: order.id }
    });

    // Delete associated items
    await prisma.orderItem.deleteMany({
      where: { orderId: order.id }
    });

    // Delete order
    await prisma.order.delete({
      where: { id: order.id }
    });

    console.log(`Cleaned test order: ${order.orderNumber} (₹${order.totalAmount})`);
  }

  // Also clean purchases with 0 downloads from testing if any
  const testPurchases = await prisma.purchase.deleteMany({
    where: {
      customer: { email: { contains: 'test@example.com' } }
    }
  });

  console.log("Cleanup completed successfully!");
}

cleanTestOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
