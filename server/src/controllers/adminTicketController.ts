import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateSlaDeadlines } from './support/slaEngine';

const prisma = new PrismaClient();

// Allowed agent roles (case-insensitive check)
const ALLOWED_AGENT_ROLES = [
  'admin',
  'super_admin',
  'manager',
  'staff',
  'support_agent',
  'support agent',
  'store manager',
  'super admin',
  'ADMIN',
  'SUPER_ADMIN',
  'MANAGER',
  'STAFF',
  'SUPPORT_AGENT'
];

/**
 * Normalizes input status to standard DB status or group filter
 */
function normalizeStatusFilter(statusStr: string) {
  const s = statusStr.trim().toLowerCase();
  if (s === 'all') return null;
  if (s === 'open') return { in: ['OPEN', 'NEW', 'open', 'new'] };
  if (s === 'pending') {
    return {
      in: [
        'PENDING',
        'WAITING_FOR_CUSTOMER',
        'IN_PROGRESS',
        'PENDING_FINANCE',
        'PENDING_REFUND',
        'PENDING_CATALOG',
        'UNDER_REVIEW',
        'pending',
        'waiting_for_customer'
      ]
    };
  }
  if (s === 'resolved') return { in: ['RESOLVED', 'resolved'] };
  if (s === 'closed') return { in: ['CLOSED', 'closed'] };
  return s.toUpperCase();
}

/**
 * Normalizes input priority to standard DB priority or group filter
 */
function normalizePriorityFilter(priorityStr: string) {
  const p = priorityStr.trim().toLowerCase();
  if (p === 'all') return null;
  if (p === 'low') return { in: ['LOW', 'low'] };
  if (p === 'normal' || p === 'medium') return { in: ['NORMAL', 'MEDIUM', 'normal', 'medium'] };
  if (p === 'high') return { in: ['HIGH', 'high'] };
  if (p === 'urgent' || p === 'critical') return { in: ['URGENT', 'CRITICAL', 'urgent', 'critical'] };
  return p.toUpperCase();
}

/**
 * 1. GET /api/admin/tickets
 * Return a paginated ticket queue with server-side filtering
 */
