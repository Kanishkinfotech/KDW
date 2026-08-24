// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';

export const getBundles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundles = await prisma.bundle.findMany({
      include: { products: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bundles });
  } catch (error) {
    next(error);
  }
};

export const getBundleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const bundle = await prisma.bundle.findUnique({ 
      where: { id },
      include: { products: true }
    });
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle not found' });
    res.json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

export const createBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productIds, ...bundleData } = req.body;
    const bundle = await prisma.bundle.create({
      data: {
        ...bundleData,
        products: productIds ? {
          connect: productIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: { products: true }
    });
    res.status(201).json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

export const updateBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { productIds, ...bundleData } = req.body;
    
    // First, clear existing connections if we are updating products
    if (productIds) {
      await prisma.bundle.update({
        where: { id },
        data: { products: { set: [] } }
      });
    }

    const bundle = await prisma.bundle.update({
      where: { id },
      data: {
        ...bundleData,
        ...(productIds && {
          products: {
            connect: productIds.map((pid: string) => ({ id: pid }))
          }
        })
      },
      include: { products: true }
    });
    res.json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

export const deleteBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.bundle.delete({ where: { id } });
    res.json({ success: true, message: 'Bundle deleted' });
  } catch (error) {
    next(error);
  }
};
