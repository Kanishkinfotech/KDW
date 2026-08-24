const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.bundle.update({
    where: { slug: 'the-ultimate-freelancer-bundle' },
    data: { originalPrice: 7500, price: 5225 }
  });
  console.log('Updated The Ultimate Freelancer Bundle to 5225');
}
run().catch(console.error).finally(() => prisma.$disconnect());
