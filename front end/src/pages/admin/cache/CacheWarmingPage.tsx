import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Flame, RefreshCw, CheckCircle2, Play, Package, FolderTree, Sparkles } from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheWarmingPage: React.FC = () => {
  const [warming, setWarming] = useState(false);
  const [warmResult, setWarmResult] = useState<any>(null);

  const handleRunWarming = async () => {
    try {
      setWarming(true);
      const res = await axios.post('/api/admin/cache/warm', {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        setWarmResult(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to warm cache');
    } finally {
      setWarming(false);
    }
  };

  return (
    <div className="space-y-6">
      <CacheLayout />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              Proactive Cache Warming Strategy
            </h2>
            <p className="text-xs text-slate-400">Pre-populate critical public entities into memory before peak customer traffic.</p>
          </div>

          <button
            onClick={handleRunWarming}
            disabled={warming}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            {warming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {warming ? 'Warming in Progress...' : 'Execute Cache Warming'}
          </button>
        </div>

        {warmResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Cache Pre-Warmed Successfully</div>
                <div className="text-[11px] text-emerald-400">
                  {warmResult.warmedProducts} published products & {warmResult.warmedCategories} category hierarchies loaded.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Catalog Products</h3>
            <p className="text-xs text-slate-400">Top 20 most viewed and active published products (900s TTL).</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 w-fit">
              <FolderTree className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Category Hierarchies</h3>
            <p className="text-xs text-slate-400">Store navigation categories and nested child trees (1800s TTL).</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 w-fit">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Public Banners & SEO</h3>
            <p className="text-xs text-slate-400">Storefront hero banners, announcements, and sitemap metadata.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CacheWarmingPage;
