import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  Smartphone,
  Lock
} from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemLoginsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [userTypeFilter, setUserTypeFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLoginLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, analyticsRes] = await Promise.all([
        axios.get('/api/admin/system/logins', {
          params: {
            userType: userTypeFilter,
            result: resultFilter,
            isSuspicious: suspiciousOnly ? 'true' : undefined,
            search: search || undefined
          },
          withCredentials: true
        }),
        axios.get('/api/admin/system/logins/analytics', { withCredentials: true })
      ]);

      if (logsRes.data.success) {
        setLogs(logsRes.data.data);
      }
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch login logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginLogs();
  }, [userTypeFilter, resultFilter, suspiciousOnly]);

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchLoginLogs} isLoading={loading} />

      {/* Security Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Logins</span>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white">{analytics?.totalLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {analytics?.adminLogins || 0} Staff • {analytics?.customerLogins || 0} Customers
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Successful</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{analytics?.successfulLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Authorized sessions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Failed Logins</span>
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{analytics?.failedLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Invalid credentials</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Failure Rate</span>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white">{analytics?.failureRate || 0}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Target: &lt; 5.0%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Suspicious Attempts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{analytics?.suspiciousLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Brute-force / Tor detections</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by email, name, IP address, failure reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLoginLogs()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All User Types</option>
            <option value="ADMIN">Staff / Admin</option>
            <option value="CUSTOMER">Customers</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
            <option value="BLOCKED">Blocked Only</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              checked={suspiciousOnly}
              onChange={(e) => setSuspiciousOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span>Suspicious Only</span>
          </label>
        </div>
      </div>

      {/* Login Logs Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading authentication logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Login Logs Found</h4>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User / Identity</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Device / User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      <div>{l.email}</div>
                      {l.userName && <div className="text-[10px] text-slate-400">{l.userName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        l.userType === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {l.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                      {l.eventType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.result === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : l.result === 'BLOCKED'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {l.result}
                        </span>
                        {l.isSuspicious && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            SUSPICIOUS
                          </span>
                        )}
                      </div>
                      {l.failureReason && (
                        <div className="text-[10px] text-rose-400 mt-0.5 max-w-xs truncate">
                          {l.failureReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                      {l.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] max-w-xs truncate" title={l.userAgent}>
                      {l.userAgent || '—'}
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
export default SystemLoginsPage;
