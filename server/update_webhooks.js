const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const host = 'http://localhost:5000';
  const endpoints = [
    {
      id: 'wh_razorpay_events',
      name: 'Razorpay Payment & Order Webhook',
      url: `${host}/api/payments/webhook`,
      secretMasked: 'whsec_rzp_live_••••',
      secretHash: '64b35e2fcf353e353ea20bb918e137986478769bd2b670e71c382a184a7ff278',
      direction: 'INCOMING',
      provider: 'RAZORPAY',
      subscribedEvents: JSON.stringify(['payment.captured', 'order.paid', 'refund.processed', 'payment.failed']),
      status: 'ACTIVE'
    },
    {
      id: 'wh_resend_email',
      name: 'Resend Email Event Webhook',
      url: `${host}/api/webhooks/resend`,
      secretMasked: 'whsec_rsd_••••••••',
      secretHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      direction: 'INCOMING',
      provider: 'RESEND',
      subscribedEvents: JSON.stringify(['email.sent', 'email.delivered', 'email.bounced', 'email.complained']),
      status: 'ACTIVE'
    }
  ];

  for (const ep of endpoints) {
    await p.automationWebhookEndpoint.upsert({
      where: { id: ep.id },
      create: ep,
      update: ep
    });
  }

  // Remove any corrupted / duplicate / test endpoints
  const validIds = endpoints.map(e => e.id);
  const deleted = await p.automationWebhookEndpoint.deleteMany({
    where: { id: { notIn: validIds } }
  });

  const finalEps = await p.automationWebhookEndpoint.findMany();
  console.log('Final endpoints count:', finalEps.length, finalEps.map(e => ({ name: e.name, url: e.url, provider: e.provider })));
}

run().catch(console.error).finally(() => p.$disconnect());
