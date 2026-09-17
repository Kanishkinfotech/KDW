import { prisma } from '../database/db';

async function checkOfferStats() {
  const [totalOffers, activeOffers, scheduledOffers, offers] = await Promise.all([
    prisma.offer.count(),
    prisma.offer.count({ where: { status: 'ACTIVE' } }),
    prisma.offer.count({ where: { status: 'SCHEDULED' } }),
    prisma.offer.findMany({
      include: {
        campaign: true,
        rules: true
      }
    })
  ]);

  console.log('=== REAL OFFERS DATABASE STATS ===');
  console.log('Total Offers in DB:', totalOffers);
  console.log('Active Offers:', activeOffers);
  console.log('Scheduled Offers:', scheduledOffers);
  console.log('\nAll Offers in DB:');
  console.table(offers.map((o: any) => ({
    id: o.id,
    name: o.name,
    type: o.offerType,
    discountType: o.discountType,
    discountValue: o.discountValue,
    priority: o.priority,
    stacking: o.stackingPolicy,
    status: o.status,
    startAt: o.startAt,
    endAt: o.endAt,
    views: o.viewsCount,
    clicks: o.clicksCount,
    orders: o.ordersCount,
    revenue: o.revenueGenerated
  })));

  await prisma.$disconnect();
}

checkOfferStats().catch(err => {
  console.error(err);
  process.exit(1);
});
