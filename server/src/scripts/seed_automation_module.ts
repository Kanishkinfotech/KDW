import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function seedAutomationModule() {
  console.log('--- SEEDING KDW AUTOMATION MODULE DATA & TEMPLATES ---');

  // 1. Seed 14 Production Workflow Templates
  const templates = [
    {
      templateKey: 'tpl_order_paid_fulfilment',
      name: 'Successful Order Paid Fulfilment',
      description: 'Automatically creates digital entitlement, generates software licence, dispatches customer access email, and notifies Store Manager.',
      category: 'ORDER',
      triggerEvent: 'order.paid',
      conditionJson: JSON.stringify([
        { field: 'paymentStatus', operator: 'EQUALS', value: 'PAID' }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'CREATE_ENTITLEMENT', config: { durationDays: 365 } },
        { actionType: 'ISSUE_LICENCE', config: { maxActivations: 3 } },
        { actionType: 'SEND_EMAIL', config: { template: 'ORDER_FULFILLED_RECEIPT' } },
        { actionType: 'NOTIFY_ADMIN', config: { title: 'Order Fulfilled', severity: 'LOW' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_order_missing_entitlement',
      name: 'Paid Order Missing Entitlement Recovery',
      description: 'Detects paid orders missing digital entitlements after 2 minutes, triggers automated fulfillment retry, and alerts Support.',
      category: 'ORDER',
      triggerEvent: 'order.paid',
      conditionJson: JSON.stringify([
        { field: 'entitlementExists', operator: 'EQUALS', value: false }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'CREATE_ENTITLEMENT', config: { retry: true } },
        { actionType: 'NOTIFY_ADMIN', config: { title: 'Missing Entitlement Auto-Recovery', severity: 'HIGH' } },
        { actionType: 'CREATE_TICKET', config: { subject: 'Urgent: Missing Entitlement Investigation', priority: 'HIGH' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_access_granted_email',
      name: 'Access Granted Email Dispatch',
      description: 'Sends secure instant access links with time-limited signed tokens to verified purchasers.',
      category: 'EMAIL',
      triggerEvent: 'entitlement.created',
      conditionJson: JSON.stringify([
        { field: 'status', operator: 'EQUALS', value: 'ACTIVE' }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'SEND_EMAIL', config: { template: 'ACCESS_GRANTED_STREAM' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_abandoned_checkout',
      name: 'Abandoned Checkout Recovery',
      description: 'Sends abandoned checkout reminder with special 10% coupon if customer has not purchased within 2 hours.',
      category: 'EMAIL',
      triggerEvent: 'checkout.started',
      conditionJson: JSON.stringify([
        { field: 'marketingConsent', operator: 'EQUALS', value: true },
        { field: 'isPurchased', operator: 'EQUALS', value: false }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'SEND_EMAIL', config: { template: 'ABANDONED_CHECKOUT_RECOVERY', delayMinutes: 120 } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_returning_customer_loyalty',
      name: 'Returning Customer Loyalty Offer',
      description: 'Tags VIP repeat customers with >= 2 paid orders and schedules exclusive early-access discounts.',
      category: 'CUSTOMER',
      triggerEvent: 'order.paid',
      conditionJson: JSON.stringify([
        { field: 'paidOrderCount', operator: 'GREATER_THAN', value: 1 }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'ADD_TAG', config: { tag: 'VIP_REPEAT_BUYER' } },
        { actionType: 'SEND_EMAIL', config: { template: 'LOYALTY_APPRECIATION_VOUCHER' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_guest_order_claim',
      name: 'Guest Order Claiming on Email Verification',
      description: 'Links historical unlinked guest purchases to customer account upon email verification.',
      category: 'CUSTOMER',
      triggerEvent: 'customer.email_verified',
      conditionJson: JSON.stringify([
        { field: 'guestOrdersCount', operator: 'GREATER_THAN', value: 0 }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'ADD_TAG', config: { tag: 'ACCOUNT_VERIFIED' } },
        { actionType: 'NOTIFY_ADMIN', config: { title: 'Guest Orders Linked', severity: 'LOW' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_marketing_opt_out',
      name: 'Marketing Opt-Out Suppression',
      description: 'Immediately updates suppression records and removes unsubscribed customers from active campaigns.',
      category: 'CUSTOMER',
      triggerEvent: 'customer.opt_out',
      conditionJson: JSON.stringify([]),
      actionJson: JSON.stringify([
        { actionType: 'ADD_TAG', config: { tag: 'MARKETING_UNSUBSCRIBED' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_repeated_download_failure',
      name: 'Repeated Download Failure Alert',
      description: 'Monitors multiple failed file downloads, schedules Google Drive health checks, and opens high-priority support ticket.',
      category: 'DOWNLOAD',
      triggerEvent: 'download.failed',
      conditionJson: JSON.stringify([
        { field: 'failureCount', operator: 'GREATER_THAN', value: 2 }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'CREATE_TICKET', config: { subject: 'Delivery Alert: Repeated Download Failure', priority: 'HIGH' } },
        { actionType: 'DRIVE_HEALTH_CHECK', config: { verifyPermissions: true } },
        { actionType: 'NOTIFY_ADMIN', config: { title: 'Drive Asset Health Warning', severity: 'HIGH' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_access_expiry_reminder',
      name: 'Access Expiry 7-Day Reminder',
      description: 'Alerts customers whose access window is expiring with zero downloads completed.',
      category: 'DOWNLOAD',
      triggerEvent: 'entitlement.expiring',
      conditionJson: JSON.stringify([
        { field: 'downloadCount', operator: 'EQUALS', value: 0 }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'SEND_EMAIL', config: { template: 'ACCESS_EXPIRY_WARNING' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_download_limit_reached',
      name: 'Download Limit Reached Notice',
      description: 'Sends explanation notice and logs support review task when maximum device download quota is reached.',
      category: 'DOWNLOAD',
      triggerEvent: 'download.limit_reached',
      conditionJson: JSON.stringify([]),
      actionJson: JSON.stringify([
        { actionType: 'SEND_EMAIL', config: { template: 'DOWNLOAD_LIMIT_NOTICE' } },
        { actionType: 'CREATE_TICKET', config: { subject: 'Download Quota Review Request', priority: 'MEDIUM' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_software_licence_issuance',
      name: 'Software License Key Issuance',
      description: 'Generates cryptographically signed software activation license keys upon order completion.',
      category: 'LICENCE',
      triggerEvent: 'order.paid',
      conditionJson: JSON.stringify([
        { field: 'productType', operator: 'EQUALS', value: 'SOFTWARE' }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'ISSUE_LICENCE', config: { format: 'HEX_KEY' } },
        { actionType: 'SEND_EMAIL', config: { template: 'LICENCE_KEYS_DELIVERY' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_payment_failure_notice',
      name: 'Payment Failure Recovery Notice',
      description: 'Sends polite payment retry checkout link and flags potential gateway dropouts.',
      category: 'ORDER',
      triggerEvent: 'payment.failed',
      conditionJson: JSON.stringify([]),
      actionJson: JSON.stringify([
        { actionType: 'SEND_EMAIL', config: { template: 'PAYMENT_FAILED_RETRY' } },
        { actionType: 'ADD_TAG', config: { tag: 'PAYMENT_DROPOUT' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_refund_revocation',
      name: 'Customer Refund Processing & Revocation',
      description: 'Revokes active digital entitlement and cancels issued license keys upon refund approval.',
      category: 'ORDER',
      triggerEvent: 'refund.processed',
      conditionJson: JSON.stringify([]),
      actionJson: JSON.stringify([
        { actionType: 'REVOKE_ACCESS', config: { reason: 'Refund approved' } },
        { actionType: 'NOTIFY_ADMIN', config: { title: 'Digital Entitlements Revoked', severity: 'MEDIUM' } }
      ]),
      isTemplate: true
    },
    {
      templateKey: 'tpl_support_sla_escalation',
      name: 'Support Ticket SLA Escalation',
      description: 'Escalates overdue support tickets to Senior Staff and elevates priority to CRITICAL.',
      category: 'CUSTOM',
      triggerEvent: 'support.ticket.overdue',
      conditionJson: JSON.stringify([]),
      actionJson: JSON.stringify([
        { actionType: 'CREATE_TICKET', config: { subject: 'Overdue SLA Escalation', priority: 'CRITICAL' } },
        { actionType: 'NOTIFY_ADMIN', config: { title: 'Ticket SLA Breach', severity: 'CRITICAL' } }
      ]),
      isTemplate: true
    }
  ];

  for (const t of templates) {
    await prisma.automationRule.upsert({
      where: { templateKey: t.templateKey },
      update: t,
      create: t
    });
  }
  console.log(`✅ Seeded ${templates.length} Production Workflow Templates.`);

  // 2. Seed an Active Rule based on Order Paid Fulfilment
  const activeRule = await prisma.automationRule.upsert({
    where: { id: 'rule_active_order_fulfilment' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'rule_active_order_fulfilment',
      name: 'Production Order Paid Fulfilment Pipeline',
      description: 'Live order fulfillment rule executing entitlement creation and email receipt dispatch.',
      category: 'ORDER',
      triggerEvent: 'order.paid',
      conditionJson: JSON.stringify([
        { field: 'paymentStatus', operator: 'EQUALS', value: 'PAID' }
      ]),
      actionJson: JSON.stringify([
        { actionType: 'CREATE_ENTITLEMENT', config: { durationDays: 365 } },
        { actionType: 'ISSUE_LICENCE', config: { maxActivations: 3 } },
        { actionType: 'SEND_EMAIL', config: { template: 'ORDER_RECEIPT' } }
      ]),
      status: 'ACTIVE',
      executionCount: 142,
      lastExecutedAt: new Date()
    }
  });

  // 3. Seed Sample Runs with Step Timeline
  const run1 = await prisma.automationRun.create({
    data: {
      id: 'run_sample_01',
      workflowId: activeRule.id,
      workflowName: activeRule.name,
      triggerEventType: 'order.paid',
      customerEmail: 'arjun.sharma@example.com',
      orderId: 'ORD-2026-9901',
      status: 'COMPLETED',
      durationMs: 135,
      attemptCount: 1,
      steps: {
        create: [
          { stepOrder: 1, stepType: 'ACTION', actionType: 'CREATE_ENTITLEMENT', status: 'COMPLETED', durationMs: 45, resultJson: JSON.stringify({ entitlementId: 'ent_9901', status: 'ACTIVE' }) },
          { stepOrder: 2, stepType: 'ACTION', actionType: 'ISSUE_LICENCE', status: 'COMPLETED', durationMs: 38, resultJson: JSON.stringify({ licenseKey: 'KDW-LIC-A9B2-C8D4' }) },
          { stepOrder: 3, stepType: 'ACTION', actionType: 'SEND_EMAIL', status: 'COMPLETED', durationMs: 52, resultJson: JSON.stringify({ messageId: 'msg_887192', status: 'DELIVERED' }) }
        ]
      }
    }
  }).catch(() => {});

  // 4. Seed Sample Dead-Letter Job
  const runFailed = await prisma.automationRun.create({
    data: {
      id: 'run_failed_dlq_01',
      workflowId: activeRule.id,
      workflowName: activeRule.name,
      triggerEventType: 'order.paid',
      customerEmail: 'failed.buyer@example.com',
      orderId: 'ORD-2026-9999',
      status: 'DEAD_LETTER',
      durationMs: 420,
      attemptCount: 3,
      errorMessage: 'Drive storage API quota exhausted during asset bundle packaging'
    }
  }).catch(() => {});

  await prisma.automationDeadLetterJob.create({
    data: {
      id: 'dlq_01',
      runId: 'run_failed_dlq_01',
      workflowId: activeRule.id,
      workflowName: activeRule.name,
      eventType: 'order.paid',
      failureReason: 'Drive storage API quota exhausted during asset bundle packaging',
      attemptCount: 3,
      replayStatus: 'UNREPLAYED'
    }
  }).catch(() => {});

  // 5. Seed Outgoing Webhook Endpoints
  const secret = crypto.randomBytes(24).toString('hex');
  await prisma.automationWebhookEndpoint.upsert({
    where: { id: 'wh_razorpay_events' },
    update: {},
    create: {
      id: 'wh_razorpay_events',
      name: 'Razorpay Payment Captured Webhook',
      url: 'https://api.kanishkdigitalworld.com/api/webhooks/razorpay',
      secretMasked: `whsec_${secret.slice(0, 4)}...${secret.slice(-4)}`,
      secretHash: crypto.createHash('sha256').update(secret).digest('hex'),
      direction: 'INCOMING',
      provider: 'RAZORPAY',
      subscribedEvents: JSON.stringify(['order.paid', 'payment.captured', 'refund.processed']),
      status: 'ACTIVE'
    }
  });

  // 6. Seed Recurring Schedule
  await prisma.automationSchedule.upsert({
    where: { id: 'sched_hourly_gc' },
    update: {},
    create: {
      id: 'sched_hourly_gc',
      name: 'Hourly Expired Access & Cache Sweep',
      workflowId: activeRule.id,
      scheduleType: 'RECURRING_CRON',
      cronExpression: '0 * * * *',
      nextExecutionAt: new Date(Date.now() + 3600 * 1000),
      status: 'ACTIVE'
    }
  });

  console.log('--- KDW AUTOMATION MODULE SEEDING COMPLETED CLEANLY ---');
}

seedAutomationModule()
  .catch((e) => {
    console.error('Error seeding automation module:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
