const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const bundles = await prisma.bundle.findMany({ include: { products: true } });
  for (const b of bundles) {
    const sum = b.products.reduce((acc, p) => acc + (p.price || 0), 0);
    if (sum > 0) {
      const newPrice = Math.floor(sum * 0.7);
      await prisma.bundle.update({
        where: { id: b.id },
        data: { originalPrice: sum, price: newPrice }
      });
      console.log('Updated', b.title, 'sum:', sum, 'price:', newPrice);
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
