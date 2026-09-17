import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { IndianRupee, ShoppingCart, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import type { DashboardAnalyticsData } from '../../../services/adminDashboardService';

export interface RevenueAnalyticsSectionProps {
  analytics?: DashboardAnalyticsData;
  periodLabel?: string;
  loading: boolean;
}

export default function RevenueAnalyticsSection({
  analytics,
  periodLabel = 'Selected Period',
  loading
}: RevenueAnalyticsSectionProps) {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders' | 'aov'>('revenue');

  const series = analytics?.revenueSeries || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl text-xs space-y-1.5 min-w-[160px]">
          <div className="font-mono font-bold text-slate-500 pb-1 border-b border-slate-100 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#5b21b6]" />
            <span>{label}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Revenue:</span>
            <span className="font-mono font-bold text-[#171325]">{formatCurrency(data.revenue || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Orders:</span>
            <span className="font-mono font-bold text-[#5b21b6]">{data.orders || 0}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>AOV:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(data.aov || 0)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getMetricColor = () => {
    if (activeMetric === 'orders') return '#5b21b6';
    if (activeMetric === 'aov') return '#0284c7';
    return '#059669'; // Revenue emerald
  };

  return (
    <div className="kdw-card p-6 sm:p-8 space-y-6">
      {/* Chart Header & Metric Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            FINANCIAL STANDING
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#171325]">
            Revenue & Order Trajectory
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Recorded database transactions aggregated for <span className="font-semibold text-slate-700">{periodLabel}</span>.
          </p>
        </div>

        {/* Metric Toggles */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric('revenue')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans transition-all ${
              activeMetric === 'revenue'
                ? 'bg-white text-[#171325] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span>Revenue</span>
          </button>
          <button
            onClick={() => setActiveMetric('orders')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans transition-all ${
              activeMetric === 'orders'
                ? 'bg-white text-[#171325] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#5b21b6]" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveMetric('aov')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans transition-all ${
              activeMetric === 'aov'
                ? 'bg-white text-[#171325] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            <span>AOV</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-2xl animate-pulse">
            <span className="text-xs font-mono text-slate-400">Loading transactional timeseries...</span>
          </div>
        ) : series.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center bg-slate-50/50 rounded-2xl text-slate-400 text-xs">
            No transactions recorded in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getMetricColor()} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={getMetricColor()} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'DM Mono' }} 
                dy={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'DM Mono' }}
                tickFormatter={(val) => activeMetric === 'orders' ? String(val) : `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={activeMetric} 
                stroke={getMetricColor()} 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#chartGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Trajectory Summary Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">Period Gross Revenue</span>
          <span className="text-lg font-serif font-bold text-[#171325] font-mono mt-0.5 block">
            {formatCurrency(analytics?.totalRevenue ?? 0)}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">Total Paid Orders</span>
          <span className="text-lg font-serif font-bold text-[#171325] font-mono mt-0.5 block">
            {analytics?.totalOrders ?? 0} Transactions
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">Calculated Period AOV</span>
          <span className="text-lg font-serif font-bold text-[#171325] font-mono mt-0.5 block">
            {formatCurrency(analytics?.averageOrderValue ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
