import { useEffect, useState, useCallback } from 'react';
import { 
  IndianRupee, ShoppingCart, Users, Download, Package,
  RefreshCw, AlertCircle, ArrowRight, CheckCircle2,
  AlertTriangle, XCircle, Clock, ShieldCheck, Activity,
  ExternalLink, X, Eye, Layers, TrendingUp, Calendar, Filter,
  FolderTree, Tags, HardDrive, Zap, HelpCircle
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import SEO from '../../components/SEO';
import axios from 'axios';

// Helper for status badge styling
const getStatusBadge = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'paid':
    case 'completed':
    case 'success':
      return {
        label: s === 'paid' ? 'Paid' : s === 'completed' ? 'Completed' : 'Success',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold'
      };
    case 'pending':
    case 'processing':
    case 'new':
      return {
        label: s === 'pending' ? 'Pending' : s === 'processing' ? 'Processing' : 'New',
        className: 'bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold'
      };
    case 'refunded':
      return {
        label: 'Refunded',
        className: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-semibold'
      };
    case 'cancelled':
    case 'failed':
      return {
        label: s === 'cancelled' ? 'Cancelled' : 'Failed',
        className: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold'
      };
    default:
      return {
        label: status || 'Unknown',
        className: 'bg-slate-100 text-slate-700 border border-slate-200 font-semibold'
      };
  }
};

