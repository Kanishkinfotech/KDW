const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.bundle.upsert({
    where: { slug: 'creator-ai-mastery-bundle' },
    update: {},
    create: {
      title: 'Creator AI Mastery Bundle',
      slug: 'creator-ai-mastery-bundle',
      description: 'All our top-selling AI prompt packs and automation scripts in one massively discounted bundle.',
      price: 79.00,
      originalPrice: 150.00,
      coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800',
      itemsIncluded: 3,
      rating: 4.9,
      status: 'ACTIVE'
    }
  });
  
  await prisma.bundle.upsert({
    where: { slug: 'social-media-marketing-bundle' },
    update: {},
    create: {
      title: 'Social Media Marketing Bundle',
      slug: 'social-media-marketing-bundle',
      description: 'Complete collection of social media templates and strategies.',
      price: 129.00,
      originalPrice: 199.00,
      coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
      itemsIncluded: 4,
      rating: 4.8,
      status: 'ACTIVE'
    }
  });

  console.log("Seeded other bundles successfully");
}

main().catch(console.error).finally(() => prisma.$disconnect());
