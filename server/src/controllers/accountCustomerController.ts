import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { CustomerService } from '../services/customerService';

export const claimGuestOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await CustomerService.claimGuestPurchases(user.id);
    res.json(result);
  } catch (error: any) {
    next(error);
  }
};

export const updateAccountConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { consentType, status } = req.body;

    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const consent = await prisma.customerConsent.upsert({
      where: { id: `${user.id}_${consentType}` },
      update: {
        status: String(status).toUpperCase(),
        withdrawnAt: status === 'OPTED_OUT' || status === 'WITHDRAWN' ? new Date() : null
      },
      create: {
        id: `${user.id}_${consentType}`,
        customerId: user.id,
        consentType: String(consentType).toUpperCase(),
        status: String(status).toUpperCase(),
        source: 'ACCOUNT_PORTAL',
        withdrawnAt: status === 'OPTED_OUT' || status === 'WITHDRAWN' ? new Date() : null
      }
    });

    res.json({ success: true, message: 'Consent preferences saved', consent });
  } catch (error) {
    next(error);
  }
};

export const createDataRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { requestType, reason } = req.body;

    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const request = await prisma.customerDataRequest.create({
      data: {
        customerId: user.id,
        requestType: String(requestType).toUpperCase(),
        reason: reason || 'Submitted via customer account portal',
        requestedBy: user.email,
        status: 'SUBMITTED'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Your privacy data request has been logged. Our compliance team will process it promptly.',
      request
    });
  } catch (error) {
    next(error);
  }
};