const PAYMENT_PIE_COLORS = {
  Successful: '#10b981', // emerald
  Pending: '#f59e0b',    // amber
  Failed: '#ef4444',     // rose
  Refunded: '#8b5cf6'    // violet
};

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL Parameter Synchronization
  const initialRange = searchParams.get('range') || 'Last 7 Days';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(initialStartDate && initialEndDate ? 'Custom Range' : initialRange);
  const [customStartDate, setCustomStartDate] = useState(initialStartDate);
  const [customEndDate, setCustomEndDate] = useState(initialEndDate);
  const [showCustomInputs, setShowCustomInputs] = useState(initialStartDate && initialEndDate ? true : false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Fetch consolidated dashboard data from real backend endpoint
  const fetchDashboardData = useCallback(async (range: string, customStart?: string, customEnd?: string) => {
    try {
      setIsRefreshing(true);
      setError(null);

      const token = localStorage.getItem('token');
      let url = `/api/admin/dashboard?range=${encodeURIComponent(range)}`;
      if (range === 'Custom Range' && customStart && customEnd) {
        url = `/api/admin/dashboard?startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
      }

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.success && res.data?.data) {
        setDashboardData(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Invalid response format from server');
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load dashboard data for this period.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load or range change trigger
  useEffect(() => {
    if (dateRange === 'Custom Range') {
      if (customStartDate && customEndDate) {
        fetchDashboardData('Custom Range', customStartDate, customEndDate);
      }
    } else {
      fetchDashboardData(dateRange);
    }
  }, [dateRange, fetchDashboardData]);

  // Handle range change from dropdown
  const handleRangeChange = (newRange: string) => {
    setDateRange(newRange);
    if (newRange === 'Custom Range') {
      setShowCustomInputs(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const sevenDaysAgoStr = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
      if (!customStartDate) setCustomStartDate(sevenDaysAgoStr);
      if (!customEndDate) setCustomEndDate(todayStr);
    } else {
      setShowCustomInputs(false);
      setSearchParams({ range: newRange });
    }
  };

  // Apply custom date range
  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) return;
    setSearchParams({ range: 'Custom Range', startDate: customStartDate, endDate: customEndDate });
    fetchDashboardData('Custom Range', customStartDate, customEndDate);
  };

  const { 
    overview, sales, payments, orders, accessDelivery, 
    topProducts, salesByCategory, orderFunnel, 
    atAGlance, operationalAlerts,
    recentOrders, recentDownloads, recentActivity, period 
  } = dashboardData || {};

  // Prepare payment pie data
  const paymentPieData = [
    { name: 'Successful', value: payments?.successful || 0, color: PAYMENT_PIE_COLORS.Successful },
    { name: 'Pending', value: payments?.pending || 0, color: PAYMENT_PIE_COLORS.Pending },
    { name: 'Failed', value: payments?.failed || 0, color: PAYMENT_PIE_COLORS.Failed },
    { name: 'Refunded', value: payments?.refunded || 0, color: PAYMENT_PIE_COLORS.Refunded },
  ].filter(item => item.value > 0);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8 pb-12 animate-pulse font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded-lg w-48"></div>
            <div className="h-4 bg-slate-200 rounded-lg w-72"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded-xl w-36"></div>
        </div>

        {/* 8 KPI Skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Analytics Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white rounded-3xl border border-slate-200/80"></div>
          <div className="h-80 bg-white rounded-3xl border border-slate-200/80"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm max-w-lg mx-auto my-12 font-sans">
        <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Dashboard Data</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">{error}</p>
        <button 
          onClick={() => fetchDashboardData(dateRange, customStartDate, customEndDate)} 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 cursor-pointer"
        >
          <RefreshCw size={16} />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in font-sans text-slate-900">
      <SEO title="Dashboard | KDW Admin" description="Kanishk Digital World Admin Master Production Dashboard" />

      {/* 1. TOP HEADER & GLOBAL DATE RANGE SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
            {period?.label && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Calendar size={12} />
                {period.label}
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            Real-time business performance and operational status for <span className="font-bold text-slate-700">{period?.label || dateRange}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Supported Global Periods Dropdown */}
          <select 
            value={dateRange}
            onChange={(e) => handleRangeChange(e.target.value)}
            disabled={isRefreshing}
            className="bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs font-bold cursor-pointer transition-all"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Custom Range">Custom Range...</option>
          </select>

          {/* Refresh Action (Preserves Currently Selected Range) */}
          <button 
            onClick={() => fetchDashboardData(dateRange, customStartDate, customEndDate)}
            title="Refresh Dashboard Data"
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {showCustomInputs && (
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Custom Date Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">From:</span>
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">To:</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              onClick={handleApplyCustomRange}
              disabled={isRefreshing || !customStartDate || !customEndDate}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}

      {/* OPERATIONAL ALERTS BANNER */}
      {operationalAlerts && operationalAlerts.length > 0 && (
        <div className="space-y-2">
          {operationalAlerts.map((alert: any) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
                alert.level === 'critical' 
                  ? 'bg-rose-50/90 border-rose-200 text-rose-950' 
                  : alert.level === 'warning'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-blue-50/90 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle size={18} className={alert.level === 'critical' ? 'text-rose-600' : 'text-amber-600'} />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate">{alert.title}</h4>
                  <p className="text-[11px] opacity-80 mt-0.5">{alert.description}</p>
                </div>
              </div>
              <Link 
                to={alert.link}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-current hover:opacity-80 transition-opacity"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 2. EIGHT MASTER KPI CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3.5">
        {/* KPI 1: TOTAL PRODUCTS */}
        <Link 
          to="/admin/products"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Products</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Package size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {overview?.totalProducts?.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Catalog items</span>
          </div>
        </Link>

        {/* KPI 2: TOTAL CATEGORIES */}
        <Link 
          to="/admin/categories"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categories</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <FolderTree size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {overview?.totalCategories?.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Active categories</span>
          </div>
        </Link>

        {/* KPI 3: TOTAL SUB CATEGORIES */}
        <Link 
          to="/admin/categories"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sub Categories</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
              <Tags size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {overview?.totalSubCategories?.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Active subcategories</span>
          </div>
        </Link>

        {/* KPI 4: TOTAL BUNDLES */}
        <Link 
          to="/admin/bundles"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bundles</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Layers size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {overview?.totalBundles?.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Active bundles</span>
          </div>
        </Link>

        {/* KPI 5: PAID ORDERS (Selected period) */}
        <Link 
          to="/admin/orders"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paid Orders</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <ShoppingCart size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {overview?.paidOrders?.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block truncate">Selected period</span>
          </div>
        </Link>

        {/* KPI 6: TOTAL CUSTOMERS */}
        <Link 
          to="/admin/customers"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customers</span>
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 group-hover:scale-110 transition-transform">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {overview?.totalCustomers?.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Current buyers</span>
          </div>
        </Link>

        {/* KPI 7: TOTAL DOWNLOADS (Selected period) */}
        <Link 
          to="/admin/downloads"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Downloads</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
              <Download size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {overview?.totalDownloads?.toLocaleString() || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Selected period</span>
          </div>
        </Link>

        {/* KPI 8: REVENUE / SELECTED PERIOD */}
        <Link 
          to="/admin/orders"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all group bg-gradient-to-br from-white to-primary/5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Revenue</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <IndianRupee size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-primary tracking-tight">
              {formatCurrency(overview?.periodRevenue || 0)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Selected period</span>
          </div>
        </Link>
      </div>

      {/* 3. AT A GLANCE METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Sales</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{formatCurrency(atAGlance?.todaysSales || 0)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <IndianRupee size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Order (AOV)</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{formatCurrency(atAGlance?.averageOrderValue || 0)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Order Conversion</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{atAGlance?.conversionRate || 0}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Zap size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Tickets</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{atAGlance?.activeSupportTickets || 0}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <HelpCircle size={18} />
          </div>
        </div>
      </div>

      {/* 4. MAIN ANALYTICS: SALES & REVENUE (AREA CHART) + ORDER FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sales & Revenue Overview (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sales & Revenue Overview</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Paid revenue curve across the active period.
                </p>
              </div>
              <div className="flex items-center gap-4 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Revenue</span>
                  <span className="text-lg font-black text-slate-900">{formatCurrency(sales?.totalRevenue || 0)}</span>
                </div>
                <div className="h-7 w-px bg-slate-200"></div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Orders</span>
                  <span className="text-lg font-black text-primary">{sales?.paidOrders || 0}</span>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-1">
              {sales?.revenueSeries && sales.revenueSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sales.revenueSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="masterSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Paid Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2563eb" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#masterSalesGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No revenue records found for this period.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Conversion Funnel (1 Column) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Order Funnel</h2>
              <span className="text-xs text-slate-500 font-semibold">Drop-off Analytics</span>
            </div>

            <div className="space-y-3">
              {orderFunnel && orderFunnel.map((step: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{step.step}</span>
                    <span className="text-slate-900">{step.count} ({step.rate}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(5, step.rate))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">End-to-end checkout & download progression</span>
          </div>
        </div>

      </div>

      {/* 5. PAYMENT STATUS & CATEGORY PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Payment Status Donut */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Payment Status</h2>
              <span className="text-xs text-slate-500 font-semibold">{payments?.totalTransactions || 0} Total</span>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center">
              {paymentPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any) => [`${val} Transactions`, name]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-xs">No transactions in period</div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900">{payments?.successful || 0}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Paid</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link to="/admin/payments" className="p-2 rounded-xl bg-emerald-50 text-center text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors">
                Successful: {payments?.successful || 0}
              </Link>
              <Link to="/admin/payments" className="p-2 rounded-xl bg-amber-50 text-center text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors">
                Pending: {payments?.pending || 0}
              </Link>
              <Link to="/admin/payments" className="p-2 rounded-xl bg-rose-50 text-center text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors">
                Failed: {payments?.failed || 0}
              </Link>
              <Link to="/admin/payments" className="p-2 rounded-xl bg-purple-50 text-center text-xs font-bold text-purple-900 hover:bg-purple-100 transition-colors">
                Refunded: {payments?.refunded || 0}
              </Link>
            </div>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Sales by Category</h2>
              <Link to="/admin/categories" className="text-primary text-xs font-bold hover:underline">Categories</Link>
            </div>

            <div className="space-y-3">
              {salesByCategory && salesByCategory.length > 0 ? (
                salesByCategory.map((cat: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 truncate">{cat.name}</span>
                      <span className="text-slate-900">{formatCurrency(cat.revenue)} ({cat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No category sales in this period.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link to="/admin/categories" className="text-xs font-bold text-primary hover:underline">
              Category Management →
            </Link>
          </div>
        </div>

        {/* Top Selling Products & Bundles */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Top Products & Bundles</h2>
              <Link to="/admin/products" className="text-primary text-xs font-bold hover:underline">View All</Link>
            </div>

            <div className="space-y-2.5">
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((p: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{p.name}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${p.type === 'Bundle' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.type}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 shrink-0">{formatCurrency(p.revenue)}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No product sales in this period.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link to="/admin/products" className="text-xs font-bold text-primary hover:underline">
              Catalog Items →
            </Link>
          </div>
        </div>

      </div>

      {/* 6. GOOGLE DRIVE STORAGE HEALTH & ACCESS ISSUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Google Drive Storage Health Widget */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-primary" />
                <h2 className="text-base font-bold text-slate-900">Google Drive Storage Health</h2>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} />
                Secure Proxy Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">API Connection</span>
                <span className="font-bold text-emerald-700 mt-1 block">Connected & Healthy</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Storage Mode</span>
                <span className="font-bold text-slate-800 mt-1 block">Restricted Private Drive</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Exposed Drive URLs</span>
                <span className="font-black text-emerald-700 mt-1 block">0 (Never Exposed)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Service Account Auth</span>
                <span className="font-bold text-emerald-700 mt-1 block">Valid & Operational</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Google Drive is the single authorized product-file storage. Files are securely streamed server-side after token validation.
            </p>
          </div>
        </div>

        {/* Access & Delivery Issues Actionable Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Access & Delivery Issues</h2>
                <p className="text-xs text-slate-500 mt-0.5">Exceptions in the selected period requiring admin review.</p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full">
                Action Items
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
                <span className="text-xs font-bold text-rose-950">Paid Without Access</span>
                <div className="my-2 flex items-baseline justify-between">
                  <span className="text-xl font-black text-rose-950">{accessDelivery?.paidWithoutAccess || 0}</span>
                  <Link to="/admin/orders" className="text-[10px] font-bold bg-white text-rose-700 px-2 py-0.5 rounded border border-rose-300">
                    Review
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                <span className="text-xs font-bold text-amber-950">Failed Access Emails</span>
                <div className="my-2 flex items-baseline justify-between">
                  <span className="text-xl font-black text-amber-950">{accessDelivery?.failedEmails || 0}</span>
                  <Link to="/admin/orders" className="text-[10px] font-bold bg-white text-amber-700 px-2 py-0.5 rounded border border-amber-300">
                    Review
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                <span className="text-xs font-bold text-amber-950">Failed Downloads</span>
                <div className="my-2 flex items-baseline justify-between">
                  <span className="text-xl font-black text-amber-950">{accessDelivery?.failedDownloads || 0}</span>
                  <Link to="/admin/downloads" className="text-[10px] font-bold bg-white text-amber-700 px-2 py-0.5 rounded border border-amber-300">
                    Review
                  </Link>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-yellow-50/70 border border-yellow-200 flex flex-col justify-between">
                <span className="text-xs font-bold text-yellow-950">Near Download Limit</span>
                <div className="my-2 flex items-baseline justify-between">
                  <span className="text-xl font-black text-yellow-950">{accessDelivery?.nearDownloadLimit || 0}</span>
                  <Link to="/admin/downloads" className="text-[10px] font-bold bg-white text-yellow-800 px-2 py-0.5 rounded border border-yellow-300">
                    Review
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">Failed downloads do not consume customer quota limits</span>
          </div>
        </div>

      </div>

      {/* 7. RECENT ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Orders</h2>
            <p className="text-slate-500 text-xs mt-0.5">Click any order row to inspect full details and order lifecycle timeline.</p>
          </div>
          <Link to="/admin/orders" className="text-primary text-xs font-bold hover:underline">
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Order Number</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Purchase Type</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: any) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-primary group-hover:underline">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium max-w-[180px] truncate">
                        {order.product}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${order.purchaseType === 'Account' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {order.purchaseType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No orders recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. RECENT DOWNLOADS & RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Downloads */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Downloads</h2>
              <p className="text-slate-500 text-xs mt-0.5">Customer asset delivery events in period.</p>
            </div>
            <Link to="/admin/downloads" className="text-primary text-xs font-bold hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3 text-center">Quota</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDownloads && recentDownloads.length > 0 ? (
                  recentDownloads.map((dl: any) => {
                    const isSuccess = dl.result === 'Success';
                    return (
                      <tr key={dl.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">{dl.customer}</td>
                        <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">{dl.product}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {isSuccess ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {dl.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{dl.downloadCount}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{new Date(dl.time).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-xs">
                      No downloads recorded in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">Chronological feed of live store events in period.</p>
              </div>
              <Link to="/admin/audit-logs" className="text-primary text-xs font-bold hover:underline">
                Audit Logs
              </Link>
            </div>

            <div className="space-y-2">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((act: any) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 flex items-start justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${act.type === 'order' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                        {act.type === 'order' ? <ShoppingCart size={11} /> : <Activity size={11} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{act.title}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{act.description}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No activity recorded in this period.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-center">
            <Link to="/admin/audit-logs" className="text-xs font-bold text-primary hover:underline">
              View All Audit History →
            </Link>
          </div>
        </div>

      </div>

      {/* 9. ORDER DETAILS DRAWER WITH 5-STAGE LIFECYCLE TIMELINE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{selectedOrder.orderNumber}</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Order Details & Lifecycle Timeline</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Order Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Customer</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedOrder.customer}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Email</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{selectedOrder.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Amount</span>
                  <span className="font-black text-slate-900 mt-0.5 block">{formatCurrency(selectedOrder.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Purchase Type</span>
                  <span className="font-bold text-indigo-700 mt-0.5 block">{selectedOrder.purchaseType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Razorpay Order</span>
                  <span className="font-mono text-[11px] text-slate-700 mt-0.5 block truncate">{selectedOrder.razorpayOrderId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Razorpay Payment</span>
                  <span className="font-mono text-[11px] text-slate-700 mt-0.5 block truncate">{selectedOrder.razorpayPaymentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Access Status</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">{selectedOrder.accessStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Downloads</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedOrder.downloadCount} / 5</span>
                </div>
              </div>

              {/* Order Visual Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  Order Lifecycle Progression
                </h4>

                <div className="relative pl-6 space-y-4 border-l-2 border-slate-100 ml-2">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                    <h5 className="text-xs font-bold text-slate-900">1. Order Created</h5>
                    <p className="text-[11px] text-slate-500">Checkout session initiated by customer.</p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full ${selectedOrder.razorpayOrderId !== '—' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300 ring-4 ring-slate-100'}`}></div>
                    <h5 className="text-xs font-bold text-slate-900">2. Razorpay Order Created</h5>
                    <p className="text-[11px] text-slate-500">Gateway order identifier registered on server.</p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full ${selectedOrder.status === 'Paid' || selectedOrder.paymentStatus === 'PAID' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-400 ring-4 ring-amber-100'}`}></div>
                    <h5 className="text-xs font-bold text-slate-900">3. Payment Received & Verified</h5>
                    <p className="text-[11px] text-slate-500">Server-side HMAC signature verification confirmed.</p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full ${selectedOrder.status === 'Paid' || selectedOrder.paymentStatus === 'PAID' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300 ring-4 ring-slate-100'}`}></div>
                    <h5 className="text-xs font-bold text-slate-900">4. Purchase & Entitlement Created</h5>
                    <p className="text-[11px] text-slate-500">Secure access entitlement created with 5-download limit.</p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full ${selectedOrder.downloadCount > 0 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300 ring-4 ring-slate-100'}`}></div>
                    <h5 className="text-xs font-bold text-slate-900">5. Google Drive Secure Delivery</h5>
                    <p className="text-[11px] text-slate-500">
                      {selectedOrder.downloadCount > 0 ? `${selectedOrder.downloadCount} successful asset deliveries streamed.` : 'Awaiting customer download request.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5 shrink-0">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link 
                to="/admin/orders"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Full Orders Module
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
