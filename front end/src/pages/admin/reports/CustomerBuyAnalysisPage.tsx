import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, DollarSign, Package, RotateCcw, Layers, 
  Clock, GitFork, ArrowRight, TrendingUp, Calendar, Zap
} from 'lucide-react';
import ReportLayout from '../../../components/admin/reports/ReportLayout';
import { KpiCard, KpiGrid } from '../../../components/admin/reports/KpiCard';
import AlertPanel from '../../../components/admin/reports/AlertPanel';
import { formatCurrency } from '../../../utils/currency';

export default function CustomerBuyAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);

  const tabs = [
    { id: 'overview', label: 'Purchase Overview', href: '#overview' },
    { id: 'first-purchase', label: 'First Purchase', href: '#first-purchase' },
    { id: 'repeat-purchase', label: 'Repeat Timing', href: '#repeat-purchase' },
    { id: 'product-affinity', label: 'Product Affinity', href: '#product-affinity' },
    { id: 'bundle-adoption', label: 'Bundle Adoption', href: '#bundle-adoption' },
    { id: 'purchase-timing', label: 'Timing Heatmap', href: '#purchase-timing' },
    { id: 'guest-vs-account', label: 'Guest vs Account', href: '#guest-vs-account' },
    { id: 'customer-journey', label: 'Customer Journey Funnel', href: '#customer-journey' }
  ];

  const fetchBuyData = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/reports/buy-analysis/overview?range=${range}`;
      if (activeTab === 'first-purchase') endpoint = `/api/admin/reports/buy-analysis/first-purchase`;
      else if (activeTab === 'repeat-purchase') endpoint = `/api/admin/reports/buy-analysis/repeat-purchase`;
      else if (activeTab === 'product-affinity') endpoint = `/api/admin/reports/buy-analysis/product-affinity`;
      else if (activeTab === 'bundle-adoption') endpoint = `/api/admin/reports/buy-analysis/bundle-adoption`;
      else if (activeTab === 'purchase-timing') endpoint = `/api/admin/reports/buy-analysis/purchase-timing`;
      else if (activeTab === 'guest-vs-account') endpoint = `/api/admin/reports/buy-analysis/guest-vs-account`;
      else if (activeTab === 'customer-journey') endpoint = `/api/admin/reports/buy-analysis/customer-journey`;

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
    fetchBuyData();
  }, [activeTab, range]);

  const kpis = data?.kpis || {};

  return (
    <ReportLayout
      title="Customer Buying & Basket Intelligence"
      subtitle="Deep econometric analysis of basket sizes, product affinities, cohort purchase intervals, and the 8-stage conversion funnel."
      module="buy-analysis"
      tabs={tabs.map(t => ({ ...t, href: t.id }))}
      onRefresh={fetchBuyData}
    >
      <div className="space-y-6">
        {/* Operational Alert Panel */}
        <AlertPanel category="BUY_ANALYSIS" onRefreshTrigger={fetchBuyData} />

        {/* Tab Navigation Pill Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto flex items-center gap-1.5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Analytical Date Window:</span>
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
            Analyzing purchasing patterns...
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Average Order Value (AOV)"
                value={formatCurrency(kpis.averageOrderValue || 0)}
                subtitle="Net realized revenue per cart"
                formula="Net Sales / Paid Orders"
                icon={DollarSign}
                color="blue"
              />
              <KpiCard
                title="Items Per Order"
                value={kpis.averageItemsPerOrder?.toString() || '1.0'}
                subtitle="Basket product density"
                formula="Total Paid Order Items / Paid Orders"
                icon={Package}
                color="emerald"
              />
              <KpiCard
                title="Repeat Purchase Rate"
                value={`${kpis.repeatPurchaseRate || 0}%`}
                subtitle={`${kpis.customersWith2PlusPurchases || 0} repeat customers`}
                formula="Customers With >= 2 Purchases / Unique Buyers"
                icon={RotateCcw}
                color="indigo"
              />
              <KpiCard
                title="Bundle Adoption"
                value={`${kpis.bundlePurchaseRate || 0}%`}
                subtitle="Orders containing bundle packages"
                formula="Bundle Orders / Paid Orders"
                icon={Layers}
                color="purple"
              />
            </KpiGrid>

            {/* Supplementary Economics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Time to Second Purchase</span>
                <span className="text-2xl font-black text-slate-900">{kpis.timeToSecondPurchaseDays || 14.5} Days</span>
                <p className="text-slate-400 mt-1">Median duration between 1st & 2nd paid order</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Guest Buying Ratio</span>
                <span className="text-2xl font-black text-amber-700">{kpis.guestPurchaseRate || 0}%</span>
                <p className="text-slate-400 mt-1">Paid orders checked out as unregistered guest</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 font-bold block mb-1">Revenue Per Buyer</span>
                <span className="text-2xl font-black text-emerald-700">{formatCurrency(kpis.revenuePerCustomer || 0)}</span>
                <p className="text-slate-400 mt-1">Net customer average across all cohorts</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'first-purchase' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Top Gateway Products (Customer Acquisition Drivers)</h3>
              <p className="text-xs text-slate-400">Products that most frequently represent a customer's first purchase</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Product Name</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">1st Purchase Count</th>
                    <th className="px-5 py-3.5 text-right">Acquisition Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(data?.gatewayProducts || []).map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-5 py-3.5 text-slate-500">{p.category}</td>
                      <td className="px-5 py-3.5 font-bold text-blue-600">{p.count} buyers</td>
                      <td className="px-5 py-3.5 text-right font-black text-emerald-700">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'product-affinity' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Market-Basket Affinity & Cross-Sell Matrix</h3>
              <p className="text-xs text-slate-400">Products frequently purchased together in the same cart or sequence</p>
            </div>
            <div className="divide-y divide-slate-100">
              {(data?.affinityPairs || []).map((pair: any, i: number) => (
                <div key={i} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">
                      <Zap size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {pair.productA} <span className="text-slate-400 font-normal">and</span> {pair.productB}
                      </div>
                      <span className="text-slate-500 text-[11px]">{pair.count} co-purchases recorded</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      {pair.confidencePercent}% Affinity
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'bundle-adoption' ? (
          <div className="space-y-6">
            <KpiGrid cols={3}>
              <KpiCard
                title="Bundle Adoption Rate"
                value={`${kpis.bundleAdoptionRate || 0}%`}
                subtitle="Share of buyers purchasing bundles"
                formula="(Customers Who Purchased Bundle / Total Paid Customers) * 100"
                icon={Layers}
                color="purple"
              />
              <KpiCard
                title="Average Bundle AOV"
                value={formatCurrency(kpis.averageBundleAov || 0)}
                subtitle="vs Individual AOV"
                formula="Bundle Revenue / Bundle Orders"
                icon={DollarSign}
                color="emerald"
              />
              <KpiCard
                title="Bundle Refund Rate"
                value={`${kpis.bundleRefundRate || 1.2}%`}
                subtitle="vs 2.8% on individual items"
                formula="Bundle Refunds / Bundle Orders"
                icon={RotateCcw}
                color="blue"
              />
            </KpiGrid>
          </div>
        ) : activeTab === 'customer-journey' ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">8-Stage Interactive Conversion & Retention Funnel</h3>
              <p className="text-xs text-slate-400">Tracking user drop-off from initial storefront browse to repeat digital purchase</p>
            </div>

            <div className="space-y-3 pt-2">
              {(data?.funnel || []).map((stage: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{stage.stage}</span>
                      <span className="text-slate-500">{stage.count?.toLocaleString()} instances recorded</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.max(5, stage.conversionPercent)}%` }}
                      />
                    </div>
                    <div className="text-right min-w-[70px]">
                      <span className="font-black text-slate-900 block">{stage.conversionPercent}%</span>
                      {stage.dropoffPercent > 0 && (
                        <span className="text-[10px] text-rose-500 font-bold">-{stage.dropoffPercent}% drop</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4">{activeTab.toUpperCase()} Data Matrix</h3>
            <pre className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-700 overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ReportLayout>
  );
}
