const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeSuperAdmin() {
  await prisma.user.updateMany({
    where: { email: 'admin@example.com' },
    data: { role: 'SUPER_ADMIN' }
  });
  console.log("admin@example.com is now SUPER_ADMIN");
}

makeSuperAdmin().catch(console.error).finally(() => prisma.$disconnect());
