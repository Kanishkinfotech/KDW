import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, RefreshCw, CheckCircle2, AlertCircle, Activity, Download } from 'lucide-react';
import SEO from '../../../components/SEO';

export default function AdminDownloadActivity() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
        search: search.trim(),
        result: resultFilter,
        eventType: eventTypeFilter
      });
      const res = await fetch(`/api/admin/downloads/activity?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
        setMetrics(json.metrics || {});
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
    fetchActivity();
  }, [page, resultFilter, eventTypeFilter]);

  return (
    <div className="space-y-6">
      <SEO title="Download Activity Stream | KDW Admin" description="Real-time telemetry and audit trail of digital delivery attempts" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Download Activity Log</h1>
          <p className="text-sm text-slate-500 mt-1">Immutable streaming events, telemetry latency, and delivery results.</p>
        </div>
        <button onClick={fetchActivity} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Latency / Duration Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div>
          <span className="text-xs text-slate-500 block">Total Logged Events</span>
          <span className="text-lg font-black text-slate-900">{metrics.totalEvents || totalCount}</span>
        </div>
        <div className="border-l border-slate-100">
          <span className="text-xs text-slate-500 block">Average Duration</span>
          <span className="text-lg font-black text-blue-600">{(metrics.avgDurationMs || 0) / 1000}s</span>
        </div>
        <div className="border-l border-slate-100">
          <span className="text-xs text-slate-500 block">Median Duration (P50)</span>
          <span className="text-lg font-black text-emerald-600">{(metrics.medianDurationMs || 0) / 1000}s</span>
        </div>
        <div className="border-l border-slate-100">
          <span className="text-xs text-slate-500 block">95th Percentile (P95)</span>
          <span className="text-lg font-black text-indigo-600">{(metrics.p95DurationMs || 0) / 1000}s</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchActivity(); }} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by IP, email, product, or error reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800">
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <Filter size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-600">Result:</span>
            <select
              value={resultFilter}
              onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
            >
              <option value="ALL">All Results</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">Event Type:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="download_completed">Completed</option>
              <option value="download_failed">Failed</option>
              <option value="limit_reached">Limit Reached</option>
              <option value="token_expired">Token Expired</option>
              <option value="access_revoked">Access Revoked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading streaming telemetry...
          </div>
        ) : logs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Clock size={40} className="opacity-20 mb-2" />
            <p>No activity events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Product & Version</th>
                  <th className="px-5 py-3.5">Event / Result</th>
                  <th className="px-5 py-3.5">Latency</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Failure / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">
                      <div>{new Date(l.createdAt).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{l.customerEmail || 'Guest'}</div>
                      <div className="text-[10px] text-slate-400">Order: {l.order?.orderNumber || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{l.productName}</div>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                        v{l.productVersion || '1.0'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                        l.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {l.result === 'SUCCESS' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                        {l.eventType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {l.durationMs ? `${(l.durationMs / 1000).toFixed(2)}s` : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{l.ipAddress || '127.0.0.1'}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                      {l.failureReason || l.failureCategory || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {logs.length} of {totalCount} events</span>
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
