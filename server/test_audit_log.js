const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.auditLog.findMany({});
  console.log('Logs:', logs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
