const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.notification.create({
    data: {
      title: 'Welcome to Notifications',
      message: 'This is a test notification from the real database!',
      type: 'System'
    }
  });
  console.log('Seeded notification successfully');
}
main().catch(console.error).finally(() => prisma.$disconnect());
