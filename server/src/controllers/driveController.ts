import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logAdminAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

export const getDriveFiles = async (req: Request, res: Response) => {
  try {
    const files = await prisma.driveFile.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const productIds = files.map(f => f.linkedProduct).filter(id => id && id !== 'None') as string[];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    const productMap = new Map(products.map(p => [p.id, p.name]));

    // Map them to what the frontend expects
    const formattedFiles = files.map(file => ({
      _id: file.id,
      filename: file.filename,
      size: file.size || 'Unknown',
      linkedProduct: (file.linkedProduct && file.linkedProduct !== 'None') ? (productMap.get(file.linkedProduct) || file.linkedProduct) : 'None',
      status: file.status,
      driveUrl: file.driveUrl,
      createdAt: file.createdAt
    }));

    res.status(200).json({ success: true, data: formattedFiles });
  } catch (error) {
    console.error('Error fetching drive files:', error);
    res.status(500).json({ success: false, message: 'Server error fetching drive files' });
  }
};

export const linkDriveFile = async (req: Request, res: Response) => {
  try {
    const { filename, size, linkedProduct, driveUrl, forceOverwrite } = req.body;
    const adminId = (req as any).user?.id || 'system';

    if (!filename || !driveUrl) {
      return res.status(400).json({ success: false, message: 'Filename and Drive URL are required' });
    }

    let actualLinkedProduct = null;
    if (linkedProduct && linkedProduct !== 'None') {
      const product = await prisma.product.findUnique({ where: { id: linkedProduct } });
      if (product) {
        if (product.googleDriveFileId && product.googleDriveFileId !== driveUrl && !forceOverwrite) {
          return res.status(409).json({ 
            success: false, 
            message: `Product "${product.name}" already has a linked Drive file. Do you want to overwrite it?`,
            requiresConfirmation: true 
          });
        }
        await prisma.product.update({
          where: { id: linkedProduct },
          data: { googleDriveFileId: driveUrl }
        });
        actualLinkedProduct = linkedProduct;
      }
    }

    const newFile = await prisma.driveFile.create({
      data: {
        filename,
        size,
        linkedProduct: actualLinkedProduct,
        driveUrl
      }
    });

    await logAdminAction(adminId, 'LINK_MEDIA', 'DriveFile', `Linked drive file ${filename}`);

    res.status(201).json({ success: true, data: newFile, message: 'Media linked successfully' });
  } catch (error) {
    console.error('Error linking drive file:', error);
    res.status(500).json({ success: false, message: 'Server error linking drive file' });
  }
};

export const deleteDriveFile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const adminId = (req as any).user?.id || 'system';

    const existingFile = await prisma.driveFile.findUnique({ where: { id } });
    if (!existingFile) {
      return res.status(404).json({ success: false, message: 'Media file not found' });
    }

    // Safety check: Does a product use this URL? (The instruction says not to delete if it breaks a product)
    const linkedProduct = await prisma.product.findFirst({
      where: { googleDriveFileId: existingFile.driveUrl }
    });
    
    if (linkedProduct) {
      return res.status(400).json({ success: false, message: `Cannot delete: URL is actively used by product "${linkedProduct.name}"` });
    }

    await prisma.driveFile.delete({ where: { id } });

    await logAdminAction(adminId, 'DELETE_MEDIA', 'DriveFile', `Deleted media link ${existingFile.filename}`);

    res.status(200).json({ success: true, message: 'Media link deleted successfully' });
  } catch (error) {
    console.error('Error deleting drive file:', error);
    res.status(500).json({ success: false, message: 'Server error deleting drive file' });
  }
};
