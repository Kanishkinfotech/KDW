import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Filter, RefreshCw, CheckCircle2, RotateCcw, Wrench, ShieldAlert } from 'lucide-react';
import SEO from '../../../components/SEO';
import { authFetch } from '../../../api/apiClient';

export default function AdminFailedDownloads() {
  const [loading, setLoading] = useState(true);
  const [failures, setFailures] = useState<any[]>([]);
  const [priorityCounts, setPriorityCounts] = useState<any>({});
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isResolved, setIsResolved] = useState('false');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchFailures = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        priority: priorityFilter,
        category: categoryFilter,
        isResolved
      });
      const res = await authFetch(`/api/admin/downloads/failed-downloads?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setFailures(json.data || []);
        setPriorityCounts(json.priorityCounts || {});
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailures();
  }, [page, priorityFilter, categoryFilter, isResolved]);

  const handleResolve = async (id: string) => {
    const notes = prompt('Enter resolution notes (optional):') || 'Resolved by admin.';
    try {
      const res = await authFetch(`/api/admin/downloads/failed-downloads/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage('Failure marked as resolved.');
        fetchFailures();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/downloads/failed-downloads/${id}/retry`, { method: 'POST' });
      const json = await res.json();
      setActionMessage(json.message || (json.success ? 'Retry succeeded!' : 'Retry failed.'));
      fetchFailures();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Failed Downloads Queue | KDW Admin" description="Operational triage queue for digital delivery rejections" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Failed Downloads Operational Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Priority queue for resolving Google Drive permissions, corrupted links, and token limits.</p>
        </div>
        <button onClick={fetchFailures} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-500 hover:text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Priority Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => { setPriorityFilter('CRITICAL'); setIsResolved('false'); }}
          className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 cursor-pointer hover:bg-rose-100/70 transition-all text-center"
        >
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Critical Severity</span>
          <span className="text-2xl font-black text-rose-900">{priorityCounts.CRITICAL || 0}</span>
          <span className="text-[11px] text-rose-600 block mt-0.5">Drive permission / missing files</span>
        </div>
        <div
          onClick={() => { setPriorityFilter('HIGH'); setIsResolved('false'); }}
          className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-all text-center"
        >
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">High Severity</span>
          <span className="text-2xl font-black text-amber-900">{priorityCounts.HIGH || 0}</span>
          <span className="text-[11px] text-amber-600 block mt-0.5">Multi-customer impact</span>
        </div>
        <div
          onClick={() => { setPriorityFilter('MEDIUM'); setIsResolved('false'); }}
          className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 cursor-pointer hover:bg-blue-100/70 transition-all text-center"
        >
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Medium Severity</span>
          <span className="text-2xl font-black text-blue-900">{priorityCounts.MEDIUM || 0}</span>
          <span className="text-[11px] text-blue-600 block mt-0.5">Limit reached events</span>
        </div>
        <div
          onClick={() => { setPriorityFilter('LOW'); setIsResolved('false'); }}
          className="bg-slate-100 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-200/70 transition-all text-center"
        >
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Low Severity</span>
          <span className="text-2xl font-black text-slate-900">{priorityCounts.LOW || 0}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Expired client tokens</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsResolved('false'); setPage(1); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              isResolved === 'false' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active Issues
          </button>
          <button
            onClick={() => { setIsResolved('true'); setPage(1); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              isResolved === 'true' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolved Archive
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">Failure Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none max-w-[160px] truncate"
            >
              <option value="ALL">All Categories</option>
              <option value="Drive permission denied">Drive permission denied</option>
              <option value="Drive file missing">Drive file missing</option>
              <option value="Limit reached">Limit reached</option>
              <option value="Expired token">Expired token</option>
              <option value="Revoked token">Revoked token</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading failure queue...
          </div>
        ) : failures.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <CheckCircle2 size={44} className="text-emerald-500 mb-2 opacity-80" />
            <p>No failures in queue! System healthy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Failure Category</th>
                  <th className="px-5 py-3.5">Attempts</th>
                  <th className="px-5 py-3.5">First / Last Failed</th>
                  <th className="px-5 py-3.5">Customer / Order</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {failures.map((f) => {
                  const pBadge =
                    f.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                    f.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    f.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${pBadge}`}>
                          {f.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{f.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">File ID: {f.driveFileId || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-800">{f.failureCategory}</div>
                        <div className="text-[11px] text-slate-500 max-w-xs truncate">{f.errorMessage}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {f.attemptCount}x
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        <div>Last: {new Date(f.lastFailedAt).toLocaleTimeString()} {new Date(f.lastFailedAt).toLocaleDateString()}</div>
                        <div className="text-slate-400">First: {new Date(f.firstFailedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-800">{f.customerEmail || 'Guest'}</div>
                        <div className="text-[10px] text-slate-400">Order: {f.order?.orderNumber || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRetry(f.id)}
                            title="Retry File Health Test"
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors"
                          >
                            Retry Test
                          </button>
                          {!f.isResolved && (
                            <button
                              onClick={() => handleResolve(f.id)}
                              title="Mark Resolved"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {failures.length} of {totalCount} failures</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <span className="font-bold text-slate-800">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
