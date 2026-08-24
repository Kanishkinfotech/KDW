const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456789', 10);
  const user = await prisma.user.upsert({
    where: { email: 'vishwa1234@gmail.com' },
    update: { passwordHash: hashedPassword, role: 'ADMIN' },
    create: {
      email: 'vishwa1234@gmail.com',
      passwordHash: hashedPassword,
      name: 'Admin Vishwa',
      role: 'ADMIN',
      mobile: '1234567890'
    }
  });
  console.log("Admin user created:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
