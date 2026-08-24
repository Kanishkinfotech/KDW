const { PrismaClient } = require('@prisma/client');

async function testConnection(password) {
  const url = `postgresql://postgres:${password}@localhost:5432/postgres?schema=public`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    console.log(`Connection SUCCESS with password: ${password}`);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    // console.log(`Failed with password: ${password}`);
    return false;
  }
}

async function run() {
  const passwords = ['postgres', 'password', 'root', 'admin', '123456', ''];
  for (const p of passwords) {
    const success = await testConnection(p);
    if (success) {
      process.exit(0);
    }
  }
  console.log('Could not connect with common passwords.');
}

run();
