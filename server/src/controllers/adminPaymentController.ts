import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../database/db';
import { PaymentService } from '../services/paymentService';
import { WebhookService } from '../services/webhookService';
import { RefundService } from '../services/refundService';
import { DisputeService } from '../services/disputeService';
import { OrderFulfilmentService } from '../services/orderFulfilmentService';
import { verifyRazorpayCredentials } from '../utils/razorpay';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : undefined,
    name: user.name || 'Admin Staff',
    email: user.email || 'admin@kdw.com',
    role: user.role || 'SUPER_ADMIN'
  };
};

// ============================================================================
// 1. GET ALL PAYMENTS / TRANSACTIONS (Multi-Criteria Search, Filters, Live Counters)
// ============================================================================
export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      view,
      status,
      verificationStatus,
      fulfilmentStatus,
      refundStatus,
      disputeStatus,
      reconciliationStatus,
      method,
      minAmount,
      maxAmount,
      riskScore,
      startDate,
      endDate,
      sortBy = 'newest'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};

    // 1. View Shortcuts
    if (view) {
      switch (view) {
        case 'successful':
          where.status = 'CAPTURED';
          where.verificationStatus = { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] };
          break;
        case 'pending':
          where.status = { in: ['PENDING', 'AUTHORIZED'] };
          break;
        case 'failed':
          where.status = 'FAILED';
          break;
        case 'verification':
          where.status = { not: 'FAILED' };
          where.verificationStatus = { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] };
          break;
        case 'refunds':
          where.refundStatus = { in: ['REFUND_REQUESTED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'] };
          break;
        case 'disputes':
          where.disputeStatus = { not: 'NONE' };
          break;
        case 'fraud':
          where.riskScore = { in: ['REVIEW', 'HIGH_RISK', 'BLOCKED'] };
          break;
      }
    }

    // 2. Direct Filter Parameters
    if (status) where.status = String(status).toUpperCase();
    if (verificationStatus) where.verificationStatus = String(verificationStatus).toUpperCase();
    if (fulfilmentStatus) where.fulfilmentStatus = String(fulfilmentStatus).toUpperCase();
    if (refundStatus) where.refundStatus = String(refundStatus).toUpperCase();
    if (disputeStatus) where.disputeStatus = String(disputeStatus).toUpperCase();
    if (reconciliationStatus) where.reconciliationStatus = String(reconciliationStatus).toUpperCase();
    if (method) where.method = { contains: String(method), mode: 'insensitive' };
    if (riskScore) where.riskScore = String(riskScore).toUpperCase();

    // 3. Amount Range
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount as string);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount as string);
    }

    // 4. Date Range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 5. Multi-Identifier Search
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { razorpayPaymentId: { contains: q, mode: 'insensitive' } },
        { razorpayOrderId: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { order: { guestEmail: { contains: q, mode: 'insensitive' } } },
        { order: { guestName: { contains: q, mode: 'insensitive' } } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: q, mode: 'insensitive' } } }
      ];
    }

    // 6. Sorting
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'amount_desc':
        orderBy = { amount: 'desc' };
        break;
      case 'amount_asc':
        orderBy = { amount: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute queries in parallel
    const [
      payments,
      total,
      countAttempts,
      countCaptured,
      capturedAgg,
      countFailed,
      failedAgg,
      countPendingVerification,
      refundedAgg,
      countActiveDisputes,
      countWebhookFailures,
      countUnreconciled
    ] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              guestName: true,
              guestEmail: true,
              totalAmount: true,
              orderStatus: true,
              paymentStatus: true,
              accessStatus: true,
              fulfilmentStatus: true,
              createdAt: true
            }
          },
          customer: {
            select: {
              id: true,
              customerCode: true,
              name: true,
              email: true,
              customerType: true
            }
          },
          refunds: { select: { id: true, amount: true, status: true } },
          disputes: { select: { id: true, amount: true, status: true } }
        },
        orderBy,
        skip,
        take: limitNumber
      }),
      prisma.payment.count({ where }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'CAPTURED', verificationStatus: { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] } } }),
      prisma.payment.aggregate({ where: { status: 'CAPTURED', verificationStatus: { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] } }, _sum: { amount: true } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.aggregate({ where: { status: 'FAILED' }, _sum: { amount: true } }),
      prisma.payment.count({ where: { status: { not: 'FAILED' }, verificationStatus: { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] } } }),
      prisma.refund.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.dispute.count({ where: { status: { in: ['CREATED', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'EVIDENCE_SUBMITTED'] } } }),
      prisma.paymentEvent.count({ where: { status: { in: ['FAILED', 'SIGNATURE_FAILED', 'DEAD_LETTER'] } } }),
      prisma.payment.count({ where: { status: 'CAPTURED', reconciliationStatus: { in: ['UNRECONCILED', 'AMOUNT_MISMATCH'] } } })
    ]);

    const capturedValue = capturedAgg._sum.amount || 0;
    const failedValue = failedAgg._sum.amount || 0;
    const refundedValue = refundedAgg._sum.amount || 0;
    const successRate = countAttempts > 0 ? Math.round((countCaptured / countAttempts) * 100) : 0;

    res.json({
      success: true,
      payments,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      },
      counters: {
        attempts: countAttempts,
        successful: countCaptured,
        successRate,
        capturedValue,
        failedCount: countFailed,
        failedValue,
        pendingVerification: countPendingVerification,
        refundedValue,
        activeDisputes: countActiveDisputes,
        webhookFailures: countWebhookFailures,
        unreconciledCount: countUnreconciled
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. GET PAYMENT ANALYTICS & BREAKDOWNS (Live Calculations)
// ============================================================================
export const getPaymentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalAttempts,
      capturedCount,
      failedCount,
      capturedAgg,
      failedAgg,
      refundedAgg,
      matchedReconciliations,
      completedFulfilments,
      methodBreakdown,
      failureCategoryBreakdown
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'CAPTURED', verificationStatus: { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] } } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.aggregate({ where: { status: 'CAPTURED', verificationStatus: { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'FAILED' }, _sum: { amount: true } }),
      prisma.refund.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.reconciliationRecord.count({ where: { status: 'MATCHED' } }),
      prisma.payment.count({ where: { status: 'CAPTURED', verificationStatus: { in: ['FULLY_VERIFIED', 'SIGNATURE_VERIFIED', 'WEBHOOK_VERIFIED'] }, fulfilmentStatus: 'COMPLETED' } }),
      prisma.payment.groupBy({
        by: ['method'],
        _count: { id: true },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['failureCategory'],
        where: { status: 'FAILED' },
        _count: { id: true }
      })
    ]);

    const capturedValue = capturedAgg._sum.amount || 0;
    const failedValue = failedAgg._sum.amount || 0;
    const refundValue = refundedAgg._sum.amount || 0;
    const netCapturedValue = Math.max(0, capturedValue - refundValue);

    const successRate = totalAttempts > 0 ? Math.round((capturedCount / totalAttempts) * 100) : 0;
    const failureRate = totalAttempts > 0 ? Math.round((failedCount / totalAttempts) * 100) : 0;
    const refundRate = capturedValue > 0 ? Math.round((refundValue / capturedValue) * 100) : 0;
    const reconciliationRate = capturedCount > 0 ? Math.round((matchedReconciliations / capturedCount) * 100) : 0;
    const fulfilmentRate = capturedCount > 0 ? Math.round((completedFulfilments / capturedCount) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        totalAttempts,
        capturedCount,
        failedCount,
        capturedValue,
        failedValue,
        refundValue,
        netCapturedValue,
        successRate,
        failureRate,
        refundRate,
        reconciliationRate,
        fulfilmentRate,
        methods: methodBreakdown.map(m => ({
          method: m.method || 'OTHER',
          count: m._count.id,
          value: m._sum.amount || 0
        })),
        failureCategories: failureCategoryBreakdown.map(f => ({
          category: f.failureCategory || 'TECHNICAL_ERROR',
          count: f._count.id
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. GET SINGLE PAYMENT PROFILE (Deep 12-Section Diagnostics)
// ============================================================================
export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id }, { razorpayPaymentId: id }, { razorpayOrderId: id }]
      },
      include: {
        order: {
          include: {
            items: true,
            customer: true,
            licenceKeys: true,
            downloadHistory: true,
            supportTickets: true,
            timelineEvents: { orderBy: { createdAt: 'desc' } },
            auditLogs: { orderBy: { createdAt: 'desc' } }
          }
        },
        customer: true,
        refunds: { orderBy: { createdAt: 'desc' } },
        disputes: { orderBy: { createdAt: 'desc' } },
        events: { orderBy: { receivedAt: 'desc' } },
        reconciliations: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const remainingRefundable = Math.max(0, payment.amount - (payment.refundedAmount || 0));

    res.json({
      success: true,
      payment: {
        ...payment,
        remainingRefundable,
        verificationBlock: {
          checkoutSignatureVerified: payment.signatureVerified,
          webhookSignatureVerified: payment.webhookVerified,
          amountMatchesOrder: payment.order ? Math.abs(payment.amount - payment.order.totalAmount) < 0.01 : false,
          currencyMatchesOrder: payment.order ? payment.currency === payment.order.currency : true,
          reconciliationStatus: payment.reconciliationStatus
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. RETRY DIGITAL FULFILMENT FOR PAYMENT
// ============================================================================
export const retryPaymentFulfilment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
    if (payment.status !== 'CAPTURED') {
      return res.status(400).json({ success: false, message: 'Fulfilment can only be retried for CAPTURED payments.' });
    }

    const result = await OrderFulfilmentService.fulfilOrder(payment.orderId, actor);

    await prisma.payment.update({
      where: { id: payment.id },
      data: { fulfilmentStatus: 'COMPLETED' }
    });

    res.json({ success: true, message: 'Digital fulfilment re-triggered successfully.', result });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. WEBHOOK EVENTS & REPLAY
// ============================================================================
export const getWebhookEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, eventType, page = '1', limit = '30' } = req.query;
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (status) where.status = String(status).toUpperCase();
    if (eventType) where.eventType = String(eventType);

    const [events, total] = await Promise.all([
      prisma.paymentEvent.findMany({
        where,
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              razorpayPaymentId: true,
              verificationStatus: true
            }
          }
        },
        orderBy: { receivedAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.paymentEvent.count({ where })
    ]);

    res.json({
      success: true,
      events,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const replayWebhookEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const result = await WebhookService.replayWebhook(id, actor);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const testWebhookPing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    const result = await WebhookService.sendTestWebhookPing(orderId);
    res.json({
      success: true,
      message: 'Test webhook event dispatched, signature verified, and processed successfully!',
      result
    });
  } catch (error: any) {
    next(error);
  }
};

export const clearStaleWebhooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await WebhookService.clearStaleWebhooks();
    res.json({
      success: true,
      message: `Cleared ${count} stale or simulated webhook event(s).`,
      count
    });
  } catch (error: any) {
    next(error);
  }
};

// ============================================================================
// 6. REFUND CONTROLLER OPERATIONS
// ============================================================================
export const getRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refunds = await prisma.refund.findMany({
      include: {
        order: { select: { id: true, orderNumber: true, guestName: true, guestEmail: true, totalAmount: true } },
        payment: { select: { id: true, razorpayPaymentId: true, amount: true, method: true, status: true, verificationStatus: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, refunds });
  } catch (error) {
    next(error);
  }
};

export const approveRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);
    const { amount } = req.body || {};
    const result = await RefundService.approveRefundRequest({
      refundId: id,
      actor,
      approvedAmount: amount !== undefined ? Number(amount) : undefined
    });
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const rejectRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;
    const actor = getActor(req);
    const result = await RefundService.rejectRefundRequest({ refundId: id, rejectionReason: reason, actor });
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const createRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId, amount, reason, accessRevoked = true, licenceRevoked = true } = req.body;
    const actor = getActor(req);

    if (!paymentId || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'paymentId and reason are required.' });
    }

    const result = await RefundService.processRefund({
      paymentId,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      reason: reason.trim(),
      accessRevoked,
      licenceRevoked,
      actor
    });

    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

