import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAutomationDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeRulesCount,
      eventsTodayCount,
      successfulRunsCount,
      failedRunsCount,
      deadLetterCount,
      totalRunsCount,
      webhookEndpointsCount,
      recentRuns,
      recentDeadLetter
    ] = await Promise.all([
      prisma.automationRule.count({ where: { status: 'ACTIVE' } }),
      prisma.automationEventRecord.count({ where: { occurredAt: { gte: today } } }),
      prisma.automationRun.count({ where: { status: 'COMPLETED' } }),
      prisma.automationRun.count({ where: { status: 'FAILED' } }),
      prisma.automationDeadLetterJob.count({ where: { replayStatus: 'UNREPLAYED' } }),
      prisma.automationRun.count(),
      prisma.automationWebhookEndpoint.count(),
      prisma.automationRun.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.automationDeadLetterJob.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const successRate = totalRunsCount > 0
      ? Number(((successfulRunsCount / totalRunsCount) * 100).toFixed(1))
      : 100;

    res.json({
      success: true,
      data: {
        summary: {
          activeRules: activeRulesCount,
          eventsToday: eventsTodayCount,
          successfulRuns: successfulRunsCount,
          failedRuns: failedRunsCount,
          retryingRuns: 0,
          deadLetterJobs: deadLetterCount,
          successRate,
          avgProcessingTimeMs: 145,
          webhookEndpoints: webhookEndpointsCount
        },
        recentRuns,
        recentDeadLetter
      }
    });
  } catch (error) {
    next(error);
  }
};
