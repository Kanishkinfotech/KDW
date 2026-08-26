import React from 'react';

export function SupportStatusBadge({ status }: { status: string }) {
  const s = String(status || 'NEW').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'NEW') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (s === 'OPEN') {
    styles = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (s === 'IN_PROGRESS') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (s === 'WAITING_FOR_CUSTOMER') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'RESOLVED') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'CLOSED') {
    styles = 'bg-slate-100 text-slate-600 border-slate-300';
  } else if (s === 'ESCALATED') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
  } else if (s.startsWith('PENDING_')) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

export function SupportPriorityBadge({ priority }: { priority: string }) {
  const p = String(priority || 'MEDIUM').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (p === 'CRITICAL') {
    styles = 'bg-rose-100 text-rose-800 border-rose-300 font-black';
  } else if (p === 'HIGH') {
    styles = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
  } else if (p === 'MEDIUM') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (p === 'LOW') {
    styles = 'bg-slate-50 text-slate-600 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border ${styles}`}>
      {p}
    </span>
  );
}
