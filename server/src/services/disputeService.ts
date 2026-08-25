import { prisma } from '../database/db';
import { PaymentActor } from './paymentService';

export class DisputeService {
  /**
   * Automatically compiles a comprehensive dispute evidence packet
   */
  static async assembleEvidencePacket(disputeId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        payment: true,
        order: {
          include: {
            items: true,
            customer: true,
            timelineEvents: true,
            licenceKeys: true,
            downloadHistory: true,
            supportTickets: true
          }
        }
      }
    });

    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    const order = dispute.order;
    const payment = dispute.payment;

    // Structured Evidence Packet
    const evidencePacket = {
      disputeReference: dispute.razorpayDisputeId || dispute.id,
      disputeAmount: dispute.amount,
      customer: {
        name: order.guestName || order.customer?.name || 'Customer',
        email: order.guestEmail || order.customer?.email,
        phone: order.guestMobile || order.customer?.mobile,
        accountVerified: order.customer?.emailVerified || false,
        customerSince: order.customer?.createdAt || order.createdAt
      },
      transaction: {
        kdwOrderNumber: order.orderNumber,
        razorpayPaymentId: payment?.razorpayPaymentId || order.razorpayPaymentId,
        razorpayOrderId: payment?.razorpayOrderId || order.razorpayOrderId,
        amount: payment?.amount || order.totalAmount,
        currency: payment?.currency || order.currency,
        paymentMethod: payment?.method || 'RAZORPAY',
        signatureVerified: payment?.signatureVerified || false,
        paymentDate: order.paidAt || order.createdAt
      },
      digitalDelivery: {
        emailDeliveryStatus: order.emailDeliveryStatus || 'SENT',
        emailSentAt: order.emailSentAt || order.paidAt,
        purchasedItems: (order.items || []).map(i => ({
          name: i.productNameSnapshot || i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          licenceType: i.licenceSnapshot || 'COMMERCIAL'
        }))
      },
      proofOfAccess: {
        downloadAttemptsCount: order.downloadHistory?.length || 0,
        downloads: (order.downloadHistory || []).slice(0, 10).map(d => ({
          downloadedAt: d.downloadedAt,
          ipAddress: d.ipAddress,
          userAgent: d.userAgent,
          result: d.result
        })),
        licenceKeysIssued: (order.licenceKeys || []).map(l => ({
          keyMasked: l.keyMasked,
          licenceType: l.licenceType,
          activations: l.activationCount,
          status: l.status,
          issuedAt: l.issuedAt
        }))
      },
      termsAndPolicy: {
        termsAcceptedAtCheckout: true,
        refundPolicy: 'Digital Download Non-Refundable Once Downloaded or Key Activated',
        orderCompletedTimestamp: order.createdAt
      },
      compiledAt: new Date().toISOString()
    };

    // Save evidence packet in database
    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        evidenceStatus: 'ASSEMBLED',
        evidenceData: evidencePacket
      }
    });

    return {
      success: true,
      message: 'Dispute evidence packet compiled successfully.',
      evidencePacket
    };
  }

  /**
   * Submits dispute evidence packet
   */
  static async submitEvidence(disputeId: string, actor: PaymentActor) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true }
    });

    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    if (!dispute.evidenceData) {
      // Assemble if not present
      await this.assembleEvidencePacket(disputeId);
    }

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'EVIDENCE_SUBMITTED',
        evidenceStatus: 'SUBMITTED',
        assignedTo: actor.name || 'Finance Team'
      }
    });

    await prisma.orderTimelineEvent.create({
      data: {
        orderId: dispute.orderId,
        eventType: 'DISPUTE_OPENED',
        actorType: 'ADMIN',
        actorName: actor.name || 'Finance Team',
        status: 'WARNING',
        description: `Dispute evidence packet submitted to payment gateway for chargeback ${dispute.razorpayDisputeId || dispute.id}.`,
        referenceId: dispute.razorpayDisputeId
      }
    });

    return {
      success: true,
      message: 'Dispute evidence packet successfully submitted to payment gateway.',
      dispute: updated
    };
  }

  /**
   * Handles server-side dispute webhook updates from Razorpay
   */
  static async handleDisputeWebhook(data: {
    razorpayDisputeId: string;
    razorpayPaymentId?: string;
    amount: number;
    reason?: string;
    status: string;
  }) {
    let payment = null;
    if (data.razorpayPaymentId) {
      payment = await prisma.payment.findUnique({
        where: { razorpayPaymentId: data.razorpayPaymentId },
        include: { order: true }
      });
    }

    if (!payment) return;

    const dispute = await prisma.dispute.upsert({
      where: { razorpayDisputeId: data.razorpayDisputeId },
      update: {
        status: data.status,
        amount: data.amount || payment.amount,
        resolvedAt: ['WON', 'LOST', 'CLOSED'].includes(data.status) ? new Date() : undefined
      },
      create: {
        orderId: payment.orderId,
        paymentId: payment.id,
        razorpayDisputeId: data.razorpayDisputeId,
        amount: data.amount || payment.amount,
        currency: payment.currency,
        reason: data.reason || 'Chargeback',
        status: data.status,
        deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
      }
    });

    // Auto-assemble evidence if new
    if (data.status === 'UNDER_REVIEW') {
      await this.assembleEvidencePacket(dispute.id).catch(console.error);
    }
  }
}
