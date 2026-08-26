import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get Background Worker Jobs with Queue & Status Filters
export const getBackgroundJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue, status, jobType, search, page = '1', limit = '25' } = req.query;
    const where: any = {};

    if (queue && queue !== 'ALL') where.queue = String(queue).toUpperCase();
    if (status && status !== 'ALL') where.status = String(status).toUpperCase();
    if (jobType && jobType !== 'ALL') where.jobType = String(jobType).toUpperCase();

    if (search) {
      where.OR = [
        { jobType: { contains: String(search), mode: 'insensitive' } },
        { errorMessage: { contains: String(search), mode: 'insensitive' } },
        { relatedResourceId: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * take;

    const [jobs, total] = await Promise.all([
      prisma.systemBackgroundJob.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemBackgroundJob.count({ where })
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

// 2. Retry Background Job
export const retryBackgroundJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const job = await prisma.systemBackgroundJob.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const updated = await prisma.systemBackgroundJob.update({
      where: { id },
      data: {
        status: 'QUEUED',
        attempts: 0,
        errorMessage: null,
        failedAt: null,
        startedAt: null
      }
    });

    await prisma.settingAuditLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'ADMIN',
        action: 'UPDATED',
        group: 'SYSTEM',
        details: `Manually requeued job '${job.jobType}' (ID: ${job.id})`
      }
    });

    res.json({
      success: true,
      message: `Job '${job.jobType}' requeued for background worker execution.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 3. Cancel Background Job
export const cancelBackgroundJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const authUser = (req as any).user;

    const job = await prisma.systemBackgroundJob.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const updated = await prisma.systemBackgroundJob.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    await prisma.settingAuditLog.create({
      data: {
        actorId: authUser?.id || null,
        actorName: authUser?.name || 'Administrator',
        actorRole: authUser?.role || 'ADMIN',
        action: 'UPDATED',
        group: 'SYSTEM',
        details: `Cancelled background job '${job.jobType}' (ID: ${job.id})`
      }
    });

    res.json({
      success: true,
      message: `Job '${job.jobType}' marked as cancelled.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Queue Metrics Summary
export const getJobQueueMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [queued, running, completed, failed, deadLetter] = await Promise.all([
      prisma.systemBackgroundJob.count({ where: { status: 'QUEUED' } }),
      prisma.systemBackgroundJob.count({ where: { status: 'RUNNING' } }),
      prisma.systemBackgroundJob.count({ where: { status: 'COMPLETED' } }),
      prisma.systemBackgroundJob.count({ where: { status: 'FAILED' } }),
      prisma.systemBackgroundJob.count({ where: { status: 'DEAD_LETTER' } })
    ]);

    res.json({
      success: true,
      data: {
        queued,
        running,
        completed,
        failed,
        deadLetter,
        totalTracked: queued + running + completed + failed + deadLetter
      }
    });
  } catch (error) {
    next(error);
  }
};
