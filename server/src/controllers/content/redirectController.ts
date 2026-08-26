import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

const getActor = (req: Request) => {
  const user = (req as any).user || {};
  return {
    id: user.id ? String(user.id) : 'system-admin',
    name: user.name || 'System Admin'
  };
};

export const getRedirects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'ALL', search, page = '1', limit = '30' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (search) {
      where.OR = [
        { oldPath: { contains: String(search), mode: 'insensitive' } },
        { newPath: { contains: String(search), mode: 'insensitive' } },
        { reason: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [total, redirects] = await Promise.all([
      prisma.contentRedirect.count({ where }),
      prisma.contentRedirect.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: redirects,
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

export const createRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = getActor(req);
    const { oldPath, newPath, redirectType = '301', reason } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({ success: false, message: 'Source (Old Path) and Destination (New Path) are required.' });
    }

    const cleanOld = oldPath.startsWith('/') ? oldPath.toLowerCase() : `/${oldPath.toLowerCase()}`;
    const cleanNew = newPath.startsWith('/') ? newPath.toLowerCase() : `/${newPath.toLowerCase()}`;

    // Loop & self-redirect check
    if (cleanOld === cleanNew) {
      return res.status(400).json({ success: false, message: 'A URL cannot redirect to itself (redirect loop).' });
    }

    // Existing check
    const existing = await prisma.contentRedirect.findUnique({ where: { oldPath: cleanOld } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A redirect for path "${cleanOld}" already exists pointing to "${existing.newPath}". Please edit the existing rule instead.`
      });
    }

    const redirect = await prisma.contentRedirect.create({
      data: {
        oldPath: cleanOld,
        newPath: cleanNew,
        redirectType,
        reason: reason || 'Manual URL redirect mapping',
        status: 'ACTIVE',
        createdById: actor.id,
        createdByName: actor.name
      }
    });

    res.status(201).json({ success: true, redirect, message: 'Redirect rule created successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { newPath, redirectType, reason, status } = req.body;

    const redirect = await prisma.contentRedirect.update({
      where: { id },
      data: {
        ...(newPath && { newPath }),
        ...(redirectType && { redirectType }),
        ...(reason !== undefined && { reason }),
        ...(status && { status })
      }
    });

    res.json({ success: true, redirect, message: 'Redirect updated.' });
  } catch (error) {
    next(error);
  }
};

export const deleteRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await prisma.contentRedirect.delete({ where: { id } });
    res.json({ success: true, message: 'Redirect deleted.' });
  } catch (error) {
    next(error);
  }
};

export const resolveRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = String(req.query.path || '');
    const cleanPath = path.startsWith('/') ? path.toLowerCase() : `/${path.toLowerCase()}`;

    const redirect = await prisma.contentRedirect.findFirst({
      where: { oldPath: cleanPath, status: 'ACTIVE' }
    });

    if (redirect) {
      // Increment hit counter asynchronously
      prisma.contentRedirect.update({
        where: { id: redirect.id },
        data: { hitsCount: { increment: 1 } }
      }).catch(console.error);

      return res.json({ success: true, redirect });
    }

    res.json({ success: false, message: 'No active redirect found.' });
  } catch (error) {
    next(error);
  }
};
