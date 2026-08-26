import React, { useState, useEffect } from 'react';
import { 
  LineChart, DollarSign, ShoppingCart, Tag, RotateCcw, 
  Users, TrendingUp, Download, Calendar, Layers, Award
} from 'lucide-react';
import SEO from '../../../components/SEO';
import StatCard from '../../../components/admin/StatCard';
import ReportFilterBar from '../../../components/admin/ReportFilterBar';
import { formatCurrency } from '../../../utils/currency';

export default function AdminSalesReport() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'products' | 'categories'>('overview');
  const [reportData, setReportData] = useState<any>(null);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/sales?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json);
      }
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [range]);

  const kpis = reportData?.kpis || {};
  const daily = reportData?.daily || [];
  const products = reportData?.products || [];
  const categories = reportData?.categories || [];

  const handleExportCSV = () => {
    let rows: any[] = [];
    if (activeTab === 'daily') rows = daily;
    else if (activeTab === 'products') rows = products;
    else if (activeTab === 'categories') rows = categories;
    else rows = products;

    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [
      headers,
      ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KDW-Sales-Report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SEO title="Sales & Commercial Report | KDW Admin" description="Multi-dimensional sales analytics, product units, and revenue" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales & Revenue Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Immutable financial snapshots of confirmed captured orders, units sold, and net revenue.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        onRefresh={fetchSalesReport}
        onExport={handleExportCSV}
        metadata={reportData?.metadata}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Sales Volume"
          value={formatCurrency(kpis.grossSales || 0)}
          icon={DollarSign}
          description="Total before discounts and refunds"
        />
        <StatCard
          title="Net Commercial Sales"
          value={formatCurrency(kpis.netSales || 0)}
          icon={TrendingUp}
          description={`Discounts: ${formatCurrency(kpis.discounts || 0)} • Refunds: ${formatCurrency(kpis.refunds || 0)}`}
        />
        <StatCard
          title="Paid Orders Fulfilled"
          value={kpis.paidOrders?.toLocaleString() || '0'}
          icon={ShoppingCart}
          description={`${kpis.unitsSold || 0} total digital units delivered`}
        />
        <StatCard
          title="Average Order Value (AOV)"
          value={formatCurrency(kpis.averageOrderValue || 0)}
          icon={Award}
          description={`Across ${kpis.uniqueCustomers || 0} unique paying customers`}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Commercial Overview' },
          { id: 'daily', label: 'Daily Sales Trend' },
          { id: 'products', label: 'Sales by Product' },
          { id: 'categories', label: 'Sales by Category' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panes */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          Calculating financial models...
        </div>
      ) : activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-1">Top Revenue Generating Products</h3>
            <p className="text-xs text-slate-500 mb-4">Ranked by net operating sales volume</p>

            <div className="space-y-3">
              {products.slice(0, 6).map((p: any, idx: number) => (
                <div key={p.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[11px] text-slate-500">{p.units} units sold • {p.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">{formatCurrency(p.net)}</span>
                    <span className="text-[10px] text-slate-400">Net Sales</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Share */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-1">Sales by Category Pillar</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution of revenue across catalog sectors</p>

            <div className="space-y-3">
              {categories.map((c: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                    <span className="text-[11px] text-slate-500">{c.orderCount} orders • {c.units} items</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-700 block">{formatCurrency(c.revenue)}</span>
                    <span className="text-[10px] text-slate-400">Total Volume</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'daily' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Gross Sales</th>
                  <th className="px-5 py-3.5">Discounts</th>
                  <th className="px-5 py-3.5">Refunds</th>
                  <th className="px-5 py-3.5">Net Sales</th>
                  <th className="px-5 py-3.5">Orders Count</th>
                  <th className="px-5 py-3.5">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {daily.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{d.date}</td>
                    <td className="px-5 py-3.5">{formatCurrency(d.gross)}</td>
                    <td className="px-5 py-3.5 text-rose-600">-{formatCurrency(d.discounts)}</td>
                    <td className="px-5 py-3.5 text-rose-600">-{formatCurrency(d.refunds)}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">{formatCurrency(d.net)}</td>
                    <td className="px-5 py-3.5">{d.orders}</td>
                    <td className="px-5 py-3.5">{d.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'products' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Units Sold</th>
                  <th className="px-5 py-3.5">Gross Revenue</th>
                  <th className="px-5 py-3.5">Refunds</th>
                  <th className="px-5 py-3.5 text-right">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{p.category}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{p.units}</td>
                    <td className="px-5 py-3.5">{formatCurrency(p.gross)}</td>
                    <td className="px-5 py-3.5 text-rose-600">{formatCurrency(p.refunds)}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{formatCurrency(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Category Name</th>
                  <th className="px-5 py-3.5">Total Orders</th>
                  <th className="px-5 py-3.5">Units Delivered</th>
                  <th className="px-5 py-3.5 text-right">Total Net Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {categories.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="px-5 py-3.5">{c.orderCount}</td>
                    <td className="px-5 py-3.5">{c.units}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{formatCurrency(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
