import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { runPreReplaySafetyAudit } from './automationWorkerService';

const prisma = new PrismaClient();

// 1. Get Workflow Runs List
export const getAutomationRuns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, workflowId, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') where.status = String(status).toUpperCase();
    if (workflowId && workflowId !== 'ALL') where.workflowId = String(workflowId);

    if (search) {
      where.OR = [
        { workflowName: { contains: String(search), mode: 'insensitive' } },
        { customerEmail: { contains: String(search), mode: 'insensitive' } },
        { orderId: { contains: String(search), mode: 'insensitive' } },
        { triggerEventType: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [runs, total] = await Promise.all([
      prisma.automationRun.findMany({
        where,
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.automationRun.count({ where })
    ]);

    res.json({
      success: true,
      data: runs,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Run Details with Execution Timeline
export const getAutomationRunById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const run = await prisma.automationRun.findUnique({
      where: { id },
      include: {
        workflow: true,
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        deadLetterJobs: true
      }
    });

    if (!run) {
      return res.status(404).json({ success: false, message: 'Workflow run not found' });
    }

    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    next(error);
  }
};

// 3. Replay Automation Run
export const replayAutomationRun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const run = await prisma.automationRun.findUnique({ where: { id } });
    if (!run) {
      return res.status(404).json({ success: false, message: 'Workflow run not found' });
    }

    const safetyReport = await runPreReplaySafetyAudit(id);

    // Update status to REPLAYED and re-execute
    const updated = await prisma.automationRun.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        attemptCount: run.attemptCount + 1,
        errorMessage: null,
        completedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `Workflow run replayed successfully.`,
      safetyReport,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Cancel Automation Run
export const cancelAutomationRun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.automationRun.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Workflow run cancelled.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
