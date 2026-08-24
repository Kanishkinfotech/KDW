import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAdminAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

// Get all coupons (Admin)
export const getAdminCoupons = async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (search) {
      where.code = { contains: search as string, mode: 'insensitive' };
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { id: 'desc' }, // Assuming newer coupons have higher IDs or could use a createdAt field if added later
        skip,
        take: limitNumber
      }),
      prisma.coupon.count({ where })
    ]);

    res.status(200).json({
      success: true,
      coupons,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching admin coupons:', error);
    res.status(500).json({ success: false, message: 'Server error fetching coupons' });
  }
};

// Create a coupon (Admin)
export const createAdminCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, expiryDate, usageLimit, status } = req.body;
    const adminId = (req as any).user?.id || 'system';

    const existingCoupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        status: status || 'ACTIVE',
      }
    });

    await logAdminAction(adminId, 'CREATE_COUPON', 'Coupon', `Created coupon ${coupon.code}`);

    res.status(201).json({ success: true, coupon, message: 'Coupon created successfully' });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: 'Server error creating coupon' });
  }
};

// Update a coupon (Admin)
export const updateAdminCoupon = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { discountType, discountValue, expiryDate, usageLimit, status } = req.body;
    const adminId = (req as any).user?.id || 'system';

    const existingCoupon = await prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit, 10) : null) : undefined,
        status,
      }
    });

    await logAdminAction(adminId, 'UPDATE_COUPON', 'Coupon', `Updated coupon ${updatedCoupon.code}`);

    res.status(200).json({ success: true, coupon: updatedCoupon, message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: 'Server error updating coupon' });
  }
};

// Delete a coupon (Admin)
export const deleteAdminCoupon = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const adminId = (req as any).user?.id || 'system';

    const existingCoupon = await prisma.coupon.findUnique({ where: { id } });
    if (!existingCoupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await prisma.coupon.delete({ where: { id } });

    await logAdminAction(adminId, 'DELETE_COUPON', 'Coupon', `Deleted coupon ${existingCoupon.code}`);

    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Server error deleting coupon' });
  }
};

// Validate Coupon (Public Checkout)
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code. Please check and try again.' });
    }

    if (coupon.status !== 'ACTIVE' && coupon.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This coupon is currently inactive.' });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
    }

    const discountText = coupon.discountType === 'PERCENTAGE' || (coupon as any).discountType === 'PERCENT'
      ? `${coupon.discountValue}%`
      : `₹${coupon.discountValue}`;

    return res.status(200).json({
      success: true,
      message: `🎉 Congratulations! ${discountText} discount coupon applied successfully!`,
      data: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountPercentage: coupon.discountType === 'PERCENTAGE' ? coupon.discountValue : coupon.discountValue
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, message: 'Server error validating coupon' });
  }
};

// Get Public Active Coupons list
export const getPublicCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { 
        OR: [
          { status: 'ACTIVE' },
          { status: 'Active' }
        ]
      },
      select: { id: true, code: true, discountType: true, discountValue: true, expiryDate: true }
    });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
};
