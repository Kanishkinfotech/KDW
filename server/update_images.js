const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      thumbnail: { contains: 'unsplash.com' }
    }
  });

  console.log(`Found ${products.length} products with unsplash URLs.`);

  const fallbackImages = [
    '/images/products/marketing_automation.jpg',
    '/images/products/agent_kits.jpg',
    '/images/products/social_media_kit.jpg',
    '/images/products/startup_proposal.jpg'
  ];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const newImage = fallbackImages[i % fallbackImages.length];
    
    await prisma.product.update({
      where: { id: product.id },
      data: { 
        thumbnail: newImage,
        previewImages: JSON.stringify([newImage, newImage, newImage]) // add preview images too
      }
    });
    console.log(`Updated ${product.name} to use ${newImage}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
