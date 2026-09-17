import { prisma } from '../database/db';
import { OrderFulfilmentService } from '../services/orderFulfilmentService';

async function fulfilAllPaidOrders() {
  console.log('--- Scanning unfulfilled paid orders ---');
  
  const unfulfilledPaidOrders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ['PAID', 'CAPTURED'] },
      fulfilmentStatus: { not: 'FULFILLED' }
    }
  });

  console.log(`Found ${unfulfilledPaidOrders.length} paid orders awaiting fulfilment.`);

  let fulfilledCount = 0;
  let failedCount = 0;

  for (const order of unfulfilledPaidOrders) {
    try {
      await OrderFulfilmentService.fulfilOrder(order.id, {
        name: 'Super Admin Batch Sync',
        email: 'admin@kdw.com',
        role: 'SUPER_ADMIN'
      });
      fulfilledCount++;
      console.log(`[OK] Fulfilled order ${order.orderNumber} (${fulfilledCount}/${unfulfilledPaidOrders.length})`);
    } catch (err: any) {
      failedCount++;
      console.error(`[FAIL] Order ${order.orderNumber}:`, err.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`Batch Fulfilment Complete:`);
  console.log(`  Successfully Fulfilled: ${fulfilledCount}`);
  console.log(`  Failed: ${failedCount}`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

fulfilAllPaidOrders().catch(err => {
  console.error('Fatal error running batch fulfilment:', err);
  process.exit(1);
});
