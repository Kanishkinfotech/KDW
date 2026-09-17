import React from 'react';
import { Link } from 'react-router-dom';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  Package, 
  Boxes,
  TrendingUp, 
  Download, 
  PhoneCall, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import type { DashboardKpiData } from '../../../services/adminDashboardService';

export interface DashboardKpiGridProps {
  kpis?: DashboardKpiData;
  periodInfo?: {
    label?: string;
    rangeKey?: string;
    compareMode?: string;
    compareLabel?: string;
    startDate?: string;
    endDate?: string;
  };
  rangeKey?: string;
  loading: boolean;
}

export default function DashboardKpiGrid({ kpis, periodInfo, rangeKey = 'Last 7 Days', loading }: DashboardKpiGridProps) {
  const getPeriodTitles = (rKey: string = 'Last 7 Days', pInfo?: DashboardKpiGridProps['periodInfo']) => {
    const r = rKey.toLowerCase().replace(/_/g, ' ');
    let revenueTitle = 'Period Revenue';
    let ordersTitle = 'Period Orders';
    let dateSubtitle = 'IST Store Day';

    if (pInfo?.startDate && pInfo?.endDate) {
      const s = new Date(pInfo.startDate);
      const e = new Date(pInfo.endDate);
      dateSubtitle = `${s.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${e.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
    }

    if (r === 'today' || r === '1d') {
      revenueTitle = "Today's Revenue";
      ordersTitle = "Orders Today";
      dateSubtitle = "IST Store Day";
    } else if (r === 'yesterday') {
      revenueTitle = "Yesterday's Revenue";
      ordersTitle = "Yesterday's Orders";
      dateSubtitle = "IST Store Day";
    } else if (r.includes('7')) {
      revenueTitle = "7 Days Revenue";
      ordersTitle = "7 Days Orders";
    } else if (r.includes('30')) {
      revenueTitle = "30 Days Revenue";
      ordersTitle = "30 Days Orders";
    } else if (r.includes('90')) {
      revenueTitle = "90 Days Revenue";
      ordersTitle = "90 Days Orders";
    } else if (r === 'this month' || r === 'month') {
      revenueTitle = "This Month's Revenue";
      ordersTitle = "This Month's Orders";
    } else if (r === 'last month') {
      revenueTitle = "Last Month's Revenue";
      ordersTitle = "Last Month's Orders";
    } else if (r.includes('year') || r === 'ytd') {
      revenueTitle = "This Year's Revenue";
      ordersTitle = "This Year's Orders";
    } else if (r === 'custom range' || r === 'custom') {
      revenueTitle = "Period Revenue";
      ordersTitle = "Period Orders";
    }

    return { revenueTitle, ordersTitle, dateSubtitle };
  };

  const isToday = rangeKey.toLowerCase() === 'today' || rangeKey.toLowerCase() === '1d';
  const isNoComparison = periodInfo?.compareMode === 'none';
  const compareTagLabel = isNoComparison ? '' : (periodInfo?.compareLabel || (isToday ? 'vs yesterday' : 'vs prev'));

  const { revenueTitle, ordersTitle, dateSubtitle } = getPeriodTitles(rangeKey, periodInfo);

  const revenueDisplay = isToday ? (kpis?.todayRevenue ?? 0) : (kpis?.periodRevenue ?? 0);
  const ordersDisplay = isToday ? (kpis?.ordersToday ?? 0) : (kpis?.periodOrders ?? 0);

  const revenueGrowthVal = isNoComparison 
    ? null 
    : (isToday ? kpis?.todayRevenueGrowth : kpis?.revenueGrowth);

  const ordersGrowthVal = isNoComparison
    ? null
    : (isToday ? kpis?.todayOrdersGrowth : kpis?.ordersGrowth);

  const renderTrend = (growth: number | null | undefined, label: string = 'vs prev') => {
    if (isNoComparison || growth === null || growth === undefined) {
      return null;
    }
    if (growth > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
          <ArrowUpRight className="w-3 h-3" />
          <span>+{growth}%</span>
          {label && <span className="text-[9px] font-sans text-emerald-700 font-normal ml-0.5 hidden xl:inline">{label}</span>}
        </span>
      );
    }
    if (growth < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
          <ArrowDownRight className="w-3 h-3" />
          <span>{growth}%</span>
          {label && <span className="text-[9px] font-sans text-rose-700 font-normal ml-0.5 hidden xl:inline">{label}</span>}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
        <span>0%</span>
        {label && <span className="text-[9px] font-sans text-slate-500 font-normal ml-0.5 hidden xl:inline">{label}</span>}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      {/* 1. Period Revenue Card */}
      <Link
        to="/admin/orders"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            {loading ? <span className="w-12 h-4 bg-slate-100 rounded animate-pulse" /> : renderTrend(revenueGrowthVal, compareTagLabel)}
            <span className="text-[10px] font-mono text-slate-400">01</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-24 h-8 bg-slate-100 rounded animate-pulse" /> : formatCurrency(revenueDisplay)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span className="truncate max-w-[150px]">{revenueTitle}</span>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">{dateSubtitle}</span>
          </div>
        </div>
      </Link>

      {/* 2. Period Orders Card */}
      <Link
        to="/admin/orders"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            {loading ? (
              <span className="w-12 h-4 bg-slate-100 rounded animate-pulse" />
            ) : isToday ? (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                {kpis?.todayOrdersGrowth && kpis.todayOrdersGrowth >= 0 ? `+${kpis.todayOrdersGrowth}` : (kpis?.todayOrdersGrowth ?? 0)} vs yday
              </span>
            ) : (
              renderTrend(ordersGrowthVal, compareTagLabel)
            )}
            <span className="text-[10px] font-mono text-slate-400">02</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : `${ordersDisplay} Orders`}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span className="truncate max-w-[150px]">{ordersTitle}</span>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">{dateSubtitle}</span>
          </div>
        </div>
      </Link>

      {/* 3. Registered Customers */}
      <Link
        to="/admin/customers"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +{kpis?.newCustomersToday ?? 0} today
            </span>
            <span className="text-[10px] font-mono text-slate-400">03</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : (kpis?.totalCustomers ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span>Registered Customers</span>
            <span className="text-[11px] font-mono text-slate-400">{kpis?.returningCustomers ?? 0} returning</span>
          </div>
        </div>
      </Link>

      {/* 4. Products Card (Dedicated) */}
      <Link
        to="/admin/products"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-slate-400">04</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : (kpis?.productsCount ?? 25)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span>Active Products</span>
            <span className="text-[11px] font-mono text-slate-400">Live in Store</span>
          </div>
        </div>
      </Link>

      {/* 5. Product Bundles Card (Dedicated) */}
      <Link
        to="/admin/bundles"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Boxes className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-slate-400">05</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : (kpis?.bundlesCount ?? 4)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span>Product Bundles</span>
            <span className="text-[11px] font-mono text-slate-400">Curated Packages</span>
          </div>
        </div>
      </Link>

      {/* 6. Average Order Value */}
      <Link
        to="/admin/analytics"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            {loading ? <span className="w-12 h-4 bg-slate-100 rounded animate-pulse" /> : renderTrend(kpis?.aovGrowth, compareTagLabel)}
            <span className="text-[10px] font-mono text-slate-400">06</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-24 h-8 bg-slate-100 rounded animate-pulse" /> : formatCurrency(kpis?.averageOrderValue ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span>Average Order Value</span>
            <span className="text-[11px] font-mono text-slate-400">Period AOV</span>
          </div>
        </div>
      </Link>

      {/* 7. Digital Downloads */}
      <Link
        to="/admin/downloads"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-slate-400">07</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : (kpis?.downloadsToday ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span>Downloads Recorded</span>
            <span className="text-[11px] font-mono text-slate-400">{kpis?.failedDownloads ?? 0} failures</span>
          </div>
        </div>
      </Link>

      {/* 8. Open Support */}
      <Link
        to="/admin/support/tickets"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            {kpis && kpis.highPriorityTickets > 0 && (
              <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                {kpis.highPriorityTickets} High Pri
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-400">08</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : (kpis?.openSupportTickets ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span>Open Support Tickets</span>
            <span className="text-[11px] font-mono text-slate-400">{kpis?.unassignedTickets ?? 0} unassigned</span>
          </div>
        </div>
      </Link>

      {/* 9. Active Workflow Rules */}
      <Link
        to="/admin/automation"
        className="kdw-card p-5 flex flex-col justify-between min-h-[140px] hover:border-[#5b21b6]/40 group transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-slate-400">09</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] font-mono tracking-tight">
            {loading ? <span className="inline-block w-16 h-8 bg-slate-100 rounded animate-pulse" /> : (kpis?.activeWorkflowRules ?? 0)}
          </div>
          <div className="flex items-center justify-between text-xs font-medium font-sans text-slate-500 mt-1">
            <span>Active Workflow Rules</span>
            <span className="text-[11px] font-mono text-slate-400">Durable Engine</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
