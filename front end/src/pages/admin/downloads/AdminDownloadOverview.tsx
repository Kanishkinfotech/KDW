import React, { useState, useEffect } from 'react';
import { 
  Download, ShieldCheck, AlertCircle, Clock, CheckCircle2, 
  Archive, HardDrive, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../../components/SEO';
import StatCard from '../../../components/admin/StatCard';
import ReportFilterBar from '../../../components/admin/ReportFilterBar';

export default function AdminDownloadOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [data, setData] = useState<any>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/downloads/overview?range=${range}&productId=${selectedProduct}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch download overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [range, selectedProduct]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const products = data?.products || [];

  return (
    <div className="space-y-6">
      <SEO title="Download Management Overview | KDW Admin" description="Digital file delivery and operational metrics" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Download Operations & Health</h1>
          <p className="text-sm text-slate-500 mt-1">Live operational monitor for secure digital product fulfillment, token streaming, and Drive health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/downloads/entitlements"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <ShieldCheck size={14} />
            Manage Entitlements
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        products={products}
        selectedProduct={selectedProduct}
        onProductChange={setSelectedProduct}
        onRefresh={fetchOverview}
        metadata={data?.metadata}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/admin/downloads/entitlements')} className="cursor-pointer">
          <StatCard
            title="Active Entitlements"
            value={kpis.activeEntitlements?.toLocaleString() || '0'}
            icon={ShieldCheck}
            description="Purchasers with active download rights"
          />
        </div>
        <div onClick={() => navigate('/admin/downloads/activity')} className="cursor-pointer">
          <StatCard
            title="Downloads Today"
            value={kpis.downloadAttemptsToday?.toLocaleString() || '0'}
            icon={Download}
            description={`${kpis.successfulDownloads || 0} successes • ${kpis.failedDownloads || 0} fails`}
          />
        </div>
        <div onClick={() => navigate('/admin/downloads/activity?result=SUCCESS')} className="cursor-pointer">
          <StatCard
            title="Download Success Rate"
            value={`${kpis.downloadSuccessRate || 100}%`}
            icon={CheckCircle2}
            description={`Customer completion rate: ${kpis.customerCompletionRate || 0}%`}
          />
        </div>
        <div onClick={() => navigate('/admin/downloads/failed')} className="cursor-pointer">
          <StatCard
            title="Unresolved Failures"
            value={kpis.unresolvedFailures?.toString() || '0'}
            icon={AlertCircle}
            description={`${kpis.drivePermissionErrors || 0} Google Drive permission alerts`}
          />
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div>
          <span className="text-xs text-slate-500 block">Avg Download Time</span>
          <span className="text-base font-bold text-slate-900">{kpis.averageDownloadDurationSeconds || 1.2}s</span>
        </div>
        <div className="border-l border-slate-100">
          <span className="text-xs text-slate-500 block">Limit Reached Events</span>
          <span className="text-base font-bold text-amber-600">{kpis.downloadLimitEvents || 0}</span>
        </div>
        <div className="border-l border-slate-100">
          <span className="text-xs text-slate-500 block">Expired Entitlements</span>
          <span className="text-base font-bold text-slate-600">{kpis.expiredEntitlements || 0}</span>
        </div>
        <div className="border-l border-slate-100">
          <span className="text-xs text-slate-500 block">Revoked Access</span>
          <span className="text-base font-bold text-rose-600">{kpis.revokedEntitlements || 0}</span>
        </div>
      </div>

      {/* Charts & Operational Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph / Bars */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Download Activity & Fulfillment Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily volume of successful vs failed digital file streams</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
              {range.toUpperCase()}
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              Loading telemetry...
            </div>
          ) : (
            <div className="space-y-3">
              {(charts.trend || []).slice(-10).map((d: any, i: number) => {
                const total = d.attempts || 1;
                const successPct = Math.round((d.successes / total) * 100) || 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{d.date}</span>
                      <span className="text-slate-500">
                        {d.successes} successes / {d.attempts} attempts ({successPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${successPct}%` }} />
                      <div className="bg-rose-500 h-full transition-all" style={{ width: `${100 - successPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Failure Breakdown & Quick Diagnostics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Failure Reason Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of delivery & token rejections</p>

            <div className="space-y-3">
              {(charts.failureDistribution || []).length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                  No download failures recorded in this period.
                </div>
              ) : (
                (charts.failureDistribution || []).map((f: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{f.name}</span>
                      <span className="text-[11px] text-slate-400">Error trigger</span>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-black text-xs rounded-lg">
                      {f.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to="/admin/downloads/failed"
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <AlertCircle size={14} /> Open Operational Failure Queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
