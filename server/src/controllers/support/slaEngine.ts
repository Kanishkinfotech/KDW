// SLA Engine Service for calculating first response and resolution deadlines

export interface SlaPolicy {
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

export const DEFAULT_SLA_POLICIES: Record<string, SlaPolicy> = {
  CRITICAL: {
    firstResponseMinutes: 30,      // 30 minutes
    resolutionMinutes: 240         // 4 hours
  },
  HIGH: {
    firstResponseMinutes: 120,     // 2 hours
    resolutionMinutes: 1440        // 24 hours (1 business day)
  },
  MEDIUM: {
    firstResponseMinutes: 480,     // 8 hours
    resolutionMinutes: 4320        // 3 business days (72 hours)
  },
  LOW: {
    firstResponseMinutes: 1440,    // 24 hours
    resolutionMinutes: 7200        // 5 business days (120 hours)
  },
  PLANNED: {
    firstResponseMinutes: 2880,    // 48 hours
    resolutionMinutes: 14400       // 10 business days
  }
};

export function calculateSlaDeadlines(priority: string, createdAt: Date = new Date()) {
  const policy = DEFAULT_SLA_POLICIES[priority.toUpperCase()] || DEFAULT_SLA_POLICIES.MEDIUM;
  
  const firstResponseDueAt = new Date(createdAt.getTime() + policy.firstResponseMinutes * 60 * 1000);
  const resolutionDueAt = new Date(createdAt.getTime() + policy.resolutionMinutes * 60 * 1000);

  return {
    firstResponseTargetMinutes: policy.firstResponseMinutes,
    resolutionTargetMinutes: policy.resolutionMinutes,
    firstResponseDueAt,
    resolutionDueAt
  };
}

export function evaluateSlaStatus(
  slaRecord: {
    firstResponseDueAt?: Date | null;
    resolutionDueAt?: Date | null;
    firstResponseCompletedAt?: Date | null;
    resolutionCompletedAt?: Date | null;
    isPaused?: boolean;
  } | null,
  currentStatus: string
): 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'BREACHED' | 'COMPLETED' {
  if (!slaRecord) return 'HEALTHY';

  if (currentStatus === 'RESOLVED' || currentStatus === 'CLOSED') {
    return 'COMPLETED';
  }

  const now = Date.now();

  // Check Resolution Deadline
  if (slaRecord.resolutionDueAt) {
    const dueTime = new Date(slaRecord.resolutionDueAt).getTime();
    const diffMs = dueTime - now;

    if (diffMs <= 0) return 'BREACHED';
    if (diffMs < 2 * 60 * 60 * 1000) return 'CRITICAL'; // < 2h remaining
    if (diffMs < 6 * 60 * 60 * 1000) return 'WARNING';  // < 6h remaining
  }

  // Check First Response Deadline if not completed
  if (!slaRecord.firstResponseCompletedAt && slaRecord.firstResponseDueAt) {
    const dueTime = new Date(slaRecord.firstResponseDueAt).getTime();
    const diffMs = dueTime - now;

    if (diffMs <= 0) return 'BREACHED';
    if (diffMs < 30 * 60 * 1000) return 'CRITICAL';     // < 30m remaining
    if (diffMs < 60 * 60 * 1000) return 'WARNING';      // < 1h remaining
  }

  return 'HEALTHY';
}
