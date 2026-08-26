import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FolderTree, RefreshCw, Trash2, Zap, Database, ShieldCheck } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheNamespacesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [namespaces, setNamespaces] = useState<any[]>([]);

  const fetchNamespaces = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/cache/namespaces', { withCredentials: true });
      if (res.data.success) {
        setNamespaces(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load namespaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNamespaces();
  }, []);

  const handleClearNamespace = async (namespace: string) => {
    if (!window.confirm(`Purge all keys in namespace '${namespace}'? PostgreSQL will rebuild data on demand.`)) return;

    try {
      const res = await axios.post('/api/admin/cache/clear-namespace', { namespace }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchNamespaces();
      }
    } catch (err) {
      toast.error('Failed to clear namespace');
    }
  };

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchNamespaces} isLoading={loading} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              Configured Cache Namespaces & Invalidation Policies
            </h2>
            <p className="text-xs text-slate-400">Isolated key prefixes with explicit TTL policies and database rebuild sources.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {namespaces.map((ns) => (
            <div key={ns.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-white">{ns.namespace}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">Env: {ns.environment}</div>
                </div>
                <button
                  onClick={() => handleClearNamespace(ns.namespace)}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-lg transition"
                >
                  Purge Namespace
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Active Keys</span>
                  <strong className="text-white font-mono">{ns.keyCount}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Default TTL</span>
                  <strong className="text-white">{ns.defaultTtlSeconds}s</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Max Staleness</span>
                  <strong className="text-white">{ns.maxStalenessSeconds}s</strong>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Rebuild Source:</span>
                  <span className="font-semibold text-slate-200">{ns.rebuildSource}</span>
                </div>
                <div className="text-slate-400">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 mt-2 mb-1">Invalidation Triggers</span>
                  <div className="flex flex-wrap gap-1">
                    {ns.invalidationTriggers?.map((trig: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-emerald-400 rounded font-mono">
                        {trig}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default CacheNamespacesPage;
