import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const getNavigationMenus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menus = await prisma.navigationMenu.findMany({
      orderBy: { location: 'asc' }
    });
    res.json({ success: true, menus });
  } catch (error) {
    next(error);
  }
};

export const getMenuByLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = String(req.params.location);
    const menu = await prisma.navigationMenu.findFirst({
      where: { location, status: 'ACTIVE' }
    });
    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
};

export const createNavigationMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, location = 'HEADER_PRIMARY', itemsJson = [], status = 'ACTIVE' } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Menu name and slug are required.' });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const menu = await prisma.navigationMenu.create({
      data: {
        name,
        slug: cleanSlug,
        location,
        itemsJson,
        status
      }
    });

    res.status(201).json({ success: true, menu, message: 'Navigation menu created.' });
  } catch (error) {
    next(error);
  }
};

export const updateNavigationMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { name, location, itemsJson, status } = req.body;

    const menu = await prisma.navigationMenu.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(itemsJson !== undefined && { itemsJson }),
        ...(status && { status })
      }
    });

    res.json({ success: true, menu, message: 'Navigation menu updated.' });
  } catch (error) {
    next(error);
  }
};

export const deleteNavigationMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await prisma.navigationMenu.delete({ where: { id } });
    res.json({ success: true, message: 'Navigation menu deleted.' });
  } catch (error) {
    next(error);
  }
};
