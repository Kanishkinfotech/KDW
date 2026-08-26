import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'media-admin',
    name: user.name || 'Media Manager'
  };
};

export const getMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { folder = 'ALL', fileType = 'ALL', unusedOnly, search, page = '1', limit = '30' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (folder && folder !== 'ALL') where.folder = String(folder);
    if (fileType && fileType !== 'ALL') where.fileType = String(fileType);
    if (unusedOnly === 'true') where.isUsed = false;
    if (search) {
      where.OR = [
        { fileName: { contains: String(search), mode: 'insensitive' } },
        { originalName: { contains: String(search), mode: 'insensitive' } },
        { altText: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, assets] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: assets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createMediaRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const { fileName, originalName, fileType = 'IMAGE', mimeType = 'image/jpeg', fileSize = 0, dimensions, url, thumbnailUrl, altText, caption, folder = 'general' } = req.body;

    if (!fileName || !url) {
      return res.status(400).json({ success: false, message: 'File name and URL are required.' });
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        fileName,
        originalName: originalName || fileName,
        fileType,
        mimeType,
        fileSize: parseInt(fileSize, 10) || 0,
        dimensions,
        url,
        thumbnailUrl: thumbnailUrl || url,
        altText: altText || fileName,
        caption,
        folder,
        uploadedById: actor.id,
        uploadedByName: actor.name,
        usageReferences: [],
        isUsed: false
      }
    });

    res.status(201).json({ success: true, media: asset, message: 'Media registered in library.' });
  } catch (error) {
    next(error);
  }
};

export const updateMediaMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { altText, caption, folder } = req.body;

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(altText !== undefined && { altText }),
        ...(caption !== undefined && { caption }),
        ...(folder !== undefined && { folder })
      }
    });

    res.json({ success: true, media: asset, message: 'Media metadata updated.' });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });

    if (!asset) return res.status(404).json({ success: false, message: 'Media not found.' });

    // SAFETY CHECK: Scan if media is referenced by any published content
    const references: any[] = (asset.usageReferences as any[]) || [];
    if (asset.isUsed || references.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Deletion Blocked: This media file is actively used by ${references.length} published content items. Please remove or replace the media references first.`,
        references
      });
    }

    await prisma.mediaAsset.delete({ where: { id } });
    res.json({ success: true, message: 'Media asset safely deleted.' });
  } catch (error) {
    next(error);
  }
};
