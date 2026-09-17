const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const eps = await p.automationWebhookEndpoint.findMany();
  console.log('All endpoints:', eps.length);
  for (const ep of eps) {
    console.log(ep.id, ep.name, ep.url, ep.provider, ep.direction, ep.status);
  }
}

run().catch(console.error).finally(() => p.$disconnect());
