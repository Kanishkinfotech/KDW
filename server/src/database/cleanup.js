const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.category.findMany();
  console.log("ALL CATEGORIES:");
  categories.forEach(c => console.log(`- ${c.name} (${c.id})`));
  
  const products = await prisma.product.findMany();
  console.log("\nALL PRODUCTS:");
  products.forEach(p => console.log(`- ${p.name} (Cat: ${categories.find(c => c.id === p.categoryId)?.name})`));
  
  await prisma.$disconnect();
}

run().catch(console.error);
