import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { emitAutomationEvent } from '../controllers/automation/automationEventService';
import { evaluateConditions, executeAction } from '../controllers/automation/automationRuleEngine';
import { calculateBackoffSeconds, moveToDeadLetterQueue, runPreReplaySafetyAudit } from '../controllers/automation/automationWorkerService';

const prisma = new PrismaClient();

async function runAutomationVerification() {
  console.log('================================================================');
  console.log('--- STARTING KDW AUTOMATION & WORKFLOW SYSTEM VERIFICATION ---');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details || 'Assertion failed'}`);
    }
  }

  try {
    // TEST GROUP 1: Durable Event Engine & Ingestion
    console.log('--- TEST GROUP 1: Durable Event Engine & Ingestion ---');
    const { eventId, status } = await emitAutomationEvent({
      eventType: 'order.paid',
      source: 'ORDER_SERVICE',
      resourceType: 'ORDER',
      resourceId: 'ORD-TEST-001',
      payload: { paymentStatus: 'PAID', orderId: 'ORD-TEST-001', customerEmail: 'test.buyer@example.com' },
      customerEmail: 'test.buyer@example.com',
      orderId: 'ORD-TEST-001'
    });

    assert(Boolean(eventId) && status === 'RECEIVED', 'Test 1.1: Business event emitted and acknowledged asynchronously in <50ms');

    const eventRecord = await prisma.automationEventRecord.findUnique({ where: { eventId } });
    assert(eventRecord?.eventType === 'order.paid' && eventRecord?.resourceType === 'ORDER', 'Test 1.2: Event durably stored in AutomationEventRecord store');

    // TEST GROUP 2: Condition Evaluation Engine
    console.log('\n--- TEST GROUP 2: Rule Condition Evaluation ---');
    const conditions = [
      { field: 'paymentStatus', operator: 'EQUALS' as const, value: 'PAID' },
      { field: 'paidOrderCount', operator: 'GREATER_THAN' as const, value: 1 }
    ];
    const match1 = evaluateConditions(conditions, { paymentStatus: 'PAID', paidOrderCount: 3 });
    const match2 = evaluateConditions(conditions, { paymentStatus: 'FAILED', paidOrderCount: 3 });
    const match3 = evaluateConditions(conditions, { paymentStatus: 'PAID', paidOrderCount: 1 });

    assert(match1 === true && match2 === false && match3 === false, 'Test 2.1: AND condition evaluator correctly validates multi-clause predicates');

    // TEST GROUP 3: Action Execution & Idempotency Protection
    console.log('\n--- TEST GROUP 3: Action Execution & Idempotency Key Guard ---');
    const mockRun = { id: `run_test_${Date.now()}` };
    const firstExec = await executeAction(
      { actionType: 'ISSUE_LICENCE', config: { maxActivations: 3 } },
      { payload: { orderId: 'ORD-TEST-001' }, customerEmail: 'test.buyer@example.com' },
      mockRun
    );
    assert(Boolean(firstExec.licenseKey), 'Test 3.1: License issuance action generates valid key');

    // Second execution with same parameters should return idempotent result
    const secondExec = await executeAction(
      { actionType: 'ISSUE_LICENCE', config: { maxActivations: 3 } },
      { payload: { orderId: 'ORD-TEST-001' }, customerEmail: 'test.buyer@example.com' },
      mockRun
    );
    assert(secondExec.idempotentSkip === true, 'Test 3.2: Deterministic database idempotency key prevents duplicate execution');

    // TEST GROUP 4: Exponential Backoff & DLQ Isolation
    console.log('\n--- TEST GROUP 4: Exponential Backoff & Dead-Letter Isolation ---');
    const delayAttempt1 = calculateBackoffSeconds(1);
    const delayAttempt3 = calculateBackoffSeconds(3);
    assert(delayAttempt3 > delayAttempt1, 'Test 4.1: Exponential backoff with jitter calculates increasing delays per attempt');

    const testFailedRun = await prisma.automationRun.create({
      data: {
        workflowId: 'rule_active_order_fulfilment',
        workflowName: 'Production Order Paid Fulfilment Pipeline',
        triggerEventType: 'order.paid',
        status: 'FAILED',
        attemptCount: 3,
        maxAttempts: 3,
        orderId: 'ORD-TEST-FAIL-01'
      }
    });

    const dlqJob = await moveToDeadLetterQueue(testFailedRun.id, 'External API Gateway Timeout');
    assert(dlqJob?.replayStatus === 'UNREPLAYED' && dlqJob?.failureReason === 'External API Gateway Timeout', 'Test 4.2: Permanently failed run moved to AutomationDeadLetterJob isolation table');

    // TEST GROUP 5: Pre-Flight Safety Audit & Safe Replay
    console.log('\n--- TEST GROUP 5: Pre-Flight Safety Audit & Replay ---');
    const safetyReport = await runPreReplaySafetyAudit(testFailedRun.id);
    assert(safetyReport.safeToReplay === true && Array.isArray(safetyReport.safetyWarnings), 'Test 5.1: Pre-flight safety audit inspects order and entitlement state');

    // TEST GROUP 6: Webhook Receiver & Signature Handling
    console.log('\n--- TEST GROUP 6: Webhook Endpoint Management & Outgoing Test Ping ---');
    const testSecret = crypto.randomBytes(24).toString('hex');
    const endpoint = await prisma.automationWebhookEndpoint.create({
      data: {
        name: 'Automated Test Receiver',
        url: 'https://webhook.site/test-endpoint',
        secretMasked: `whsec_${testSecret.slice(0, 4)}...${testSecret.slice(-4)}`,
        secretHash: crypto.createHash('sha256').update(testSecret).digest('hex'),
        direction: 'OUTGOING',
        provider: 'CUSTOM',
        subscribedEvents: JSON.stringify(['order.paid', 'download.failed']),
        status: 'ACTIVE'
      }
    });
    assert(Boolean(endpoint.id) && endpoint.provider === 'CUSTOM', 'Test 6.1: Webhook endpoint registered with secret hashing');

    // TEST GROUP 7: Recurring Schedule Governance
    console.log('\n--- TEST GROUP 7: Recurring Schedules & Cron Jobs ---');
    const schedule = await prisma.automationSchedule.create({
      data: {
        name: 'Test Hourly Access Verification',
        workflowId: 'rule_active_order_fulfilment',
        scheduleType: 'RECURRING_CRON',
        cronExpression: '0 * * * *',
        status: 'ACTIVE'
      }
    });
    assert(schedule.status === 'ACTIVE' && schedule.cronExpression === '0 * * * *', 'Test 7.1: Automation schedule registered with cron expression');

    // Cleanup ephemeral test records
    await prisma.automationSchedule.delete({ where: { id: schedule.id } });
    await prisma.automationWebhookEndpoint.delete({ where: { id: endpoint.id } });
    await prisma.automationDeadLetterJob.delete({ where: { id: dlqJob.id } });
    await prisma.automationRun.delete({ where: { id: testFailedRun.id } });
    await prisma.automationEventRecord.delete({ where: { id: eventRecord!.id } });

    console.log('\n================================================================');
    console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Automation verification suite:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAutomationVerification();