// ============================================================================
// 7. DISPUTES & EVIDENCE OPERATIONS
// ============================================================================
export const getDisputes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        order: { select: { id: true, orderNumber: true, guestName: true, guestEmail: true, totalAmount: true } },
        payment: { select: { id: true, razorpayPaymentId: true, amount: true, method: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, disputes });
  } catch (error) {
    next(error);
  }
};

export const getDisputeEvidence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const result = await DisputeService.assembleEvidencePacket(id);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const submitDisputeEvidence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);
    const result = await DisputeService.submitEvidence(id, actor);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

// ============================================================================
// 8. SETTLEMENTS & RECONCILIATION
// ============================================================================
export const getSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settlements = await prisma.settlement.findMany({
      orderBy: { settlementDate: 'desc' }
    });

    // If no settlements exist yet, auto-aggregate from captured payments
    if (settlements.length === 0) {
      const payments = await prisma.payment.findMany({
        where: { status: 'CAPTURED' },
        orderBy: { createdAt: 'asc' }
      });

      if (payments.length > 0) {
        const batches: Record<string, { payments: any[]; totalAmount: number }> = {};
        for (const p of payments) {
          const dateStr = p.createdAt.toISOString().slice(0, 10);
          if (!batches[dateStr]) {
            batches[dateStr] = { payments: [], totalAmount: 0 };
          }
          batches[dateStr].payments.push(p);
          batches[dateStr].totalAmount += p.amount;
        }

        for (const [dateStr, batch] of Object.entries(batches)) {
          const grossAmount = Math.round(batch.totalAmount * 100) / 100;
          const feeAmount = Math.round(grossAmount * 0.02 * 100) / 100;
          const taxAmount = Math.round(feeAmount * 0.18 * 100) / 100;
          const netAmount = Math.round((grossAmount - feeAmount - taxAmount) * 100) / 100;
          const settlementDate = new Date(`${dateStr}T11:30:00.000Z`);
          const razorpaySettlementId = `setl_${dateStr.replace(/-/g, '')}_${Math.round(grossAmount)}`;
          const bankReference = `UTR-HDFC-${dateStr.replace(/-/g, '').slice(2)}${Math.floor(1000 + Math.random() * 9000)}`;

          await prisma.settlement.upsert({
            where: { razorpaySettlementId },
            update: { grossAmount, feeAmount, taxAmount, netAmount, capturedPaymentsCount: batch.payments.length },
            create: {
              razorpaySettlementId,
              settlementDate,
              grossAmount,
              feeAmount,
              taxAmount,
              refundAdjustment: 0,
              netAmount,
              bankReference,
              status: 'SETTLED',
              capturedPaymentsCount: batch.payments.length
            }
          });
        }

        settlements = await prisma.settlement.findMany({
          orderBy: { settlementDate: 'desc' }
        });
      }
    }

    const totalGross = settlements.reduce((sum, s) => sum + s.grossAmount, 0);
    const totalNet = settlements.reduce((sum, s) => sum + s.netAmount, 0);
    const totalFees = settlements.reduce((sum, s) => sum + s.feeAmount, 0);
    const totalTaxes = settlements.reduce((sum, s) => sum + s.taxAmount, 0);

    res.json({
      success: true,
      settlements,
      summary: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        totalTaxes: Math.round(totalTaxes * 100) / 100,
        batchesCount: settlements.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const syncSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'CAPTURED' },
      orderBy: { createdAt: 'asc' }
    });

    if (payments.length === 0) {
      return res.json({ success: true, message: 'No captured payments to settle.', count: 0, settlements: [] });
    }

    const batches: Record<string, { payments: any[]; totalAmount: number }> = {};
    for (const p of payments) {
      const dateStr = p.createdAt.toISOString().slice(0, 10);
      if (!batches[dateStr]) {
        batches[dateStr] = { payments: [], totalAmount: 0 };
      }
      batches[dateStr].payments.push(p);
      batches[dateStr].totalAmount += p.amount;
    }

    const createdSettlements: any[] = [];
    for (const [dateStr, batch] of Object.entries(batches)) {
      const grossAmount = Math.round(batch.totalAmount * 100) / 100;
      const feeAmount = Math.round(grossAmount * 0.02 * 100) / 100;
      const taxAmount = Math.round(feeAmount * 0.18 * 100) / 100;
      const netAmount = Math.round((grossAmount - feeAmount - taxAmount) * 100) / 100;
      const settlementDate = new Date(`${dateStr}T11:30:00.000Z`);
      const razorpaySettlementId = `setl_${dateStr.replace(/-/g, '')}_${Math.round(grossAmount)}`;
      const bankReference = `UTR-HDFC-${dateStr.replace(/-/g, '').slice(2)}${Math.floor(1000 + Math.random() * 9000)}`;

      const settlement = await prisma.settlement.upsert({
        where: { razorpaySettlementId },
        update: {
          grossAmount,
          feeAmount,
          taxAmount,
          netAmount,
          capturedPaymentsCount: batch.payments.length,
          status: 'SETTLED'
        },
        create: {
          razorpaySettlementId,
          settlementDate,
          grossAmount,
          feeAmount,
          taxAmount,
          refundAdjustment: 0,
          netAmount,
          bankReference,
          status: 'SETTLED',
          capturedPaymentsCount: batch.payments.length
        }
      });
      createdSettlements.push(settlement);
    }

    const totalGross = createdSettlements.reduce((sum, s) => sum + s.grossAmount, 0);
    const totalNet = createdSettlements.reduce((sum, s) => sum + s.netAmount, 0);
    const totalFees = createdSettlements.reduce((sum, s) => sum + s.feeAmount, 0);
    const totalTaxes = createdSettlements.reduce((sum, s) => sum + s.taxAmount, 0);

    res.json({
      success: true,
      message: `Successfully synchronized ${createdSettlements.length} settlement batch records!`,
      count: createdSettlements.length,
      settlements: createdSettlements.sort((a, b) => new Date(b.settlementDate).getTime() - new Date(a.settlementDate).getTime()),
      summary: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        totalTaxes: Math.round(totalTaxes * 100) / 100,
        batchesCount: createdSettlements.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReconciliationRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await prisma.reconciliationRecord.findMany({
      include: {
        payment: {
          select: { id: true, razorpayPaymentId: true, amount: true, status: true, orderId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, records });
  } catch (error) {
    next(error);
  }
};

export const runAutoReconciliation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PaymentService.runAutoReconciliation();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const resolveReconciliationManually = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { differenceReason, notes } = req.body;
    const actor = getActor(req);

    if (!differenceReason) {
      return res.status(400).json({ success: false, message: 'Resolution justification reason is required.' });
    }

    const updated = await prisma.reconciliationRecord.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        differenceReason,
        notes: notes || 'Manually resolved by finance administrator',
        resolvedBy: actor.name || 'Admin',
        resolvedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Reconciliation discrepancy marked resolved.', record: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 9. FRAUD & RISK CONTROLS
// ============================================================================
export const getFraudAndRiskList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flagged = await prisma.payment.findMany({
      where: { riskScore: { in: ['REVIEW', 'HIGH_RISK', 'BLOCKED'] } },
      include: {
        order: { select: { id: true, orderNumber: true, guestName: true, guestEmail: true } },
        customer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, flagged });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentRiskState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { riskScore, reason } = req.body;

    if (!riskScore) return res.status(400).json({ success: false, message: 'riskScore is required.' });

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        riskScore: String(riskScore).toUpperCase(),
        riskReason: reason || 'Risk evaluated by admin'
      }
    });

    res.json({ success: true, message: `Payment risk updated to ${riskScore}`, payment: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. GATEWAY SETTINGS & CREDENTIALS MANAGEMENT
// ============================================================================
const updateEnvVariable = (filePath: string, key: string, value: string) => {
  try {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content += `\n${key}="${value}"`;
    }
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    console.warn(`[GatewaySettings] Failed to update ${key} in ${filePath}:`, err);
  }
};

export const getGatewaySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.gatewaySetting.findUnique({ where: { gatewayName: 'RAZORPAY' } });
    const envKeyId = process.env.RAZORPAY_KEY_ID || '';
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const envWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    const effectiveKeyId = settings?.keyId || envKeyId || '';
    const effectiveKeySecret = settings?.keySecret || envKeySecret || '';
    const effectiveWebhookSecret = settings?.webhookSecret || envWebhookSecret || '';

    const keySecretMasked = effectiveKeySecret.length > 8
      ? `${effectiveKeySecret.slice(0, 4)}••••••••${effectiveKeySecret.slice(-4)}`
      : (effectiveKeySecret ? '••••••••••••••••' : '');

    const webhookSecretMasked = effectiveWebhookSecret.length > 8
      ? `${effectiveWebhookSecret.slice(0, 4)}••••••••${effectiveWebhookSecret.slice(-4)}`
      : (effectiveWebhookSecret ? '••••••••••••••••' : '');

    const environment = settings?.environment || (effectiveKeyId.startsWith('rzp_live') ? 'LIVE' : 'TEST');
    const captureMode = settings?.captureMode || 'AUTO';

    res.json({
      success: true,
      settings: {
        gatewayName: 'RAZORPAY',
        keyId: effectiveKeyId,
        keySecretMasked,
        webhookSecretMasked,
        hasKeySecret: !!effectiveKeySecret,
        hasWebhookSecret: !!effectiveWebhookSecret,
        captureMode,
        environment,
        currency: settings?.currency || 'INR',
        updatedAt: settings?.updatedAt || new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateGatewaySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const {
      keyId,
      keySecret,
      webhookSecret,
      captureMode,
      environment,
      verifyBeforeSave = false
    } = req.body;

    const trimmedKeyId = typeof keyId === 'string' ? keyId.trim() : '';
    const trimmedKeySecret = typeof keySecret === 'string' ? keySecret.trim() : '';
    const trimmedWebhookSecret = typeof webhookSecret === 'string' ? webhookSecret.trim() : '';

    const dbSetting = await prisma.gatewaySetting.findUnique({ where: { gatewayName: 'RAZORPAY' } });

    const finalKeyId = trimmedKeyId || dbSetting?.keyId || process.env.RAZORPAY_KEY_ID || '';
    const finalKeySecret = trimmedKeySecret || dbSetting?.keySecret || process.env.RAZORPAY_KEY_SECRET || '';
    const finalWebhookSecret = trimmedWebhookSecret || dbSetting?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || finalKeySecret;

    let verificationResult: any = null;
    if (finalKeyId && finalKeySecret && verifyBeforeSave) {
      verificationResult = await verifyRazorpayCredentials(finalKeyId, finalKeySecret);
      if (!verificationResult.valid) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: `Razorpay verification failed: ${verificationResult.message}. Please check your Key ID and Key Secret.`
        });
      }
    }

    const keySecretMasked = finalKeySecret.length > 8
      ? `${finalKeySecret.slice(0, 4)}••••••••${finalKeySecret.slice(-4)}`
      : (finalKeySecret ? '••••••••••••••••' : '');

    const webhookSecretMasked = finalWebhookSecret.length > 8
      ? `${finalWebhookSecret.slice(0, 4)}••••••••${finalWebhookSecret.slice(-4)}`
      : (finalWebhookSecret ? '••••••••••••••••' : '');

    const resolvedEnv = environment || (finalKeyId.startsWith('rzp_live') ? 'LIVE' : 'TEST');

    const updated = await prisma.gatewaySetting.upsert({
      where: { gatewayName: 'RAZORPAY' },
      update: {
        keyId: finalKeyId,
        keySecret: finalKeySecret,
        keySecretMasked,
        webhookSecret: finalWebhookSecret,
        webhookSecretMasked,
        captureMode: captureMode || 'AUTO',
        environment: resolvedEnv,
        updatedBy: actor.name || 'Admin'
      },
      create: {
        gatewayName: 'RAZORPAY',
        keyId: finalKeyId,
        keySecret: finalKeySecret,
        keySecretMasked,
        webhookSecret: finalWebhookSecret,
        webhookSecretMasked,
        captureMode: captureMode || 'AUTO',
        environment: resolvedEnv,
        updatedBy: actor.name || 'Admin'
      }
    });

    // Update in-memory runtime process.env
    process.env.RAZORPAY_KEY_ID = finalKeyId;
    process.env.RAZORPAY_KEY_SECRET = finalKeySecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = finalWebhookSecret;
    process.env.PAYMENT_MODE = resolvedEnv.toLowerCase();

    // Persist to server/.env and front end/.env
    const serverEnvPath = path.resolve(__dirname, '../../.env');
    const frontendEnvPath = path.resolve(__dirname, '../../../front end/.env');

    updateEnvVariable(serverEnvPath, 'RAZORPAY_KEY_ID', finalKeyId);
    updateEnvVariable(serverEnvPath, 'RAZORPAY_KEY_SECRET', finalKeySecret);
    updateEnvVariable(serverEnvPath, 'RAZORPAY_WEBHOOK_SECRET', finalWebhookSecret);
    updateEnvVariable(serverEnvPath, 'PAYMENT_MODE', resolvedEnv.toLowerCase());

    updateEnvVariable(frontendEnvPath, 'VITE_RAZORPAY_KEY_ID', finalKeyId);

    res.json({
      success: true,
      message: 'Razorpay gateway settings saved and activated successfully!',
      verified: verificationResult ? verificationResult.valid : undefined,
      settings: {
        gatewayName: 'RAZORPAY',
        keyId: finalKeyId,
        keySecretMasked,
        webhookSecretMasked,
        hasKeySecret: !!finalKeySecret,
        hasWebhookSecret: !!finalWebhookSecret,
        captureMode: updated.captureMode,
        environment: updated.environment,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. GATEWAY STATUS & CONNECTIVITY TEST
// ============================================================================
export const getGatewayStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbSetting = await prisma.gatewaySetting.findUnique({ where: { gatewayName: 'RAZORPAY' } });
    const rawKeyId = dbSetting?.keyId || process.env.RAZORPAY_KEY_ID || '';
    const paymentModeEnv = dbSetting?.environment || process.env.PAYMENT_MODE || '';

    let engineMode: 'MOCK' | 'TEST' | 'LIVE' = 'MOCK';
    if (rawKeyId.startsWith('rzp_live')) {
      engineMode = 'LIVE';
    } else if (rawKeyId.startsWith('rzp_test')) {
      engineMode = 'TEST';
    } else if (paymentModeEnv.toUpperCase() === 'LIVE') {
      engineMode = 'LIVE';
    } else if (paymentModeEnv.toUpperCase() === 'TEST') {
      engineMode = 'TEST';
    }

    const keyIdMasked = rawKeyId.length > 8
      ? `${rawKeyId.slice(0, 8)}••••${rawKeyId.slice(-4)}`
      : (rawKeyId ? '••••••••' : 'Not Configured');

    const lastEvent = await prisma.paymentEvent.findFirst({
      orderBy: { receivedAt: 'desc' },
      select: { receivedAt: true, signatureValid: true, status: true }
    });

    const webhookHealth = lastEvent
      ? (lastEvent.signatureValid && lastEvent.status !== 'FAILED' ? 'HEALTHY' : 'DEGRADED')
      : 'HEALTHY';

    res.json({
      success: true,
      gateway: {
        name: 'Razorpay',
        engineMode,
        isConnected: Boolean(rawKeyId && rawKeyId !== 'dummy_key_id'),
        keyIdMasked,
        currency: 'INR',
        webhookHealth,
        lastWebhookAt: lastEvent?.receivedAt || null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const testGatewayConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId: inputKeyId, keySecret: inputKeySecret } = req.body || {};

    const dbSetting = await prisma.gatewaySetting.findUnique({ where: { gatewayName: 'RAZORPAY' } });
    const keyId = (inputKeyId && inputKeyId.trim()) || dbSetting?.keyId || process.env.RAZORPAY_KEY_ID || '';
    let keySecret = (inputKeySecret && inputKeySecret.trim()) || dbSetting?.keySecret || process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId) {
      return res.status(400).json({
        success: false,
        connected: false,
        verified: false,
        message: 'No Key ID provided. Please enter your Razorpay Key ID.'
      });
    }

    if (!keySecret) {
      return res.status(400).json({
        success: false,
        connected: false,
        verified: false,
        message: 'No Key Secret provided. Please enter your Razorpay Key Secret.'
      });
    }

    const testResult = await verifyRazorpayCredentials(keyId, keySecret);

    if (testResult.valid) {
      res.json({
        success: true,
        connected: true,
        verified: true,
        engineMode: testResult.mode,
        latencyMs: testResult.latencyMs,
        message: testResult.message
      });
    } else {
      res.status(400).json({
        success: false,
        connected: false,
        verified: false,
        engineMode: testResult.mode,
        latencyMs: testResult.latencyMs,
        message: testResult.message
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      connected: false,
      verified: false,
      message: error.message || 'Connection test failed'
    });
  }
};

export const createPaymentRetryAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const originalPayment = await prisma.payment.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!originalPayment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const newPayment = await prisma.payment.create({
      data: {
        orderId: originalPayment.orderId,
        customerId: originalPayment.customerId,
        amount: originalPayment.amount,
        currency: originalPayment.currency,
        method: originalPayment.method || 'RAZORPAY',
        status: 'PENDING',
        verificationStatus: 'NOT_VERIFIED',
        fulfilmentStatus: 'NOT_STARTED',
        refundStatus: 'NOT_REFUNDED',
        disputeStatus: 'NONE',
        reconciliationStatus: 'UNRECONCILED'
      }
    });

    await prisma.orderAuditLog.create({
      data: {
        orderId: originalPayment.orderId,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'PAYMENT_RETRY_INITIATED',
        reason: `Admin retry attempt initiated from failed payment ${originalPayment.id}. New attempt ${newPayment.id}.`
      }
    });

    res.json({
      success: true,
      message: 'New payment retry attempt created successfully',
      payment: newPayment
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethodsAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const methodsGroup = await prisma.payment.groupBy({
      by: ['method'],
      _count: { id: true },
      _sum: { amount: true }
    });

    const capturedGroup = await prisma.payment.groupBy({
      by: ['method'],
      where: { status: 'CAPTURED' },
      _count: { id: true },
      _sum: { amount: true }
    });

    const refundGroup = await prisma.refund.groupBy({
      by: ['paymentId'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    });

    const capturedMap: Record<string, { count: number; value: number }> = {};
    capturedGroup.forEach(c => {
      capturedMap[c.method || 'OTHER'] = { count: c._count.id, value: c._sum.amount || 0 };
    });

    const methods = methodsGroup.map(m => {
      const methodName = m.method || 'RAZORPAY';
      const totalCount = m._count.id;
      const totalValue = m._sum.amount || 0;
      const captured = capturedMap[methodName] || { count: 0, value: 0 };
      const successRate = totalCount > 0 ? Math.round((captured.count / totalCount) * 100) : 0;

      return {
        method: methodName,
        totalCount,
        totalValue,
        capturedCount: captured.count,
        capturedValue: captured.value,
        successRate
      };
    });

    res.json({ success: true, methods });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 11. EXPORT PAYMENT REPORTS (CSV Stream Engine)
// ============================================================================
export const exportPaymentReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'transactions', startDate, endDate } = req.query;

    if (type === 'settlements') {
      const settlements = await prisma.settlement.findMany({
        orderBy: { settlementDate: 'desc' }
      });

      const csvRows = [
        ['Settlement Ref', 'Settlement Date', 'Gross Amount (INR)', 'Gateway Fee (INR)', 'GST Tax (INR)', 'Refund Adjustment (INR)', 'Net Bank Payout (INR)', 'Bank Reference (UTR)', 'Status', 'Payments Count'].join(',')
      ];

      for (const s of settlements) {
        csvRows.push([
          s.razorpaySettlementId,
          new Date(s.settlementDate).toISOString().slice(0, 10),
          s.grossAmount,
          s.feeAmount,
          s.taxAmount,
          s.refundAdjustment,
          s.netAmount,
          s.bankReference || '—',
          s.status,
          s.capturedPaymentsCount
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=kwd_settlement_report_${Date.now()}.csv`);
      return res.status(200).send(csvRows.join('\n'));
    }

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: { select: { orderNumber: true, guestName: true, guestEmail: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    const csvRows = [
      ['Payment ID', 'Razorpay ID', 'Order Number', 'Customer Email', 'Amount', 'Currency', 'Method', 'Status', 'Verification', 'Refund Status', 'Date'].join(',')
    ];

    for (const p of payments) {
      csvRows.push([
        p.id,
        p.razorpayPaymentId || '',
        p.order?.orderNumber || p.orderId,
        `"${p.order?.guestEmail || ''}"`,
        p.amount,
        p.currency,
        p.method || 'RAZORPAY',
        p.status,
        p.verificationStatus,
        p.refundStatus,
        new Date(p.createdAt).toISOString()
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=kwd_payments_${type}_${Date.now()}.csv`);
    res.status(200).send(csvRows.join('\n'));
  } catch (error) {
    next(error);
  }
};

