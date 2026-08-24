import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, ShoppingCart, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/admin/StatCard';
import { formatCurrency } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvExport';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function AdminAnalytics() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);

  const [dateRange, setDateRange] = useState('Last 30 Days');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [dashRes, dailyRes, topRes] = await Promise.all([
          axios.get(`/api/admin/analytics/dashboard?range=${encodeURIComponent(dateRange)}`),
          axios.get(`/api/admin/analytics/daily-revenue?range=${encodeURIComponent(dateRange)}`),
          axios.get(`/api/admin/analytics/top-products?range=${encodeURIComponent(dateRange)}`),
        ]);

        const dash = dashRes.data;
        const daily = dailyRes.data;
        const top = topRes.data;

        setDashboardData(dash);
        setDailyRevenueData(daily.data || []);
        setDailyTotal(daily.total || 0);
        setTopProductsData(top.products || []);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  const handleExportCSV = () => {
    if (!dailyRevenueData || dailyRevenueData.length === 0) return;
    exportToCSV(dailyRevenueData, `analytics_revenue_${dateRange.replace(/\s+/g, '_').toLowerCase()}`);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Analytics Data...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-danger">
        <h2 className="text-xl font-bold mb-2">Error Loading Analytics</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg">Retry</button>
      </div>
    );
  }

  const { financial, orders } = dashboardData || {};

  const renderGrowth = (val: any) => {
    if (val === undefined || val === null) return '— vs last month';
    return `${val > 0 ? '+' : ''}${val}% vs last month`;
  };
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics & Revenue</h1>
          <p className="text-slate-500 mt-1">Deep dive into your financial metrics and growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-medium"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
            <option value="Year to Date">Year to Date</option>
            <option value="All Time">All Time</option>
          </select>
          <button onClick={handleExportCSV} className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue (Month)" value={formatCurrency(financial?.monthlyRevenue || 0)} change={renderGrowth(financial?.financialGrowth?.monthlyVsLastMonth)} changeType={financial?.financialGrowth?.monthlyVsLastMonth >= 0 ? "positive" : "negative"} icon={IndianRupee} />
        <StatCard title="Total Orders (Month)" value={orders?.currentMonthOrderCount || 0} change={renderGrowth(orders?.ordersGrowth?.monthlyOrdersVsLastMonth)} changeType={orders?.ordersGrowth?.monthlyOrdersVsLastMonth >= 0 ? "positive" : "negative"} icon={ShoppingCart} />
        <StatCard title="Avg. Order Value" value={formatCurrency(financial?.averageOrderValue || 0)} change={renderGrowth(financial?.financialGrowth?.aovVsLastMonth)} changeType={financial?.financialGrowth?.aovVsLastMonth >= 0 ? "positive" : "negative"} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8">
        {/* Revenue Overview Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Overview</h3>
              <p className="text-sm text-slate-500">Daily revenue for the last 15 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-900">{formatCurrency(dailyTotal)}</p>
              <p className="text-sm font-bold text-slate-500">Total in 15 days</p>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyRevenueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenueDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenueDaily)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Revenue Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Revenue Breakdown (By Product)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Units Sold</th>
                <th className="px-6 py-4">Gross Revenue</th>
                <th className="px-6 py-4">Refunds</th>
                <th className="px-6 py-4">Net Revenue</th>
                <th className="px-6 py-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProductsData.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 text-slate-600">{item.unitsSold}</td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(item.grossRevenue || item.revenue || 0)}</td>
                  <td className="px-6 py-4 text-danger">-{formatCurrency(item.refunds || 0)}</td>
                  <td className="px-6 py-4 font-black text-success">{formatCurrency(item.netRevenue || item.revenue || 0)}</td>
                  <td className="px-6 py-4 text-right">
                    {(item.netRevenue || item.revenue) > 0 ? (
                      <span className="inline-flex items-center text-success"><ArrowUpRight size={16} /></span>
                    ) : (
                      <span className="inline-flex items-center text-danger"><ArrowDownRight size={16} /></span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

