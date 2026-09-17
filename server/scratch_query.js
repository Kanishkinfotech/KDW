const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Reset all category featured flags
  await prisma.category.updateMany({
    data: { featured: false }
  });

  // 2. Curate 5 top primary categories with images & priority
  const topCategories = [
    {
      slug: 'ai-prompt-bundles',
      name: 'AI Prompt Packs',
      image: '/images/categories/chatgpt_bundles.jpg',
      description: 'Curated ChatGPT, Claude, and Midjourney prompt engineering systems.',
      featured: true,
      featuredPriority: 100
    },
    {
      slug: 'website-kits',
      name: 'Website Kits',
      image: '/images/products/saas_website.jpg',
      description: 'Production-ready web templates, design systems, and components.',
      featured: true,
      featuredPriority: 90
    },
    {
      slug: 'automation',
      name: 'Automation & Workflows',
      image: '/images/products/ai_workflow.jpg',
      description: 'Lead generation, CRM synchronization, and autonomous marketing pipelines.',
      featured: true,
      featuredPriority: 80
    },
    {
      slug: 'business-templates',
      name: 'Business Templates',
      image: '/images/products/finance_dashboard.jpg',
      description: 'Financial models, client agreements, pitch decks, and operating sheets.',
      featured: true,
      featuredPriority: 70
    },
    {
      slug: 'social-media-bundles',
      name: 'Social Media Bundles',
      image: '/images/categories/instagram_bundles.jpg',
      description: 'High-engagement viral carousels, Canva templates, and growth toolkits.',
      featured: true,
      featuredPriority: 60
    }
  ];

  for (const cat of topCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        image: cat.image,
        description: cat.description,
        featured: true,
        featuredPriority: cat.featuredPriority,
        status: 'ACTIVE'
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        image: cat.image,
        description: cat.description,
        featured: true,
        featuredPriority: cat.featuredPriority,
        status: 'ACTIVE'
      }
    });
    console.log(`✓ Updated category: ${cat.name}`);
  }

  const updated = await prisma.category.findMany({
    where: { featured: true },
    select: { name: true, slug: true, image: true, featured: true }
  });

  console.log('Featured categories in DB:', updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());




