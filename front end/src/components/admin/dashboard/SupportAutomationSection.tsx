import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, Zap, ArrowRight, AlertCircle, Clock, CheckCircle2, Play } from 'lucide-react';
import type { DashboardSupportData, DashboardAutomationData } from '../../../services/adminDashboardService';

export interface SupportAutomationSectionProps {
  supportData?: DashboardSupportData;
  automationData?: DashboardAutomationData;
  loading: boolean;
}

export default function SupportAutomationSection({
  supportData,
  automationData,
  loading
}: SupportAutomationSectionProps) {
  const support = supportData || { open: 0, unassigned: 0, highPriority: 0, slaAtRisk: 0, overdue: 0 };
  const automation = automationData || { activeRules: 0, runsToday: 0, successfulRuns: 0, failedRuns: 0, retryingRuns: 0, deadLetterJobs: 0 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Support Overview Card */}
      <div className="kdw-card p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
              CUSTOMER RESOLUTION
            </span>
            <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
              Support Desk
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Live queue metrics for open inquiries, SLAs, and escalated customer tickets.
            </p>
          </div>
          <Link
            to="/admin/support/tickets"
            className="text-xs font-semibold text-[#5b21b6] hover:underline inline-flex items-center gap-1 font-sans"
          >
            <span>View tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/support/tickets"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Open Tickets</span>
            <span className="text-xl font-serif font-bold text-[#171325] font-mono mt-1 block">
              {loading ? '—' : support.open}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">Active queue</span>
          </Link>

          <Link
            to="/admin/support/tickets"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Unassigned</span>
            <span className="text-xl font-serif font-bold text-amber-600 font-mono mt-1 block">
              {loading ? '—' : support.unassigned}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">Needs staff</span>
          </Link>

          <Link
            to="/admin/support/tickets"
            className={`p-3.5 rounded-2xl border transition-colors ${
              support.highPriority > 0 ? 'bg-rose-50/50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">High Priority</span>
            <span className={`text-xl font-serif font-bold font-mono mt-1 block ${support.highPriority > 0 ? 'text-rose-600' : 'text-[#171325]'}`}>
              {loading ? '—' : support.highPriority}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">Urgent tickets</span>
          </Link>

          <Link
            to="/admin/support/tickets"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Overdue</span>
            <span className="text-xl font-serif font-bold text-[#171325] font-mono mt-1 block">
              {loading ? '—' : support.overdue}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">&gt;48 hours</span>
          </Link>
        </div>
      </div>

      {/* Automation Overview Card */}
      <div className="kdw-card p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
              WORKFLOW AUTOMATION
            </span>
            <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
              Automation Engine
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Status of autonomous digital entitlement, email dispatch, and event workflows.
            </p>
          </div>
          <Link
            to="/admin/automation"
            className="text-xs font-semibold text-[#5b21b6] hover:underline inline-flex items-center gap-1 font-sans"
          >
            <span>Automation hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/automation/orders"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Active Rules</span>
            <span className="text-xl font-serif font-bold text-[#171325] font-mono mt-1 block">
              {loading ? '—' : automation.activeRules}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">Configured</span>
          </Link>

          <Link
            to="/admin/automation/runs"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Runs Today</span>
            <span className="text-xl font-serif font-bold text-[#5b21b6] font-mono mt-1 block">
              {loading ? '—' : automation.runsToday}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">Events processed</span>
          </Link>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Successes</span>
            <span className="text-xl font-serif font-bold text-emerald-600 font-mono mt-1 block">
              {loading ? '—' : automation.successfulRuns}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">Zero drift</span>
          </div>

          <Link
            to="/admin/automation/dead-letter"
            className={`p-3.5 rounded-2xl border transition-colors ${
              automation.deadLetterJobs > 0 ? 'bg-rose-50/50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans block">Dead Letter</span>
            <span className={`text-xl font-serif font-bold font-mono mt-1 block ${automation.deadLetterJobs > 0 ? 'text-rose-600' : 'text-[#171325]'}`}>
              {loading ? '—' : automation.deadLetterJobs}
            </span>
            <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">DLQ jobs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
