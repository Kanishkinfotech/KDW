import React, { useState, useEffect } from 'react';
import { 
  Download, CheckCircle2, AlertTriangle, Cloud, 
  Clock, ShieldAlert, Package, Calendar, RefreshCw, Activity
} from 'lucide-react';
import ReportLayout from '../../../components/admin/reports/ReportLayout';
import { KpiCard, KpiGrid } from '../../../components/admin/reports/KpiCard';
import AlertPanel from '../../../components/admin/reports/AlertPanel';

export default function DownloadReportPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);

  const tabs = [
    { id: 'overview', label: 'Download Overview', href: '#overview' },
    { id: 'by-product', label: 'Downloads by Product', href: '#by-product' },
    { id: 'by-version', label: 'Version Reliability', href: '#by-version' }
  ];

  const fetchDownloadData = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/reports/downloads/overview?range=${range}`;
      if (activeTab === 'by-product') endpoint = `/api/admin/reports/downloads/by-product`;
      else if (activeTab === 'by-version') endpoint = `/api/admin/reports/downloads/by-version`;

      const res = await fetch(endpoint);
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
    fetchDownloadData();
  }, [activeTab, range]);

  const kpis = data?.kpis || {};

  return (
    <ReportLayout
      title="Digital Asset Delivery & Download Intelligence"
      subtitle="Real-time telemetry on customer file deliveries, Google Drive latency, stream completion rates, and version regression."
      module="download"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={fetchDownloadData}
    >
      <div className="space-y-6">
        {/* Operational Alert Panel */}
        <AlertPanel category="DOWNLOAD" onRefreshTrigger={fetchDownloadData} />

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Analytical Delivery Period:</span>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar size={14} className="text-slate-500" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Auditing delivery telemetry...
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Download Attempts"
                value={kpis.totalDownloadAttempts?.toLocaleString() || '0'}
                subtitle={`${kpis.successfulDownloads || 0} completed streams`}
                formula="Download Logs Recorded in Database"
                icon={Download}
                color="blue"
              />
              <KpiCard
                title="Success Rate"
                value={`${kpis.downloadSuccessRate ?? 0}%`}
                subtitle={`${kpis.failedDownloads || 0} failed streams`}
                formula={kpis.totalDownloadAttempts > 0 ? "(Successful Downloads / Total Attempts) * 100" : "0% (No stream attempts)"}
                icon={CheckCircle2}
                color={kpis.totalDownloadAttempts === 0 ? "slate" : kpis.downloadSuccessRate >= 95 ? "emerald" : "rose"}
              />
              <KpiCard
                title="Customer Completion"
                value={`${kpis.customerCompletionRate ?? 0}%`}
                subtitle="Buyers with >=1 download"
                formula={kpis.customerCompletionRate > 0 ? "(Buyers with >= 1 Download / Entitlement Holders) * 100" : "0% (No completed downloads)"}
                icon={Activity}
                color={kpis.customerCompletionRate > 0 ? "indigo" : "slate"}
              />
              <KpiCard
                title="Avg Stream Latency"
                value={`${kpis.averageDownloadDurationSeconds ?? 0}s`}
                subtitle="Drive stream transfer speed"
                formula="Average Duration of Completed Stream Events"
                icon={Clock}
                color={kpis.averageDownloadDurationSeconds > 0 ? "amber" : "slate"}
              />
            </KpiGrid>

            {/* Diagnostic Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Paid With No Download</span>
                <span className="text-2xl font-black text-rose-600">{kpis.customersWithNoDownload || 0} Customers</span>
                <p className="text-slate-400 mt-1">Paid entitlements with 0 download attempts</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Expired Access Tokens</span>
                <span className="text-2xl font-black text-slate-800">{kpis.expiredAccess || 0}</span>
                <p className="text-slate-400 mt-1">Tokens that lapsed before stream execution</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Drive Service Health</span>
                <span className={`text-2xl font-black ${kpis.drivePermissionErrors > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {kpis.driveServiceHealth || '100% OPERATIONAL'}
                </span>
                <p className="text-slate-400 mt-1">Google Drive API token & service status</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'by-product' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Product-Level Download Telemetry</h3>
              <p className="text-xs text-slate-400">Aggregated download volume, stream success rates, and active customer entitlements</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Product Name</th>
                    <th className="px-5 py-3.5">Active Entitlements</th>
                    <th className="px-5 py-3.5">Total Attempts</th>
                    <th className="px-5 py-3.5">Successes</th>
                    <th className="px-5 py-3.5">Failures</th>
                    <th className="px-5 py-3.5 text-right">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(!data?.data || data.data.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No product telemetry found.
                      </td>
                    </tr>
                  ) : (
                    data.data.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                        <td className="px-5 py-3.5 font-semibold text-blue-600">{p.entitlementsCount} holders</td>
                        <td className="px-5 py-3.5">{p.attemptsCount}</td>
                        <td className="px-5 py-3.5 text-emerald-700 font-bold">{p.successfulDownloads}</td>
                        <td className="px-5 py-3.5 text-rose-600">{p.failedDownloads}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                            p.attemptsCount === 0
                              ? 'bg-slate-100 text-slate-500'
                              : p.successRate >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.attemptsCount === 0 ? '0%' : `${p.successRate}%`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'by-version' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Version-Specific Reliability & Latency Regression</h3>
              <p className="text-xs text-slate-400">Detecting stream failures or latency spikes tied to specific package versions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Product & Version</th>
                    <th className="px-5 py-3.5">Attempts</th>
                    <th className="px-5 py-3.5">Successes</th>
                    <th className="px-5 py-3.5">Failures</th>
                    <th className="px-5 py-3.5">Avg Duration</th>
                    <th className="px-5 py-3.5 text-right">Reliability Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(!data?.data || data.data.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No version download telemetry recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.data.map((v: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{v.productName} <span className="font-mono text-slate-500">v{v.version}</span></td>
                        <td className="px-5 py-3.5">{v.attempts}</td>
                        <td className="px-5 py-3.5 text-emerald-700">{v.successes}</td>
                        <td className="px-5 py-3.5 text-rose-600">{v.failed}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">{v.attempts > 0 ? `${v.avgDurationSeconds}s` : '—'}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                            v.attempts === 0
                              ? 'bg-slate-100 text-slate-500'
                              : v.successRate >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            {v.attempts === 0 ? '0%' : `${v.successRate}%`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </ReportLayout>
  );
}
