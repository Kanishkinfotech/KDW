import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  RefreshCw,
  RotateCw,
  Search,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const FailedJobsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [failedRuns, setFailedRuns] = useState<any[]>([]);

  const fetchFailedRuns = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/runs?status=FAILED', { withCredentials: true });
      if (res.data.success) {
        setFailedRuns(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load failed jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedRuns();
  }, []);

  const handleRetryJob = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/automation/runs/${id}/replay`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchFailedRuns();
      }
    } catch (err) {
      toast.error('Failed to retry job');
    }
  };

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchFailedRuns} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Failed & Retrying Automation Jobs
          </h2>
          <p className="text-xs text-slate-400">
            Jobs that encountered transient or permanent execution errors during pipeline step dispatch.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Trigger Event</th>
                <th className="px-4 py-3">Failure Reason</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                    Scanning failed job records...
                  </td>
                </tr>
              ) : failedRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Zero failed jobs in queue.
                  </td>
                </tr>
              ) : (
                failedRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {r.workflowName}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-amber-400">
                      {r.triggerEventType}
                    </td>
                    <td className="px-4 py-3 text-rose-300 max-w-xs truncate">
                      {r.errorMessage || 'Execution step error'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {r.attemptCount} / {r.maxAttempts}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <NavLink
                          to={`/admin/automation/runs/${r.id}`}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
                        >
                          Inspect
                        </NavLink>
                        <button
                          onClick={() => handleRetryJob(r.id)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold transition flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          Retry
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default FailedJobsPage;
