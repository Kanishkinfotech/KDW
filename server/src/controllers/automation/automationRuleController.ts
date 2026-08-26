import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { evaluateConditions } from './automationRuleEngine';

const prisma = new PrismaClient();

// 1. Get Automation Rules
export const getAutomationRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, isTemplate, search } = req.query;
    const where: any = {};

    if (category && category !== 'ALL') where.category = String(category);
    if (status && status !== 'ALL') where.status = String(status).toUpperCase();
    if (isTemplate !== undefined) where.isTemplate = isTemplate === 'true';

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { triggerEvent: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const rules = await prisma.automationRule.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const parsedRules = rules.map((r) => ({
      ...r,
      conditions: JSON.parse(r.conditionJson || '[]'),
      actions: JSON.parse(r.actionJson || '[]')
    }));

    res.json({
      success: true,
      data: parsedRules
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Rule by ID
export const getAutomationRuleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const rule = await prisma.automationRule.findUnique({
      where: { id },
      include: {
        runs: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Automation rule not found' });
    }

    res.json({
      success: true,
      data: {
        ...rule,
        conditions: JSON.parse(rule.conditionJson || '[]'),
        actions: JSON.parse(rule.actionJson || '[]')
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Automation Rule
export const createAutomationRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, category = 'CUSTOM', triggerEvent, conditions = [], actions = [] } = req.body;
    const authUser = (req as any).user;

    if (!name || !triggerEvent) {
      return res.status(400).json({ success: false, message: 'Workflow name and trigger event are required' });
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        description,
        category,
        triggerEvent,
        conditionJson: JSON.stringify(conditions),
        actionJson: JSON.stringify(actions),
        status: 'ACTIVE',
        createdBy: authUser?.name || 'Administrator',
        updatedBy: authUser?.name || 'Administrator'
      }
    });

    res.status(201).json({
      success: true,
      message: `Workflow '${rule.name}' created and activated.`,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Automation Rule
export const updateAutomationRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description, category, triggerEvent, conditions, actions, status } = req.body;
    const authUser = (req as any).user;

    const data: any = {
      updatedBy: authUser?.name || 'Administrator'
    };

    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (category) data.category = category;
    if (triggerEvent) data.triggerEvent = triggerEvent;
    if (conditions) data.conditionJson = JSON.stringify(conditions);
    if (actions) data.actionJson = JSON.stringify(actions);
    if (status) data.status = status;

    const rule = await prisma.automationRule.update({
      where: { id },
      data
    });

    res.json({
      success: true,
      message: `Workflow '${rule.name}' updated successfully.`,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// 5. Test Rule (Dry-Run Mode)
export const testAutomationRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { samplePayload = {} } = req.body;

    const rule = await prisma.automationRule.findUnique({ where: { id } });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const conditions = JSON.parse(rule.conditionJson || '[]');
    const actions = JSON.parse(rule.actionJson || '[]');

    const matches = evaluateConditions(conditions, samplePayload);

    res.json({
      success: true,
      data: {
        isDryRun: true,
        workflowName: rule.name,
        triggerEvent: rule.triggerEvent,
        samplePayload,
        conditionsEvaluated: conditions.length,
        conditionsPassed: matches,
        plannedActions: matches ? actions.map((a: any) => a.actionType) : [],
        simulatedOutcome: matches ? 'ALL_CONDITIONS_MET_WORKFLOW_WOULD_EXECUTE' : 'CONDITIONS_NOT_MET_WORKFLOW_SKIPPED'
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Activate Rule
export const activateAutomationRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const rule = await prisma.automationRule.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    res.json({
      success: true,
      message: `Workflow '${rule.name}' is now ACTIVE.`,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// 7. Pause Rule
export const pauseAutomationRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const rule = await prisma.automationRule.update({
      where: { id },
      data: { status: 'PAUSED' }
    });

    res.json({
      success: true,
      message: `Workflow '${rule.name}' has been PAUSED.`,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// 8. Delete Rule
export const deleteAutomationRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.automationRule.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Workflow rule deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
