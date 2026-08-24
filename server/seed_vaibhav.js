const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Kanishk~1122', 10);
  const user = await prisma.user.upsert({
    where: { email: 'vaibhav123@gmail.com' },
    update: { passwordHash: hashedPassword, role: 'ADMIN' },
    create: {
      email: 'vaibhav123@gmail.com',
      passwordHash: hashedPassword,
      name: 'Vaibhav',
      role: 'ADMIN',
      mobile: '1234567890'
    }
  });
  console.log("Admin user created:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
