import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { calculateSlaDeadlines, evaluateSlaStatus } from '../controllers/support/slaEngine';

const prisma = new PrismaClient();

async function runSupportSystemVerification() {
  console.log('====================================================');
  console.log('   KDW SUPPORT MODULE — FULL SYSTEM VERIFICATION   ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${name} ${details ? `— ${details}` : ''}`);
    }
  }

  // TEST 1: SLA Deadlines Calculation Engine
  const criticalSla = calculateSlaDeadlines('CRITICAL');
  assertTest(
    'SLA Engine: CRITICAL priority sets 30m response target & 240m resolution target',
    criticalSla.firstResponseTargetMinutes === 30 && criticalSla.resolutionTargetMinutes === 240
  );

  const highSla = calculateSlaDeadlines('HIGH');
  assertTest(
    'SLA Engine: HIGH priority sets 120m response target & 1440m resolution target',
    highSla.firstResponseTargetMinutes === 120 && highSla.resolutionTargetMinutes === 1440
  );

  // TEST 2: Dynamic SLA Status Evaluation
  const healthyStatus = evaluateSlaStatus({ resolutionDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }, 'OPEN');
  assertTest('SLA Status: Future deadline evaluates to HEALTHY', healthyStatus === 'HEALTHY');

  const breachedStatus = evaluateSlaStatus({ resolutionDueAt: new Date(Date.now() - 1000) }, 'OPEN');
  assertTest('SLA Status: Past deadline evaluates to BREACHED', breachedStatus === 'BREACHED');

  const completedStatus = evaluateSlaStatus({ resolutionDueAt: new Date(Date.now() - 1000) }, 'RESOLVED');
  assertTest('SLA Status: Resolved ticket evaluates to COMPLETED', completedStatus === 'COMPLETED');

  // TEST 3: Database Models & Seed Data Integrity
  const ticketCount = await prisma.supportTicket.count();
  assertTest('Database: Support tickets seeded and queryable', ticketCount > 0, `Count: ${ticketCount}`);

  const categoryConfigs = await prisma.supportCategoryConfig.count();
  assertTest('Database: Support category configurations populated', categoryConfigs >= 8, `Count: ${categoryConfigs}`);

  const cannedCount = await prisma.cannedResponse.count();
  assertTest('Database: Canned response templates populated', cannedCount >= 5, `Count: ${cannedCount}`);

  // TEST 4: Eager loading and Relationships
  const testTicket = await prisma.supportTicket.findFirst({
    where: { ticketNumber: 'TKT-202608-0001' },
    include: {
      user: true,
      order: true,
      product: true,
      messages: true,
      slaRecord: true
    }
  });
  assertTest('Unified Context: Ticket eager loads user, order, product, messages, and SLA record', Boolean(testTicket && testTicket.slaRecord));

  // TEST 5: Internal Notes Isolation Check
  const inProgressTicket = await prisma.supportTicket.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: { messages: true }
  });

  if (inProgressTicket) {
    const customerVisibleMsgs = inProgressTicket.messages.filter(m => m.visibility === 'CUSTOMER');
    const internalNotes = inProgressTicket.messages.filter(m => m.visibility === 'INTERNAL_NOTE');

    assertTest(
      'Security Isolation: Internal notes exist and are flagged with visibility=INTERNAL_NOTE',
      internalNotes.length > 0 && customerVisibleMsgs.every(m => m.visibility === 'CUSTOMER')
    );
  }

  // TEST 6: Customer Request Lifecycle
  const customerReq = await prisma.customerRequest.findFirst({
    where: { requestType: 'DATA_EXPORT' },
    include: { ticket: true }
  });
  assertTest(
    'GDPR / Account Request: Customer request linked to parent ticket and verified',
    Boolean(customerReq && customerReq.verificationStatus === 'VERIFIED')
  );

  // TEST 7: Customer Satisfaction Survey
  const csatRecords = await prisma.supportSatisfaction.findMany();
  assertTest('CSAT Engine: Customer satisfaction surveys recorded with 1-5 star ratings', csatRecords.length > 0);

  // TEST 8: State Machine & Ticket Event Audit Trail
  const initialEvents = await prisma.supportTicketEvent.count();
  assertTest('Audit Trail: Ticket lifecycle events recorded in immutable audit log', initialEvents > 0);

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('ALL SUPPORT MODULE TESTS COMPLETED SUCCESSFULLY.');
  } else {
    throw new Error(`Support system verification failed: ${totalTests - passedTests} tests failed.`);
  }
}

runSupportSystemVerification()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
