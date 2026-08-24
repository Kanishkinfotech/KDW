const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updatePassword() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('987654321', salt);

  await prisma.user.updateMany({
    where: { email: 'admin@example.com' },
    data: { passwordHash }
  });
  console.log("Password updated successfully for admin@example.com");
}

updatePassword().catch(console.error).finally(() => prisma.$disconnect());
