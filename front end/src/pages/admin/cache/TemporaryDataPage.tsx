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

      <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-xs space-y-4">
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
                className="w-full bg-white border border-sky-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition shadow-2xs"
              />
            </div>
            <button
              onClick={fetchKeys}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Namespace:</span>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-sky-500 shadow-2xs"
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
        <div className="overflow-x-auto border border-sky-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-sky-50/80 text-sky-900 uppercase tracking-wider font-semibold border-b border-sky-100 text-[11px]">
              <tr>
                <th className="px-4 py-3">Key & Namespace</th>
                <th className="px-4 py-3">TTL / Expiration</th>
                <th className="px-4 py-3">Source of Truth</th>
                <th className="px-4 py-3">Rebuildable</th>
                <th className="px-4 py-3">Hits</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-600 mb-2" />
                    Scanning temporary key memory space...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No active temporary cache keys found for selected namespace.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-medium text-slate-900 text-xs">{k.key}</div>
                      <div className="text-[10px] text-sky-700 font-semibold mt-0.5">{k.namespace}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">{k.ttlSeconds}s</div>
                      <div className="text-[10px] text-slate-500">Exp: {new Date(k.expiresAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {k.sourceOfTruth}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        YES (AUTO)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {k.hitCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleClearKey(k.key)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
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
