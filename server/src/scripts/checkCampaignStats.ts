import { prisma } from '../database/db';

async function checkCampaignStats() {
  const [totalCampaigns, runningCampaigns, scheduledCampaigns, draftCampaigns, completedCampaigns, campaigns, recipients] = await Promise.all([
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: 'RUNNING' } }),
    prisma.campaign.count({ where: { status: 'SCHEDULED' } }),
    prisma.campaign.count({ where: { status: 'DRAFT' } }),
    prisma.campaign.count({ where: { status: 'COMPLETED' } }),
    prisma.campaign.findMany({
      include: {
        coupons: true,
        offers: true,
        _count: { select: { recipients: true } }
      }
    }),
    prisma.campaignRecipient.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    })
  ]);

  console.log('=== REAL CAMPAIGNS DATABASE STATS ===');
  console.log('Total Campaigns:', totalCampaigns);
  console.log('Running Campaigns:', runningCampaigns);
  console.log('Scheduled Campaigns:', scheduledCampaigns);
  console.log('Draft Campaigns:', draftCampaigns);
  console.log('Completed Campaigns:', completedCampaigns);
  console.log('Total Recipients in DB:', recipients.length);

  console.log('\nCampaigns in DB:');
  console.table(campaigns.map((c: any) => ({
    id: c.id,
    name: c.name,
    type: c.campaignType,
    channel: c.channel,
    status: c.status,
    segment: c.audienceSegment,
    sentCount: c.sentCount,
    deliveredCount: c.deliveredCount,
    openedCount: c.openedCount,
    clickedCount: c.clickedCount,
    revenue: c.revenueGenerated,
    startAt: c.startAt,
    recipientsCount: c._count.recipients
  })));

  await prisma.$disconnect();
}

checkCampaignStats().catch(err => {
  console.error(err);
  process.exit(1);
});
