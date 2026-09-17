import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Wrench, RefreshCw, Trash2, Flame, Clock, HardDrive, ShieldAlert, History } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheMaintenancePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [targetNamespace, setTargetNamespace] = useState('kdw:prod:product');
  const [targetKey, setTargetKey] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/admin/cache/maintenance-logs', { withCredentials: true });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load maintenance history');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleMaintenance = async (action: string) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/admin/cache/maintenance', { action }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchLogs();
      }
    } catch (err) {
      toast.error(`Maintenance action '${action}' failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearNamespace = async () => {
    if (!targetNamespace) return;
    try {
      setLoading(true);
      const res = await axios.post('/api/admin/cache/clear-namespace', { namespace: targetNamespace }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchLogs();
      }
    } catch (err) {
      toast.error('Failed to clear namespace');
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = async () => {
    if (!targetKey) {
      toast.error('Please enter a cache key');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('/api/admin/cache/clear-key', { key: targetKey }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        setTargetKey('');
        fetchLogs();
      }
    } catch (err) {
      toast.error('Failed to clear key');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    const reason = window.prompt('EMERGENCY ACTION: Enter reason for full cache purge:');
    if (!reason) return;

    try {
      setLoading(true);
      const res = await axios.post('/api/admin/cache/clear-all', { reason }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchLogs();
      }
    } catch (err) {
      toast.error('Failed to purge cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchLogs} isLoading={loading} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Controls */}
        <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-sky-600" />
            Direct Maintenance Operations
          </h2>

          <div className="space-y-3 pt-2">
            {/* Clear by Namespace */}
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-2">
              <label className="text-xs font-semibold text-slate-700">Clear by Namespace</label>
              <div className="flex items-center gap-2">
                <select
                  value={targetNamespace}
                  onChange={(e) => setTargetNamespace(e.target.value)}
                  className="flex-1 bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-2xs"
                >
                  <option value="kdw:prod:product">kdw:prod:product</option>
                  <option value="kdw:prod:category">kdw:prod:category</option>
                  <option value="kdw:prod:search">kdw:prod:search</option>
                  <option value="kdw:prod:rate">kdw:prod:rate</option>
                  <option value="kdw:prod:coupon">kdw:prod:coupon</option>
                </select>
                <button
                  onClick={handleClearNamespace}
                  disabled={loading}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Purge
                </button>
              </div>
            </div>

            {/* Clear by Key */}
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-2">
              <label className="text-xs font-semibold text-slate-700">Clear Individual Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. kdw:prod:product:v3:agency-pack"
                  value={targetKey}
                  onChange={(e) => setTargetKey(e.target.value)}
                  className="flex-1 bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
                />
                <button
                  onClick={handleClearKey}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Rebuild & Cleanup */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleMaintenance('EXPIRED_CLEANUP')}
                disabled={loading}
                className="p-4 bg-sky-50/50 hover:bg-sky-100/60 border border-sky-100 rounded-xl text-left transition cursor-pointer"
              >
                <Clock className="w-4 h-4 text-sky-600 mb-1" />
                <div className="text-xs font-bold text-slate-900">Expired Cleanup</div>
                <div className="text-[10px] text-slate-500">Garbage collection sweep</div>
              </button>

              <button
                onClick={() => handleMaintenance('REBUILD')}
                disabled={loading}
                className="p-4 bg-sky-50/50 hover:bg-sky-100/60 border border-sky-100 rounded-xl text-left transition cursor-pointer"
              >
                <Flame className="w-4 h-4 text-emerald-600 mb-1" />
                <div className="text-xs font-bold text-slate-900">Rebuild from DB</div>
                <div className="text-[10px] text-slate-500">Reload top products</div>
              </button>
            </div>

            {/* Clear All Emergency */}
            <div className="pt-2">
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Purge All Cache (Emergency Recovery)
              </button>
            </div>
          </div>
        </div>

        {/* Maintenance History */}
        <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-sky-600" />
            Maintenance Audit Trail
          </h2>

          <div className="overflow-y-auto max-h-96 pr-1">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No maintenance events recorded yet.</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="bg-sky-50/40 p-3.5 rounded-xl border border-sky-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-800">{l.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(l.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-700 text-[11px]">{l.reason || 'Routine maintenance'}</div>
                    <div className="text-[10px] text-slate-500">
                      Actor: <strong className="text-slate-700">{l.actorName}</strong> • Affected: <strong className="text-slate-900 font-mono">{l.keysAffected}</strong> keys
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CacheMaintenancePage;
