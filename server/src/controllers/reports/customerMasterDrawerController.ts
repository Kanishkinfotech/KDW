import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const getCustomerMasterDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = String(req.params.id);
    const isGuest = rawId.startsWith('guest-');
    const guestEmail = isGuest ? rawId.replace('guest-', '') : null;

    if (isGuest && guestEmail) {
      // Find by guest email
      const orders = await prisma.order.findMany({
        where: { guestEmail, paymentStatus: { in: ['PAID', 'COMPLETED'] } },
        include: {
          items: { include: { product: true } },
          payments: true,
          refunds: true,
          digitalEntitlements: true,
          couponRedemptions: { include: { coupon: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

      return res.json({
        success: true,
        customer: {
          id: rawId,
          name: orders[0]?.guestName || 'Guest Buyer',
          email: guestEmail,
          mobile: orders[0]?.guestMobile || 'N/A',
          customerType: 'GUEST',
          status: 'GUEST',
          joinedAt: orders[0]?.createdAt || new Date(),
          totalSpent: Math.round(totalSpent),
          orders,
          payments: orders.flatMap(o => o.payments),
          refunds: orders.flatMap(o => o.refunds),
          entitlements: orders.flatMap(o => o.digitalEntitlements),
          downloads: [],
          coupons: orders.flatMap(o => o.couponRedemptions.map(r => r.coupon)),
          loginLogs: [],
          sessions: [],
          supportTickets: [],
          consents: []
        }
      });
    }

    // Standard User Account lookup
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawId },
          { email: rawId }
        ]
      },
      include: {
        orders: {
          include: {
            items: { include: { product: true } },
            payments: true,
            refunds: true,
            digitalEntitlements: true,
            couponRedemptions: { include: { coupon: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: { orderBy: { createdAt: 'desc' } },
        digitalEntitlements: {
          include: { product: true, licence: true },
          orderBy: { createdAt: 'desc' }
        },
        downloadLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        loginLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        sessions: { where: { isRevoked: false }, orderBy: { lastSeenAt: 'desc' } },
        supportTickets: { orderBy: { createdAt: 'desc' } },
        consents: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    const totalSpent = user.orders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      customer: {
        id: user.id,
        name: user.name || 'Valued Customer',
        email: user.email,
        mobile: user.mobile || 'N/A',
        customerType: 'ACCOUNT',
        status: user.status,
        joinedAt: user.createdAt,
        totalSpent: Math.round(totalSpent),
        orders: user.orders,
        payments: user.payments,
        refunds: user.orders.flatMap(o => o.refunds),
        entitlements: user.digitalEntitlements,
        downloads: user.downloadLogs,
        coupons: user.orders.flatMap(o => o.couponRedemptions.map(r => r.coupon)),
        loginLogs: user.loginLogs,
        sessions: user.sessions,
        supportTickets: user.supportTickets,
        consents: user.consents
      }
    });
  } catch (error) {
    next(error);
  }
};
