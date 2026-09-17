const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const eps = await p.automationWebhookEndpoint.findMany();
  console.log(JSON.stringify(eps, null, 2));
}

run().catch(console.error).finally(() => p.$disconnect());
