const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting cleanup of gail.com...");

  // 1. Find both users
  const gailUser = await prisma.user.findFirst({
    where: { email: { equals: 'vishwa1234@gail.com', mode: 'insensitive' } }
  });
  
  let gmailUser = await prisma.user.findFirst({
    where: { email: { equals: 'vishwa1234@gmail.com', mode: 'insensitive' } }
  });

  const hashedPassword = await bcrypt.hash('123456789', 10);

  if (!gmailUser) {
    gmailUser = await prisma.user.create({
      data: {
        email: 'vishwa1234@gmail.com',
        normalizedEmail: 'vishwa1234@gmail.com',
        name: 'Admin Vishwa',
        role: 'SUPER_ADMIN',
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        emailVerified: true,
        failedLoginCount: 0
      }
    });
    console.log("Created gmailUser:", gmailUser.email);
  } else {
    gmailUser = await prisma.user.update({
      where: { id: gmailUser.id },
      data: {
        name: 'Admin Vishwa',
        role: 'SUPER_ADMIN',
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        failedLoginCount: 0,
        emailVerified: true
      }
    });
    console.log("Updated gmailUser:", gmailUser.email, "role:", gmailUser.role);
  }

  if (gailUser) {
    console.log("Found gailUser:", gailUser.id, gailUser.email);

    // Re-point related records for gailUser
    await prisma.order.updateMany({ where: { customerId: gailUser.id }, data: { customerId: gmailUser.id } }).catch(() => {});
    await prisma.purchase.updateMany({ where: { customerId: gailUser.id }, data: { customerId: gmailUser.id } }).catch(() => {});
    await prisma.auditLog.updateMany({ where: { adminId: gailUser.id }, data: { adminId: gmailUser.id } }).catch(() => {});
    await prisma.customerSession.deleteMany({ where: { userId: gailUser.id } }).catch(() => {});
    await prisma.customerLoginLog.updateMany({ where: { userId: gailUser.id }, data: { userId: gmailUser.id } }).catch(() => {});
    await prisma.customerTimelineEvent.updateMany({ where: { customerId: gailUser.id }, data: { customerId: gmailUser.id } }).catch(() => {});
    await prisma.customerSecurityEvent.updateMany({ where: { userId: gailUser.id }, data: { userId: gmailUser.id } }).catch(() => {});
    await prisma.customerAuditLog.updateMany({ where: { userId: gailUser.id }, data: { userId: gmailUser.id } }).catch(() => {});
    await prisma.staffProfile.deleteMany({ where: { userId: gailUser.id } }).catch(() => {});

    // Delete gailUser
    await prisma.user.delete({ where: { id: gailUser.id } });
    console.log("Successfully deleted gailUser from database.");
  } else {
    console.log("No gailUser found in User table.");
  }

  // 2. Update any other table columns containing gail.com
  const r1 = await prisma.customerLoginLog.updateMany({
    where: { email: { contains: 'gail.com', mode: 'insensitive' } },
    data: { email: 'vishwa1234@gmail.com' }
  }).catch(() => ({ count: 0 }));
  console.log(`Updated ${r1.count} login logs.`);

  const r2 = await prisma.systemLoginLog.updateMany({
    where: { email: { contains: 'gail.com', mode: 'insensitive' } },
    data: { email: 'vishwa1234@gmail.com' }
  }).catch(() => ({ count: 0 }));
  console.log(`Updated ${r2.count} system login logs.`);

  const r3 = await prisma.customerSecurityEvent.updateMany({
    where: { email: { contains: 'gail.com', mode: 'insensitive' } },
    data: { email: 'vishwa1234@gmail.com' }
  }).catch(() => ({ count: 0 }));
  console.log(`Updated ${r3.count} security events.`);

  const r4 = await prisma.customerTimelineEvent.updateMany({
    where: { actorEmail: { contains: 'gail.com', mode: 'insensitive' } },
    data: { actorEmail: 'vishwa1234@gmail.com' }
  }).catch(() => ({ count: 0 }));
  console.log(`Updated ${r4.count} timeline events.`);

  console.log("Cleanup of gail.com completed successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
