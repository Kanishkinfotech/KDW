import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateSlaDeadlines } from './slaEngine';

const prisma = new PrismaClient();

// 1. Submit Public Contact / Support Query with Automatic Classification
export const submitContactQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, queryType, orderNumber, subject, message, attachments } = req.body;
    const authUser = (req as any).user;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const trimmedMsg = String(message || '').trim();
    const finalName = String(name || '').trim();
    const finalEmail = String(email || '').trim();
    const cleanSubject = String(subject || '').trim();
    const finalSubject = cleanSubject || `${queryType ? queryType.replace(/_/g, ' ') : 'Support'} Inquiry from ${finalName}`;

    // Automatic classification based on queryType or text analysis
    let type = 'CONTACT_QUERY';
    let priority = 'MEDIUM';
    let category = queryType || 'General';

    const lowerMsg = trimmedMsg.toLowerCase();
    if (queryType === 'DOWNLOAD_ISSUE' || lowerMsg.includes('download') || lowerMsg.includes('drive')) {
      type = 'DOWNLOAD_ISSUE';
      category = 'Download & Fulfillment';
      priority = 'HIGH';
    } else if (queryType === 'REFUND_REQUEST' || lowerMsg.includes('refund') || lowerMsg.includes('money back')) {
      type = 'REFUND_REQUEST';
      category = 'Billing & Refunds';
      priority = 'HIGH';
    } else if (queryType === 'LICENCE_ISSUE' || lowerMsg.includes('licence') || lowerMsg.includes('license') || lowerMsg.includes('activation')) {
      type = 'LICENCE_ISSUE';
      category = 'Licence & Activation';
      priority = 'HIGH';
    } else if (lowerMsg.includes('payment') || lowerMsg.includes('upi') || lowerMsg.includes('card')) {
      type = 'PAYMENT_QUERY';
      category = 'Payment & Invoicing';
    }

    // Lookup user if exists
    let user = authUser;
    if (!user && finalEmail) {
      user = await prisma.user.findFirst({ where: { email: { equals: finalEmail, mode: 'insensitive' } } });
    }

    // Lookup order if orderNumber given
    let orderId: string | null = null;
    if (orderNumber) {
      const cleanOrderNum = String(orderNumber).trim().replace(/^#/, '');
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: { equals: cleanOrderNum, mode: 'insensitive' } },
            { id: cleanOrderNum }
          ]
        }
      });
      if (order) orderId = order.id;
    }

    // Generate unique ticket number
    const count = await prisma.supportTicket.count();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const ticketNumber = `TKT-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

    const slaDeadlines = calculateSlaDeadlines(priority);

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.create({
        data: {
          ticketNumber,
          userId: user ? user.id : null,
          customerName: finalName,
          customerEmail: finalEmail,
          isGuest: !user,
          orderId,
          type,
          category,
          priority,
          status: 'NEW',
          source: 'WEB_CONTACT',
          subject: finalSubject,
          description: trimmedMsg,
          slaStatus: 'HEALTHY',
          slaFirstResponseDueAt: slaDeadlines.firstResponseDueAt,
          slaResolutionDueAt: slaDeadlines.resolutionDueAt
        }
      });

      await tx.supportSlaRecord.create({
        data: {
          ticketId: t.id,
          priority,
          firstResponseTargetMinutes: slaDeadlines.firstResponseTargetMinutes,
          resolutionTargetMinutes: slaDeadlines.resolutionTargetMinutes,
          firstResponseDueAt: slaDeadlines.firstResponseDueAt,
          resolutionDueAt: slaDeadlines.resolutionDueAt
        }
      });

      await tx.supportMessage.create({
        data: {
          ticketId: t.id,
          senderId: user ? user.id : null,
          senderType: 'CUSTOMER',
          senderName: finalName,
          senderEmail: finalEmail,
          message: trimmedMsg,
          visibility: 'CUSTOMER',
          channel: 'WEB',
          attachmentsJson: attachments ? JSON.parse(JSON.stringify(attachments)) : null
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: t.id,
          eventType: 'CREATED',
          actorName: finalName,
          actorRole: 'CUSTOMER',
          newValue: 'NEW',
          reason: 'Web Contact Query Submitted'
        }
      });

      // Also create a linked CustomerRequest record so it appears in the Customer Requests admin desk
      await tx.customerRequest.create({
        data: {
          ticketId: t.id,
          customerId: user ? user.id : null,
          requestType: queryType || type || 'GENERAL',
          verificationStatus: user ? 'VERIFIED' : 'PENDING',
          verificationMethod: user ? 'LOGIN_CONFIRMED' : 'GUEST_FORM',
          status: 'NEW',
          actionTaken: null,
          dataAccessedJson: {
            name: finalName,
            email: finalEmail,
            orderNumber: orderNumber ? String(orderNumber).trim() : null,
            subject: finalSubject,
            message: trimmedMsg
          }
        }
      });

      return t;
    });

    res.status(201).json({
      success: true,
      message: 'Support inquiry received. A customer support ticket has been registered.',
      ticketNumber: ticket.ticketNumber,
      expectedResponseTime: priority === 'HIGH' ? 'Within 2 hours' : 'Within 24 hours'
    });
  } catch (error) {
    next(error);
  }
};

// 2B. Customer Get Support Inquiries & Staff Responses (Used by Contact Support Page)
export const getCustomerSupportRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const queryEmail = (req.query.email as string) || authUser?.email;
    const queryTicket = req.query.ticketNumber as string;

    const orConditions: any[] = [];
    if (authUser?.id) {
      orConditions.push({ userId: authUser.id });
    }
    if (authUser?.email) {
      orConditions.push({ customerEmail: { equals: authUser.email.trim(), mode: 'insensitive' } });
    }
    if (queryEmail) {
      orConditions.push({ customerEmail: { equals: queryEmail.trim(), mode: 'insensitive' } });
    }
    if (queryTicket) {
      orConditions.push({ ticketNumber: queryTicket.trim() });
    }

    if (orConditions.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: orConditions
      },
      include: {
        messages: {
          where: { visibility: 'CUSTOMER' },
          orderBy: { createdAt: 'asc' }
        },
        order: { select: { orderNumber: true } },
        customerRequest: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// 2. Customer Get "My Tickets"
export const getCustomerTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    if (!authUser?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { userId: authUser.id },
          { customerEmail: { equals: authUser.email, mode: 'insensitive' } }
        ]
      },
      include: {
        order: { select: { orderNumber: true } },
        satisfaction: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// 3. Customer Get Ticket Conversation Details
export const getCustomerTicketDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }]
      },
      include: {
        order: { select: { orderNumber: true, orderStatus: true, totalAmount: true } },
        product: { select: { name: true } },
        messages: {
          where: { visibility: 'CUSTOMER' },
          orderBy: { createdAt: 'asc' }
        },
        satisfaction: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Ensure authorization
    if (authUser && ticket.userId && ticket.userId !== authUser.id && ticket.customerEmail !== authUser.email) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// 4. Submit Satisfaction Survey (CSAT)
export const submitSatisfactionSurvey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, rating, comment } = req.body;
    const authUser = (req as any).user;

    if (!ticketId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid rating (1 to 5) and ticketId are required' });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const survey = await prisma.supportSatisfaction.upsert({
      where: { ticketId },
      update: {
        rating: parseInt(String(rating), 10),
        comment,
        isSatisfied: rating >= 4,
        submittedAt: new Date()
      },
      create: {
        ticketId,
        customerId: authUser?.id || ticket.userId || null,
        customerEmail: ticket.customerEmail || authUser?.email,
        orderId: ticket.orderId,
        rating: parseInt(String(rating), 10),
        comment,
        isSatisfied: rating >= 4
      }
    });

    res.json({
      success: true,
      message: 'Thank you for your feedback! Your satisfaction score has been recorded.',
      data: survey
    });
  } catch (error) {
    next(error);
  }
};

// 5. Self-Service Order & Download Access Status Check
export const selfServiceOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber, email } = req.body;
    if (!orderNumber || !email) {
      return res.status(400).json({ success: false, message: 'Order number and email are required' });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: String(orderNumber).trim(),
        OR: [
          { guestEmail: { equals: email, mode: 'insensitive' } },
          { customer: { email: { equals: email, mode: 'insensitive' } } }
        ]
      },
      include: {
        orderItems: {
          include: { product: { select: { name: true, version: true } } }
        },
        digitalEntitlements: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No matching order found with the provided details. Please verify your order number.'
      });
    }

    const anyOrder = order as any;
    res.json({
      success: true,
      order: {
        orderNumber: anyOrder.orderNumber,
        status: anyOrder.orderStatus,
        createdAt: anyOrder.createdAt,
        totalAmount: anyOrder.totalAmount,
        items: (anyOrder.orderItems || []).map((item: any) => ({
          productTitle: item.product?.name || 'Digital Product',
          price: item.price
        })),
        entitlements: (anyOrder.digitalEntitlements || []).map((e: any) => ({
          status: e.status,
          downloadCount: e.downloadCount,
          downloadLimit: e.downloadLimit,
          accessExpiresAt: e.accessExpiresAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
