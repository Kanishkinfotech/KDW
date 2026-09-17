import { prisma } from '../database/db';
import { PaymentActor } from './paymentService';
import { dashboardBroadcaster } from './dashboardBroadcastService';
import { getRazorpayClient } from '../utils/razorpay';

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
        const rpRefund = await getRazorpayClient().payments.refund(payment.razorpayPaymentId, {
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

    dashboardBroadcaster.broadcast('refund.processed', {
      orderId: payment.orderId,
      refundId: createdRefund?.id,
      amount: refundAmount,
      timestamp: new Date().toISOString()
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

  /**
   * Customer submits a refund request for a verified order
   */
  static async requestCustomerRefund(data: {
    orderId: string;
    customerId?: string;
    customerEmail?: string;
    reason: string;
    note?: string;
    productName?: string;
  }) {
    const { orderId, customerId, customerEmail, reason, note, productName } = data;

    if (!orderId || !reason || !reason.trim() || !note || !note.trim()) {
      throw new Error('Order ID, refund reason, and explanation for administrator are mandatory.');
    }

    // 1. Find Order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        refunds: true,
        items: { include: { product: true, bundle: true } }
      }
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    if (customerId && order.customerId && order.customerId !== customerId) {
      throw new Error('You are not authorized to request a refund for this order.');
    }

    if (!customerId && customerEmail && order.guestEmail?.toLowerCase() !== customerEmail.toLowerCase()) {
      throw new Error('You are not authorized to request a refund for this order.');
    }

    // 2. Verify payment status
    const verifiedPayment = order.payments.find(
      p => p.status === 'CAPTURED' || p.status === 'PARTIALLY_REFUNDED'
    );

    if (!verifiedPayment) {
      throw new Error('This order does not have a verified, captured payment eligible for refund.');
    }

    // 3. Check for existing active or pending refund requests
    const existingPending = order.refunds.find(
      r => r.status === 'PENDING_APPROVAL' || r.status === 'REQUESTED'
    );
    if (existingPending) {
      throw new Error('A refund request is already pending review for this order.');
    }

    const alreadyRefunded = order.refunds
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const refundableAmount = Math.max(0, verifiedPayment.amount - alreadyRefunded);
    if (refundableAmount <= 0) {
      throw new Error('This order has already been fully refunded.');
    }

    const formattedBaseReason = productName ? `[Product: ${productName}] ${reason.trim()}` : reason.trim();
    const fullReason = note && note.trim() ? `${formattedBaseReason} - Note: ${note.trim()}` : formattedBaseReason;
    const customerIdentifier = order.guestName || customerEmail || order.guestEmail || 'Customer';

    // 4. Create Refund Record in PENDING_APPROVAL status
    const refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId: verifiedPayment.id,
        amount: refundableAmount,
        currency: verifiedPayment.currency || 'INR',
        reason: fullReason,
        status: 'PENDING_APPROVAL',
        requestedBy: customerIdentifier,
        accessRevoked: false,
        licenceRevoked: false,
        submittedAt: new Date()
      }
    });

    // 5. Update Payment & Order refund status
    await prisma.payment.update({
      where: { id: verifiedPayment.id },
      data: { refundStatus: 'REFUND_REQUESTED' }
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { refundStatus: 'REFUND_REQUESTED' }
    });

    // 5B. Create Support Desk Ticket so it immediately appears in Support Desk -> Refund Requests
    try {
      const ticketCount = await prisma.supportTicket.count();
      const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
      const ticketNumber = `TKT-${datePrefix}-${String(ticketCount + 1).padStart(4, '0')}`;

      await prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: customerId || order.customerId || null,
          customerName: customerIdentifier,
          customerEmail: customerEmail || order.guestEmail || '',
          isGuest: !customerId && !order.customerId,
          orderId: order.id,
          type: 'REFUND_REQUEST',
          category: 'Billing & Refunds',
          priority: 'HIGH',
          status: 'NEW',
          source: 'ACCOUNT',
          subject: `Refund Request: Order #${order.orderNumber}${productName ? ' - ' + productName : ''}`,
          description: `Refund Reason: ${reason}\n\nCustomer Explanation:\n${note}\n\nOrder Number: #${order.orderNumber}\nRequested Refund Amount: ₹${refundableAmount}`,
          tags: JSON.stringify({
            refundId: refund.id,
            orderNumber: order.orderNumber,
            amount: refundableAmount,
            reason,
            note,
            productName: productName || null
          })
        }
      });
    } catch (ticketErr) {
      console.warn('[RefundService] Failed to create SupportTicket for refund request:', ticketErr);
    }

    // 6. Create in-app Notification for Admin
    try {
      await prisma.notification.create({
        data: {
          title: `Refund Request: Order #${order.orderNumber}`,
          message: `Customer ${customerIdentifier} requested refund of ₹${refundableAmount} for Order #${order.orderNumber}. Reason: ${fullReason}`,
          type: 'Refund',
          link: '/admin/support/refund-requests'
        }
      });
    } catch (notifErr) {
      console.warn('[RefundService] Failed to create in-app notification:', notifErr);
    }

    // 7. Create Order Timeline Event
    try {
      await prisma.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: 'REFUND_REQUESTED',
          actorType: 'CUSTOMER',
          actorName: customerIdentifier,
          status: 'PENDING',
          description: `Customer submitted refund request of ₹${refundableAmount}. Reason: ${fullReason}`,
          referenceId: refund.id
        }
      });
    } catch (tlErr) {
      console.warn('[RefundService] Failed to create timeline event:', tlErr);
    }

    dashboardBroadcaster.broadcast('refund.requested', {
      orderId: order.id,
      refundId: refund.id,
      amount: refundableAmount,
      requestedBy: customerIdentifier
    });

    return {
      success: true,
      message: 'Your refund request has been submitted and is pending administrator review.',
      refund
    };
  }

  /**
   * Admin approves a pending customer refund request
   */
  static async approveRefundRequest(data: {
    refundId: string;
    actor: PaymentActor;
    approvedAmount?: number;
  }) {
    const refund = await prisma.refund.findUnique({
      where: { id: data.refundId },
      include: {
        payment: true,
        order: { include: { items: true } }
      }
    });

    if (!refund) {
      throw new Error('Refund request record not found.');
    }

    if (refund.status !== 'PENDING_APPROVAL' && refund.status !== 'REQUESTED') {
      throw new Error(`Cannot approve refund in status '${refund.status}'.`);
    }

    if (!refund.paymentId || !refund.payment) {
      throw new Error('Associated payment record not found for this refund.');
    }

    const effectiveAmount = (data.approvedAmount !== undefined && Number(data.approvedAmount) > 0)
      ? Math.min(Number(data.approvedAmount), refund.amount)
      : refund.amount;

    // Execute the actual gateway refund using processRefund logic
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key_id';
    let razorpayRefundId = refund.razorpayRefundId || `rfnd_${Date.now()}`;

    if (!isMock && refund.payment.razorpayPaymentId && !refund.payment.razorpayPaymentId.startsWith('pay_chk_') && !refund.payment.razorpayPaymentId.startsWith('pay_wh_')) {
      try {
        const rpRefund = await getRazorpayClient().payments.refund(refund.payment.razorpayPaymentId, {
          amount: Math.round(effectiveAmount * 100),
          notes: {
            reason: refund.reason || 'Customer refund request approved',
            orderId: refund.orderId,
            approvedBy: data.actor.email || 'Admin'
          }
        });
        razorpayRefundId = rpRefund.id;
      } catch (err: any) {
        console.error('[RefundService] Razorpay refund API error on approval:', err);
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Gateway Refund Error: ${err.error?.description || err.message}`);
        }
        razorpayRefundId = `rfnd_dev_${Date.now()}`;
      }
    }

    const currentRefunded = refund.payment.refundedAmount || 0;
    const newTotalRefunded = currentRefunded + effectiveAmount;
    const isFullRefund = newTotalRefunded >= refund.payment.amount - 0.01;
    const nextStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await prisma.$transaction(async (tx) => {
      // 1. Update Refund
      await tx.refund.update({
        where: { id: refund.id },
        data: {
          amount: effectiveAmount,
          razorpayRefundId,
          status: 'COMPLETED',
          approvedBy: data.actor.name || 'Admin Staff',
          accessRevoked: true,
          licenceRevoked: true,
          completedAt: new Date()
        }
      });

      // 2. Update Payment
      await tx.payment.update({
        where: { id: refund.paymentId! },
        data: {
          status: nextStatus,
          refundStatus: nextStatus,
          refundedAmount: newTotalRefunded
        }
      });

      // 3. Update Order
      await tx.order.update({
        where: { id: refund.orderId },
        data: {
          refundedAmount: (refund.order.refundedAmount || 0) + refund.amount,
          paymentStatus: nextStatus,
          refundStatus: nextStatus,
          refundedAt: new Date()
        }
      });

      // 4. Revoke access & licences
      await tx.purchase.updateMany({
        where: { orderId: refund.orderId },
        data: { accessStatus: 'REVOKED' }
      });

      await tx.bundleEntitlement.updateMany({
        where: { orderId: refund.orderId },
        data: { status: 'REVOKED' }
      });

      await tx.componentEntitlement.updateMany({
        where: { orderId: refund.orderId },
        data: { status: 'REVOKED' }
      });

      await tx.licenceKey.updateMany({
        where: { orderId: refund.orderId },
        data: { status: 'REVOKED' }
      });

      // 5. Timeline Event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: refund.orderId,
          eventType: 'REFUND_APPROVED',
          actorType: 'ADMIN',
          actorName: data.actor.name || 'Admin Staff',
          status: 'SUCCESS',
          description: `Customer refund request of ₹${refund.amount} approved and processed by ${data.actor.name}. Access revoked.`,
          referenceId: razorpayRefundId
        }
      });

      // 6. Audit Log
      await tx.orderAuditLog.create({
        data: {
          orderId: refund.orderId,
          actorId: data.actor.id,
          actorEmail: data.actor.email || 'admin@kdw.com',
          actorRole: data.actor.role || 'SUPER_ADMIN',
          action: 'REFUND_APPROVED',
          reason: refund.reason,
          newValue: {
            refundId: refund.id,
            amount: effectiveAmount,
            razorpayRefundId,
            approvedBy: data.actor.name
          }
        }
      });

      // 7. Update Support Ticket to RESOLVED
      await tx.supportTicket.updateMany({
        where: { orderId: refund.orderId, type: 'REFUND_REQUEST' },
        data: { status: 'RESOLVED', resolvedAt: new Date() }
      });
    });

    dashboardBroadcaster.broadcast('refund.processed', {
      orderId: refund.orderId,
      refundId: refund.id,
      amount: effectiveAmount,
      approvedBy: data.actor.name
    });

    return {
      success: true,
      message: `Refund of ₹${effectiveAmount} approved and sent successfully.`
    };
  }

  /**
   * Admin rejects a pending customer refund request
   */
  static async rejectRefundRequest(data: {
    refundId: string;
    rejectionReason: string;
    actor: PaymentActor;
  }) {
    const refund = await prisma.refund.findUnique({
      where: { id: data.refundId },
      include: { payment: true, order: true }
    });

    if (!refund) {
      throw new Error('Refund request record not found.');
    }

    if (refund.status !== 'PENDING_APPROVAL' && refund.status !== 'REQUESTED') {
      throw new Error(`Cannot reject refund in status '${refund.status}'.`);
    }

    const reason = data.rejectionReason?.trim() || 'Request does not meet refund policy criteria.';

    await prisma.$transaction(async (tx) => {
      // 1. Update Refund Record
      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: 'REJECTED',
          rejectedBy: data.actor.name || 'Admin Staff',
          rejectionReason: reason,
          completedAt: new Date()
        }
      });

      // 2. Reset payment & order refund status if no other completed refunds exist
      const otherCompleted = await tx.refund.count({
        where: { orderId: refund.orderId, status: 'COMPLETED' }
      });

      const resetRefundStatus = otherCompleted > 0 ? 'PARTIALLY_REFUNDED' : 'NOT_REFUNDED';

      if (refund.paymentId) {
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { refundStatus: resetRefundStatus }
        });
      }

      await tx.order.update({
        where: { id: refund.orderId },
        data: { refundStatus: resetRefundStatus }
      });

      // 3. Timeline event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: refund.orderId,
          eventType: 'REFUND_REJECTED',
          actorType: 'ADMIN',
          actorName: data.actor.name || 'Admin Staff',
          status: 'SUCCESS',
          description: `Refund request of ₹${refund.amount} rejected by ${data.actor.name}. Reason: ${reason}`,
          referenceId: refund.id
        }
      });

      // 4. Update corresponding Support Ticket to CLOSED
      await tx.supportTicket.updateMany({
        where: { orderId: refund.orderId, type: 'REFUND_REQUEST' },
        data: { status: 'CLOSED', closedAt: new Date() }
      });
    });

    // 5. Notify customer in app
    try {
      if (refund.order.customerId) {
        await prisma.notification.create({
          data: {
            userId: refund.order.customerId,
            title: `Refund Request Declined: Order #${refund.order.orderNumber}`,
            message: `Your refund request was declined. Reason: ${reason}`,
            type: 'Refund',
            link: '/dashboard'
          }
        });
      }
    } catch (notifErr) {
      console.warn('[RefundService] Failed to create customer notification:', notifErr);
    }

    return {
      success: true,
      message: 'Refund request declined.'
    };
  }

  /**
   * Retrieves all refunds for a specific customer
   */
  static async getCustomerRefunds(userId?: string, userEmail?: string) {
    if (!userId && !userEmail) return [];

    const orConditions: any[] = [];
    if (userId) {
      orConditions.push({ customerId: userId });
    }
    if (userEmail) {
      orConditions.push({ guestEmail: { equals: userEmail, mode: 'insensitive' } });
    }

    if (orConditions.length === 0) return [];

    return prisma.refund.findMany({
      where: {
        order: {
          OR: orConditions
        }
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paymentStatus: true,
            createdAt: true,
            items: {
              include: {
                product: { select: { id: true, name: true, thumbnail: true } },
                bundle: { select: { id: true, title: true, coverImage: true } }
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            verificationStatus: true,
            method: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