export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      priority,
      categoryId,
      assignedAgentId,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const authUser = (req as any).user;
    const where: any = {};

    // Status filter
    if (status && String(status).trim() !== '' && String(status).toUpperCase() !== 'ALL') {
      const statusCondition = normalizeStatusFilter(String(status));
      if (statusCondition) {
        where.status = statusCondition;
      }
    }

    // Priority filter
    if (priority && String(priority).trim() !== '' && String(priority).toUpperCase() !== 'ALL') {
      const priorityCondition = normalizePriorityFilter(String(priority));
      if (priorityCondition) {
        where.priority = priorityCondition;
      }
    }

    // Category filter
    if (categoryId && String(categoryId).trim() !== '' && String(categoryId).toUpperCase() !== 'ALL') {
      where.OR = [
        { category: String(categoryId) },
        { subcategory: String(categoryId) }
      ];
    }

    // Assignment filter
    if (assignedAgentId && String(assignedAgentId).trim() !== '' && String(assignedAgentId).toUpperCase() !== 'ALL') {
      const assignStr = String(assignedAgentId).trim().toLowerCase();
      if (assignStr === 'unassigned') {
        where.assignedToId = null;
      } else if (assignStr === 'me') {
        where.assignedToId = authUser?.id || 'NO_AUTH_USER';
      } else {
        where.assignedToId = String(assignedAgentId).trim();
      }
    }

    // Search filter across subject, ticketNumber, customerEmail, customerName, description
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
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true } },
          order: { select: { id: true, orderNumber: true } },
          _count: { select: { messages: true } }
        }
      }),
      prisma.supportTicket.count({ where })
    ]);

    // Gather unique assigned agent IDs to populate agent details if needed
    const agentIds = Array.from(new Set(tickets.map(t => t.assignedToId).filter(Boolean))) as string[];
    let agentsMap: Record<string, { id: string; name: string; email: string }> = {};
    if (agentIds.length > 0) {
      const agentUsers = await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, email: true }
      });
      agentsMap = agentUsers.reduce((acc, a) => {
        acc[a.id] = a;
        return acc;
      }, {} as Record<string, { id: string; name: string; email: string }>);
    }

    const formattedTickets = tickets.map(t => {
      const agent = t.assignedToId && agentsMap[t.assignedToId]
        ? agentsMap[t.assignedToId]
        : t.assignedToId
        ? { id: t.assignedToId, name: t.assignedToName || 'Staff Member', email: '' }
        : null;

      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        type: t.type,
        category: t.category,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        customer: t.user || {
          id: t.userId || null,
          name: t.customerName || 'Customer',
          email: t.customerEmail || ''
        },
        user: t.user || {
          id: t.userId || null,
          name: t.customerName || 'Customer',
          email: t.customerEmail || ''
        },
        assignedAgent: agent,
        assignedToId: t.assignedToId,
        assignedToName: agent?.name || t.assignedToName || null,
        product: t.product || null,
        order: t.order || null,
        messageCount: t._count.messages
      };
    });

    res.json({
      success: true,
      data: formattedTickets,
      tickets: formattedTickets,
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

/**
 * 2. GET /api/admin/tickets/stats
 * Return real database counts for all ticket statistics
 */
export const getTicketStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const currentUserId = authUser?.id || '';

    const nonResolvedClosedStatuses = [
      'NEW',
      'OPEN',
      'PENDING',
      'WAITING_FOR_CUSTOMER',
      'IN_PROGRESS',
      'PENDING_FINANCE',
      'PENDING_REFUND',
      'PENDING_CATALOG',
      'UNDER_REVIEW',
      'ESCALATED',
      'REOPENED',
      'new',
      'open',
      'pending',
      'in_progress'
    ];

    const [
      total,
      open,
      pending,
      resolved,
      closed,
      unassigned,
      urgent,
      mine
    ] = await Promise.all([
      // Total
      prisma.supportTicket.count(),
      // Open
      prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'NEW', 'open', 'new'] } }
      }),
      // Pending
      prisma.supportTicket.count({
        where: {
          status: {
            in: [
              'PENDING',
              'WAITING_FOR_CUSTOMER',
              'IN_PROGRESS',
              'PENDING_FINANCE',
              'PENDING_REFUND',
              'PENDING_CATALOG',
              'UNDER_REVIEW',
              'pending',
              'waiting_for_customer'
            ]
          }
        }
      }),
      // Resolved
      prisma.supportTicket.count({
        where: { status: { in: ['RESOLVED', 'resolved'] } }
      }),
      // Closed
      prisma.supportTicket.count({
        where: { status: { in: ['CLOSED', 'closed'] } }
      }),
      // Unassigned & not resolved/closed
      prisma.supportTicket.count({
        where: {
          assignedToId: null,
          status: { in: nonResolvedClosedStatuses }
        }
      }),
      // Urgent & not resolved/closed
      prisma.supportTicket.count({
        where: {
          priority: { in: ['URGENT', 'CRITICAL', 'urgent', 'critical'] },
          status: { in: nonResolvedClosedStatuses }
        }
      }),
      // Mine & not resolved/closed
      currentUserId
        ? prisma.supportTicket.count({
            where: {
              assignedToId: currentUserId,
              status: { in: nonResolvedClosedStatuses }
            }
          })
        : 0
    ]);

    const stats = {
      total,
      open,
      pending,
      resolved,
      closed,
      unassigned,
      urgent,
      mine
    };

    res.json({
      success: true,
      stats,
      ...stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/admin/tickets/agents
 * Return active staff members eligible for ticket assignment
 */
export const getAgents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    const eligibleAgents = allUsers.filter(u => {
      const roleStr = String(u.role || '').toLowerCase();
      return ALLOWED_AGENT_ROLES.some(r => r.toLowerCase() === roleStr);
    });

    res.json({
      success: true,
      agents: eligibleAgents,
      data: eligibleAgents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/admin/tickets/:id
 * Return complete ticket workspace including customer info, messages, agent, product, and related tickets
 */
export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

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
            createdAt: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            orderStatus: true,
            createdAt: true
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Lookup assigned agent details
    let assignedAgent = null;
    if (ticket.assignedToId) {
      const agentUser = await prisma.user.findUnique({
        where: { id: ticket.assignedToId },
        select: { id: true, name: true, email: true, role: true }
      });
      if (agentUser) {
        assignedAgent = agentUser;
      } else {
        assignedAgent = {
          id: ticket.assignedToId,
          name: ticket.assignedToName || 'Assigned Staff',
          email: '',
          role: ticket.assignedToRole || 'STAFF'
        };
      }
    }

    // Customer details fallback
    const customer = ticket.user || {
      id: ticket.userId || null,
      name: ticket.customerName || 'Customer',
      email: ticket.customerEmail || '',
      createdAt: ticket.createdAt
    };

    // Format messages for admin (including isInternal flag and attachments)
    const formattedMessages = ticket.messages.map(m => ({
      id: m.id,
      message: m.message,
      isInternal: m.visibility === 'INTERNAL_NOTE',
      createdAt: m.createdAt,
      sender: m.sender || {
        id: m.senderId || null,
        name: m.senderName || (m.senderType === 'AGENT' ? 'Staff' : 'Customer'),
        role: m.senderType === 'AGENT' ? 'ADMIN' : 'CUSTOMER'
      },
      attachments: m.attachmentsJson ? JSON.parse(JSON.stringify(m.attachmentsJson)) : []
    }));

    // Find up to 5 related tickets for this customer (excluding current ticket)
    const customerIdCondition = ticket.userId
      ? { userId: ticket.userId }
      : ticket.customerEmail
      ? { customerEmail: { equals: ticket.customerEmail, mode: 'insensitive' as const } }
      : null;

    let relatedTickets: any[] = [];
    if (customerIdCondition) {
      relatedTickets = await prisma.supportTicket.findMany({
        where: {
          ...customerIdCondition,
          id: { not: ticket.id }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          updatedAt: true
        }
      });
    }

    const responseData = {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      type: ticket.type,
      category: ticket.category,
      orderId: ticket.orderId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      customer,
      assignedAgent,
      assignedToId: ticket.assignedToId,
      assignedToName: assignedAgent?.name || ticket.assignedToName || null,
      product: ticket.product || null,
      order: ticket.order || null,
      messages: formattedMessages,
      relatedTickets
    };

    res.json({
      success: true,
      ticket: responseData,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/admin/tickets/:id/reply
 * Post a public agent reply or internal note
 */
export const replyTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { message, isInternal = false, attachments } = req.body;
    const authUser = (req as any).user;

    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }]
      },
      include: { slaRecord: true }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Get agent profile info
    const agentName = authUser?.name || 'Support Staff';
    const agentEmail = authUser?.email || '';
    const now = new Date();
    const visibility = isInternal ? 'INTERNAL_NOTE' : 'CUSTOMER';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create message
      const createdMsg = await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: authUser?.id || null,
          senderType: 'AGENT',
          senderName: agentName,
          senderEmail: agentEmail,
          message: String(message).trim(),
          visibility,
          channel: 'PORTAL',
          attachmentsJson: attachments ? JSON.parse(JSON.stringify(attachments)) : null,
          sentAt: now,
          deliveredAt: now
        },
        include: {
          sender: { select: { id: true, name: true, role: true } }
        }
      });

      // 2. Status & SLA transitions
      const updateData: any = { updatedAt: now };

      // If public reply and ticket is currently OPEN or NEW, transition to pending (WAITING_FOR_CUSTOMER)
      if (!isInternal) {
        const currentUpper = String(ticket.status || '').toUpperCase();
        if (currentUpper === 'OPEN' || currentUpper === 'NEW') {
          updateData.status = 'WAITING_FOR_CUSTOMER';
        }

        // Record first response timestamp if not already set
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
      }

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: updateData
      });

      // 3. Log event
      await tx.supportTicketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: isInternal ? 'NOTE_ADDED' : 'REPLY_SENT',
          actorId: authUser?.id || null,
          actorName: agentName,
          actorRole: authUser?.role || 'ADMIN',
          newValue: updateData.status || ticket.status,
          reason: isInternal ? 'Internal note added' : 'Public agent reply sent'
        }
      });

      return createdMsg;
    });

    res.status(201).json({
      success: true,
      message: isInternal ? 'Internal note added' : 'Reply sent successfully',
      reply: {
        id: result.id,
        message: result.message,
        isInternal: result.visibility === 'INTERNAL_NOTE',
        createdAt: result.createdAt,
        sender: result.sender || {
          id: authUser?.id || null,
          name: agentName,
          role: authUser?.role || 'ADMIN'
        },
        attachments: result.attachmentsJson ? JSON.parse(JSON.stringify(result.attachmentsJson)) : []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. PATCH /api/admin/tickets/:id/status
 * Update ticket status
 */
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, reason } = req.body;
    const authUser = (req as any).user;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const s = status.trim().toLowerCase();
    let targetStatus = '';

    if (s === 'open' || s === 'new') {
      targetStatus = 'OPEN';
    } else if (s === 'pending' || s === 'waiting_for_customer' || s === 'in_progress') {
      targetStatus = 'WAITING_FOR_CUSTOMER';
    } else if (s === 'resolved') {
      targetStatus = 'RESOLVED';
    } else if (s === 'closed') {
      targetStatus = 'CLOSED';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values are: open, pending, resolved, closed.'
      });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }]
      },
      include: { slaRecord: true }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const now = new Date();
    const updateData: any = { status: targetStatus, updatedAt: now };

    if (targetStatus === 'RESOLVED' && !ticket.resolvedAt) {
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
    } else if (targetStatus === 'CLOSED' && !ticket.closedAt) {
      updateData.closedAt = now;
    } else if (targetStatus === 'OPEN' && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      updateData.reopenedAt = now;
      updateData.resolvedAt = null;
      updateData.closedAt = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id: ticket.id },
        data: updateData
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: 'STATUS_CHANGE',
          actorId: authUser?.id || null,
          actorName: authUser?.name || 'Admin',
          actorRole: authUser?.role || 'ADMIN',
          oldValue: ticket.status,
          newValue: targetStatus,
          reason: reason || `Status updated to ${targetStatus}`
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: `Status updated to ${targetStatus}`,
      ticket: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. PATCH /api/admin/tickets/:id/priority
 * Update ticket priority
 */
