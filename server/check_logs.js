const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const systemLogs = await p.systemWebhookLog.findMany({ take: 5 });
  console.log('systemWebhookLogs:', systemLogs);
  const paymentEvents = await p.paymentEvent.findMany({ take: 5 });
  console.log('paymentEvents:', paymentEvents);
}

run().catch(console.error).finally(() => p.$disconnect());
