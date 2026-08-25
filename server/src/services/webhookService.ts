import crypto from 'crypto';
import { prisma } from '../database/db';
import { PaymentService, PaymentActor } from './paymentService';
import { RefundService } from './refundService';
import { DisputeService } from './disputeService';

export class WebhookService {
  /**
   * Processes a raw incoming Razorpay Webhook request idempotently
   */
  static async processRawWebhook(
    rawBody: string | Buffer,
    signature: string,
    secret: string
  ): Promise<{ status: string; message: string; eventId?: string }> {
    const rawString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // 1. Verify Webhook Signature
    const isSignatureValid = PaymentService.verifyWebhookSignature(rawBody, signature, secret);

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(rawString);
    } catch (e) {
      throw new Error('Invalid JSON webhook body');
    }

    const eventType = parsedPayload.event;
    const payload = parsedPayload.payload || {};
    const externalEventId = parsedPayload.event_id || payload?.payment?.entity?.id ? `evt_${payload?.payment?.entity?.id}_${eventType}` : `evt_${Date.now()}`;

    // 2. Check Idempotency (Deduplication)
    const existingEvent = await prisma.paymentEvent.findFirst({
      where: {
        OR: [
          { externalEventId },
          { payloadHash: crypto.createHash('sha256').update(rawString).digest('hex') }
        ]
      }
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      return {
        status: 'DUPLICATE',
        message: 'Webhook event already processed previously',
        eventId: existingEvent.id
      };
    }

    // 3. Store Event in Database
    const payloadHash = crypto.createHash('sha256').update(rawString).digest('hex');
    const paymentEvent = await prisma.paymentEvent.create({
      data: {
        externalEventId,
        eventType,
        rawPayload: rawString,
        payloadHash,
        signatureValid: isSignatureValid,
        status: isSignatureValid ? 'PROCESSING' : 'SIGNATURE_FAILED',
        receivedAt: new Date()
      }
    });

    if (!isSignatureValid) {
      await prisma.paymentEvent.update({
        where: { id: paymentEvent.id },
        data: { failureReason: 'HMAC signature verification failed' }
      });
      throw new Error('Invalid Razorpay webhook signature');
    }

    // 4. Dispatch Event to Core Lifecycle Engine
    try {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = payload.payment?.entity || {};
        const razorpayOrderId = paymentEntity.order_id || payload.order?.entity?.id;
        const razorpayPaymentId = paymentEntity.id;
        const amount = paymentEntity.amount ? paymentEntity.amount / 100 : (payload.order?.entity?.amount ? payload.order.entity.amount / 100 : 0);
        const currency = paymentEntity.currency || 'INR';
        const method = paymentEntity.method?.toUpperCase() || 'RAZORPAY';

        if (razorpayOrderId && razorpayPaymentId) {
          const order = await prisma.order.findFirst({
            where: { razorpayOrderId }
          });

          if (order) {
            const captured = await PaymentService.recordSuccessfulCapture({
              orderId: order.id,
              razorpayOrderId,
              razorpayPaymentId,
              amount,
              currency,
              method,
              verificationType: 'WEBHOOK'
            });

            await prisma.paymentEvent.update({
              where: { id: paymentEvent.id },
              data: {
                orderId: order.id,
                paymentId: captured?.id || undefined,
                status: 'PROCESSED',
                processedAt: new Date()
              }
            });
          }
        }
      } else if (eventType === 'payment.failed') {
        const paymentEntity = payload.payment?.entity || {};
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        const failureCode = paymentEntity.error_code || 'PAYMENT_FAILED';
        const failureDescription = paymentEntity.error_description || 'Payment declined by customer bank';

        await PaymentService.recordFailedAttempt({
          razorpayOrderId,
          razorpayPaymentId,
          failureCode,
          failureDescription,
          method: paymentEntity.method?.toUpperCase() || 'RAZORPAY'
        });

        await prisma.paymentEvent.update({
          where: { id: paymentEvent.id },
          data: { status: 'PROCESSED', processedAt: new Date() }
        });
      } else if (eventType === 'refund.processed' || eventType === 'refund.created') {
        const refundEntity = payload.refund?.entity || {};
        const razorpayPaymentId = refundEntity.payment_id;
        const razorpayRefundId = refundEntity.id;
        const amount = refundEntity.amount ? refundEntity.amount / 100 : 0;

        await RefundService.handleRefundWebhook({
          razorpayPaymentId,
          razorpayRefundId,
          amount,
          status: 'COMPLETED'
        });

        await prisma.paymentEvent.update({
          where: { id: paymentEvent.id },
          data: { status: 'PROCESSED', processedAt: new Date() }
        });
      } else if (eventType === 'dispute.created' || eventType === 'dispute.won' || eventType === 'dispute.lost') {
        const disputeEntity = payload.dispute?.entity || {};
        await DisputeService.handleDisputeWebhook({
          razorpayDisputeId: disputeEntity.id || `disp_${Date.now()}`,
          razorpayPaymentId: disputeEntity.payment_id,
          amount: disputeEntity.amount ? disputeEntity.amount / 100 : 0,
          reason: disputeEntity.reason_code || 'Chargeback',
          status: eventType === 'dispute.won' ? 'WON' : eventType === 'dispute.lost' ? 'LOST' : 'UNDER_REVIEW'
        });

        await prisma.paymentEvent.update({
          where: { id: paymentEvent.id },
          data: { status: 'PROCESSED', processedAt: new Date() }
        });
      } else {
        // Unknown or unhandled event
        await prisma.paymentEvent.update({
          where: { id: paymentEvent.id },
          data: { status: 'PROCESSED', processedAt: new Date() }
        });
      }

      return { status: 'PROCESSED', message: `Webhook event ${eventType} processed successfully`, eventId: paymentEvent.id };
    } catch (err: any) {
      await prisma.paymentEvent.update({
        where: { id: paymentEvent.id },
        data: {
          status: 'FAILED',
          failureReason: err.message || 'Error processing webhook payload'
        }
      });
      throw err;
    }
  }

  /**
   * Authorized idempotent Webhook Replay
   */
  static async replayWebhook(eventId: string, actor: PaymentActor) {
    const event = await prisma.paymentEvent.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new Error(`Webhook event ${eventId} not found`);
    }

    const payload = JSON.parse(event.rawPayload);

    // Replay logic
    if (event.eventType === 'payment.captured' || event.eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity.id;
      const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 0;

      if (razorpayOrderId && razorpayPaymentId) {
        const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
        if (order) {
          await PaymentService.recordSuccessfulCapture({
            orderId: order.id,
            razorpayOrderId,
            razorpayPaymentId,
            amount,
            verificationType: 'MANUAL',
            actor
          });
        }
      }
    }

    await prisma.paymentEvent.update({
      where: { id: eventId },
      data: {
        status: 'REPLAYED',
        replayedBy: actor.name || 'Admin',
        replayedAt: new Date()
      }
    });

    return {
      success: true,
      message: `Webhook event ${event.externalEventId || event.id} successfully replayed.`
    };
  }
}
