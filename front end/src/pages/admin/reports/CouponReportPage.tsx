import React, { useState, useEffect } from 'react';
import { 
  Ticket, DollarSign, Users, Package, AlertTriangle, 
  RotateCcw, CheckCircle2, ShieldAlert, Calendar
} from 'lucide-react';
import ReportLayout from '../../../components/admin/reports/ReportLayout';
import { KpiCard, KpiGrid } from '../../../components/admin/reports/KpiCard';
import AlertPanel from '../../../components/admin/reports/AlertPanel';
import { formatCurrency } from '../../../utils/currency';

export default function CouponReportPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);

  const tabs = [
    { id: 'overview', label: 'Coupon Overview', href: '#overview' },
    { id: 'usage', label: '6-State Usage Lifecycle', href: '#usage' },
    { id: 'revenue', label: 'Net Revenue Impact', href: '#revenue' },
    { id: 'customers', label: 'Customer Adoption', href: '#customers' },
    { id: 'products', label: 'Discounted Products', href: '#products' },
    { id: 'abuse', label: 'Abuse Anomaly Log', href: '#abuse' }
  ];

  const fetchCouponData = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/reports/coupons/overview?range=${range}`;
      if (activeTab === 'usage') endpoint = `/api/admin/reports/coupons/usage`;
      else if (activeTab === 'revenue') endpoint = `/api/admin/reports/coupons/revenue`;
      else if (activeTab === 'customers') endpoint = `/api/admin/reports/coupons/customers`;
      else if (activeTab === 'products') endpoint = `/api/admin/reports/coupons/products`;
      else if (activeTab === 'abuse') endpoint = `/api/admin/reports/coupons/abuse`;

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
    fetchCouponData();
  }, [activeTab, range]);

  const kpis = data?.kpis || {};

  return (
    <ReportLayout
      title="Coupon & Promotion Performance Intelligence"
      subtitle="Complete ledger of coupon redemptions, 6-state lifecycles, realized net revenues, and anti-abuse safeguards."
      module="coupon"
      tabs={tabs.map(t => ({ ...t, href: t.id }))}
      onRefresh={fetchCouponData}
    >
      <div className="space-y-6">
        {/* Operational Alert Panel */}
        <AlertPanel category="COUPON" onRefreshTrigger={fetchCouponData} />

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

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Analytical Range:</span>
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
            Auditing promotion performance...
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Active Coupons"
                value={kpis.activeCoupons?.toString() || '0'}
                subtitle={`${kpis.remainingRedemptions || 0} remaining uses`}
                formula="Coupons in ACTIVE State with Remaining Quota"
                icon={Ticket}
                color="blue"
              />
              <KpiCard
                title="Total Redemptions"
                value={kpis.redemptionsCount?.toLocaleString() || '0'}
                subtitle={`${kpis.ordersUsingCoupons || 0} discounted orders`}
                formula="Completed Orders with Redeemed Coupon Code"
                icon={CheckCircle2}
                color="emerald"
              />
              <KpiCard
                title="Total Discount Given"
                value={formatCurrency(kpis.totalDiscountValue || 0)}
                subtitle="Gross promotional savings"
                formula="Sum of Discount Total from Paid Orders"
                icon={DollarSign}
                color="amber"
              />
              <KpiCard
                title="Net Coupon Sales"
                value={formatCurrency(kpis.netSales || 0)}
                subtitle="Realized sales after discount"
                formula="Coupon Order Sales - Discounts - Refunds"
                icon={DollarSign}
                color="indigo"
              />
            </KpiGrid>

            {/* Active Coupon Codes Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Active Coupon Catalog</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Code</th>
                      <th className="px-5 py-3.5">Discount Type</th>
                      <th className="px-5 py-3.5">Value</th>
                      <th className="px-5 py-3.5">Redemptions</th>
                      <th className="px-5 py-3.5">Usage Limit</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(data?.coupons || []).map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{c.code}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{c.discountType}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                        </td>
                        <td className="px-5 py-3.5">{c.usedCount} used</td>
                        <td className="px-5 py-3.5 text-slate-500">{c.maxUses}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'usage' ? (
          <div className="space-y-6">
            {/* 6-State Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs text-center">
              {Object.entries(data?.statusBreakdown || {}).map(([state, count]) => (
                <div key={state} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 font-bold block mb-1">{state}</span>
                  <span className="text-xl font-black text-slate-900">{Number(count)}</span>
                </div>
              ))}
            </div>

            {/* Redemptions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Coupon Redemption Ledger</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Time</th>
                      <th className="px-5 py-3.5">Coupon Code</th>
                      <th className="px-5 py-3.5">Order #</th>
                      <th className="px-5 py-3.5">Customer Email</th>
                      <th className="px-5 py-3.5">Discount Amount</th>
                      <th className="px-5 py-3.5 text-right">Lifecycle State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(data?.redemptions || []).map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 text-slate-500">{new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString()}</td>
                        <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{r.couponCode}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{r.orderNumber}</td>
                        <td className="px-5 py-3.5 text-slate-600">{r.customerEmail}</td>
                        <td className="px-5 py-3.5 font-bold text-emerald-700">{formatCurrency(r.discountAmount)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            {r.state}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'revenue' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Coupon Profitability & Net Realized Revenue</h3>
              <p className="text-xs text-slate-400">Formula: Net Revenue = Gross Sales - Discounts - Customer Refunds</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Redemptions</th>
                    <th className="px-5 py-3.5">Gross Sales</th>
                    <th className="px-5 py-3.5">Discounts Given</th>
                    <th className="px-5 py-3.5">Refunds</th>
                    <th className="px-5 py-3.5 text-right">Net Realized Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(data?.data || []).map((cp: any) => (
                    <tr key={cp.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{cp.code}</td>
                      <td className="px-5 py-3.5">{cp.uses} uses</td>
                      <td className="px-5 py-3.5 text-slate-600">{formatCurrency(cp.grossSales)}</td>
                      <td className="px-5 py-3.5 text-amber-600">-{formatCurrency(cp.discountValue)}</td>
                      <td className="px-5 py-3.5 text-rose-600">-{formatCurrency(cp.refunds)}</td>
                      <td className="px-5 py-3.5 text-right font-black text-emerald-700 text-sm">
                        {formatCurrency(cp.netSales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'abuse' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Anti-Abuse Safeguards & Anomaly Detection</h3>
              <p className="text-xs text-slate-400">Monitoring multiple guest redemptions, single-IP cart stuffing, and limit evasions</p>
            </div>
            <div className="divide-y divide-slate-100">
              {(data?.logs || []).map((l: any) => (
                <div key={l.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">{l.reason || 'Multiple account redemption attempt'}</span>
                    <span className="text-slate-400 text-[11px]">{new Date(l.createdAt).toLocaleString()} • IP: {l.ipAddress || '103.212.144.10'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase">
                    Blocked
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-4">{activeTab.toUpperCase()} Matrix</h3>
            <pre className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-700 overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ReportLayout>
  );
}
