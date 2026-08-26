import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Cpu, Search, Filter, RefreshCw, RotateCcw, XCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemJobsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const [jobsRes, metricsRes] = await Promise.all([
        axios.get('/api/admin/system/jobs', {
          params: {
            queue: queueFilter,
            status: statusFilter,
            search: search || undefined
          },
          withCredentials: true
        }),
        axios.get('/api/admin/system/jobs/metrics', { withCredentials: true })
      ]);

      if (jobsRes.data.success) {
        setJobs(jobsRes.data.data);
      }
      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch background worker jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [queueFilter, statusFilter]);

  const handleRetry = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await axios.post(`/api/admin/system/jobs/${id}/retry`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || 'Job requeued successfully');
        fetchJobs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retry job');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await axios.post(`/api/admin/system/jobs/${id}/cancel`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || 'Job cancelled');
        fetchJobs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel job');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchJobs} isLoading={loading} />

      {/* Queue Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Queued Jobs</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{metrics?.queued || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting worker pickup</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Running</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{metrics?.running || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Actively processing</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{metrics?.completed || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Successfully fulfilled</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Failed</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{metrics?.failed || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Eligible for retry</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Dead Letter</span>
            <XCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{metrics?.deadLetter || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Exceeded max attempts</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by job type, error message, resource ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={queueFilter}
            onChange={(e) => setQueueFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Queues</option>
            <option value="HIGH_PRIORITY">High Priority</option>
            <option value="DEFAULT">Default</option>
            <option value="BULK">Bulk</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="DEAD_LETTER">Dead Letter</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading queue items...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Background Jobs in this Queue</h4>
          <p className="text-xs text-slate-400 mt-1">Background worker queues are currently clear.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Job Type</th>
                  <th className="px-4 py-3">Queue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Related Resource</th>
                  <th className="px-4 py-3">Error / Note</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(j.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {j.jobType}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {j.queue}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : j.status === 'RUNNING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : j.status === 'QUEUED'
                          ? 'bg-blue-500/10 text-blue-400'
                          : j.status === 'DEAD_LETTER'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-[11px]">
                      {j.attempts} / {j.maxAttempts}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                      {j.relatedResourceId || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] max-w-xs truncate" title={j.errorMessage}>
                      {j.errorMessage || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(j.status === 'FAILED' || j.status === 'DEAD_LETTER' || j.status === 'CANCELLED') && (
                          <button
                            onClick={() => handleRetry(j.id)}
                            disabled={actionLoadingId === j.id}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition border border-slate-700 inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                        {j.status === 'QUEUED' && (
                          <button
                            onClick={() => handleCancel(j.id)}
                            disabled={actionLoadingId === j.id}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs rounded transition border border-rose-500/30"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default SystemJobsPage;
