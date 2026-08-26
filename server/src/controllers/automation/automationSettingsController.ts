import { Request, Response, NextFunction } from 'express';

// Global memory cache for automation settings
let automationSettings = {
  maxRetryAttempts: 5,
  initialBackoffSeconds: 30,
  maxBackoffSeconds: 3600,
  workerConcurrency: 8,
  webhookTimeoutSeconds: 15,
  webhookRateLimitPerMinute: 300,
  deadLetterRetentionDays: 90,
  eventRetentionDays: 60,
  enableSafeReplayIdempotency: true,
  autoPauseOnFailureSpike: true
};

export const getAutomationSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: automationSettings
    });
  } catch (error) {
    next(error);
  }
};

export const updateAutomationSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    automationSettings = {
      ...automationSettings,
      ...updates
    };

    res.json({
      success: true,
      message: 'Automation settings updated successfully.',
      data: automationSettings
    });
  } catch (error) {
    next(error);
  }
};
