import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Globe, Search, Filter, RefreshCw, Clock, ArrowUpDown } from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemApiLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [statusCode, setStatusCode] = useState('');
  const [minLatency, setMinLatency] = useState('');
  const [search, setSearch] = useState('');

  const fetchApiLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/system/api-logs', {
        params: {
          statusCode: statusCode || undefined,
          minLatency: minLatency || undefined,
          search: search || undefined
        },
        withCredentials: true
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch API telemetry logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiLogs();
  }, [statusCode, minLatency]);

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchApiLogs} isLoading={loading} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Request ID, endpoint path, IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchApiLogs()}
            className="w-full bg-white border border-sky-100 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            className="bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs"
          >
            <option value="">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>

          <select
            value={minLatency}
            onChange={(e) => setMinLatency(e.target.value)}
            className="bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs"
          >
            <option value="">All Latencies</option>
            <option value="100">&gt; 100 ms</option>
            <option value="300">&gt; 300 ms</option>
            <option value="1000">&gt; 1,000 ms (1s)</option>
          </select>

          <button
            onClick={fetchApiLogs}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition shadow-2xs"
          >
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
          <p className="text-xs font-medium">Loading API telemetry...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
          <Globe className="w-8 h-8 mx-auto text-sky-500 mb-2" />
          <h4 className="text-sm font-bold text-slate-900">No API Logs Found</h4>
          <p className="text-xs text-slate-500 mt-1">API requests are recorded in real-time as traffic flows through endpoints.</p>
        </div>
      ) : (
        <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-sky-100 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Endpoint Route</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Response Size</th>
                  <th className="px-4 py-3">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/70 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        log.method === 'GET'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : log.method === 'POST'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.method === 'PATCH' || log.method === 'PUT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.statusCode < 300
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.statusCode < 500
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={log.latencyMs > 500 ? 'text-rose-600' : log.latencyMs > 200 ? 'text-amber-600' : 'text-emerald-600'}>
                        {log.latencyMs} ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.responseSizeBytes ? `${(log.responseSizeBytes / 1024).toFixed(1)} KB` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.ipAddress || '—'}
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
export default SystemApiLogsPage;
