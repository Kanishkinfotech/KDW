import Razorpay from 'razorpay';
import { prisma } from '../database/db';
import { PaymentActor } from './paymentService';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

export class RefundService {
  /**
   * Processes a partial or full refund with policy-driven access revocation
   */
  static async processRefund(data: {
    paymentId: string;
    amount?: number;
    reason: string;
    accessRevoked?: boolean;
    licenceRevoked?: boolean;
    actor: PaymentActor;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { order: { include: { items: true } }, refunds: true }
    });

    if (!payment) {
      throw new Error(`Payment record ${data.paymentId} not found`);
    }

    if (!['CAPTURED', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
      throw new Error(`Cannot refund payment in status ${payment.status}. Must be CAPTURED.`);
    }

    const alreadyRefunded = payment.refundedAmount || 0;
    const remainingRefundable = Math.max(0, payment.amount - alreadyRefunded);

    const refundAmount = data.amount !== undefined ? data.amount : remainingRefundable;

    if (refundAmount <= 0) {
      throw new Error('Refund amount must be greater than zero.');
    }

    if (refundAmount > remainingRefundable + 0.01) {
      throw new Error(`Refund amount ₹${refundAmount} exceeds remaining refundable balance ₹${remainingRefundable}.`);
    }

    const isFullRefund = Math.abs(refundAmount - remainingRefundable) < 0.01;
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key_id';

    let razorpayRefundId = `rfnd_${Date.now()}`;

    // Execute Razorpay API call if live
    if (!isMock && payment.razorpayPaymentId && !payment.razorpayPaymentId.startsWith('pay_chk_') && !payment.razorpayPaymentId.startsWith('pay_wh_')) {
      try {
        const rpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(refundAmount * 100),
          notes: {
            reason: data.reason,
            orderId: payment.orderId,
            actor: data.actor.email || 'Admin'
          }
        });
        razorpayRefundId = rpRefund.id;
      } catch (err: any) {
        console.error('[RefundService] Razorpay refund API error:', err);
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Gateway Refund Error: ${err.error?.description || err.message}`);
        }
        razorpayRefundId = `rfnd_dev_${Date.now()}`;
      }
    }

    const newTotalRefunded = alreadyRefunded + refundAmount;
    const nextPaymentStatus = newTotalRefunded >= payment.amount - 0.01 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    const nextRefundStatus = newTotalRefunded >= payment.amount - 0.01 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    let createdRefund: any;

    // Database Atomic Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create Refund Record
      createdRefund = await tx.refund.create({
        data: {
          orderId: payment.orderId,
          paymentId: payment.id,
          razorpayRefundId,
          amount: refundAmount,
          currency: payment.currency,
          reason: data.reason,
          status: 'COMPLETED',
          requestedBy: data.actor.name || 'Admin Staff',
          approvedBy: data.actor.name || 'Admin Staff',
          accessRevoked: data.accessRevoked ?? true,
          licenceRevoked: data.licenceRevoked ?? true,
          submittedAt: new Date(),
          completedAt: new Date()
        }
      });

      // 2. Update Payment Record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextPaymentStatus,
          refundStatus: nextRefundStatus,
          refundedAmount: newTotalRefunded
        }
      });

      // 3. Update Order Record
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          refundedAmount: (payment.order.refundedAmount || 0) + refundAmount,
          paymentStatus: nextPaymentStatus,
          refundStatus: nextRefundStatus,
          refundedAt: new Date()
        }
      });

      // 4. Revoke Digital Access & Licences if flagged
      if (data.accessRevoked !== false) {
        await tx.purchase.updateMany({
          where: { orderId: payment.orderId },
          data: { accessStatus: 'REVOKED' }
        });

        await tx.bundleEntitlement.updateMany({
          where: { orderId: payment.orderId },
          data: { status: 'REVOKED' }
        });

        await tx.componentEntitlement.updateMany({
          where: { orderId: payment.orderId },
          data: { status: 'REVOKED' }
        });

        if (data.licenceRevoked !== false) {
          await tx.licenceKey.updateMany({
            where: { orderId: payment.orderId },
            data: { status: 'REVOKED' }
          });
        }
      }

      // 5. Create Order Timeline Event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: payment.orderId,
          eventType: 'REFUND_PROCESSED',
          actorType: 'ADMIN',
          actorName: data.actor.name || 'Admin Staff',
          status: 'SUCCESS',
          description: `Refund of ₹${refundAmount} processed (${isFullRefund ? 'FULL' : 'PARTIAL'}). Access Revoked: ${data.accessRevoked !== false ? 'YES' : 'NO'}. Reason: ${data.reason}`,
          referenceId: razorpayRefundId
        }
      });

      // 6. Create Audit Log
      await tx.orderAuditLog.create({
        data: {
          orderId: payment.orderId,
          actorId: data.actor.id,
          actorEmail: data.actor.email || 'admin@kdw.com',
          actorRole: data.actor.role || 'SUPER_ADMIN',
          action: 'REFUND_CREATED',
          reason: data.reason,
          newValue: {
            refundAmount,
            razorpayRefundId,
            accessRevoked: data.accessRevoked !== false
          }
        }
      });
    });

    return {
      success: true,
      message: `Refund of ₹${refundAmount} processed successfully.`,
      refund: createdRefund
    };
  }

  /**
   * Handles server-side refund webhook updates from Razorpay
   */
  static async handleRefundWebhook(data: {
    razorpayPaymentId: string;
    razorpayRefundId: string;
    amount: number;
    status: string;
  }) {
    const payment = await prisma.payment.findFirst({
      where: { razorpayPaymentId: data.razorpayPaymentId }
    });

    if (!payment) return;

    await prisma.refund.upsert({
      where: { razorpayRefundId: data.razorpayRefundId },
      update: {
        status: data.status === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING',
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined
      },
      create: {
        orderId: payment.orderId,
        paymentId: payment.id,
        razorpayRefundId: data.razorpayRefundId,
        amount: data.amount,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  }
}
