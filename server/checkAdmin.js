const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
  console.log(admins.map(a => ({ name: a.name, email: a.email, role: a.role })));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
