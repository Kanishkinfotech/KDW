const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bundles = [
  {
    title: 'The Ultimate Freelancer Bundle',
    description: 'Get everything you need to start and scale your freelance business. Includes contracts, invoices, and proposal templates.',
    price: 149.00,
    originalPrice: 250.00,
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
    itemsIncluded: 5,
    rating: 5.0
  },
  {
    title: 'Creator AI Mastery Bundle',
    description: 'All our top-selling AI prompt packs and automation scripts in one massively discounted bundle.',
    price: 79.00,
    originalPrice: 150.00,
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800',
    itemsIncluded: 3,
    rating: 4.9
  }
];

async function seedBundles() {
  console.log('Seeding bundles...');
  await prisma.bundle.deleteMany({});
  
  for (const b of bundles) {
    await prisma.bundle.create({
      data: {
        title: b.title,
        description: b.description,
        price: b.price,
        originalPrice: b.originalPrice,
        coverImage: b.coverImage,
        rating: b.rating,
        itemsIncluded: b.itemsIncluded,
        status: 'ACTIVE'
      }
    });
  }
  console.log('Seeded bundles successfully!');
}

seedBundles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