export const updatePriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { priority, reason } = req.body;
    const authUser = (req as any).user;

    if (!priority || typeof priority !== 'string') {
      return res.status(400).json({ success: false, message: 'Priority is required' });
    }

    const p = priority.trim().toLowerCase();
    let targetPriority = '';

    if (p === 'low') {
      targetPriority = 'LOW';
    } else if (p === 'normal' || p === 'medium') {
      targetPriority = 'MEDIUM';
    } else if (p === 'high') {
      targetPriority = 'HIGH';
    } else if (p === 'urgent' || p === 'critical') {
      targetPriority = 'CRITICAL';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Allowed values are: low, normal, high, urgent.'
      });
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }]
      },
      include: { slaRecord: true }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const newSla = calculateSlaDeadlines(targetPriority, ticket.createdAt);

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          priority: targetPriority,
          slaFirstResponseDueAt: newSla.firstResponseDueAt,
          slaResolutionDueAt: newSla.resolutionDueAt,
          updatedAt: new Date()
        }
      });

      if (ticket.slaRecord) {
        await tx.supportSlaRecord.update({
          where: { id: ticket.slaRecord.id },
          data: {
            priority: targetPriority,
            firstResponseTargetMinutes: newSla.firstResponseTargetMinutes,
            resolutionTargetMinutes: newSla.resolutionTargetMinutes,
            firstResponseDueAt: newSla.firstResponseDueAt,
            resolutionDueAt: newSla.resolutionDueAt
          }
        });
      }

      await tx.supportTicketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: 'PRIORITY_CHANGE',
          actorId: authUser?.id || null,
          actorName: authUser?.name || 'Admin',
          actorRole: authUser?.role || 'ADMIN',
          oldValue: ticket.priority,
          newValue: targetPriority,
          reason: reason || `Priority updated to ${targetPriority}`
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: `Priority updated to ${targetPriority}`,
      ticket: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. PATCH /api/admin/tickets/:id/assign
 * Assign or unassign agent for ticket
 */
