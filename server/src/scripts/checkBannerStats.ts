import { prisma } from '../database/db';

async function checkBannerStats() {
  console.log('=== KWD CONTENT MANAGEMENT: PROMOTIONAL BANNERS AUDIT ===\n');

  const [totalBanners, activeBanners, pausedBanners, allBanners] = await Promise.all([
    prisma.contentBanner.count(),
    prisma.contentBanner.count({ where: { status: 'ACTIVE' } }),
    prisma.contentBanner.count({ where: { status: 'PAUSED' } }),
    prisma.contentBanner.findMany({ orderBy: [{ placement: 'asc' }, { priority: 'asc' }] })
  ]);

  console.log(`Total Banners in DB: ${totalBanners}`);
  console.log(`Active Banners in DB: ${activeBanners}`);
  console.log(`Paused Banners in DB: ${pausedBanners}`);

  console.log('\nConfigured Banners:');
  allBanners.forEach((b, idx) => {
    console.log(`[#${idx + 1}] Name: ${b.name}, Placement: ${b.placement}, Status: ${b.status}, Priority: ${b.priority}`);
    console.log(`     Headline: "${b.headline || 'N/A'}", CTA: "${b.ctaLabel || 'N/A'}" -> ${b.ctaUrl || 'N/A'}`);
    console.log(`     Impressions: ${b.impressionsCount}, Clicks: ${b.clicksCount}, Conversions: ${b.conversionsCount}, Revenue: ₹${b.revenueAttributed}\n`);
  });

  await prisma.$disconnect();
}

checkBannerStats().catch(err => {
  console.error(err);
  process.exit(1);
});
