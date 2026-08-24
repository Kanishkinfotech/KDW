import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';

export const updateInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type as string;
    const id = req.params.id as string;
    let { sku, stock, minStock } = req.body;

    if (!id || (type !== 'product' && type !== 'bundle')) {
      return res.status(400).json({ success: false, message: 'Invalid entity type or ID.' });
    }

    // Convert stock to null if it's meant to be unlimited (frontend sends empty string or null)
    let finalStock: number | null = stock === '' || stock === null ? null : parseInt(stock, 10);
    if (finalStock !== null && isNaN(finalStock)) {
      finalStock = null;
    }
    
    // Prevent negative stock
    if (finalStock !== null && finalStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
    }

    let finalMinStock = parseInt(minStock, 10);
    if (isNaN(finalMinStock) || finalMinStock < 0) {
      finalMinStock = 0;
    }
    
    const finalSku = typeof sku === 'string' ? sku : null;

    let updatedEntity;

    if (type === 'product') {
      updatedEntity = await prisma.product.update({
        where: { id },
        data: {
          sku: finalSku,
          stock: finalStock,
          minStock: finalMinStock,
        }
      });
    } else if (type === 'bundle') {
      updatedEntity = await prisma.bundle.update({
        where: { id },
        data: {
          sku: finalSku,
          stock: finalStock,
          minStock: finalMinStock,
        }
      });
    }

    return res.status(200).json({ success: true, data: updatedEntity, message: 'Inventory updated successfully.' });

  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }
    next(error);
  }
};
