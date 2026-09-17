import { prisma } from '../database/db';

async function checkNotificationStats() {
  console.log('=== KWD MAIL & NOTIFICATIONS AUDIT ===\n');

  const [totalNotifications, unreadNotifications, allNotifications] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  ]);

  console.log(`Total Notifications in DB: ${totalNotifications}`);
  console.log(`Unread Notifications in DB: ${unreadNotifications}`);

  console.log('\nRecent Notifications:');
  allNotifications.forEach((n, idx) => {
    console.log(`[#${idx + 1}] Type: ${n.type}, Read: ${n.isRead}, Created: ${n.createdAt}`);
    console.log(`     Message: "${n.message}"\n`);
  });

  await prisma.$disconnect();
}

checkNotificationStats().catch(err => {
  console.error(err);
  process.exit(1);
});
