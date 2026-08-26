import React from 'react';

interface ContentStatusBadgeProps {
  status: string;
  isPolicy?: boolean;
}

export const ContentStatusBadge: React.FC<ContentStatusBadgeProps> = ({ status, isPolicy }) => {
  const normalized = (status || 'DRAFT').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = normalized;

  switch (normalized) {
    case 'PUBLISHED':
    case 'ACTIVE':
    case 'APPROVED':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'PENDING_REVIEW':
    case 'UNDER_REVIEW':
    case 'SCHEDULED':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'REJECTED':
    case 'REPORTED':
    case 'CRITICAL':
    case 'EXPIRED':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'UPDATED':
    case 'OPEN':
    case 'IN_PROGRESS':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'ARCHIVED':
    case 'PAUSED':
    case 'CLOSED':
    case 'OUTDATED':
      styles = 'bg-slate-100 text-slate-600 border-slate-300';
      break;
    case 'DRAFT':
    case 'NEW':
    default:
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
        {label.replace(/_/g, ' ')}
      </span>
      {isPolicy && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
          Policy
        </span>
      )}
    </div>
  );
};
