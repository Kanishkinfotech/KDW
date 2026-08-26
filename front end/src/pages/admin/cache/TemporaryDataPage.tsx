import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Layers, Search, RefreshCw, CheckCircle2, ShieldAlert, Key, Trash2 } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const TemporaryDataPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<any[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/cache/keys', {
        params: {
          namespace: selectedNamespace,
          search: searchTerm,
          limit: 50
        },
        withCredentials: true
      });
      if (res.data.success) {
        setKeys(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load temporary data store');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [selectedNamespace]);

  const handleClearKey = async (key: string) => {
    if (!window.confirm(`Clear temporary key '${key}'? The source data will be rebuilt from PostgreSQL on next request.`)) return;

    try {
      const res = await axios.post('/api/admin/cache/clear-key', { key }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchKeys();
      }
    } catch (err) {
      toast.error('Failed to clear key');
    }
  };

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchKeys} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search temporary keys (e.g. kdw:prod:product)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchKeys()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              onClick={fetchKeys}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Namespace:</span>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Temporary Stores</option>
              <option value="kdw:prod:product">Product Listing / Pages</option>
              <option value="kdw:prod:category">Category Tree</option>
              <option value="kdw:prod:search">Search Suggestions</option>
              <option value="kdw:prod:rate">Rate Limit Counters</option>
              <option value="kdw:prod:coupon">Coupon Reservations</option>
              <option value="kdw:prod:report">Report Jobs Status</option>
            </select>
          </div>
        </div>

        {/* Temporary Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Key & Namespace</th>
                <th className="px-4 py-3">TTL / Expiration</th>
                <th className="px-4 py-3">Source of Truth</th>
                <th className="px-4 py-3">Rebuildable</th>
                <th className="px-4 py-3">Hits</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
                    Scanning temporary key memory space...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No active temporary cache keys found for selected namespace.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-white text-xs">{k.key}</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">{k.namespace}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{k.ttlSeconds}s</div>
                      <div className="text-[10px] text-slate-400">Exp: {new Date(k.expiresAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {k.sourceOfTruth}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        YES (AUTO)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {k.hitCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleClearKey(k.key)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-[11px] font-semibold transition"
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
export default TemporaryDataPage;
