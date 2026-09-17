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

      {/* Security Analytics Summary Cards in Light Blue Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Total Logins</span>
            <Shield className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{analytics?.totalLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {analytics?.adminLogins || 0} Staff • {analytics?.customerLogins || 0} Customers
          </div>
        </div>

        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Successful</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{analytics?.successfulLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Authorized sessions</div>
        </div>

        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Failed Logins</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{analytics?.failedLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Invalid credentials</div>
        </div>

        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Failure Rate</span>
            <Lock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{analytics?.failureRate || 0}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Target: &lt; 5.0%</div>
        </div>

        <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Suspicious Attempts</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{analytics?.suspiciousLogins || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Brute-force / Tor detections</div>
        </div>
      </div>

      {/* Filters & Search in Light Blue Theme */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by email, name, IP address, failure reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLoginLogs()}
            className="w-full bg-white border border-sky-100 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs"
          >
            <option value="ALL">All User Types</option>
            <option value="ADMIN">Staff / Admin</option>
            <option value="CUSTOMER">Customers</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="bg-white border border-sky-100 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs"
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
            <option value="BLOCKED">Blocked Only</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-white border border-sky-100 px-3 py-2 rounded-xl shadow-2xs">
            <input
              type="checkbox"
              checked={suspiciousOnly}
              onChange={(e) => setSuspiciousOnly(e.target.checked)}
              className="rounded bg-white border-slate-300 text-sky-600 focus:ring-0"
            />
            <span>Suspicious Only</span>
          </label>
        </div>
      </div>

      {/* Login Logs Table in Light Blue Theme */}
      {loading ? (
        <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
          <p className="text-xs font-medium">Loading authentication logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-sky-100 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
          <ShieldCheck className="w-8 h-8 mx-auto text-sky-500 mb-2" />
          <h4 className="text-sm font-bold text-slate-900">No Login Logs Found</h4>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-sky-100 text-[10px]">
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
              <tbody className="divide-y divide-sky-100/70 font-sans">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="font-semibold">{l.email}</div>
                      {l.userName && <div className="text-[10px] text-slate-400">{l.userName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        l.userType === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {l.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 font-medium">
                      {l.eventType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.result === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : l.result === 'BLOCKED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {l.result}
                        </span>
                        {l.isSuspicious && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            SUSPICIOUS
                          </span>
                        )}
                      </div>
                      {l.failureReason && (
                        <div className="text-[10px] text-rose-600 mt-0.5 max-w-xs truncate font-medium">
                          {l.failureReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                      {l.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate" title={l.userAgent}>
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
