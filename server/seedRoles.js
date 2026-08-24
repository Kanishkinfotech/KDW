const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rolesToCreate = [
    {
      name: 'SUPER_ADMIN',
      description: 'Full system access',
      permissions: JSON.stringify(['all']),
      isSystem: true
    },
    {
      name: 'ADMIN',
      description: 'General administrator',
      permissions: JSON.stringify(['view_dashboard', 'manage_users', 'manage_products', 'manage_orders', 'view_roles']),
      isSystem: true
    },
    {
      name: 'SUPPORT_AGENT',
      description: 'Customer support',
      permissions: JSON.stringify(['view_dashboard', 'manage_support']),
      isSystem: false
    },
    {
      name: 'MARKETING',
      description: 'Marketing staff',
      permissions: JSON.stringify(['view_dashboard', 'manage_products', 'manage_coupons']),
      isSystem: false
    },
    {
      name: 'CUSTOMER',
      description: 'Standard customer account',
      permissions: JSON.stringify([]),
      isSystem: true
    }
  ];

  console.log('Seeding roles...');

  for (const r of rolesToCreate) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r
    });
    console.log(`Created/Verified role: ${r.name}`);
  }
  
  console.log('Seeding complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
