import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FileText, RefreshCw, CheckCircle2, Shield } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheAuditPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/cache/maintenance-logs', { withCredentials: true });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load cache audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchAuditLogs} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Immutable Cache Audit Trail
          </h2>
          <p className="text-xs text-slate-400">Complete log of all manual purges, namespace invalidations, warming runs, and automated GC passes.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Keys Affected</th>
                <th className="px-4 py-3">Reason / Context</th>
                <th className="px-4 py-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No cache maintenance records found.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {l.action}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-200 font-medium">{l.actorName}</span>
                      <span className="text-[10px] text-slate-500 block">({l.actorRole})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      {l.keysAffected}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {l.reason || 'Automated maintenance'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
export default CacheAuditPage;
