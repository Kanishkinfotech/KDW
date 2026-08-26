import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Key, Search, Trash2, RefreshCw, Filter, Layers, HardDrive } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheKeysPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('ALL');

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/cache/keys', {
        params: {
          environment: selectedEnv,
          search: searchTerm,
          limit: 100
        },
        withCredentials: true
      });
      if (res.data.success) {
        setKeys(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load cache keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [selectedEnv]);

  const handleEvict = async (key: string) => {
    try {
      const res = await axios.post('/api/admin/cache/clear-key', { key }, { withCredentials: true });
      if (res.data.success) {
        toast.success(`Key '${key}' evicted`);
        fetchKeys();
      }
    } catch (err) {
      toast.error('Failed to evict key');
    }
  };

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchKeys} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search keys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchKeys()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={fetchKeys}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Environment:</span>
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Environments</option>
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="TEST">Test</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Cache Key Name</th>
                <th className="px-4 py-3">Namespace</th>
                <th className="px-4 py-3">Size (Bytes)</th>
                <th className="px-4 py-3">TTL Remaining</th>
                <th className="px-4 py-3">Environment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                    Querying key space...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No cache keys found matching criteria.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-white text-xs font-semibold">
                      {k.key}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-emerald-400">
                        {k.namespace}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {k.sizeBytes} B
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{k.ttlSeconds}s</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {k.environment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEvict(k.key)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-xs font-semibold transition"
                      >
                        Evict
                      </button>
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
export default CacheKeysPage;
