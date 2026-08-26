import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateSlaDeadlines, evaluateSlaStatus } from './slaEngine';

const prisma = new PrismaClient();

// 1. Get Tickets with Advanced Server-side Filtering & Pagination
export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      priority,
      type,
      assignedToId,
      unassignedOnly,
      overdueOnly,
      slaStatus,
      customerId,
      orderId,
      productId,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = String(status);
    }
    if (priority && priority !== 'ALL') {
      where.priority = String(priority);
    }
    if (type && type !== 'ALL') {
      where.type = String(type);
    }
    if (assignedToId && assignedToId !== 'ALL') {
      where.assignedToId = String(assignedToId);
    }
    if (unassignedOnly === 'true') {
      where.assignedToId = null;
    }
    if (slaStatus && slaStatus !== 'ALL') {
      where.slaStatus = String(slaStatus);
    }
    if (overdueOnly === 'true') {
      where.slaStatus = 'BREACHED';
    }
    if (customerId) {
      where.userId = String(customerId);
    }
    if (orderId) {
      where.orderId = String(orderId);
    }
    if (productId) {
      where.productId = String(productId);
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * take;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take,
        orderBy: { [String(sortBy)]: String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          order: { select: { id: true, orderNumber: true, totalAmount: true, orderStatus: true } },
          product: { select: { id: true, name: true } },
          slaRecord: true,
          satisfaction: true
        }
      }),
      prisma.supportTicket.count({ where })
    ]);

    // Recalculate dynamic SLA badge for active tickets
    const enrichedTickets = tickets.map(t => {
      const calculatedSla = evaluateSlaStatus(t.slaRecord, t.status);
      return {
        ...t,
        slaStatus: calculatedSla
      };
    });

    res.json({
      success: true,
      data: enrichedTickets,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Ticket Details with Unified Context
export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            customerType: true,
            emailVerified: true,
            createdAt: true,
            orders: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: { id: true, orderNumber: true, totalAmount: true, orderStatus: true, createdAt: true }
            }
          }
        },
        order: {
          include: {
            orderItems: {
              include: { product: { select: { id: true, name: true, version: true } } }
            },
            payments: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              select: { id: true, paymentMethod: true, paymentStatus: true, razorpayPaymentId: true, amount: true, currency: true }
            },
            refunds: true
          }
        },
        product: {
          select: { id: true, name: true, version: true, stock: true, status: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, role: true } }
          }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        slaRecord: true,
        customerRequest: true,
        satisfaction: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    // Role-based visibility: support agents see everything, customers only see customer-visible messages
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STORE_MANAGER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'CATALOG_MANAGER'].includes(
      String(authUser?.role || '').toUpperCase()
    );

    if (!isStaff && ticket.userId && ticket.userId !== authUser?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to support ticket' });
    }

    // Filter messages for non-staff customers (never show internal notes)
    const filteredMessages = isStaff
      ? ticket.messages
      : ticket.messages.filter(m => m.visibility === 'CUSTOMER');

    // Dynamic SLA Evaluation
    const currentSlaStatus = evaluateSlaStatus(ticket.slaRecord, ticket.status);

    res.json({
      success: true,
      ticket: {
        ...ticket,
        messages: filteredMessages,
        slaStatus: currentSlaStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Ticket (Admin or Public / Authenticated)
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      subject,
      description,
      type = 'GENERAL',
      category = 'General',
      subcategory,
      priority = 'MEDIUM',
      customerId,
      customerName,
      customerEmail,
      orderId,
      productId,
      assignedToId,
      source = 'PORTAL',
      attachments
    } = req.body;

    const authUser = (req as any).user;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    // Target user / customer
    const targetUserId = customerId || authUser?.id || null;
    let finalEmail = customerEmail;
    let finalName = customerName;

    if (targetUserId) {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (user) {
        finalEmail = finalEmail || user.email;
        finalName = finalName || user.name;
      }
    }

    // Generate unique ticket number
    const count = await prisma.supportTicket.count();
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const ticketNumber = `TKT-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

    // SLA Calculation
    const slaDeadlines = calculateSlaDeadlines(priority);

    // Transactional creation of Ticket + SLA record + Initial Event
    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: {
          ticketNumber,
          userId: targetUserId,
          customerEmail: finalEmail,
          customerName: finalName,
          isGuest: !targetUserId,
          orderId: orderId || null,
          productId: productId || null,
          type,
          category,
          subcategory: subcategory || null,
          priority,
          status: 'NEW',
          source,
          subject,
          description,
          assignedToId: assignedToId || null,
          slaStatus: 'HEALTHY',
          slaFirstResponseDueAt: slaDeadlines.firstResponseDueAt,
          slaResolutionDueAt: slaDeadlines.resolutionDueAt
        }
      });

      // SLA Record
      await tx.supportSlaRecord.create({
        data: {
          ticketId: created.id,
          priority,
          firstResponseTargetMinutes: slaDeadlines.firstResponseTargetMinutes,
          resolutionTargetMinutes: slaDeadlines.resolutionTargetMinutes,
          firstResponseDueAt: slaDeadlines.firstResponseDueAt,
          resolutionDueAt: slaDeadlines.resolutionDueAt
        }
      });

      // Initial Message
      await tx.supportMessage.create({
        data: {
          ticketId: created.id,
          senderId: targetUserId,
          senderType: authUser?.role && authUser.role !== 'CUSTOMER' ? 'AGENT' : 'CUSTOMER',
          senderName: finalName || 'Customer',
          senderEmail: finalEmail || '',
          message: description,
          visibility: 'CUSTOMER',
          channel: 'PORTAL',
          attachmentsJson: attachments ? JSON.parse(JSON.stringify(attachments)) : null
        }
      });

      // Initial Event
      await tx.supportTicketEvent.create({
        data: {
          ticketId: created.id,
          eventType: 'CREATED',
          actorId: authUser?.id || null,
          actorName: authUser?.name || finalName || 'System',
          actorRole: authUser?.role || 'CUSTOMER',
          newValue: 'NEW',
          reason: 'Ticket created via ' + source
        }
      });

      return created;
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// 4. Send Reply to Customer
export const replyTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, attachments } = req.body;
    const id = req.params.id as string;
    const authUser = (req as any).user;

    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { slaRecord: true }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STORE_MANAGER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'CATALOG_MANAGER'].includes(
      String(authUser?.role || '').toUpperCase()
    );

    const senderType = isStaff ? 'AGENT' : 'CUSTOMER';
    const now = new Date();

    const createdMsg = await prisma.$transaction(async (tx) => {
      // 1. Create message
      const msg = await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: authUser?.id || null,
          senderType,
          senderName: authUser?.name || 'Support Staff',
          senderEmail: authUser?.email || '',
          message: String(message).trim(),
          visibility: 'CUSTOMER',
          channel: 'PORTAL',
          attachmentsJson: attachments ? JSON.parse(JSON.stringify(attachments)) : null,
          sentAt: now,
          deliveredAt: now
        }
      });

      // 2. Status & SLA transitions
      const updateData: any = {};
      
      if (isStaff) {
        // If first response from staff, record timestamp
        if (!ticket.firstResponseAt) {
          updateData.firstResponseAt = now;
          if (ticket.slaRecord) {
            await tx.supportSlaRecord.update({
              where: { id: ticket.slaRecord.id },
              data: {
                firstResponseCompletedAt: now,
                isFirstResponseBreached: ticket.slaRecord.firstResponseDueAt
                  ? now > new Date(ticket.slaRecord.firstResponseDueAt)
                  : false
              }
            });
          }
        }
        // Change status to WAITING_FOR_CUSTOMER unless already resolved
        if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
          updateData.status = 'WAITING_FOR_CUSTOMER';
        }
      } else {
        // Customer replied, reopen or move to IN_PROGRESS
        if (ticket.status === 'WAITING_FOR_CUSTOMER' || ticket.status === 'RESOLVED') {
          updateData.status = 'IN_PROGRESS';
        }
      }

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: updateData
      });

      // 3. Log event
      await tx.supportTicketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: 'REPLY_SENT',
          actorId: authUser?.id || null,
          actorName: authUser?.name || 'Staff',
          actorRole: authUser?.role || 'SUPPORT_AGENT',
          newValue: updateData.status || ticket.status,
          reason: `Reply dispatched by ${senderType}`
        }
      });

      return msg;
    });

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      reply: createdMsg
    });
  } catch (error) {
    next(error);
  }
};

// 5. Add Internal Note (Staff only, isolated from customer)
export const addInternalNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { note, attachments } = req.body;
    const id = req.params.id as string;
    const authUser = (req as any).user;

    if (!note || String(note).trim() === '') {
      return res.status(400).json({ success: false, message: 'Internal note cannot be empty' });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const createdNote = await prisma.$transaction(async (tx) => {
      const msg = await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: authUser.id,
          senderType: 'AGENT',
          senderName: authUser.name || 'Staff',
          senderEmail: authUser.email || '',
          message: String(note).trim(),
          visibility: 'INTERNAL_NOTE',
          channel: 'PORTAL',
          attachmentsJson: attachments ? JSON.parse(JSON.stringify(attachments)) : null
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: 'NOTE_ADDED',
          actorId: authUser.id,
          actorName: authUser.name || 'Staff',
          actorRole: authUser.role || 'SUPPORT_AGENT',
          reason: 'Internal observation / investigation note added'
        }
      });

      return msg;
    });

    res.status(201).json({
      success: true,
      message: 'Internal note saved securely',
      note: createdNote
    });
  } catch (error) {
    next(error);
  }
};

// 6. Assign Ticket
export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignedToId, assignedToName, assignedToRole } = req.body;
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id },
        data: {
          assignedToId: assignedToId || null,
          assignedToName: assignedToName || (assignedToId ? 'Assigned Staff' : null),
          assignedToRole: assignedToRole || null,
          status: ticket.status === 'NEW' ? 'OPEN' : ticket.status
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: id,
          eventType: 'ASSIGNED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          oldValue: ticket.assignedToName || 'Unassigned',
          newValue: assignedToName || (assignedToId ? 'Staff' : 'Unassigned'),
          reason: 'Staff re-assignment'
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket: updated
    });
  } catch (error) {
    next(error);
  }
};

// 7. Update Status (State Machine transitions)
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, reason } = req.body;
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const validStatuses = [
      'NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 
      'RESOLVED', 'CLOSED', 'UNASSIGNED', 'ESCALATED', 
      'PENDING_REFUND', 'PENDING_FINANCE', 'PENDING_CATALOG', 
      'DUPLICATE', 'SPAM', 'REOPENED'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { slaRecord: true }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const now = new Date();
    const updateData: any = { status };

    if (status === 'RESOLVED' && !ticket.resolvedAt) {
      updateData.resolvedAt = now;
      if (ticket.slaRecord) {
        await prisma.supportSlaRecord.update({
          where: { id: ticket.slaRecord.id },
          data: {
            resolutionCompletedAt: now,
            isResolutionBreached: ticket.slaRecord.resolutionDueAt
              ? now > new Date(ticket.slaRecord.resolutionDueAt)
              : false
          }
        });
      }
    } else if (status === 'CLOSED' && !ticket.closedAt) {
      updateData.closedAt = now;
    } else if (status === 'REOPENED') {
      updateData.reopenedAt = now;
      updateData.resolvedAt = null;
      updateData.closedAt = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id },
        data: updateData
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: id,
          eventType: 'STATUS_CHANGE',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          oldValue: ticket.status,
          newValue: status,
          reason: reason || `Status transitioned to ${status}`
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      ticket: updated
    });
  } catch (error) {
    next(error);
  }
};

// 8. Update Priority & Recalculate SLA
export const updateTicketPriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { priority, reason } = req.body;
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'PLANNED'];
    if (!priority || !validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority level' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { slaRecord: true }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const newSla = calculateSlaDeadlines(priority, ticket.createdAt);

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id },
        data: {
          priority,
          slaFirstResponseDueAt: newSla.firstResponseDueAt,
          slaResolutionDueAt: newSla.resolutionDueAt
        }
      });

      if (ticket.slaRecord) {
        await tx.supportSlaRecord.update({
          where: { id: ticket.slaRecord.id },
          data: {
            priority,
            firstResponseTargetMinutes: newSla.firstResponseTargetMinutes,
            resolutionTargetMinutes: newSla.resolutionTargetMinutes,
            firstResponseDueAt: newSla.firstResponseDueAt,
            resolutionDueAt: newSla.resolutionDueAt
          }
        });
      }

      await tx.supportTicketEvent.create({
        data: {
          ticketId: id,
          eventType: 'PRIORITY_CHANGE',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          oldValue: ticket.priority,
          newValue: priority,
          reason: reason || 'Priority adjusted by staff'
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: `Priority updated to ${priority}`,
      ticket: updated
    });
  } catch (error) {
    next(error);
  }
};

// 9. Escalate Ticket
export const escalateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetRole = 'SUPER_ADMIN', reason, priorityBump = true } = req.body;
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let newPriority = ticket.priority;
    if (priorityBump) {
      if (ticket.priority === 'LOW') newPriority = 'MEDIUM';
      else if (ticket.priority === 'MEDIUM') newPriority = 'HIGH';
      else if (ticket.priority === 'HIGH') newPriority = 'CRITICAL';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id },
        data: {
          status: 'ESCALATED',
          priority: newPriority,
          assignedToRole: targetRole
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: id,
          eventType: 'ESCALATED',
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          oldValue: ticket.status,
          newValue: 'ESCALATED',
          reason: reason || `Escalated to ${targetRole}`
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: `Ticket escalated to ${targetRole}`,
      ticket: updated
    });
  } catch (error) {
    next(error);
  }
};

// 10. Bulk Operations (Bulk Assign, Bulk Status, Bulk Priority)
export const bulkUpdateTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketIds, action, value, reason } = req.body;
    const authUser = (req as any).user;

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No tickets selected' });
    }

    if (action === 'STATUS') {
      await prisma.$transaction(async (tx) => {
        await tx.supportTicket.updateMany({
          where: { id: { in: ticketIds } },
          data: { status: value }
        });

        for (const tid of ticketIds) {
          await tx.supportTicketEvent.create({
            data: {
              ticketId: tid,
              eventType: 'STATUS_CHANGE',
              actorId: authUser.id,
              actorName: authUser.name,
              actorRole: authUser.role,
              newValue: value,
              reason: reason || 'Bulk status change'
            }
          });
        }
      });
    } else if (action === 'ASSIGN') {
      await prisma.$transaction(async (tx) => {
        await tx.supportTicket.updateMany({
          where: { id: { in: ticketIds } },
          data: { assignedToId: value }
        });

        for (const tid of ticketIds) {
          await tx.supportTicketEvent.create({
            data: {
              ticketId: tid,
              eventType: 'ASSIGNED',
              actorId: authUser.id,
              actorName: authUser.name,
              actorRole: authUser.role,
              newValue: value || 'Unassigned',
              reason: reason || 'Bulk assignment'
            }
          });
        }
      });
    } else if (action === 'PRIORITY') {
      await prisma.$transaction(async (tx) => {
        await tx.supportTicket.updateMany({
          where: { id: { in: ticketIds } },
          data: { priority: value }
        });

        for (const tid of ticketIds) {
          await tx.supportTicketEvent.create({
            data: {
              ticketId: tid,
              eventType: 'PRIORITY_CHANGE',
              actorId: authUser.id,
              actorName: authUser.name,
              actorRole: authUser.role,
              newValue: value,
              reason: reason || 'Bulk priority change'
            }
          });
        }
      });
    }

    res.json({
      success: true,
      message: `Bulk updated ${ticketIds.length} tickets successfully`
    });
  } catch (error) {
    next(error);
  }
};
