import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Activity, Search, RefreshCw, Filter, ShieldAlert } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const ActivityLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users/activity-logs', {
        params: { riskLevel: riskFilter, search: searchTerm },
        withCredentials: true
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [riskFilter]);

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchLogs} isLoading={loading} />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff actions, emails, or justifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
            <button
              onClick={fetchLogs}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200"
            >
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Action Performed</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Reason / Context</th>
                <th className="px-4 py-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500 mb-2" />
                    Querying activity audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No activity logs found for this search.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{l.actorName}</div>
                      <div className="text-[10px] text-slate-500">{l.actorEmail} ({l.actorRole})</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">
                      {l.action}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {l.resourceType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.riskLevel === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : l.riskLevel === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {l.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {l.reason || 'Nominal administrative operation'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {l.result}
                      </span>
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
export default ActivityLogsPage;
