import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { NavLink } from 'react-router-dom';
import {
  Zap,
  Activity,
  CheckCircle2,
  AlertOctagon,
  RotateCw,
  Flame,
  Clock,
  Webhook,
  ArrowUpRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const AutomationOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    activeRules: 0,
    eventsToday: 0,
    successfulRuns: 0,
    failedRuns: 0,
    retryingRuns: 0,
    deadLetterJobs: 0,
    successRate: 100,
    avgProcessingTimeMs: 0,
    webhookEndpoints: 0
  });
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [recentDeadLetter, setRecentDeadLetter] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/dashboard', { withCredentials: true });
      if (res.data.success) {
        setSummary(res.data.data.summary);
        setRecentRuns(res.data.data.recentRuns || []);
        setRecentDeadLetter(res.data.data.recentDeadLetter || []);
      }
    } catch (err) {
      toast.error('Failed to load automation telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchDashboardData} isLoading={loading} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Rules */}
        <NavLink
          to="/admin/automation/orders"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-amber-500/30 transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Rules</span>
            <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">{summary.activeRules}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              Live in production <ArrowUpRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </NavLink>

        {/* Events Processed Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Events Today</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">{summary.eventsToday}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Ingested & deduplicated</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">{summary.successRate}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{summary.successfulRuns} completed runs</div>
          </div>
        </div>

        {/* Dead-Letter Jobs */}
        <NavLink
          to="/admin/automation/dead-letter"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-rose-500/30 transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Dead-Letter (DLQ)</span>
            <Flame className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400 font-mono">{summary.deadLetterJobs}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              Awaiting safe replay <ArrowUpRight className="w-2.5 h-2.5" />
            </div>
          </div>
        </NavLink>
      </div>

      {/* Quick Launch & Templates Callout */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Production Workflow Templates Library (14 Out-of-the-Box)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Install and activate pre-configured workflows for Instant Order Fulfilment, Abandoned Checkout, Guest Claims, Repeated Download Alerts, and SLA Escalations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/admin/automation/templates"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Browse 14 Templates
          </NavLink>
          <NavLink
            to="/admin/automation/builder"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition whitespace-nowrap border border-slate-700"
          >
            Custom Builder
          </NavLink>
        </div>
      </div>

      {/* Two Column Section: Recent Runs & DLQ Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Execution Runs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Recent Execution Runs
            </h3>
            <NavLink to="/admin/automation/runs" className="text-xs text-blue-400 hover:underline">
              View All Runs
            </NavLink>
          </div>

          <div className="space-y-2">
            {recentRuns.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                No recent runs recorded. Trigger an order or emit an event to view execution trace.
              </div>
            ) : (
              recentRuns.map((r) => (
                <NavLink
                  key={r.id}
                  to={`/admin/automation/runs/${r.id}`}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs transition block"
                >
                  <div>
                    <div className="font-semibold text-white">{r.workflowName}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {r.triggerEventType} • {r.customerEmail || r.orderId || 'System Event'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : r.status === 'FAILED' || r.status === 'DEAD_LETTER'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.durationMs}ms</div>
                  </div>
                </NavLink>
              ))
            )}
          </div>
        </div>

        {/* Dead-Letter Queue Attention */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              Dead-Letter Queue (DLQ) Incidents
            </h3>
            <NavLink to="/admin/automation/dead-letter" className="text-xs text-rose-400 hover:underline">
              Manage DLQ
            </NavLink>
          </div>

          <div className="space-y-2">
            {recentDeadLetter.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                Zero dead-letter jobs. All workflow jobs completing nominal.
              </div>
            ) : (
              recentDeadLetter.map((dlq) => (
                <div
                  key={dlq.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-rose-300">{dlq.workflowName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {dlq.failureReason}
                    </div>
                  </div>

                  <NavLink
                    to="/admin/automation/dead-letter"
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition"
                  >
                    Safety Audit & Replay
                  </NavLink>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AutomationOverviewPage;
