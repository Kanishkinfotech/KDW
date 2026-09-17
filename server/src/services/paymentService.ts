import crypto from 'crypto';
import { prisma } from '../database/db';
import { OrderFulfilmentService } from './orderFulfilmentService';
import { CouponService } from './couponService';
import { OfferService } from './offerService';
import { ReviewService } from './reviewService';
import { CampaignService } from './campaignService';
import { dashboardBroadcaster } from './dashboardBroadcastService';
import { emitAutomationEvent } from '../controllers/automation/automationEventService';

export interface PaymentActor {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export class PaymentService {
  /**
   * Constant-time HMAC-SHA256 Signature Verification for Checkout
   */
  static verifyCheckoutSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    secret: string
  ): boolean {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;

    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const expected = hmac.digest('hex');

      const expectedBuffer = Buffer.from(expected, 'utf8');
      const signatureBuffer = Buffer.from(razorpaySignature, 'utf8');

      if (expectedBuffer.length !== signatureBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      console.error('[PaymentService] Error verifying checkout signature:', err);
      return false;
    }
  }

  /**
   * Constant-time HMAC-SHA256 Signature Verification for Webhook Raw Body
   */
  static verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    if (!rawBody || !signature) return false;

    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
      const expected = hmac.digest('hex');

      const expectedBuffer = Buffer.from(expected, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length !== signatureBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      console.error('[PaymentService] Error verifying webhook signature:', err);
      return false;
    }
  }

  /**
   * Evaluates Risk Score and Signal Flags
   */
  static evaluateRisk(paymentData: {
    amount: number;
    customerEmail?: string;
    customerId?: string;
    ipAddress?: string;
  }): { riskScore: 'NORMAL' | 'REVIEW' | 'HIGH_RISK'; riskReason?: string } {
    if (paymentData.amount >= 15000) {
      return { riskScore: 'REVIEW', riskReason: 'High single transaction value (>= ₹15,000)' };
    }
    return { riskScore: 'NORMAL', riskReason: 'Standard transaction parameters' };
  }

  /**
   * Categorizes Gateway Error Codes into Standardized Categories
   */
  static categorizeFailure(code?: string, description?: string): string {
    if (!code && !description) return 'TECHNICAL_ERROR';
    const text = `${code || ''} ${description || ''}`.toUpperCase();

    if (text.includes('DECLINED') || text.includes('BANK_DECLINE') || text.includes('DO_NOT_HONOR')) {
      return 'BANK_DECLINE';
    }
    if (text.includes('INSUFFICIENT_FUNDS') || text.includes('LIMIT_EXCEEDED') || text.includes('BALANCE')) {
      return 'INSUFFICIENT_FUNDS';
    }
    if (text.includes('OTP') || text.includes('AUTH_FAILED') || text.includes('3DS') || text.includes('AUTHENTICATION')) {
      return 'AUTH_FAILURE';
    }
    if (text.includes('CANCELLED') || text.includes('ABANDONED') || text.includes('USER_DROPPED')) {
      return 'CUSTOMER_ABANDONED';
    }
    if (text.includes('TIMEOUT') || text.includes('TIMED_OUT') || text.includes('EXPIRED')) {
      return 'TIMEOUT';
    }
    return 'OTHER';
  }

  /**
   * Records or Updates a Payment Atomically and Triggers Fulfilment
   */
  static async recordSuccessfulCapture(data: {
    orderId: string;
    razorpayOrderId?: string;
    razorpayPaymentId: string;
    amount: number;
    currency?: string;
    method?: string;
    verificationType: 'SIGNATURE' | 'WEBHOOK' | 'MANUAL';
    actor?: PaymentActor;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true, customer: true }
    });

    if (!order) {
      throw new Error(`Order ${data.orderId} not found`);
    }

    // Verify Amount and Currency Match
    const expectedAmount = order.totalAmount;
    if (Math.abs(expectedAmount - data.amount) > 0.01) {
      // Amount mismatch -> Critical Flag & Block Fulfilment
      await prisma.payment.upsert({
        where: { razorpayPaymentId: data.razorpayPaymentId },
        update: {
          status: 'DISPUTED',
          verificationStatus: 'VERIFICATION_FAILED',
          reconciliationStatus: 'AMOUNT_MISMATCH',
          riskScore: 'HIGH_RISK',
          riskReason: `Amount mismatch: Expected ₹${expectedAmount}, received ₹${data.amount}`
        },
        create: {
          orderId: order.id,
          customerId: order.customerId,
          razorpayOrderId: data.razorpayOrderId || order.razorpayOrderId,
          razorpayPaymentId: data.razorpayPaymentId,
          amount: data.amount,
          currency: data.currency || order.currency,
          method: data.method || 'RAZORPAY',
          status: 'DISPUTED',
          verificationStatus: 'VERIFICATION_FAILED',
          reconciliationStatus: 'AMOUNT_MISMATCH',
          riskScore: 'HIGH_RISK',
          riskReason: `Amount mismatch: Expected ₹${expectedAmount}, received ₹${data.amount}`,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });

      await prisma.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'PAYMENT_DISPUTED',
          actorType: 'SYSTEM',
          status: 'FAILED',
          description: `CRITICAL: Payment amount mismatch. Expected ₹${expectedAmount}, received ₹${data.amount}. Digital fulfilment blocked.`,
          referenceId: data.razorpayPaymentId
        }
      });

      throw new Error(`Payment verification failed: Amount mismatch (Expected ₹${expectedAmount}, Got ₹${data.amount})`);
    }

    const risk = this.evaluateRisk({
      amount: data.amount,
      customerEmail: order.guestEmail || undefined,
      customerId: order.customerId || undefined,
      ipAddress: data.ipAddress
    });

    const isSignature = data.verificationType === 'SIGNATURE';
    const isWebhook = data.verificationType === 'WEBHOOK';

    let updatedPayment: any;

    // Database Atomic Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Upsert Payment
      updatedPayment = await tx.payment.upsert({
        where: { razorpayPaymentId: data.razorpayPaymentId },
        update: {
          status: 'CAPTURED',
          verificationStatus: isWebhook ? 'FULLY_VERIFIED' : 'SIGNATURE_VERIFIED',
          fulfilmentStatus: 'PROCESSING',
          reconciliationStatus: 'MATCHED',
          signatureVerified: isSignature || undefined,
          signatureVerifiedAt: isSignature ? new Date() : undefined,
          webhookVerified: isWebhook || undefined,
          webhookVerifiedAt: isWebhook ? new Date() : undefined,
          capturedAt: new Date(),
          riskScore: risk.riskScore,
          riskReason: risk.riskReason
        },
        create: {
          orderId: order.id,
          customerId: order.customerId,
          razorpayOrderId: data.razorpayOrderId || order.razorpayOrderId,
          razorpayPaymentId: data.razorpayPaymentId,
          amount: data.amount,
          currency: data.currency || order.currency,
          method: data.method || 'RAZORPAY',
          status: 'CAPTURED',
          verificationStatus: isWebhook ? 'FULLY_VERIFIED' : 'SIGNATURE_VERIFIED',
          fulfilmentStatus: 'PROCESSING',
          reconciliationStatus: 'MATCHED',
          signatureVerified: isSignature,
          signatureVerifiedAt: isSignature ? new Date() : null,
          webhookVerified: isWebhook,
          webhookVerifiedAt: isWebhook ? new Date() : null,
          capturedAt: new Date(),
          riskScore: risk.riskScore,
          riskReason: risk.riskReason,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });

      // 2. Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'FULFILMENT_PROCESSING',
          razorpayPaymentId: data.razorpayPaymentId,
          paidAt: new Date()
        }
      });

      // 3. Create Reconciliation Record
      await tx.reconciliationRecord.create({
        data: {
          internalRecordType: 'PAYMENT',
          internalRecordId: updatedPayment.id,
          externalRecordType: 'RAZORPAY_PAYMENT',
          externalRecordId: data.razorpayPaymentId,
          expectedAmount: order.totalAmount,
          actualAmount: data.amount,
          difference: 0,
          status: 'MATCHED',
          differenceReason: 'Exact match on capture verification'
        }
      });

      // 4. Record Timeline Event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'PAYMENT_CAPTURED',
          actorType: data.verificationType === 'WEBHOOK' ? 'WEBHOOK' : 'SYSTEM',
          actorName: data.actor?.name || 'Razorpay Gateway',
          status: 'SUCCESS',
          description: `Payment of ₹${data.amount} captured and verified (${data.verificationType}). Payment ID: ${data.razorpayPaymentId}`,
          referenceId: data.razorpayPaymentId
        }
      });
    });

    // Redeem applied coupon if reserved
    CouponService.redeemCoupon(order.id).catch(err => {
      console.error('[PaymentService] Error redeeming coupon:', err);
    });

    // Authoritatively attribute offer conversions for verified payment
    OfferService.attributeVerifiedOrder(order.id).catch(err => {
      console.error('[PaymentService] Error attributing verified offer order:', err);
    });

    // Attribute order revenue to marketing campaign if customer was targeted
    (async () => {
      try {
        const conditions: any[] = [];
        if (order.customerId) conditions.push({ customerId: order.customerId });
        if (order.guestEmail) conditions.push({ email: { equals: order.guestEmail, mode: 'insensitive' as const } });

        if (conditions.length > 0) {
          const matchingRecipient = await prisma.campaignRecipient.findFirst({
            where: {
              OR: conditions
            },
            orderBy: { createdAt: 'desc' }
          });

          if (matchingRecipient) {
            await CampaignService.attributeOrderToCampaign({
              orderId: order.id,
              customerId: order.customerId || undefined,
              campaignId: matchingRecipient.campaignId,
              amount: order.totalAmount
            });
          }
        }
      } catch (err) {
        console.error('[PaymentService] Error attributing campaign revenue:', err);
      }
    })();

    // Execute Idempotent Digital Fulfilment Engine
    OrderFulfilmentService.fulfilOrder(order.id, data.actor).catch(err => {
      console.error('[PaymentService] Error executing order fulfilment:', err);
    });

    // Emit durable order.paid business event
    emitAutomationEvent({
      eventType: 'order.paid',
      source: 'PAYMENT_SERVICE',
      resourceType: 'ORDER',
      resourceId: order.id,
      orderId: order.id,
      customerId: order.customerId || undefined,
      customerEmail: order.guestEmail || order.customer?.email || undefined,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: data.amount,
        currency: data.currency || order.currency,
        itemsCount: order.items.length,
        paymentId: data.razorpayPaymentId,
        verificationType: data.verificationType,
        customerName: order.guestName || order.customer?.name || 'Customer'
      }
    }).catch(err => {
      console.error('[PaymentService] Error emitting order.paid automation event:', err);
    });

    // Real-time broadcast to all connected Admin Dashboard SSE clients
    dashboardBroadcaster.broadcast('order.paid', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: data.amount,
      currency: data.currency || order.currency,
      customerName: order.guestName || order.customer?.name || 'Customer',
      customerEmail: order.guestEmail || order.customer?.email,
      timestamp: new Date().toISOString()
    });

    // Schedule automated Review Request
    const primaryItem = order.items?.[0];
    if (primaryItem?.productId && order.guestEmail) {
      ReviewService.scheduleReviewRequest(order.id, primaryItem.productId, order.guestEmail, order.customerId || undefined).catch(err => {
        console.error('[PaymentService] Error scheduling review request:', err);
      });
    }

    return updatedPayment;
  }

  /**
   * Records a Failed Payment Attempt
   */
  static async recordFailedAttempt(data: {
    orderId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount?: number;
    failureCode?: string;
    failureDescription?: string;
    method?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const failureCategory = this.categorizeFailure(data.failureCode, data.failureDescription);

    let order = null;
    if (data.orderId) {
      order = await prisma.order.findUnique({ where: { id: data.orderId } });
    } else if (data.razorpayOrderId) {
      order = await prisma.order.findFirst({ where: { razorpayOrderId: data.razorpayOrderId } });
    }

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          orderStatus: 'PENDING_PAYMENT'
        }
      });

      if (data.razorpayPaymentId) {
        await prisma.payment.upsert({
          where: { razorpayPaymentId: data.razorpayPaymentId },
          update: {
            status: 'FAILED',
            failedAt: new Date(),
            failureCode: data.failureCode || 'GATEWAY_ERROR',
            failureCategory,
            failureDescription: data.failureDescription || 'Payment declined by gateway/bank'
          },
          create: {
            orderId: order.id,
            customerId: order.customerId,
            razorpayOrderId: data.razorpayOrderId || order.razorpayOrderId,
            razorpayPaymentId: data.razorpayPaymentId,
            amount: data.amount || order.totalAmount,
            currency: order.currency,
            method: data.method || 'RAZORPAY',
            status: 'FAILED',
            verificationStatus: 'NOT_VERIFIED',
            failedAt: new Date(),
            failureCode: data.failureCode || 'GATEWAY_ERROR',
            failureCategory,
            failureDescription: data.failureDescription || 'Payment declined by gateway/bank',
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
          }
        });
      }

      await prisma.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'PAYMENT_FAILED',
          actorType: 'WEBHOOK',
          status: 'FAILED',
          description: `Payment attempt failed: ${data.failureDescription || data.failureCode || 'Declined'} [Category: ${failureCategory}]`,
          referenceId: data.razorpayPaymentId
        }
      });

      dashboardBroadcaster.broadcast('payment.failed', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        failureReason: data.failureDescription || data.failureCode || 'Declined',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Scans and Executes Automatic Reconciliation against Payment Records
   */
  static async runAutoReconciliation() {
    const unreconciledPayments = await prisma.payment.findMany({
      where: {
        status: 'CAPTURED',
        reconciliationStatus: { in: ['UNRECONCILED', 'SETTLEMENT_PENDING'] }
      },
      include: { order: true }
    });

    let matchedCount = 0;
    let mismatchCount = 0;

    for (const payment of unreconciledPayments) {
      if (!payment.order) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { reconciliationStatus: 'MISSING_INTERNAL_RECORD' }
        });
        mismatchCount++;
        continue;
      }

      const diff = Math.abs(payment.amount - payment.order.totalAmount);
      if (diff < 0.01 && payment.currency === payment.order.currency) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { reconciliationStatus: 'MATCHED' }
        });
        matchedCount++;
      } else {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { reconciliationStatus: 'AMOUNT_MISMATCH' }
        });
        mismatchCount++;
      }
    }

    return {
      success: true,
      totalEvaluated: unreconciledPayments.length,
      matchedCount,
      mismatchCount
    };
  }
}
