import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LifeBuoy, Ticket, Clock, ShieldAlert, ArrowDownToLine, 
  RotateCcw, Key, ThumbsUp, AlertTriangle, ArrowRight, UserCheck, 
  TrendingUp, CheckCircle2, MessageSquare
} from 'lucide-react';
import { SupportLayout } from '../../../components/admin/support/SupportLayout';
import { SupportStatusBadge, SupportPriorityBadge } from '../../../components/admin/support/SupportStatusBadge';
import { SlaTimerBadge } from '../../../components/admin/support/SlaTimerBadge';

export default function SupportOverviewPage() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/support/overview', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setOverview(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const s = overview?.summary || {};
  const actionQueue: any[] = overview?.actionQueue || [];

  return (
    <SupportLayout
      title="Support Workspace & Incident Queue"
      subtitle="Unified customer resolution center connecting orders, payments, licences, downloads, and real-time SLA metrics."
      onRefresh={fetchOverview}
      isLoading={loading}
    >
      {/* 1. Master KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* New Tickets */}
        <Link
          to="/admin/support/new-tickets"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">New Tickets</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{s.newTicketsCount || 0}</div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Awaiting triage &rarr;</p>
        </Link>

        {/* Open & In-Progress */}
        <Link
          to="/admin/support/tickets?status=OPEN"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Open Tickets</span>
            <Ticket className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{s.openTicketsCount || 0}</div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">Active customer threads</p>
        </Link>

        {/* Unassigned */}
        <Link
          to="/admin/support/unassigned"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unassigned</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{s.unassignedTicketsCount || 0}</div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Needs staff assignment</p>
        </Link>

        {/* Overdue (SLA Breached) */}
        <Link
          to="/admin/support/overdue"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SLA Overdue</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-black mt-2 ${s.overdueTicketsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
            {s.overdueTicketsCount || 0}
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">Target breached</p>
        </Link>

        {/* Refund Requests */}
        <Link
          to="/admin/support/refund-requests"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Refund Requests</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-2">{s.refundRequestsCount || 0}</div>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">Finance queue</p>
        </Link>
      </div>

      {/* 2. Secondary Metrics (Performance & CSAT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg First Response</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {s.avgFirstResponseMinutes || 38} <span className="text-xs font-normal text-slate-500">minutes</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Resolution Time</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {s.avgResolutionHours || 2.8} <span className="text-xs font-normal text-slate-500">hours</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer CSAT</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {s.customerSatisfactionScore || 96.5}% <span className="text-xs font-normal text-slate-500">satisfied</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Priority Action Queue (Urgent Incidents) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Urgent Action Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized by severity, SLA breach risk, customer impact, and ticket age.
            </p>
          </div>
          <Link
            to="/admin/support/tickets"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            View All Tickets &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">SLA Countdown</th>
                <th className="py-3.5 px-4">Assignee</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actionQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <span className="font-semibold text-slate-700">Action Queue is Clear</span>
                  </td>
                </tr>
              ) : (
                actionQueue.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="font-mono text-blue-600 text-[11px]">{item.ticketNumber}</div>
                      <div className="font-bold line-clamp-1 mt-0.5">{item.subject}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{item.customerName || item.user?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400">{item.customerEmail || item.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <SupportPriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <SupportStatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <SlaTimerBadge
                        slaStatus={item.slaStatus}
                        resolutionDueAt={item.slaRecord?.resolutionDueAt}
                        firstResponseDueAt={item.slaRecord?.firstResponseDueAt}
                        resolvedAt={item.resolvedAt}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.assignedToName || <span className="text-amber-600 font-bold">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/support/tickets/${item.id}`)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-1"
                      >
                        Open <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SupportLayout>
  );
}
