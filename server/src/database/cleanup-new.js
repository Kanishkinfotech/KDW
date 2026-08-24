const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newCategoryNames = [
  'AI & Content', 'Career', 'Marketing', 'Education', 'Developer',
  'AI & Automation', 'AI & Marketing', 'AI & Business', 'Creator',
  'Business', 'E-commerce', 'Finance'
];

async function run() {
  console.log("Cleaning up new categories and products...");
  
  // Find the new categories
  const newCats = await prisma.category.findMany({
    where: { name: { in: newCategoryNames } }
  });
  const catIds = newCats.map(c => c.id);
  
  // Delete all products that belong to these new categories
  const deletedProducts = await prisma.product.deleteMany({
    where: { categoryId: { in: catIds } }
  });
  console.log(`Deleted ${deletedProducts.count} products.`);
  
  // Delete the categories
  const deletedCats = await prisma.category.deleteMany({
    where: { id: { in: catIds } }
  });
  console.log(`Deleted ${deletedCats.count} categories.`);
  
  await prisma.$disconnect();
}

run().catch(console.error);
