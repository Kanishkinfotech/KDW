const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create Category
  const category = await prisma.category.create({
    data: {
      name: 'Digital Templates',
      slug: 'digital-templates',
      description: 'Awesome digital templates',
    }
  });

  // Create Products
  await prisma.product.create({
    data: {
      name: 'Premium UI Kit',
      slug: 'premium-ui-kit',
      description: 'A fantastic UI kit for your projects.',
      shortDescription: 'High quality UI kit',
      price: 49.99,
      categoryId: category.id,
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
      status: 'ACTIVE',
    }
  });

  await prisma.product.create({
    data: {
      name: 'Business Dashboard Template',
      slug: 'business-dashboard-template',
      description: 'Complete dashboard solution.',
      shortDescription: 'Dashboard template',
      price: 79.99,
      categoryId: category.id,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
      status: 'ACTIVE',
    }
  });

  console.log("Seeded database with dummy products!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
