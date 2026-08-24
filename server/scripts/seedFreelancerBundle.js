const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBundle() {
  console.log('Seeding The Ultimate Freelancer Bundle...');
  try {
    // Find up to 5 business/agency products
    const products = await prisma.product.findMany({
      where: {
        name: {
          in: [
            'Agency Starter Pack',
            'Client Management Suite',
            'Business Startup Kit',
            'Business Proposal Template',
            'Business Finance Dashboard'
          ]
        }
      },
      take: 5
    });

    const productIds = products.map((p) => ({ id: p.id }));

    // Create the bundle
    const bundle = await prisma.bundle.upsert({
      where: { slug: 'the-ultimate-freelancer-bundle' },
      update: {
        title: 'The Ultimate Freelancer Bundle',
        description: 'Get everything you need to start and scale your freelance business. Includes contracts, invoices, and proposal templates.',
        price: 149.00,
        originalPrice: 250.00,
        discount: 101.00,
        coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
        rating: 5.0,
        itemsIncluded: products.length,
        status: 'ACTIVE',
        featured: false,
        products: {
          set: productIds
        }
      },
      create: {
        title: 'The Ultimate Freelancer Bundle',
        slug: 'the-ultimate-freelancer-bundle',
        description: 'Get everything you need to start and scale your freelance business. Includes contracts, invoices, and proposal templates.',
        price: 149.00,
        originalPrice: 250.00,
        discount: 101.00,
        coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
        rating: 5.0,
        itemsIncluded: products.length,
        status: 'ACTIVE',
        featured: false,
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
