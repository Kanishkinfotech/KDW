import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { evaluateAndExecuteRules } from './automationRuleEngine';

const prisma = new PrismaClient();

export interface EmitEventParams {
  eventType: string;
  source?: string;
  resourceType: string;
  resourceId?: string;
  payload: Record<string, any>;
  customerEmail?: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
}

/**
 * Persists and asynchronously dispatches a durable business event
 */
export async function emitAutomationEvent(params: EmitEventParams): Promise<{ eventId: string; status: string }> {
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const payloadStr = JSON.stringify(params.payload || {});

  // Persist event record immediately
  const eventRecord = await prisma.automationEventRecord.create({
    data: {
      eventId,
      eventType: params.eventType,
      source: params.source || 'INTERNAL_SERVICE',
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      payloadJson: payloadStr,
      status: 'PROCESSING'
    }
  });

  // Asynchronously trigger rule evaluation in background
  setImmediate(async () => {
    try {
      await evaluateAndExecuteRules(eventRecord, params);
      await prisma.automationEventRecord.update({
        where: { id: eventRecord.id },
        data: { status: 'PROCESSED', processedAt: new Date() }
      });
    } catch (err: any) {
      console.error(`Automation event processing error for ${eventId}:`, err);
      await prisma.automationEventRecord.update({
        where: { id: eventRecord.id },
        data: { status: 'FAILED' }
      }).catch(() => {});
    }
  });

  return { eventId, status: 'RECEIVED' };
}
