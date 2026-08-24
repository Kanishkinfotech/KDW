const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.product.findFirst({where: {name: 'Agency Starter Pack'}})
  .then(console.log)
  .finally(()=>p.$disconnect());
