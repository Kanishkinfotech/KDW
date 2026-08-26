import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SlaTimerBadgeProps {
  slaStatus: string;
  resolutionDueAt?: string | null;
  firstResponseDueAt?: string | null;
  resolvedAt?: string | null;
}

export function SlaTimerBadge({
  slaStatus,
  resolutionDueAt,
  firstResponseDueAt,
  resolvedAt
}: SlaTimerBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);

  useEffect(() => {
    if (resolvedAt || slaStatus === 'COMPLETED') {
      setTimeLeft('Resolved');
      return;
    }

    const targetDate = resolutionDueAt || firstResponseDueAt;
    if (!targetDate) {
      setTimeLeft('Healthy');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const due = new Date(targetDate).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueMins = Math.abs(Math.floor(diff / (1000 * 60)));
        const overdueHours = Math.floor(overdueMins / 60);
        const remMins = overdueMins % 60;
        setTimeLeft(`Overdue by ${overdueHours > 0 ? `${overdueHours}h ` : ''}${remMins}m`);
      } else {
        setIsOverdue(false);
        const totalMins = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        setTimeLeft(`${hours > 0 ? `${hours}h ` : ''}${mins}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, [resolutionDueAt, firstResponseDueAt, resolvedAt, slaStatus]);

  if (resolvedAt || slaStatus === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Met SLA
      </span>
    );
  }

  if (isOverdue || slaStatus === 'BREACHED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
        <ShieldAlert className="w-3 h-3 text-rose-600" /> {timeLeft}
      </span>
    );
  }

  if (slaStatus === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <Clock className="w-3 h-3" /> {timeLeft}
      </span>
    );
  }

  if (slaStatus === 'WARNING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> {timeLeft}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
      <Clock className="w-3 h-3 text-slate-400" /> {timeLeft}
    </span>
  );
}
