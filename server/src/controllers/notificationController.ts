import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory / setting backed templates store or dynamic defaults
let notificationTemplates = [
  {
    id: 'tpl-order-placed',
    name: 'Order Confirmation Email',
    category: 'MAIL',
    subject: 'Your order #{{orderNumber}} has been placed!',
    body: 'Hi {{customerName}}, thank you for your order of {{totalAmount}}. Your digital downloads are now available.',
    channel: 'EMAIL',
    variables: ['orderNumber', 'customerName', 'totalAmount', 'downloadLink'],
    isActive: true
  },
  {
    id: 'tpl-download-ready',
    name: 'Download Tokens Ready',
    category: 'CUSTOMER',
    subject: 'Your digital files are ready to download',
    body: 'Hello {{customerName}}, your secure access token for {{productName}} has been generated.',
    channel: 'IN_APP',
    variables: ['customerName', 'productName', 'expiryHours'],
    isActive: true
  },
  {
    id: 'tpl-admin-dispute',
    name: 'Admin Payment & Dispute Alert',
    category: 'ADMIN',
    subject: 'Action Required: High risk / dispute detected for order #{{orderNumber}}',
    body: 'Attention Admin: A payment dispute or chargeback notice was received for order #{{orderNumber}}.',
    channel: 'ADMIN_DESK',
    variables: ['orderNumber', 'amount', 'disputeReason'],
    isActive: true
  },
  {
    id: 'tpl-admin-low-stock',
    name: 'Admin Licence / Storage Alert',
    category: 'ADMIN',
    subject: 'Storage quota or licence keys running low',
    body: 'Licence key inventory or file health diagnostics alert for item {{itemName}}.',
    channel: 'ADMIN_DESK',
    variables: ['itemName', 'remainingCount'],
    isActive: true
  }
];

// Helper to normalize category
const normalizeCategory = (cat: string | undefined): string | null => {
  if (!cat || cat === 'ALL') return null;
  const upper = cat.toUpperCase();
  if (upper === 'MAIL' || upper === 'EMAIL') return 'MAIL';
  if (upper === 'CUSTOMER' || upper === 'CLIENT') return 'CUSTOMER';
  if (upper === 'ADMIN' || upper === 'SYSTEM' || upper === 'ALERT') return 'ADMIN';
  return upper;
};

// 1. Get all notifications with category classification filter
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { category, type, isRead, search } = req.query;
    
    const where: any = {};

    const classifiedCategory = normalizeCategory(category as string);
    if (classifiedCategory) {
      if (classifiedCategory === 'MAIL') {
        where.OR = [
          { type: { in: ['Mail', 'Email', 'MAIL', 'EMAIL'] } },
          { message: { contains: 'email', mode: 'insensitive' } },
          { message: { contains: 'mail', mode: 'insensitive' } }
        ];
      } else if (classifiedCategory === 'CUSTOMER') {
        where.OR = [
          { type: { in: ['Customer', 'CUSTOMER', 'User', 'Order'] } },
          { message: { contains: 'customer', mode: 'insensitive' } },
          { message: { contains: 'buyer', mode: 'insensitive' } }
        ];
      } else if (classifiedCategory === 'ADMIN') {
        where.OR = [
          { type: { in: ['Admin', 'ADMIN', 'System', 'Alert', 'Security'] } },
          { message: { contains: 'admin', mode: 'insensitive' } },
          { message: { contains: 'system', mode: 'insensitive' } },
          { message: { contains: 'alert', mode: 'insensitive' } }
        ];
      }
    }

    if (type && type !== 'ALL') {
      where.type = String(type);
    }

    if (isRead !== undefined && isRead !== 'ALL') {
      where.isRead = isRead === 'true';
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { message: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Compute classification counts for separate badge views
    const [allCount, mailCount, customerCount, adminCount, unreadCount] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({
        where: {
          OR: [
            { type: { in: ['Mail', 'Email', 'MAIL', 'EMAIL'] } },
            { message: { contains: 'email', mode: 'insensitive' } },
            { message: { contains: 'mail', mode: 'insensitive' } }
          ]
        }
      }),
      prisma.notification.count({
        where: {
          OR: [
            { type: { in: ['Customer', 'CUSTOMER', 'User', 'Order'] } },
            { message: { contains: 'customer', mode: 'insensitive' } },
            { message: { contains: 'buyer', mode: 'insensitive' } }
          ]
        }
      }),
      prisma.notification.count({
        where: {
          OR: [
            { type: { in: ['Admin', 'ADMIN', 'System', 'Alert', 'Security'] } },
            { message: { contains: 'admin', mode: 'insensitive' } },
            { message: { contains: 'system', mode: 'insensitive' } },
            { message: { contains: 'alert', mode: 'insensitive' } }
          ]
        }
      }),
      prisma.notification.count({ where: { isRead: false } })
    ]);

    const mapped = notifications.map(n => {
      // Determine computed classification
      let computedCategory = 'ADMIN';
      const msg = (n.message || '').toLowerCase();
      const t = (n.type || '').toLowerCase();
      if (t.includes('mail') || t.includes('email') || msg.includes('email') || msg.includes('mail')) {
        computedCategory = 'MAIL';
      } else if (t.includes('customer') || t.includes('order') || t.includes('user') || msg.includes('customer')) {
        computedCategory = 'CUSTOMER';
      }

      return {
        ...n,
        _id: n.id,
        classification: computedCategory
      };
    });

    res.status(200).json({
      success: true,
      data: mapped,
      notifications: mapped,
      counts: {
        total: allCount,
        mail: mailCount,
        customer: customerCount,
        admin: adminCount,
        unread: unreadCount,
        templates: notificationTemplates.length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// 2. Create a notification
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, type = 'System', link } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const notification = await prisma.notification.create({
      data: {
        title: title || null,
        message,
        type,
        link: link || null,
        isRead: false
      }
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
};

// 3. Mark a notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

// 4. Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    const classifiedCategory = normalizeCategory(category);
    const where: any = {};
    if (classifiedCategory === 'MAIL') {
      where.OR = [
        { type: { in: ['Mail', 'Email', 'MAIL', 'EMAIL'] } },
        { message: { contains: 'email', mode: 'insensitive' } }
      ];
    } else if (classifiedCategory === 'CUSTOMER') {
      where.OR = [
        { type: { in: ['Customer', 'CUSTOMER', 'User', 'Order'] } },
        { message: { contains: 'customer', mode: 'insensitive' } }
      ];
    } else if (classifiedCategory === 'ADMIN') {
      where.OR = [
        { type: { in: ['Admin', 'ADMIN', 'System', 'Alert'] } },
        { message: { contains: 'system', mode: 'insensitive' } }
      ];
    }

    await prisma.notification.updateMany({
      where,
      data: { isRead: true }
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
};

// 5. Delete a notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    await prisma.notification.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

// 6. Notification Templates CRUD
export const getNotificationTemplates = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: notificationTemplates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load templates' });
  }
};

export const updateNotificationTemplate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, subject, body, isActive } = req.body;
    
    const index = notificationTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    notificationTemplates[index] = {
      ...notificationTemplates[index],
      ...(name !== undefined && { name }),
      ...(subject !== undefined && { subject }),
      ...(body !== undefined && { body }),
      ...(isActive !== undefined && { isActive })
    };

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: notificationTemplates[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};

