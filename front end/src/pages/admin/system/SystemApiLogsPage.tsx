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
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Request ID, endpoint path, IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchApiLogs()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
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
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Latencies</option>
            <option value="100">&gt; 100 ms</option>
            <option value="300">&gt; 300 ms</option>
            <option value="1000">&gt; 1,000 ms (1s)</option>
          </select>

          <button
            onClick={fetchApiLogs}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
          >
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading API telemetry...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Globe className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No API Logs Found</h4>
          <p className="text-xs text-slate-400 mt-1">API requests are recorded in real-time as traffic flows through endpoints.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
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
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        log.method === 'GET'
                          ? 'bg-blue-500/10 text-blue-400'
                          : log.method === 'POST'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.method === 'PATCH' || log.method === 'PUT'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.statusCode < 300
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.statusCode < 500
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={log.latencyMs > 500 ? 'text-rose-400' : log.latencyMs > 200 ? 'text-amber-400' : 'text-emerald-400'}>
                        {log.latencyMs} ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {log.responseSizeBytes ? `${(log.responseSizeBytes / 1024).toFixed(1)} KB` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
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
