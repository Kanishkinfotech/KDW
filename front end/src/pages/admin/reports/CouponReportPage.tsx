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
    { id: 'revenue', label: 'Net Revenue Impact', href: '#revenue' },
    { id: 'products', label: 'Discounted Products', href: '#products' }
  ];

  const fetchCouponData = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/reports/coupons/overview?range=${range}`;
      if (activeTab === 'revenue') endpoint = `/api/admin/reports/coupons/revenue?range=${range}`;
      else if (activeTab === 'products') endpoint = `/api/admin/reports/coupons/products?range=${range}`;

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
      subtitle="Real-time ledger of active coupon codes, promotional redemptions, net realized revenue, and discounted product performance."
      module="coupon"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={fetchCouponData}
    >
      <div className="space-y-6">
        {/* Operational Alert Panel */}
        <AlertPanel category="COUPON" onRefreshTrigger={fetchCouponData} />

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
                subtitle={`${kpis.remainingRedemptionsLabel ? `${kpis.remainingRedemptionsLabel} remaining uses` : '0 remaining uses'}`}
                formula="Coupons in ACTIVE State in Catalog"
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
                <p className="text-xs text-slate-400">Live promotion codes, value allocations, redemptions count, and usage limits</p>
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
                    {(!data?.coupons || data.coupons.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                          No active coupons found in catalog.
                        </td>
                      </tr>
                    ) : (
                      data.coupons.map((c: any) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'revenue' ? (
          <div className="space-y-6">
            <KpiGrid cols={4}>
              <KpiCard
                title="Net Realized Revenue"
                value={formatCurrency(data?.summary?.netSales || 0)}
                subtitle="Realized sales after discounts & refunds"
                formula="Gross Sales - Discounts - Refunds"
                icon={DollarSign}
                color="emerald"
              />
              <KpiCard
                title="Gross Promotional Sales"
                value={formatCurrency(data?.summary?.grossSales || 0)}
                subtitle={`${data?.summary?.totalUses || 0} redeemed orders`}
                formula="Total Value of Orders Before Coupon Deduction"
                icon={DollarSign}
                color="blue"
              />
              <KpiCard
                title="Total Discounts Given"
                value={formatCurrency(data?.summary?.discountValue || 0)}
                subtitle="Promotional margin invested"
                formula="Sum of Redeemed Coupon Reductions"
                icon={Ticket}
                color="amber"
              />
              <KpiCard
                title="Customer Refunds"
                value={formatCurrency(data?.summary?.refunds || 0)}
                subtitle="Returns on coupon orders"
                formula="Refunded Amounts on Orders with Coupons"
                icon={RotateCcw}
                color="rose"
              />
            </KpiGrid>

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
                      <th className="px-5 py-3.5">Discount Rate</th>
                      <th className="px-5 py-3.5">Redemptions</th>
                      <th className="px-5 py-3.5">Gross Sales</th>
                      <th className="px-5 py-3.5">Discounts Given</th>
                      <th className="px-5 py-3.5">Refunds</th>
                      <th className="px-5 py-3.5 text-right">Net Realized Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(!data?.data || data.data.length === 0) ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                          No coupon revenue recorded yet in this analytical period.
                        </td>
                      </tr>
                    ) : (
                      data.data.map((cp: any) => (
                        <tr key={cp.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{cp.code}</td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">
                            {cp.discountType === 'PERCENTAGE' ? `${cp.discountRate ?? cp.discountValue}%` : formatCurrency(cp.discountRate ?? cp.discountValue)}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">{cp.uses} uses</td>
                          <td className="px-5 py-3.5 text-slate-600">{formatCurrency(cp.grossSales)}</td>
                          <td className="px-5 py-3.5 text-amber-600">-{formatCurrency(cp.discountValue)}</td>
                          <td className="px-5 py-3.5 text-rose-600">-{formatCurrency(cp.refunds)}</td>
                          <td className="px-5 py-3.5 text-right font-black text-emerald-700 text-sm">
                            {formatCurrency(cp.netSales)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Discounted Products Performance</h3>
              <p className="text-xs text-slate-400">Catalog products purchased with coupon discounts, sales volume, and realized revenue</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Product Name</th>
                    <th className="px-5 py-3.5">Coupons Applied</th>
                    <th className="px-5 py-3.5">Discounted Orders</th>
                    <th className="px-5 py-3.5">Units Sold</th>
                    <th className="px-5 py-3.5">Avg Selling Price</th>
                    <th className="px-5 py-3.5 text-right">Realized Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(!data?.products || data.products.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No discounted product orders recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    data.products.map((p: any, idx: number) => (
                      <tr key={p.productId || idx} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(p.couponsApplied || []).length === 0 ? (
                              <span className="text-slate-400 italic">None</span>
                            ) : (
                              (p.couponsApplied || []).map((cp: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                                  {cp}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700">{p.discountedOrdersCount} orders</td>
                        <td className="px-5 py-3.5 text-slate-700">{p.unitsSold} units</td>
                        <td className="px-5 py-3.5 text-slate-600">{formatCurrency(p.avgDiscountedPrice)}</td>
                        <td className="px-5 py-3.5 text-right font-black text-emerald-700 text-sm">
                          {formatCurrency(p.revenue)}
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
