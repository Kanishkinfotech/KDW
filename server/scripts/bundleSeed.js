const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBundle() {
  try {
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
      console.warn('Could not find all 3 products. Found:', products.map(p => p.name));
    }

    const bundle = await prisma.bundle.create({
      data: {
        title: 'Creator AI Mastery Bundle',
        description: 'Everything creators need to generate ideas with AI, create high-converting content, and grow on Instagram using premium templates and prompt collections.',
        price: 2526.0,
        originalPrice: 2597.0,
        coverImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80',
        rating: 4.9,
        itemsIncluded: products.length,
        products: {
          connect: products.map(p => ({ id: p.id }))
        }
      },
      include: {
        products: true
      }
    });

    console.log('Successfully created bundle:', bundle.title);
    console.log('Included products:', bundle.products.map(p => p.name));
  } catch (error) {
    console.error('Failed to seed bundle:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBundle();
