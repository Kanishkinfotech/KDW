import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50 for performance
    });
    
    // Map id to _id for frontend compatibility if needed, though frontend should use id
    const mapped = notifications.map(n => ({
      ...n,
      _id: n.id
    }));

    res.status(200).json({ success: true, data: mapped, notifications: mapped });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Mark a notification as read
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

// Delete a notification
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
