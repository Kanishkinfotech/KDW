import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, AlertCircle, Clock, Users, HardDrive, RefreshCw } from 'lucide-react';
import SEO from '../../../components/SEO';
import StatCard from '../../../components/admin/StatCard';
import ReportFilterBar from '../../../components/admin/ReportFilterBar';

export default function AdminDownloadReport() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/downloads?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [range]);

  const kpis = data?.kpis || {};
  const failureReasons = data?.failureReasons || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="space-y-6">
      <SEO title="Download Fulfillment Analytics | KDW Admin" description="Digital file streams, throughput, and reliability report" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Digital Downloads Fulfillment Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Aggregate telemetry on digital delivery attempts, bandwidth streamed, and client latency.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        onRefresh={fetchDownloads}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Download Streams"
          value={kpis.attempts?.toLocaleString() || '0'}
          icon={Download}
          description={`${kpis.successes || 0} successful • ${kpis.failures || 0} failed`}
        />
        <StatCard
          title="Delivery Success Rate"
          value={`${kpis.successRate || 100}%`}
          icon={CheckCircle2}
          description="Reliability of proxy stream pipeline"
        />
        <StatCard
          title="Avg Latency (Duration)"
          value={`${((kpis.avgDurationMs || 0) / 1000).toFixed(2)}s`}
          icon={Clock}
          description={`Median P50: ${((kpis.medianDurationMs || 0) / 1000).toFixed(2)}s • P95: ${((kpis.p95DurationMs || 0) / 1000).toFixed(2)}s`}
        />
        <StatCard
          title="Active Unique Downloaders"
          value={kpis.uniqueCustomers?.toLocaleString() || '0'}
          icon={Users}
          description={`Across ${kpis.uniqueProducts || 0} distinct catalog products`}
        />
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Failure Reasons */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-1">Rejection & Error Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Categorized failures during period</p>

          <div className="space-y-3">
            {failureReasons.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                No errors recorded.
              </div>
            ) : (
              failureReasons.map((fr: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{fr.name}</span>
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-lg">{fr.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Streams Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-1">Recent Telemetry Events</h3>
          <p className="text-xs text-slate-500 mb-4">Latest digital delivery attempts</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.slice(0, 8).map((log: any) => (
                  <tr key={log.id}>
                    <td className="p-2.5 text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="p-2.5 font-bold text-slate-900">{log.customerEmail}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{log.productName}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
