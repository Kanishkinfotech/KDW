import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db';

export const getInventoryList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        status: true,
        price: true,
        thumbnail: true,
        category: {
          select: { name: true }
        },
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const bundles = await prisma.bundle.findMany({
      select: {
        id: true,
        title: true,
        sku: true,
        stock: true,
        minStock: true,
        status: true,
        price: true,
        coverImage: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const inventoryItems = [
      ...products.map(p => ({
        id: p.id,
        name: p.name,
        type: 'product',
        sku: p.sku || `SKU-PRD-${p.id.substring(0, 6).toUpperCase()}`,
        stock: p.stock,
        minStock: p.minStock || 5,
        status: p.status,
        price: p.price,
        image: p.thumbnail,
        category: p.category?.name || 'Digital Assets',
        stockStatus: p.stock === null ? 'UNLIMITED' : p.stock === 0 ? 'OUT_OF_STOCK' : p.stock <= (p.minStock || 5) ? 'LOW_STOCK' : 'IN_STOCK',
        updatedAt: p.updatedAt
      })),
      ...bundles.map(b => ({
        id: b.id,
        name: b.title,
        type: 'bundle',
        sku: b.sku || `SKU-BND-${b.id.substring(0, 6).toUpperCase()}`,
        stock: b.stock,
        minStock: b.minStock || 5,
        status: b.status,
        price: b.price,
        image: b.coverImage,
        category: 'Bundle Collection',
        stockStatus: b.stock === null ? 'UNLIMITED' : b.stock === 0 ? 'OUT_OF_STOCK' : b.stock <= (b.minStock || 5) ? 'LOW_STOCK' : 'IN_STOCK',
        updatedAt: b.updatedAt
      }))
    ];

    return res.status(200).json({
      success: true,
      items: inventoryItems,
      totalCount: inventoryItems.length,
      lowStockCount: inventoryItems.filter(i => i.stockStatus === 'LOW_STOCK').length,
      outOfStockCount: inventoryItems.filter(i => i.stockStatus === 'OUT_OF_STOCK').length
    });
  } catch (error) {
    next(error);
  }
};

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
