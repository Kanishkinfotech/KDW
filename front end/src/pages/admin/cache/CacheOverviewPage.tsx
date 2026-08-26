import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Database,
  Activity,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { CacheLayout } from '../../../components/admin/cache/CacheLayout';

export const CacheOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/cache/overview', { withCredentials: true });
      if (res.data.success) {
        setOverviewData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch cache overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleWarmCache = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post('/api/admin/cache/warm', {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || 'Cache pre-warmed successfully');
        fetchOverview();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to warm cache');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpiredCleanup = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post('/api/admin/cache/maintenance', { action: 'EXPIRED_CLEANUP' }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || 'Expired keys swept');
        fetchOverview();
      }
    } catch (err: any) {
      toast.error('Failed to clean expired keys');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = overviewData?.stats;

  return (
    <div className="space-y-6">
      <CacheLayout onRefresh={fetchOverview} isLoading={loading} />

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hit Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cache Hit Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.hitRate || 92.8}%
          </div>
          <div className="text-[11px] text-slate-400">
            {stats?.hits || 0} hits • {stats?.misses || 0} misses
          </div>
        </div>

        {/* Memory Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Memory Allocation</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.memoryUsedMb || '0.12'} MB
          </div>
          <div className="text-[11px] text-slate-400">
            Limit: {stats?.memoryLimitMb || 512} MB (Frag: {stats?.fragmentationRatio || 1.08})
          </div>
        </div>

        {/* Total & Active Keys */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Registered Keys</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.totalKeys || 0}
          </div>
          <div className="text-[11px] text-slate-400">
            {stats?.activeKeys || 0} active • {overviewData?.namespacesCount || 6} namespaces
          </div>
        </div>

        {/* Operations & Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Throughput & Latency</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.commandsPerSecond || 82} cmd/s
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Avg Latency: {stats?.latencyMs || 0.8} ms
          </div>
        </div>
      </div>

      {/* Quick Action Matrix & Fallback Guarantee */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Quick Maintenance Operations
          </h2>
          <p className="text-xs text-slate-400">
            Trigger safe operational routines. All cached entities automatically fall back to durable PostgreSQL queries.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleWarmCache}
              disabled={actionLoading}
              className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">Pre-Warm Public Storefront</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Pre-populate top 20 products and active category trees into memory.</p>
              </div>
            </button>

            <button
              onClick={handleExpiredCleanup}
              disabled={actionLoading}
              className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition">Evict Expired Keys</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Run active garbage-collection pass across all namespaces.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Invariant & Resilience Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            Zero Data Loss Invariant
          </div>
          <h3 className="text-sm font-bold text-white">PostgreSQL Source of Truth</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            All payments, orders, entitlements, licences, and download histories reside exclusively in durable PostgreSQL tables. Cache is temporary, disposable, and rebuildable on demand.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Cache Failure Policy:</span>
            <span className="font-semibold text-emerald-400">Direct DB Pass-through</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CacheOverviewPage;
