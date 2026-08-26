import React from 'react';
import { Calendar, Filter, RefreshCw, Download, Globe, DollarSign } from 'lucide-react';

interface ReportFilterBarProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  products?: Array<{ id: string; name: string }>;
  selectedProduct?: string;
  onProductChange?: (productId: string) => void;
  categories?: Array<{ id: string; name: string }>;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  metadata?: {
    range?: string;
    timezone?: string;
    currency?: string;
    lastUpdated?: Date | string;
    includedStatuses?: string[];
    excludedStatuses?: string[];
  };
}

export default function ReportFilterBar({
  dateRange,
  onDateRangeChange,
  products = [],
  selectedProduct = 'ALL',
  onProductChange,
  categories = [],
  selectedCategory = 'ALL',
  onCategoryChange,
  onRefresh,
  onExport,
  isExporting = false,
  metadata
}: ReportFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <Calendar size={16} className="text-slate-500" />
            <span className="font-semibold text-slate-700">Period:</span>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="today">Today (24h)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">This Year (YTD)</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          {/* Product Filter */}
          {onProductChange && products.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm">
              <Filter size={16} className="text-slate-500" />
              <span className="font-semibold text-slate-700">Product:</span>
              <select
                value={selectedProduct}
                onChange={(e) => onProductChange(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-medium focus:outline-none max-w-[180px] truncate cursor-pointer"
              >
                <option value="ALL">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          {onCategoryChange && categories.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm">
              <Filter size={16} className="text-slate-500" />
              <span className="font-semibold text-slate-700">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="bg-transparent border-none text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2 px-4 rounded-xl shadow-sm shadow-primary/20 transition-all disabled:opacity-50"
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
          )}
        </div>
      </div>

      {/* Metadata Transparency Banner */}
      <div className="bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1">
            <Globe size={13} className="text-slate-400" />
            <strong className="font-semibold text-slate-700">Timezone:</strong> {metadata?.timezone || 'Asia/Kolkata (IST)'}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign size={13} className="text-slate-400" />
            <strong className="font-semibold text-slate-700">Currency:</strong> {metadata?.currency || 'INR (₹)'}
          </span>
          {metadata?.includedStatuses && (
            <span>
              <strong className="font-semibold text-emerald-700">Includes:</strong> {metadata.includedStatuses.join(', ')}
            </span>
          )}
          {metadata?.excludedStatuses && (
            <span>
              <strong className="font-semibold text-slate-500">Excludes:</strong> {metadata.excludedStatuses.join(', ')}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-400">Source: PostgreSQL Truth • Last Synced: </span>
          <strong className="font-medium text-slate-700">
            {metadata?.lastUpdated ? new Date(metadata.lastUpdated).toLocaleTimeString() : new Date().toLocaleTimeString()}
          </strong>
        </div>
      </div>
    </div>
  );
}
