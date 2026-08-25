import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { PaymentService } from '../services/paymentService';
import { WebhookService } from '../services/webhookService';
import { RefundService } from '../services/refundService';
import { DisputeService } from '../services/disputeService';
import { OrderFulfilmentService } from '../services/orderFulfilmentService';

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
          break;
        case 'pending':
          where.status = { in: ['PENDING', 'AUTHORIZED'] };
          break;
        case 'failed':
          where.status = 'FAILED';
          break;
        case 'verification':
          where.verificationStatus = { in: ['NOT_VERIFIED', 'VERIFICATION_FAILED'] };
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
      prisma.payment.count({ where: { status: 'CAPTURED' } }),
      prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.aggregate({ where: { status: 'FAILED' }, _sum: { amount: true } }),
      prisma.payment.count({ where: { verificationStatus: { in: ['NOT_VERIFIED', 'VERIFICATION_FAILED'] } } }),
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
      prisma.payment.count({ where: { status: 'CAPTURED' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'FAILED' }, _sum: { amount: true } }),
      prisma.refund.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.reconciliationRecord.count({ where: { status: 'MATCHED' } }),
      prisma.payment.count({ where: { status: 'CAPTURED', fulfilmentStatus: 'COMPLETED' } }),
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

// ============================================================================
// 6. REFUND CONTROLLER OPERATIONS
// ============================================================================
export const getRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refunds = await prisma.refund.findMany({
      include: {
        order: { select: { id: true, orderNumber: true, guestName: true, guestEmail: true } },
        payment: { select: { id: true, razorpayPaymentId: true, amount: true, method: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, refunds });
  } catch (error) {
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
    const settlements = await prisma.settlement.findMany({
      orderBy: { settlementDate: 'desc' }
    });
    res.json({ success: true, settlements });
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
// 10. GATEWAY SETTINGS
// ============================================================================
export const getGatewaySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.gatewaySetting.findUnique({ where: { gatewayName: 'RAZORPAY' } });
    if (!settings) {
      settings = await prisma.gatewaySetting.create({
        data: {
          gatewayName: 'RAZORPAY',
          keyId: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.slice(0, 6)}...` : 'rzp_live_masked',
          keySecretMasked: '••••••••••••••••••••••••',
          webhookSecretMasked: '••••••••••••••••••••••••',
          environment: process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST',
          currency: 'INR',
          captureMode: 'AUTO'
        }
      });
    }
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

export const updateGatewaySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const { captureMode, environment, retryPolicyMaxAttempts, reconciliationSchedule, notificationEmails } = req.body;

    const updated = await prisma.gatewaySetting.upsert({
      where: { gatewayName: 'RAZORPAY' },
      update: {
        ...(captureMode && { captureMode }),
        ...(environment && { environment }),
        ...(retryPolicyMaxAttempts !== undefined && { retryPolicyMaxAttempts: parseInt(retryPolicyMaxAttempts, 10) }),
        ...(reconciliationSchedule && { reconciliationSchedule }),
        ...(notificationEmails !== undefined && { notificationEmails }),
        updatedBy: actor.name || 'Admin'
      },
      create: {
        gatewayName: 'RAZORPAY',
        captureMode: captureMode || 'AUTO',
        environment: environment || 'LIVE',
        retryPolicyMaxAttempts: retryPolicyMaxAttempts || 5,
        reconciliationSchedule: reconciliationSchedule || 'DAILY',
        notificationEmails,
        updatedBy: actor.name || 'Admin'
      }
    });

    res.json({ success: true, message: 'Gateway settings saved successfully', settings: updated });
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
