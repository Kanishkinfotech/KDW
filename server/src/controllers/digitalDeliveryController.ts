// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { DigitalDeliveryService } from '../services/digitalDeliveryService';

/**
 * Admin: List all Digital Deliveries with filtering, search, and pagination
 */
export const getAdminDigitalDeliveries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      search, 
      deliveryStatus, 
      emailStatus, 
      page = 1, 
      limit = 30 
    } = req.query;

    const whereClause: any = {};

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      whereClause.OR = [
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
        { bundle: { title: { contains: q, mode: 'insensitive' } } }
      ];
    }

    if (deliveryStatus && deliveryStatus !== 'ALL') {
      whereClause.deliveryStatus = String(deliveryStatus).toUpperCase();
    }

    if (emailStatus && emailStatus !== 'ALL') {
      whereClause.emailStatus = String(emailStatus).toUpperCase();
    }

    const p = Number(page) || 1;
    const l = Number(limit) || 30;

    const [deliveries, total] = await Promise.all([
      prisma.digitalDelivery.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              paymentStatus: true,
              createdAt: true,
              guestName: true,
              guestEmail: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              thumbnail: true,
              price: true,
              category: { select: { name: true } }
            }
          },
          bundle: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              itemsIncluded: true
            }
          },
          items: {
            orderBy: { displayOrder: 'asc' },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  thumbnail: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l
      }),
      prisma.digitalDelivery.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get deliveries for a specific order
 */
export const getOrderDeliveryDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    const deliveries = await prisma.digitalDelivery.findMany({
      where: { orderId },
      include: {
        product: true,
        bundle: true,
        order: true,
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            product: true
          }
        }
      }
    });

    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Resend Digital Delivery Email to Customer
 */
export const resendOrderDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    const result = await DigitalDeliveryService.resendDeliveryEmail(orderId, (req as any).user);

    if (result.success) {
      res.json({ success: true, message: 'Digital delivery email resent successfully', data: result });
    } else {
      res.status(400).json({ success: false, message: result.message || result.error || 'Failed to resend delivery' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Customer: Secure access to purchased Google Drive links
 */
export const getCustomerDeliveryLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = (req as any).user?.id;
    const { orderId } = req.params;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const deliveries = await DigitalDeliveryService.getCustomerPurchasedDeliveries(customerId, orderId);

    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};
