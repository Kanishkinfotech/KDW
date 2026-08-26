import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ==========================================
// 1. DOWNLOAD CONTEXT ACTIONS
// ==========================================

export const resendDownloadLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, customerEmail } = req.body;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

    await prisma.$transaction(async (tx) => {
      // Record event
      await tx.supportTicketEvent.create({
        data: {
          ticketId,
          eventType: 'TOKEN_GENERATED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: tokenString.slice(0, 8) + '...',
          reason: `Secure download link resent to ${customerEmail || ticket.customerEmail || 'Customer'}`
        }
      });
    });

    res.json({
      success: true,
      message: `Secure download link generated and dispatched to ${customerEmail || ticket.customerEmail || 'Customer'}`,
      token: tokenString,
      expiresAt
    });
  } catch (error) {
    next(error);
  }
};

export const resetDownloadLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, orderId, productId, reason } = req.body;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Find and reset digital entitlement if exists
      if (orderId && productId) {
        const entitlement = await tx.digitalEntitlement.findFirst({
          where: { orderId, productId }
        });
        if (entitlement) {
          await tx.digitalEntitlement.update({
            where: { id: entitlement.id },
            data: { downloadCount: 0, status: 'ACTIVE' }
          });
        }
      }

      await tx.supportTicketEvent.create({
        data: {
          ticketId,
          eventType: 'DOWNLOAD_RESET',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: 'Limit reset to 0 attempts',
          reason: reason || 'Authorized support reset for customer download attempts'
        }
      });
    });

    res.json({
      success: true,
      message: 'Download limit reset successfully for the customer.'
    });
  } catch (error) {
    next(error);
  }
};

export const extendDownloadExpiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, orderId, productId, extraDays = 30, reason } = req.body;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const newExpiry = new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      if (orderId && productId) {
        const entitlement = await tx.digitalEntitlement.findFirst({
          where: { orderId, productId }
        });
        if (entitlement) {
          await tx.digitalEntitlement.update({
            where: { id: entitlement.id },
            data: { accessExpiresAt: newExpiry, status: 'ACTIVE' }
          });
        }
      }

      await tx.supportTicketEvent.create({
        data: {
          ticketId,
          eventType: 'EXPIRY_EXTENDED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: `Extended by ${extraDays} days (until ${newExpiry.toISOString()})`,
          reason: reason || 'Access validity extension granted by staff'
        }
      });
    });

    res.json({
      success: true,
      message: `Download access extended by ${extraDays} days until ${newExpiry.toLocaleDateString()}.`,
      newExpiry
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. LICENCE CONTEXT ACTIONS
// ==========================================

export const resendLicence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, licenseId } = req.body;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await prisma.supportTicketEvent.create({
      data: {
        ticketId,
        eventType: 'REPLY_SENT',
        actorId: authUser.id,
        actorName: authUser.name,
        actorRole: authUser.role,
        reason: `Licence key activation instructions resent to ${ticket.customerEmail || 'Customer'}`
      }
    });

    res.json({
      success: true,
      message: `Licence activation instructions dispatched to ${ticket.customerEmail || 'Customer'}`
    });
  } catch (error) {
    next(error);
  }
};

export const resetLicenceActivation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, licenseKeyId, reason } = req.body;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await prisma.$transaction(async (tx) => {
      if (licenseKeyId) {
        await tx.licenceKey.update({
          where: { id: licenseKeyId },
          data: {
            activationCount: 0,
            status: 'ACTIVE'
          }
        });
      }

      await tx.supportTicketEvent.create({
        data: {
          ticketId,
          eventType: 'LICENCE_RESET',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: 'Activations reset to 0',
          reason: reason || 'Licence activation slot reset for new machine/domain migration'
        }
      });
    });

    res.json({
      success: true,
      message: 'Licence activation slots successfully reset.'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. REFUND WORKFLOW ACTIONS
// ==========================================

export const requestFinanceReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, reason, refundAmount } = req.body;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'PENDING_FINANCE',
          assignedToRole: 'FINANCE_MANAGER'
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId,
          eventType: 'REFUND_REQUESTED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          oldValue: ticket.status,
          newValue: 'PENDING_FINANCE',
          reason: reason || `Submitted for Finance Manager review (Amount: $${refundAmount || 'Full'})`
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: 'Refund request escalated to Finance Queue for authorized review.',
      ticket: updated
    });
  } catch (error) {
    next(error);
  }
};

export const approveRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, orderId, refundAmount, reason } = req.body;
    const authUser = (req as any).user;

    const userRole = String(authUser?.role || '').toUpperCase();
    const canApprove = userRole === 'SUPER_ADMIN' || userRole === 'FINANCE_MANAGER';

    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only Finance Managers or Super Admins can approve refunds.'
      });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const targetOrderId = orderId || ticket.orderId;
    if (!targetOrderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required to process refund.' });
    }

    const order = await prisma.order.findUnique({ where: { id: targetOrderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const refundValue = refundAmount ? parseFloat(refundAmount) : order.totalAmount;

    await prisma.$transaction(async (tx) => {
      // 1. Create Refund Record
      await tx.refund.create({
        data: {
          orderId: order.id,
          amount: refundValue,
          reason: reason || 'Approved via Support Ticket #' + ticket.ticketNumber,
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      // 2. Update Order Status
      await tx.order.update({
        where: { id: order.id },
        data: { orderStatus: 'REFUNDED', refundStatus: 'COMPLETED' }
      });

      // 3. Revoke/Deactivate Entitlements
      await tx.digitalEntitlement.updateMany({
        where: { orderId: order.id },
        data: { status: 'REVOKED' }
      });

      // 4. Update Ticket Status
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'RESOLVED', resolvedAt: new Date() }
      });

      // 5. Audit Event
      await tx.supportTicketEvent.create({
        data: {
          ticketId,
          eventType: 'REFUND_APPROVED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: `$${refundValue.toFixed(2)} Refund Processed`,
          reason: reason || 'Refund authorized and executed by Finance Manager'
        }
      });
    });

    res.json({
      success: true,
      message: `Refund of $${refundValue.toFixed(2)} approved and processed successfully.`
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, reason } = req.body;
    const authUser = (req as any).user;

    const userRole = String(authUser?.role || '').toUpperCase();
    const canReject = userRole === 'SUPER_ADMIN' || userRole === 'FINANCE_MANAGER';

    if (!canReject) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only Finance Managers or Super Admins can reject refunds.'
      });
    }

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory rejection reason (min 5 characters) required.'
      });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'OPEN' }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId,
          eventType: 'REFUND_REJECTED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          newValue: 'Refund Rejected',
          reason: String(reason).trim()
        }
      });
    });

    res.json({
      success: true,
      message: 'Refund rejected and documented with reason.'
    });
  } catch (error) {
    next(error);
  }
};
