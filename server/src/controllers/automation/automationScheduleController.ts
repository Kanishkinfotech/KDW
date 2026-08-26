import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get Schedules
export const getSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await prisma.automationSchedule.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// 2. Create Schedule
export const createSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, workflowId, scheduleType = 'RECURRING_CRON', cronExpression, nextExecutionAt } = req.body;

    if (!name || !workflowId) {
      return res.status(400).json({ success: false, message: 'Schedule name and workflow ID are required' });
    }

    const schedule = await prisma.automationSchedule.create({
      data: {
        name,
        workflowId,
        scheduleType,
        cronExpression: cronExpression || '0 * * * *',
        nextExecutionAt: nextExecutionAt ? new Date(nextExecutionAt) : new Date(Date.now() + 3600 * 1000),
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      success: true,
      message: `Schedule '${schedule.name}' activated.`,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// 3. Toggle Schedule Status
export const toggleScheduleStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const schedule = await prisma.automationSchedule.findUnique({ where: { id } });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const newStatus = schedule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const updated = await prisma.automationSchedule.update({
      where: { id },
      data: { status: newStatus }
    });

    res.json({
      success: true,
      message: `Schedule status updated to ${newStatus}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 4. Delete Schedule
export const deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.automationSchedule.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Schedule deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