export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { agentId } = req.body;
    const authUser = (req as any).user;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }]
      }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let assignedAgent: any = null;

    if (agentId !== null && agentId !== undefined && String(agentId).trim() !== '') {
      // 1. Verify agent exists
      const agentUser = await prisma.user.findUnique({
        where: { id: String(agentId).trim() },
        select: { id: true, name: true, email: true, role: true, status: true }
      });

      if (!agentUser) {
        return res.status(400).json({ success: false, message: 'Assigned agent user does not exist' });
      }

      // 2. Verify agent has allowed staff/admin role
      const roleStr = String(agentUser.role || '').toLowerCase();
      const isAllowed = ALLOWED_AGENT_ROLES.some(r => r.toLowerCase() === roleStr);
      if (!isAllowed) {
        return res.status(400).json({
          success: false,
          message: 'Selected user does not have permission to receive support tickets'
        });
      }

      // 3. Verify agent is active
      if (agentUser.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: 'Selected agent user is inactive' });
      }

      assignedAgent = agentUser;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          assignedToId: assignedAgent ? assignedAgent.id : null,
          assignedToName: assignedAgent ? assignedAgent.name : null,
          assignedToRole: assignedAgent ? assignedAgent.role : null,
          updatedAt: new Date()
        }
      });

      await tx.supportTicketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: 'ASSIGNED',
          actorId: authUser?.id || null,
          actorName: authUser?.name || 'Admin',
          actorRole: authUser?.role || 'ADMIN',
          oldValue: ticket.assignedToName || 'Unassigned',
          newValue: assignedAgent ? assignedAgent.name : 'Unassigned',
          reason: assignedAgent ? `Assigned to ${assignedAgent.name}` : 'Unassigned from ticket'
        }
      });

      return t;
    });

    res.json({
      success: true,
      message: assignedAgent ? `Assigned to ${assignedAgent.name}` : 'Ticket unassigned',
      ticket: updated,
      assignedAgent
    });
  } catch (error) {
    next(error);
  }
};
