import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { NavLink } from 'react-router-dom';
import {
  Flame,
  ShieldCheck,
  RotateCw,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const DeadLetterQueuePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [safetyReport, setSafetyReport] = useState<any | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [replaying, setReplaying] = useState(false);

  const fetchDLQJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/dead-letter', { withCredentials: true });
      if (res.data.success) {
        setJobs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dead-letter queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDLQJobs();
  }, []);

  const handleOpenSafetyAudit = async (job: any) => {
    setSelectedJob(job);
    try {
      setAuditing(true);
      const res = await axios.get(`/api/admin/automation/dead-letter/${job.id}/safety-report`, { withCredentials: true });
      if (res.data.success) {
        setSafetyReport(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to generate pre-replay safety audit report');
    } finally {
      setAuditing(false);
    }
  };

  const handleExecuteReplay = async () => {
    if (!selectedJob) return;
    try {
      setReplaying(true);
      const res = await axios.post(`/api/admin/automation/dead-letter/${selectedJob.id}/replay`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedJob(null);
        fetchDLQJobs();
      }
    } catch (err) {
      toast.error('Failed to replay dead-letter job');
    } finally {
      setReplaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchDLQJobs} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            Dead-Letter Queue (DLQ) Management & Safe Replay
          </h2>
          <p className="text-xs text-slate-400">
            Permanently failed jobs isolated from production traffic. Replay triggers pre-flight safety checks to prevent duplicate side effects.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Failed At</th>
                <th className="px-4 py-3">Workflow Name</th>
                <th className="px-4 py-3">Trigger Event</th>
                <th className="px-4 py-3">Failure Reason</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-400 mb-2" />
                    Querying dead-letter isolation records...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No dead-letter jobs. System is operating clean.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-300">
                      {job.workflowName}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-amber-400">
                      {job.eventType}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                      {job.failureReason}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {job.attemptCount}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {job.replayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenSafetyAudit(job)}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold transition"
                      >
                        Safety Audit & Replay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-Replay Safety Report Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Pre-Flight Replay Safety Audit
              </h3>
              <p className="text-xs text-slate-400">
                Auditing target resource state to prevent duplicate invoices, emails, or duplicate entitlement grants.
              </p>
            </div>

            {auditing ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <RotateCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                Executing state consistency check...
              </div>
            ) : safetyReport ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Order Verification:</span>
                    <span className="font-semibold text-emerald-400">{safetyReport.orderState}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Entitlement Status:</span>
                    <span className="font-semibold text-slate-200">
                      {safetyReport.entitlementExists ? 'Exists (will skip create step)' : 'Pending'}
                    </span>
                  </div>
                </div>

                {safetyReport.safetyWarnings?.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1">
                    <span className="font-bold text-amber-400 block text-[11px]">Safety Guardrails:</span>
                    {safetyReport.safetyWarnings.map((w: string, i: number) => (
                      <div key={i} className="text-slate-300 text-[11px]">• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReplay}
                disabled={replaying}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${replaying ? 'animate-spin' : ''}`} />
                {replaying ? 'Executing...' : 'Confirm Safe Replay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DeadLetterQueuePage;
