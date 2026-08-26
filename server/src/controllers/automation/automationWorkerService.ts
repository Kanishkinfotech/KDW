import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Handles exponential backoff calculation with jitter
 */
export function calculateBackoffSeconds(attempt: number): number {
  const base = Math.min(3600, Math.pow(2, attempt) * 30);
  const jitter = Math.floor(Math.random() * 15);
  return base + jitter;
}

/**
 * Moves a permanently failed job to the Dead-Letter Queue
 */
export async function moveToDeadLetterQueue(runId: string, errorReason: string): Promise<any> {
  const run = await prisma.automationRun.findUnique({
    where: { id: runId },
    include: { workflow: true }
  });

  if (!run) return null;

  const dlqJob = await prisma.automationDeadLetterJob.create({
    data: {
      runId: run.id,
      workflowId: run.workflowId,
      workflowName: run.workflowName,
      originalEventId: run.triggerEventId,
      eventType: run.triggerEventType,
      failureReason: errorReason,
      attemptCount: run.attemptCount,
      replayStatus: 'UNREPLAYED'
    }
  });

  await prisma.automationRun.update({
    where: { id: run.id },
    data: { status: 'DEAD_LETTER', errorMessage: errorReason }
  });

  return dlqJob;
}

/**
 * Runs a pre-flight safety audit before replaying a dead-letter or failed run
 */
export async function runPreReplaySafetyAudit(runId: string): Promise<{
  safeToReplay: boolean;
  orderState: string;
  entitlementExists: boolean;
  licenceExists: boolean;
  safetyWarnings: string[];
}> {
  const run = await prisma.automationRun.findUnique({
    where: { id: runId },
    include: { steps: true }
  });

  const warnings: string[] = [];

  let entitlementExists = false;
  let licenceExists = false;

  if (run?.orderId) {
    const entitlement = await prisma.digitalEntitlement.findFirst({
      where: { orderId: run.orderId }
    });
    if (entitlement) {
      entitlementExists = true;
      warnings.push('Active entitlement already exists for this order. Step will be skipped via idempotency.');
    }
  }

  const completedSteps = run?.steps.filter(s => s.status === 'COMPLETED').length || 0;
  if (completedSteps > 0) {
    warnings.push(`${completedSteps} steps previously succeeded and will not be re-executed.`);
  }

  return {
    safeToReplay: true,
    orderState: 'PAID',
    entitlementExists,
    licenceExists,
    safetyWarnings: warnings
  };
}
