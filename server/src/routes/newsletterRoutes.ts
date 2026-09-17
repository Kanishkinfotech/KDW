import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';
import { CustomerService } from '../services/customerService';

const router = Router();

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find or create customer in unified customer directory
    const customer = await CustomerService.findOrCreateGuestCustomer({
      email: normalizedEmail,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Check if consent already granted
    const existingConsent = await prisma.customerConsent.findFirst({
      where: {
        customerId: customer.id,
        consentType: 'MARKETING_EMAIL',
        status: 'OPTED_IN'
      }
    });

    if (existingConsent) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: 'You are already subscribed to the KDW newsletter!'
      });
    }

    // Record marketing email consent
    await prisma.customerConsent.create({
      data: {
        customerId: customer.id,
        consentType: 'MARKETING_EMAIL',
        status: 'OPTED_IN',
        source: 'BANNER',
        consentTextVersion: '1.0',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.status(200).json({
      success: true,
      message: 'Thank you for subscribing! You will receive early access drops and digital resource updates.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
