const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash: hashedPassword, role: 'ADMIN' },
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      mobile: '1234567890'
    }
  });
  console.log("Admin user created:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
