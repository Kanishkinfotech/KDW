import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get Canned Responses
export const getCannedResponses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, search } = req.query;
    const where: any = {};

    if (category && category !== 'ALL') where.category = String(category);
    if (status && status !== 'ALL') where.status = String(status);
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { body: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const responses = await prisma.cannedResponse.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: responses
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create Canned Response
export const createCannedResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category = 'GENERAL', body, variables } = req.body;
    const authUser = (req as any).user;

    if (!name || !body) {
      return res.status(400).json({ success: false, message: 'Name and body are required' });
    }

    // Auto-detect template variables like {{customer.first_name}}
    const detectedVars = Array.from(body.matchAll(/\{\{([^}]+)\}\}/g)).map(m => (m as any)[1]);

    const created = await prisma.cannedResponse.create({
      data: {
        name,
        category,
        body,
        variablesJson: variables || detectedVars,
        status: 'ACTIVE',
        createdById: authUser.id,
        createdByName: authUser.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Canned response template created',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

// 3. Update Canned Response
export const updateCannedResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, category, body, status } = req.body;

    const existing = await prisma.cannedResponse.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    if (body) {
      updateData.body = body;
      updateData.variablesJson = Array.from(body.matchAll(/\{\{([^}]+)\}\}/g)).map(m => (m as any)[1]);
      updateData.version = existing.version + 1;
    }

    const updated = await prisma.cannedResponse.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Canned response updated',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Canned Response
export const deleteCannedResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.cannedResponse.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Canned response deleted'
    });
  } catch (error) {
    next(error);
  }
};
