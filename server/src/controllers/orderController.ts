import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { OrderFulfilmentService } from '../services/orderFulfilmentService';
import { sendDigitalProductDeliveryEmail } from '../utils/emailService';
import { reconcileStalePendingOrders } from './paymentController';

// Helper to extract actor from request
const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : null,
    name: user.name || 'Admin',
    email: user.email || 'admin@kdw.com',
    role: user.role || 'SUPER_ADMIN'
  };
};

// ============================================================================
// 1. GET ALL ORDERS (Multi-Filter, Multi-Identifier Search, Counters & Pagination)
// ============================================================================
export const getAdminOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Defensively reconcile stale pending orders older than 2 hours to FAILED
    await reconcileStalePendingOrders(2).catch((err) => {
      console.warn('[Orders] Stale orders auto-reconciliation warning:', err.message);
    });
    const {
      page = '1',
      limit = '20',
      search,
      orderStatus,
      status,
      paymentStatus,
      accessStatus,
      fulfilmentStatus,
      refundStatus,
      licenceStatus,
      customerType,
      view,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      datePreset,
      days,
      sortBy = 'newest'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};

    // 1. Specific sidebar / saved views filter logic
    if (view) {
      switch (String(view).toLowerCase()) {
        case 'new':
          if (!datePreset && !startDate && !endDate && !days) {
            const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            where.createdAt = { gte: past24h };
          }
          break;
        case 'pending':
        case 'pending_payment':
          where.OR = [
            { orderStatus: { in: ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'PENDING'] } },
            { paymentStatus: 'PENDING' }
          ];
          break;
        case 'completed':
          where.OR = [
            { orderStatus: { in: ['FULFILLED', 'PAID', 'COMPLETED'] } },
            { AND: [{ paymentStatus: { in: ['PAID', 'CAPTURED'] } }, { fulfilmentStatus: 'FULFILLED' }] }
          ];
          break;
        case 'pending_payment':
          where.paymentStatus = 'PENDING';
          break;
        case 'payment_review':
          where.orderStatus = 'PAYMENT_REVIEW';
          break;
        case 'paid':
          where.paymentStatus = { in: ['PAID', 'CAPTURED'] };
          break;
        case 'awaiting_fulfilment':
          where.paymentStatus = { in: ['PAID', 'CAPTURED'] };
          where.fulfilmentStatus = { not: 'FULFILLED' };
          break;
        case 'fulfilled':
          where.fulfilmentStatus = 'FULFILLED';
          break;
        case 'failed':
          where.OR = [
            { orderStatus: 'FAILED' },
            { paymentStatus: 'FAILED' },
            { fulfilmentStatus: 'FAILED' }
          ];
          break;
        case 'cancelled':
          where.orderStatus = 'CANCELLED';
          break;
        case 'refunded':
          where.OR = [
            { paymentStatus: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
            { orderStatus: 'REFUNDED' },
            { refundStatus: { in: ['APPROVED', 'COMPLETED', 'PARTIALLY_REFUNDED'] } }
          ];
          break;
        case 'partially_refunded':
          where.paymentStatus = 'PARTIALLY_REFUNDED';
          break;
        case 'disputed':
          where.OR = [
            { orderStatus: 'DISPUTED' },
            { disputeStatus: { not: 'NONE' } }
          ];
          break;
        case 'guest':
          where.customerType = 'GUEST';
          break;
        case 'without_access':
          where.paymentStatus = { in: ['PAID', 'CAPTURED'] };
          where.accessStatus = 'NOT_GRANTED';
          break;
        case 'download_failures':
          where.downloadHistory = { some: { result: 'FAILED' } };
          break;
        case 'high_value':
          where.OR = [
            { isHighValue: true },
            { totalAmount: { gte: 5000 } }
          ];
          break;
        case 'notes':
          where.orderNotes = { some: {} };
          break;
      }
    }

    // 2. Direct filter params (override or refine view)
    const effectiveStatus = (orderStatus || status) ? String(orderStatus || status).toUpperCase() : null;
    if (effectiveStatus) {
      if (effectiveStatus === 'COMPLETED') {
        where.OR = [
          { orderStatus: { in: ['FULFILLED', 'PAID', 'COMPLETED'] } },
          { AND: [{ paymentStatus: { in: ['PAID', 'CAPTURED'] } }, { fulfilmentStatus: 'FULFILLED' }] }
        ];
      } else if (effectiveStatus === 'NEW') {
        if (!datePreset && !startDate && !endDate && !days) {
          const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          where.createdAt = { gte: past24h };
        }
      } else if (effectiveStatus === 'PENDING' || effectiveStatus === 'PENDING_PAYMENT') {
        where.OR = [
          { orderStatus: { in: ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'PENDING'] } },
          { paymentStatus: 'PENDING' }
        ];
      } else if (effectiveStatus === 'FAILED') {
        where.OR = [
          { orderStatus: 'FAILED' },
          { paymentStatus: 'FAILED' },
          { fulfilmentStatus: 'FAILED' }
        ];
      } else if (effectiveStatus === 'CANCELLED') {
        where.orderStatus = 'CANCELLED';
      } else {
        where.orderStatus = effectiveStatus;
      }
    }

    if (paymentStatus) where.paymentStatus = String(paymentStatus).toUpperCase();
    if (accessStatus) where.accessStatus = String(accessStatus).toUpperCase();
    if (fulfilmentStatus) where.fulfilmentStatus = String(fulfilmentStatus).toUpperCase();
    if (refundStatus) where.refundStatus = String(refundStatus).toUpperCase();
    if (licenceStatus) where.licenceStatus = String(licenceStatus).toUpperCase();
    if (customerType) where.customerType = String(customerType).toUpperCase();

    // 3. Amount Range
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount as string);
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount as string);
    }

    // 4. Date Range & Presets ('1day', '7days', 'custom')
    const preset = String(datePreset || '').toLowerCase();
    if (preset === '1day' || preset === 'today' || days === '1') {
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past24h };
    } else if (preset === '7days' || days === '7') {
      const past7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: past7d };
    } else if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 5. Multi-Identifier Search (Debounced & Partial)
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { guestName: { contains: q, mode: 'insensitive' } },
        { guestEmail: { contains: q, mode: 'insensitive' } },
        { guestMobile: { contains: q, mode: 'insensitive' } },
        { razorpayOrderId: { contains: q, mode: 'insensitive' } },
        { razorpayPaymentId: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
        { customer: { mobile: { contains: q, mode: 'insensitive' } } },
        { customer: { id: { contains: q, mode: 'insensitive' } } },
        { items: { some: { productName: { contains: q, mode: 'insensitive' } } } },
        { items: { some: { productId: { contains: q, mode: 'insensitive' } } } },
        { items: { some: { bundleId: { contains: q, mode: 'insensitive' } } } },
        { licenceKeys: { some: { keyMasked: { contains: q, mode: 'insensitive' } } } }
      ];
    }

    // 6. Sorting
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest_amount':
        orderBy = { totalAmount: 'desc' };
        break;
      case 'lowest_amount':
        orderBy = { totalAmount: 'asc' };
        break;
      case 'recently_paid':
        orderBy = { paidAt: 'desc' };
        break;
      case 'longest_pending':
        orderBy = { createdAt: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute queries in parallel with live status counters
    const [
      orders,
      total,
      countAll,
      countNewOrders,
      countCompleted,
      countPendingPayment,
      countPaymentReview,
      countPaid,
      countAwaitingFulfilment,
      countFailed,
      countCancelled,
      countRefunded,
      countDisputed,
      countWithoutAccess
    ] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true, mobile: true, profileImage: true }
          },
          items: {
            include: {
              product: { select: { id: true, name: true, thumbnail: true, price: true, version: true } },
              bundle: { select: { id: true, title: true, coverImage: true, price: true } }
            }
          },
          payments: { take: 1, orderBy: { createdAt: 'desc' } },
          refunds: { take: 1, orderBy: { createdAt: 'desc' } },
          licenceKeys: { select: { id: true, keyMasked: true, licenceType: true, status: true } },
          _count: {
            select: {
              items: true,
              orderNotes: true,
              downloadHistory: true,
              timelineEvents: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNumber
      }),
      prisma.order.count({ where }),
      prisma.order.count(),
      prisma.order.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.order.count({
        where: {
          OR: [
            { orderStatus: { in: ['FULFILLED', 'PAID', 'COMPLETED'] } },
            { AND: [{ paymentStatus: { in: ['PAID', 'CAPTURED'] } }, { fulfilmentStatus: 'FULFILLED' }] }
          ]
        }
      }),
      prisma.order.count({
        where: {
          OR: [
            { orderStatus: { in: ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'PENDING'] } },
            { paymentStatus: 'PENDING' }
          ]
        }
      }),
      prisma.order.count({ where: { orderStatus: 'PAYMENT_REVIEW' } }),
      prisma.order.count({ where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } }),
      prisma.order.count({
        where: {
          paymentStatus: { in: ['PAID', 'CAPTURED'] },
          fulfilmentStatus: { not: 'FULFILLED' }
        }
      }),
      prisma.order.count({
        where: {
          OR: [{ orderStatus: 'FAILED' }, { paymentStatus: 'FAILED' }, { fulfilmentStatus: 'FAILED' }]
        }
      }),
      prisma.order.count({
        where: {
          orderStatus: 'CANCELLED'
        }
      }),
      prisma.order.count({
        where: {
          OR: [
            { paymentStatus: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
            { orderStatus: 'REFUNDED' },
            { refundStatus: { in: ['APPROVED', 'COMPLETED', 'PARTIALLY_REFUNDED'] } }
          ]
        }
      }),
      prisma.order.count({
        where: {
          OR: [{ orderStatus: 'DISPUTED' }, { disputeStatus: { not: 'NONE' } }]
        }
      }),
      prisma.order.count({
        where: {
          paymentStatus: { in: ['PAID', 'CAPTURED'] },
          accessStatus: 'NOT_GRANTED'
        }
      })
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      },
      counters: {
        all: countAll,
        new_orders: countNewOrders,
        pending_orders: countPendingPayment,
        pending_payment: countPendingPayment,
        completed: countCompleted,
        payment_review: countPaymentReview,
        paid: countPaid,
        awaiting_fulfilment: countAwaitingFulfilment,
        failed: countFailed,
        cancelled: countCancelled,
        refunded: countRefunded,
        disputed: countDisputed,
        without_access: countWithoutAccess
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. GET ORDER ANALYTICS / KPIS (Live Computed Database Formulas)
// ============================================================================
export const getOrderAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalOrders,
      paidOrders,
      guestOrders,
      refundedOrders,
      disputedOrders,
      fulfilledOrders,
      aggregateAmount,
      totalDownloads
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } } }),
      prisma.order.count({ where: { customerType: 'GUEST' } }),
      prisma.order.count({ where: { paymentStatus: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
      prisma.order.count({ where: { OR: [{ orderStatus: 'DISPUTED' }, { disputeStatus: { not: 'NONE' } }] } }),
      prisma.order.count({ where: { fulfilmentStatus: 'FULFILLED' } }),
      prisma.order.aggregate({
        where: { paymentStatus: { in: ['PAID', 'CAPTURED'] } },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      }),
      prisma.downloadHistory.count({ where: { result: 'SUCCESS' } })
    ]);

    const totalRevenue = aggregateAmount._sum.totalAmount || 0;
    const averageOrderValue = Math.round(aggregateAmount._avg.totalAmount || 0);
    const paymentSuccessRate = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0;
    const guestOrderPercentage = totalOrders > 0 ? Math.round((guestOrders / totalOrders) * 100) : 0;
    const fulfilmentSuccessRate = paidOrders > 0 ? Math.round((fulfilledOrders / paidOrders) * 100) : 0;
    const refundRate = paidOrders > 0 ? Math.round((refundedOrders / paidOrders) * 100) : 0;
    const disputeRate = paidOrders > 0 ? Math.round((disputedOrders / paidOrders) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        totalOrders,
        paidOrders,
        refundedOrders,
        totalRevenue,
        averageOrderValue,
        paymentSuccessRate,
        guestOrderPercentage,
        fulfilmentSuccessRate,
        refundRate,
        disputeRate,
        totalDownloads
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. GET SINGLE ORDER DETAILS (Deep Operational Snapshots, Diagnostics & Trail)
// ============================================================================
export const getAdminOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }]
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            emailVerified: true,
            profileImage: true,
            createdAt: true,
            _count: { select: { orders: true, purchases: true } }
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                thumbnail: true,
                version: true,
                licenceType: true,
                googleDriveFileId: true,
                category: { select: { id: true, name: true } }
              }
            },
            bundle: {
              include: {
                bundleItems: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                        price: true,
                        thumbnail: true,
                        googleDriveFileId: true,
                        version: true
                      }
                    }
                  },
                  orderBy: { displayOrder: 'asc' }
                }
              }
            }
          }
        },
        payments: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        orderNotes: { orderBy: { createdAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        licenceKeys: { orderBy: { issuedAt: 'desc' } },
        downloadHistory: { orderBy: { downloadedAt: 'desc' }, take: 50 },
        bundleEntitlements: {
          include: {
            bundle: { select: { id: true, title: true } },
            componentEntitlements: {
              include: {
                product: { select: { id: true, name: true, thumbnail: true } }
              }
            }
          }
        },
        digitalDeliveries: {
          include: {
            items: true
          }
        },
        supportTickets: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customer Lifetime Value
    let customerLtv = order.totalAmount;
    if (order.customerId) {
      const ltvAgg = await prisma.order.aggregate({
        where: { customerId: order.customerId, paymentStatus: { in: ['PAID', 'CAPTURED'] } },
        _sum: { totalAmount: true }
      });
      customerLtv = ltvAgg._sum.totalAmount || order.totalAmount;
    }

    // Remaining refundable amount calculation
    const totalPreviousRefunds = (order.refunds || [])
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const remainingRefundable = Math.max(0, order.totalAmount - totalPreviousRefunds);

    res.json({
      success: true,
      order: {
        ...order,
        customerLtv,
        totalPreviousRefunds,
        remainingRefundable
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. RETRY ORDER FULFILMENT (Idempotent Engine Execution)
// ============================================================================
export const retryOrderFulfilment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const result = await OrderFulfilmentService.fulfilOrder(id, {
      id: actor.id || undefined,
      email: actor.email,
      role: actor.role,
      name: actor.name
    });

    res.json({
      success: true,
      message: `Fulfilment successfully executed. ${result.deliveredItemsCount} items delivered.`,
      order: result.order
    });
  } catch (error: any) {
    next(error);
  }
};

// ============================================================================
// 4B. BATCH FULFIL ALL UNFULFILLED PAID ORDERS
// ============================================================================
export const batchFulfilOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const unfulfilledPaidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: { in: ['PAID', 'CAPTURED'] },
        fulfilmentStatus: { not: 'FULFILLED' }
      }
    });

    let fulfilledCount = 0;
    let failedCount = 0;

    for (const order of unfulfilledPaidOrders) {
      try {
        await OrderFulfilmentService.fulfilOrder(order.id, {
          id: actor.id || undefined,
          email: actor.email,
          role: actor.role,
          name: actor.name
        });
        fulfilledCount++;
      } catch (err) {
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Batch fulfilment complete: ${fulfilledCount} orders fulfilled, ${failedCount} failed.`,
      fulfilledCount,
      failedCount,
      totalProcessed: unfulfilledPaidOrders.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. RESEND ACCESS NOTIFICATION (Rate-Limited to 3/hour)
// ============================================================================
export const resendOrderAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const actor = getActor(req);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        digitalDeliveries: { include: { items: true } },
        licenceKeys: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const recipientEmail = (order.guestEmail || order.customer?.email || '').trim();
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is missing' });
    }

    // Check rate limit: count resends in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentResends = await prisma.orderTimelineEvent.count({
      where: {
        orderId: id,
        eventType: 'ACCESS_RESENT',
        createdAt: { gte: oneHourAgo }
      }
    });

    if (recentResends >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Resend limit reached (maximum 3 resends per hour allowed). Please try again later.'
      });
    }

    // Build delivery list from existing digital deliveries
    const delivery = order.digitalDeliveries[0];
    const deliveryItems = delivery?.items || [];

    const deliveryLinksList = deliveryItems.map(item => ({
      name: item.productName,
      driveUrl: item.deliveryLink
    }));

    const primaryLicence = order.licenceKeys?.[0]?.keyMasked;
    const sendResult = await sendDigitalProductDeliveryEmail({
      recipientEmail,
      customerName: order.guestName || order.customer?.name || 'Valued Customer',
      orderNumber: order.orderNumber,
      licenceKey: primaryLicence,
      items: deliveryLinksList.length > 0
        ? deliveryLinksList
        : [{ name: 'Digital Asset', driveUrl: delivery?.deliveryLink || 'http://localhost:5173/account/downloads' }]
    });

    if (!sendResult.success && !sendResult.skipped) {
      return res.status(500).json({ success: false, message: sendResult.error?.message || 'Failed to dispatch email via SMTP' });
    }

    // Record Timeline & Audit Event
    await prisma.$transaction([
      prisma.orderTimelineEvent.create({
        data: {
          orderId: id,
          eventType: 'ACCESS_RESENT',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          status: 'SUCCESS',
          description: `Access email manually resent to ${recipientEmail} by ${actor.name}.`
        }
      }),
      prisma.orderAuditLog.create({
        data: {
          orderId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'ACCESS_RESENT',
          reason: `Manual access delivery email resend by ${actor.name}`
        }
      })
    ]);

    res.json({
      success: true,
      message: `Access email successfully dispatched to ${recipientEmail}`
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. EXTEND ACCESS PERIOD (Duration Extension)
// ============================================================================
export const extendOrderAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { additionalDays = 30, reason = 'Administrative extension' } = req.body;
    const actor = getActor(req);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const newExpiry = new Date(Date.now() + (parseInt(additionalDays) || 30) * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { accessStatus: 'ACTIVE' }
      }),
      prisma.bundleEntitlement.updateMany({
        where: { orderId: id },
        data: { accessExpiresAt: newExpiry, status: 'ACTIVE' }
      }),
      prisma.componentEntitlement.updateMany({
        where: { orderId: id },
        data: { accessExpiresAt: newExpiry, status: 'ACTIVE' }
      }),
      prisma.licenceKey.updateMany({
        where: { orderId: id },
        data: { expiresAt: newExpiry, status: 'ACTIVE' }
      }),
      prisma.orderTimelineEvent.create({
        data: {
          orderId: id,
          eventType: 'ACCESS_EXTENDED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          description: `Access extended by ${additionalDays} days. Reason: ${reason}`
        }
      }),
      prisma.orderAuditLog.create({
        data: {
          orderId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'ACCESS_EXTENDED',
          reason: `Extended by ${additionalDays} days: ${reason}`,
          newValue: { additionalDays, newExpiry }
        }
      })
    ]);

    res.json({ success: true, message: `Access extended successfully by ${additionalDays} days.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. RESET DOWNLOADS (Preserves Download Logs)
// ============================================================================
export const resetOrderDownloads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { reason = 'Download limit reset requested by customer' } = req.body;
    const actor = getActor(req);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await prisma.$transaction([
      prisma.purchase.updateMany({
        where: { orderId: id },
        data: { downloadCount: 0, accessStatus: 'ACTIVE' }
      }),
      prisma.bundleEntitlement.updateMany({
        where: { orderId: id },
        data: { downloadCount: 0, status: 'ACTIVE' }
      }),
      prisma.componentEntitlement.updateMany({
        where: { orderId: id },
        data: { downloadCount: 0, status: 'ACTIVE' }
      }),
      prisma.order.update({
        where: { id },
        data: { accessStatus: 'ACTIVE' }
      }),
      prisma.orderTimelineEvent.create({
        data: {
          orderId: id,
          eventType: 'DOWNLOAD_RESET',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          description: `Download limits reset to 0 while preserving historical download logs. Reason: ${reason}`
        }
      }),
      prisma.orderAuditLog.create({
        data: {
          orderId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'DOWNLOAD_RESET',
          reason
        }
      })
    ]);

    res.json({ success: true, message: 'Download counts reset successfully. Access restored.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. REVOKE ACCESS (Revokes Entitlements & Invalidates Tokens)
// ============================================================================
export const revokeOrderAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { reason = 'Access revoked by administrator' } = req.body;
    const actor = getActor(req);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { purchases: true }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const purchaseIds = (order.purchases || []).map(p => p.id);

    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { accessStatus: 'REVOKED', orderStatus: 'ACCESS_REVOKED' }
      }),
      prisma.purchase.updateMany({
        where: { orderId: id },
        data: { accessStatus: 'REVOKED' }
      }),
      prisma.bundleEntitlement.updateMany({
        where: { orderId: id },
        data: { status: 'REVOKED' }
      }),
      prisma.componentEntitlement.updateMany({
        where: { orderId: id },
        data: { status: 'REVOKED' }
      }),
      prisma.licenceKey.updateMany({
        where: { orderId: id },
        data: { status: 'REVOKED' }
      }),
      ...(purchaseIds.length > 0
        ? [prisma.accessToken.deleteMany({ where: { purchaseId: { in: purchaseIds } } })]
        : []),
      prisma.orderTimelineEvent.create({
        data: {
          orderId: id,
          eventType: 'ACCESS_REVOKED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          status: 'WARNING',
          description: `Digital access revoked and tokens invalidated. Reason: ${reason}`
        }
      }),
      prisma.orderAuditLog.create({
        data: {
          orderId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'ACCESS_REVOKED',
          reason
        }
      })
    ]);

    res.json({ success: true, message: 'Digital access revoked and download tokens invalidated.' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 9. PROCESS REFUND (Full or Partial with Remaining Calculation & Policy Revocation)
// ============================================================================
export const processOrderRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { amount, reason = 'Customer refund request', revokeAccess = true } = req.body;
    const actor = getActor(req);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { refunds: true, purchases: true }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const totalPrevRefunds = (order.refunds || [])
      .filter((r: any) => r.status === 'COMPLETED')
      .reduce((sum: number, r: any) => sum + r.amount, 0);

    const remainingRefundable = Math.max(0, order.totalAmount - totalPrevRefunds);
    const refundAmount = amount !== undefined ? parseFloat(String(amount)) : remainingRefundable;

    if (refundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Refund amount must be greater than zero.' });
    }

    if (refundAmount > remainingRefundable) {
      return res.status(400).json({
        success: false,
        message: `Refund amount (₹${refundAmount}) exceeds remaining refundable amount (₹${remainingRefundable}).`
      });
    }

    const isFullRefund = (totalPrevRefunds + refundAmount) >= order.totalAmount;
    const newPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    const newOrderStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    const purchaseIds = (order.purchases || []).map((p: any) => p.id);

    await prisma.$transaction([
      // 1. Create Refund Record
      prisma.refund.create({
        data: {
          orderId: id,
          amount: refundAmount,
          reason,
          status: 'COMPLETED',
          requestedBy: actor.email,
          approvedBy: actor.name,
          accessRevoked: !!revokeAccess,
          licenceRevoked: !!revokeAccess
        }
      }),

      // 2. Update Order Totals & Status
      prisma.order.update({
        where: { id },
        data: {
          paymentStatus: newPaymentStatus,
          orderStatus: newOrderStatus,
          refundStatus: isFullRefund ? 'COMPLETED' : 'PARTIALLY_REFUNDED',
          refundedAmount: { increment: refundAmount },
          refundedAt: new Date(),
          ...(revokeAccess ? { accessStatus: 'REVOKED', licenceStatus: 'REVOKED' } : {})
        }
      }),

      // 3. Conditionally Revoke Access if requested
      ...(revokeAccess
        ? [
            prisma.purchase.updateMany({ where: { orderId: id }, data: { accessStatus: 'REVOKED' } }),
            prisma.bundleEntitlement.updateMany({ where: { orderId: id }, data: { status: 'REVOKED' } }),
            prisma.componentEntitlement.updateMany({ where: { orderId: id }, data: { status: 'REVOKED' } }),
            prisma.licenceKey.updateMany({ where: { orderId: id }, data: { status: 'REVOKED' } }),
            ...(purchaseIds.length > 0
              ? [prisma.accessToken.deleteMany({ where: { purchaseId: { in: purchaseIds } } })]
              : [])
          ]
        : []),

      // 4. Timeline Event
      prisma.orderTimelineEvent.create({
        data: {
          orderId: id,
          eventType: 'REFUND_PROCESSED',
          actorType: 'ADMIN',
          actorName: actor.name,
          actorEmail: actor.email,
          status: 'SUCCESS',
          description: `${isFullRefund ? 'Full' : 'Partial'} refund of ₹${refundAmount} processed. Access Revoked: ${revokeAccess}`
        }
      }),

      // 5. Audit Log
      prisma.orderAuditLog.create({
        data: {
          orderId: id,
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'REFUND_PROCESSED',
          reason,
          oldValue: { paymentStatus: order.paymentStatus, refundedAmount: totalPrevRefunds },
          newValue: { paymentStatus: newPaymentStatus, refundedAmount: totalPrevRefunds + refundAmount, refundAmount }
        }
      })
    ]);

    res.json({
      success: true,
      message: `Successfully processed ${isFullRefund ? 'full' : 'partial'} refund of ₹${refundAmount}.`
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. ADD INTERNAL OR CUSTOMER NOTE
// ============================================================================
export const addOrderNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { content, noteType = 'INTERNAL', visibility = 'PRIVATE' } = req.body;
    const actor = getActor(req);

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const note = await prisma.orderNote.create({
      data: {
        orderId: id,
        authorId: actor.id,
        authorName: actor.name,
        authorEmail: actor.email,
        noteType: String(noteType).toUpperCase(),
        visibility: String(visibility).toUpperCase(),
        content: content.trim()
      }
    });

    await prisma.orderTimelineEvent.create({
      data: {
        orderId: id,
        eventType: 'NOTE_ADDED',
        actorType: 'ADMIN',
        actorName: actor.name,
        actorEmail: actor.email,
        description: `Note added by ${actor.name} (${noteType})`
      }
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 11. EXPORT ORDERS (CSV Engine with Audit Logging)
// ============================================================================
export const exportOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'sales', startDate, endDate, view, orderStatus, status, datePreset, days } = req.query;
    const actor = getActor(req);

    const where: any = {};
    if (view) {
      const v = String(view).toLowerCase();
      if (v === 'completed') {
        where.OR = [
          { orderStatus: { in: ['FULFILLED', 'PAID', 'COMPLETED'] } },
          { AND: [{ paymentStatus: { in: ['PAID', 'CAPTURED'] } }, { fulfilmentStatus: 'FULFILLED' }] }
        ];
      } else if (v === 'new') {
        if (!datePreset && !startDate && !endDate && !days) {
          const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          where.createdAt = { gte: past24h };
        }
      } else if (v === 'pending' || v === 'pending_payment') {
        where.OR = [
          { orderStatus: { in: ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'PENDING'] } },
          { paymentStatus: 'PENDING' }
        ];
      } else if (v === 'failed') {
        where.OR = [{ orderStatus: 'FAILED' }, { paymentStatus: 'FAILED' }, { fulfilmentStatus: 'FAILED' }];
      } else if (v === 'cancelled') {
        where.orderStatus = 'CANCELLED';
      }
    }

    const effectiveStatus = (orderStatus || status) ? String(orderStatus || status).toUpperCase() : null;
    if (effectiveStatus) {
      if (effectiveStatus === 'COMPLETED') {
        where.OR = [
          { orderStatus: { in: ['FULFILLED', 'PAID', 'COMPLETED'] } },
          { AND: [{ paymentStatus: { in: ['PAID', 'CAPTURED'] } }, { fulfilmentStatus: 'FULFILLED' }] }
        ];
      } else if (effectiveStatus === 'NEW') {
        if (!datePreset && !startDate && !endDate && !days) {
          const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          where.createdAt = { gte: past24h };
        }
      } else if (effectiveStatus === 'PENDING' || effectiveStatus === 'PENDING_PAYMENT') {
        where.OR = [
          { orderStatus: { in: ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'PENDING'] } },
          { paymentStatus: 'PENDING' }
        ];
      } else if (effectiveStatus === 'FAILED') {
        where.OR = [{ orderStatus: 'FAILED' }, { paymentStatus: 'FAILED' }, { fulfilmentStatus: 'FAILED' }];
      } else if (effectiveStatus === 'CANCELLED') {
        where.orderStatus = 'CANCELLED';
      } else {
        where.orderStatus = effectiveStatus;
      }
    }

    const preset = String(datePreset || '').toLowerCase();
    if (preset === '1day' || preset === 'today' || days === '1') {
      where.createdAt = { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    } else if (preset === '7days' || days === '7') {
      where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: true,
        refunds: true,
        licenceKeys: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    // Record Audit
    await prisma.orderAuditLog.create({
      data: {
        orderId: orders[0]?.id || 'bulk',
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'EXPORTED',
        reason: `Orders ${type} export downloaded (${orders.length} rows)`
      }
    });

    const csvRows = [
      ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Type', 'Items Count', 'Amount (INR)', 'Order Status', 'Payment Status', 'Access Status', 'Fulfilment Status', 'Refunded Amount', 'Razorpay Payment ID'].join(',')
    ];

    for (const o of orders) {
      csvRows.push([
        o.orderNumber,
        new Date(o.createdAt).toISOString(),
        `"${(o.guestName || o.customer?.name || 'Guest').replace(/"/g, '""')}"`,
        o.guestEmail || o.customer?.email || '',
        o.customerType,
        o.items.length,
        o.totalAmount,
        o.orderStatus,
        o.paymentStatus,
        o.accessStatus,
        o.fulfilmentStatus,
        o.refundedAmount || 0,
        o.razorpayPaymentId || ''
      ].join(','));
    }

    const csvData = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=kwd_orders_${type}_${Date.now()}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 12. BACKWARD COMPATIBILITY WRAPPERS (For legacy route calls)
// ============================================================================
export const updateAdminOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { orderStatus, paymentStatus } = req.body;
    const actor = getActor(req);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus && { orderStatus: String(orderStatus).toUpperCase() }),
        ...(paymentStatus && { paymentStatus: String(paymentStatus).toUpperCase() })
      }
    });

    await prisma.orderAuditLog.create({
      data: {
        orderId: id,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'STATUS_UPDATED',
        reason: `Status manually updated: orderStatus=${orderStatus}, paymentStatus=${paymentStatus}`
      }
    });

    res.json({ success: true, order: updated });
  } catch (error) {
    next(error);
  }
};

