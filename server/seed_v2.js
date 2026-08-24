const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bundle = await prisma.bundle.create({
    data: {
      title: 'The Ultimate Freelancer Bundle',
      description: 'Get everything you need to start and scale your freelance business.',
      price: 149.00,
      originalPrice: 250.00,
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
      itemsIncluded: 5,
      rating: 5.0,
      slug: 'the-ultimate-freelancer-bundle'
    }
  });

  const product = await prisma.product.findFirst();
  if (product) {
    await prisma.review.create({
      data: {
        productId: product.id,
        customerName: 'Jane Doe',
        rating: 5,
        title: 'Amazing Product!',
        comment: 'This product really helped me out a lot.',
        status: 'PENDING'
      }
    });
  }

  console.log("Seeded bundle and review successfully");
}

main().catch(console.error).finally(() => prisma.$disconnect());
