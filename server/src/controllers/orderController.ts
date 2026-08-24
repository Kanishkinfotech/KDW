import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAdminAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Get all orders (Admin)
export const getAdminOrders = async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (status) {
      where.orderStatus = status as string;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { guestName: { contains: search as string, mode: 'insensitive' } },
        { guestEmail: { contains: search as string, mode: 'insensitive' } },
        { customer: { name: { contains: search as string, mode: 'insensitive' } } },
        { customer: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { name: true, email: true }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.order.count({ where })
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

// Get single order details (Admin)
export const getAdminOrderById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, mobile: true, profileImage: true }
        },
        items: {
          include: {
            product: { select: { name: true, thumbnail: true } },
            bundle: { select: { title: true, coverImage: true } }
          }
        },
        purchases: true,
        supportTickets: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error fetching admin order details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order' });
  }
};

// Update order status (Admin)
export const updateAdminOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { orderStatus, paymentStatus } = req.body;
    
    // Explicitly casting user as any because Express types might not know about user
    const adminId = (req as any).user?.id || 'system';

    const currentOrder = await prisma.order.findUnique({ 
      where: { id },
      include: { purchases: true }
    });
    if (!currentOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const dataToUpdate: any = {};
    if (orderStatus && orderStatus !== currentOrder.orderStatus) {
      dataToUpdate.orderStatus = orderStatus;
    }
    if (paymentStatus && paymentStatus !== currentOrder.paymentStatus) {
      dataToUpdate.paymentStatus = paymentStatus;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(200).json({ success: true, order: currentOrder, message: 'No changes made' });
    }

    const isRefund = orderStatus === 'REFUNDED' || paymentStatus === 'REFUNDED';

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: dataToUpdate
      });

      if (isRefund) {
        // Revoke associated digital entitlements
        await tx.purchase.updateMany({
          where: { orderId: id },
          data: { accessStatus: 'REVOKED' }
        });

        // Invalidate active download tokens for revoked purchases
        const purchases = await tx.purchase.findMany({ where: { orderId: id }, select: { id: true } });
        const purchaseIds = purchases.map(p => p.id);
        if (purchaseIds.length > 0) {
          await tx.accessToken.deleteMany({
            where: { purchaseId: { in: purchaseIds } }
          });
        }
      }

      return updated;
    });

    const actionType = isRefund ? 'REFUND_ORDER' : 'UPDATE_ORDER';
    await logAdminAction(adminId, actionType, 'Order', `Updated order ${updatedOrder.orderNumber} status to ${orderStatus || currentOrder.orderStatus} (Refund/Revocation: ${isRefund})`);

    res.status(200).json({ success: true, order: updatedOrder, message: isRefund ? 'Order refunded and digital entitlements revoked' : 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server error updating order' });
  }
};

// Process Refund & Revoke Access (Admin)
export const refundAdminOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const adminId = (req as any).user?.id || 'system';

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          paymentStatus: 'REFUNDED',
          orderStatus: 'REFUNDED'
        }
      });

      // Revoke entitlements
      await tx.purchase.updateMany({
        where: { orderId: id },
        data: { accessStatus: 'REVOKED' }
      });

      // Delete active access tokens
      const purchases = await tx.purchase.findMany({ where: { orderId: id }, select: { id: true } });
      const purchaseIds = purchases.map(p => p.id);
      if (purchaseIds.length > 0) {
        await tx.accessToken.deleteMany({
          where: { purchaseId: { in: purchaseIds } }
        });
      }

      return updated;
    });

    await logAdminAction(adminId, 'REFUND_ORDER', 'Order', `Refunded order ${order.orderNumber} and revoked digital access`);

    res.status(200).json({ success: true, order: updatedOrder, message: 'Order refunded and access revoked successfully' });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ success: false, message: 'Server error processing refund' });
  }
};