export const refundAdminOrder = processOrderRefund;

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email?.toLowerCase();

    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          ...(userId ? [{ customerId: userId }] : []),
          ...(userEmail ? [{ customerEmail: userEmail }] : [])
        ]
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, thumbnail: true, price: true, version: true, slug: true } },
            bundle: { select: { id: true, title: true, coverImage: true, price: true, slug: true } }
          }
        },
        licenceKeys: true,
        purchases: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 15. PUBLIC / GUEST ORDER STATUS LOOKUP (For Payment Success & Receipt Pages)
// ============================================================================
export const getPublicOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawParam = req.params.id || req.query.query || req.query.id || req.query.orderNumber || '';
    const orderRef = String(rawParam).trim();
    if (!orderRef) {
      return res.status(400).json({ success: false, message: 'Order reference is required' });
    }

    const order: any = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderRef },
          { orderNumber: orderRef },
          { razorpayOrderId: orderRef }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
                googleDriveLinks: true,
                googleDriveFileId: true
              }
            },
            bundle: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true
              }
            }
          }
        },
        digitalDeliveries: true,
        licenceKeys: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Return sanitized storefront order object
    const isOrderPaid = order.paymentStatus === 'PAID' || order.orderStatus === 'PAID' || order.orderStatus === 'FULFILLED' || order.totalAmount === 0;

    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: isOrderPaid ? 'PAID' : order.orderStatus,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        accessStatus: order.accessStatus,
        fulfilmentStatus: order.fulfilmentStatus,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        currency: order.currency,
        customerEmail: order.guestEmail,
        customerName: order.guestName,
        paidAt: order.paidAt,
        fulfilledAt: order.fulfilledAt,
        createdAt: order.createdAt,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          bundleId: item.bundleId,
          name: item.productName || item.product?.name || item.bundle?.title,
          price: item.unitPrice,
          quantity: item.quantity,
          downloadLinks: isOrderPaid ? (item.product?.googleDriveLinks || []) : []
        })),
        deliveries: isOrderPaid ? (order.digitalDeliveries || []) : [],
        licenceKeys: isOrderPaid ? (order.licenceKeys || []).map((k: any) => ({
          id: k.id,
          key: k.keyMasked || k.id,
          status: k.status
        })) : []
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 15. MANUAL / CRON TRIGGER: RECONCILE STALE ORDERS
// ============================================================================
export const triggerReconcileStaleOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hours = req.body?.maxAgeHours ? Number(req.body.maxAgeHours) : 2;
    const reconciledCount = await reconcileStalePendingOrders(hours);
    return res.json({
      success: true,
      message: `Reconciled ${reconciledCount} stale pending order(s) to FAILED.`,
      reconciledCount
    });
  } catch (error) {
    next(error);
  }
};


