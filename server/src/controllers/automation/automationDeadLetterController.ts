import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { runPreReplaySafetyAudit } from './automationWorkerService';

const prisma = new PrismaClient();

// 1. Get Dead-Letter Jobs
export const getDeadLetterJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, eventType, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') where.replayStatus = String(status).toUpperCase();
    if (eventType && eventType !== 'ALL') where.eventType = String(eventType);

    if (search) {
      where.OR = [
        { workflowName: { contains: String(search), mode: 'insensitive' } },
        { failureReason: { contains: String(search), mode: 'insensitive' } },
        { eventType: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [jobs, total] = await Promise.all([
      prisma.automationDeadLetterJob.findMany({
        where,
        include: {
          run: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.automationDeadLetterJob.count({ where })
    ]);

    res.json({
      success: true,
      data: jobs,
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

// 2. Pre-Replay Safety Report
export const getDeadLetterSafetyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const deadJob = await prisma.automationDeadLetterJob.findUnique({ where: { id } });
    if (!deadJob) {
      return res.status(404).json({ success: false, message: 'Dead-letter job not found' });
    }

    const safetyReport = await runPreReplaySafetyAudit(deadJob.runId);

    res.json({
      success: true,
      data: safetyReport
    });
  } catch (error) {
    next(error);
  }
};

// 3. Replay Dead-Letter Job
export const replayDeadLetterJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const deadJob = await prisma.automationDeadLetterJob.findUnique({ where: { id } });
    if (!deadJob) {
      return res.status(404).json({ success: false, message: 'Dead-letter job not found' });
    }

    const safetyReport = await runPreReplaySafetyAudit(deadJob.runId);

    const updated = await prisma.automationDeadLetterJob.update({
      where: { id },
      data: {
        replayStatus: 'REPLAYED',
        replayedBy: authUser?.name || 'Administrator',
        replayedAt: new Date()
      }
    });

    // Mark parent run as replayed/completed
    await prisma.automationRun.update({
      where: { id: deadJob.runId },
      data: { status: 'REPLAYED', errorMessage: null }
    });

    res.json({
      success: true,
      message: `Dead-letter job '${deadJob.workflowName}' replayed successfully.`,
      safetyReport,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Cancel / Resolve Dead-Letter Job
export const cancelDeadLetterJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.automationDeadLetterJob.update({
      where: { id },
      data: { replayStatus: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Dead-letter job marked as cancelled/resolved.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
