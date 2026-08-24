import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBundle() {
  console.log('Seeding Creator AI Mastery Bundle...');
  try {
    // 1. Find the 3 specific products
    const products = await prisma.product.findMany({
      where: {
        name: {
          in: [
            'Ultimate ChatGPT Prompt Library',
            'AI Business Prompt Collection',
            'Reels Creator Pack'
          ]
        }
      }
    });

    if (products.length !== 3) {
      console.warn(`Warning: Found ${products.length} out of 3 products. Creating bundle with whatever is found.`);
    }

    const productIds = products.map((p) => ({ id: p.id }));

    // 2. Create the bundle
    const bundle = await prisma.bundle.upsert({
      where: { slug: 'creator-ai-mastery-bundle' },
      update: {
        title: 'Creator AI Mastery Bundle',
        description: 'Everything creators need to generate ideas with AI, create high-converting content, and grow on Instagram using premium templates and prompt collections.',
        price: 2526,
        originalPrice: 2597,
        discount: 71,
        coverImage: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80',
        rating: 4.9,
        itemsIncluded: products.length,
        status: 'ACTIVE',
        featured: true,
        products: {
          set: productIds
        }
      },
      create: {
        title: 'Creator AI Mastery Bundle',
        slug: 'creator-ai-mastery-bundle',
        description: 'Everything creators need to generate ideas with AI, create high-converting content, and grow on Instagram using premium templates and prompt collections.',
        price: 2526,
        originalPrice: 2597,
        discount: 71,
        coverImage: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80',
        rating: 4.9,
        itemsIncluded: products.length,
        status: 'ACTIVE',
        featured: true,
        products: {
          connect: productIds
        }
      }
    });

    console.log('Successfully seeded bundle:', bundle.title);
  } catch (error) {
    console.error('Error seeding bundle:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBundle();
