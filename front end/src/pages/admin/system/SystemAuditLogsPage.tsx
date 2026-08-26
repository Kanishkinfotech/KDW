import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  Tag
} from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemAuditLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/settings/admin/audit', {
        params: {
          group: groupFilter !== 'ALL' ? groupFilter : undefined,
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
          search: search || undefined
        },
        withCredentials: true
      });
      if (res.data.success) {
        setAuditLogs(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, groupFilter]);

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchAuditLogs} isLoading={loading} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by setting key, actor, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATED">Created</option>
            <option value="UPDATED">Updated</option>
            <option value="TESTED">Tested</option>
            <option value="ROLLED_BACK">Rolled Back</option>
          </select>

          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading audit trail...</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
          <h4 className="text-sm font-semibold text-white">No Audit Logs Found</h4>
          <p className="text-xs text-slate-400 mt-1">Audit log records are generated on all administrative mutations.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor / Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Target Key</th>
                  <th className="px-4 py-3">Details / Audit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      <div>{log.actorName || 'Administrator'}</div>
                      <div className="text-[10px] text-slate-500">{log.actorRole || 'SUPER_ADMIN'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'CREATED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.action === 'ROLLED_BACK'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : log.action === 'TESTED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {log.group}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-[11px]">
                      {log.settingKey || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-[11px] max-w-md">
                      {log.details || '—'}
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
export default SystemAuditLogsPage;
