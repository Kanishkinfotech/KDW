import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. List Customer Requests
export const getCustomerRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, requestType, verificationStatus } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') where.status = String(status);
    if (requestType && requestType !== 'ALL') where.requestType = String(requestType);
    if (verificationStatus && verificationStatus !== 'ALL') where.verificationStatus = String(verificationStatus);

    const requests = await prisma.customerRequest.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, customerType: true } },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            description: true,
            status: true,
            priority: true,
            customerName: true,
            customerEmail: true,
            orderId: true,
            createdAt: true,
            order: {
              select: {
                id: true,
                orderNumber: true,
                totalAmount: true
              }
            },
            messages: {
              where: { visibility: 'CUSTOMER' },
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Customer Identity
export const verifyCustomerRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { verificationMethod = 'ORDER_VERIFICATION' } = req.body;
    const authUser = (req as any).user;

    const request = await prisma.customerRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cr = await tx.customerRequest.update({
        where: { id },
        data: {
          verificationStatus: 'VERIFIED',
          verificationMethod,
          status: 'UNDER_REVIEW',
          handledById: authUser.id,
          handledByName: authUser.name
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: request.ticketId,
          eventType: 'STATUS_CHANGE',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: 'VERIFIED',
          reason: `Customer identity verified via ${verificationMethod}`
        }
      });

      return cr;
    });

    res.json({
      success: true,
      message: 'Identity verified successfully. Request is now under review.',
      request: updated
    });
  } catch (error) {
    next(error);
  }
};

// 3. Complete Customer Request (e.g. Data Export, Email Change, Deletion)
export const completeCustomerRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { actionTaken, notes } = req.body;
    const authUser = (req as any).user;

    const request = await prisma.customerRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cr = await tx.customerRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          actionTaken: actionTaken || 'Request completed as verified',
          completedAt: new Date(),
          handledById: authUser.id,
          handledByName: authUser.name
        }
      });

      await tx.supportTicket.update({
        where: { id: request.ticketId },
        data: { status: 'RESOLVED', resolvedAt: new Date() }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: request.ticketId,
          eventType: 'RESOLVED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: 'COMPLETED',
          reason: notes || `Customer request (${request.requestType}) fulfilled.`
        }
      });

      return cr;
    });

    res.json({
      success: true,
      message: 'Customer request completed and ticket marked as resolved.',
      request: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Reject Customer Request
export const rejectCustomerRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const authUser = (req as any).user;

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Mandatory rejection reason required.' });
    }

    const request = await prisma.customerRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cr = await tx.customerRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: String(reason).trim(),
          handledById: authUser.id,
          handledByName: authUser.name
        }
      });

      await tx.supportTicket.update({
        where: { id: request.ticketId },
        data: { status: 'CLOSED' }
      });

      await tx.supportMessage.create({
        data: {
          ticketId: request.ticketId,
          senderId: authUser.id,
          senderType: 'AGENT',
          senderName: authUser.name || 'Support Staff',
          senderEmail: authUser.email || '',
          message: `Request update: ${String(reason).trim()}`,
          visibility: 'CUSTOMER',
          channel: 'PORTAL'
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: request.ticketId,
          eventType: 'STATUS_CHANGE',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: 'REJECTED',
          reason: String(reason).trim()
        }
      });

      return cr;
    });

    res.json({
      success: true,
      message: 'Customer request rejected and documented.',
      request: updated
    });
  } catch (error) {
    next(error);
  }
};

// 5. Admin Reply to Customer Request
export const replyCustomerRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { message, status = 'COMPLETED' } = req.body;
    const authUser = (req as any).user;

    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
    }

    const request = await prisma.customerRequest.findUnique({
      where: { id },
      include: { ticket: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Customer request not found.' });
    }

    const now = new Date();
    const adminName = authUser?.name || 'Support Staff';

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Create support message visible to customer
      await tx.supportMessage.create({
        data: {
          ticketId: request.ticketId,
          senderId: authUser?.id || null,
          senderType: 'AGENT',
          senderName: adminName,
          senderEmail: authUser?.email || '',
          message: String(message).trim(),
          visibility: 'CUSTOMER',
          channel: 'PORTAL',
          sentAt: now,
          deliveredAt: now
        }
      });

      // 2. Update CustomerRequest
      const cr = await tx.customerRequest.update({
        where: { id },
        data: {
          status,
          actionTaken: String(message).trim(),
          handledById: authUser?.id || null,
          handledByName: adminName,
          completedAt: status === 'COMPLETED' ? now : undefined
        }
      });

      // 3. Update Support Ticket status
      const ticketStatus = status === 'COMPLETED' ? 'RESOLVED' : 'WAITING_FOR_CUSTOMER';
      await tx.supportTicket.update({
        where: { id: request.ticketId },
        data: {
          status: ticketStatus,
          firstResponseAt: request.ticket.firstResponseAt || now,
          resolvedAt: status === 'COMPLETED' ? now : undefined
        }
      });

      // 4. Log event
      await tx.supportTicketEvent.create({
        data: {
          ticketId: request.ticketId,
          eventType: 'REPLY_SENT',
          actorId: authUser?.id || null,
          actorName: adminName,
          actorRole: authUser?.role || 'STAFF',
          newValue: ticketStatus,
          reason: `Admin replied: "${String(message).trim().slice(0, 100)}..."`
        }
      });

      return cr;
    });

    res.json({
      success: true,
      message: 'Reply sent successfully. Customer will see the reply on the storefront.',
      request: updated
    });
  } catch (error) {
    next(error);
  }
};

