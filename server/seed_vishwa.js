const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456789', 10);

  const user = await prisma.user.upsert({
    where: { email: 'vishwa1234@gmail.com' },
    update: { 
      passwordHash: hashedPassword, 
      role: 'SUPER_ADMIN',
      failedLoginCount: 0,
      status: 'ACTIVE',
      blockScope: 'NONE',
      blockReason: null
    },
    create: {
      email: 'vishwa1234@gmail.com',
      normalizedEmail: 'vishwa1234@gmail.com',
      passwordHash: hashedPassword,
      name: 'Admin Vishwa',
      role: 'SUPER_ADMIN',
      mobile: '1234567890',
      status: 'ACTIVE',
      emailVerified: true,
      failedLoginCount: 0
    }
  });
  console.log("Admin user updated/created:", user.email, "failedLoginCount:", user.failedLoginCount, "role:", user.role);

  await prisma.customerSecurityEvent.updateMany({
    where: { 
      email: 'vishwa1234@gmail.com',
      status: 'OPEN'
    },
    data: {
      status: 'RESOLVED',
      resolutionNotes: 'Unlocked and verified by administrator'
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
