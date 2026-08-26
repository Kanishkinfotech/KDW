import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentType = 'ALL' } = req.query;
    const where: any = {};
    if (contentType && contentType !== 'ALL') where.contentType = String(contentType);

    const templates = await prisma.contentTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, templates });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, contentType = 'PAGE', layoutJson = [], isDefault = false } = req.body;

    if (!name || !slug) return res.status(400).json({ success: false, message: 'Name and slug are required.' });

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    const template = await prisma.contentTemplate.create({
      data: {
        name,
        slug: cleanSlug,
        description,
        contentType,
        layoutJson,
        isDefault: Boolean(isDefault),
        status: 'ACTIVE'
      }
    });

    res.status(201).json({ success: true, template, message: 'Template created.' });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { name, description, layoutJson, isDefault, status } = req.body;

    const template = await prisma.contentTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(layoutJson !== undefined && { layoutJson }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
        ...(status && { status })
      }
    });

    res.json({ success: true, template, message: 'Template updated.' });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const template = await prisma.contentTemplate.findUnique({ where: { id } });

    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });

    // Check if any published page uses this template
    const pagesUsing = await prisma.contentPage.count({ where: { template: template.slug, status: 'PUBLISHED' } });
    if (pagesUsing > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete template because ${pagesUsing} published pages rely on it. Please archive the template or migrate pages first.`
      });
    }

    await prisma.contentTemplate.delete({ where: { id } });
    res.json({ success: true, message: 'Template deleted.' });
  } catch (error) {
    next(error);
  }
};
