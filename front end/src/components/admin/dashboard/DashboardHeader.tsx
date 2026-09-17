import React, { useState } from 'react';
import { RefreshCw, Calendar, ArrowUpDown, Download, Radio, Check, ChevronDown } from 'lucide-react';

export interface DashboardHeaderProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  comparePeriod?: string;
  onComparePeriodChange?: (compare: string) => void;
  isLive: boolean;
  lastSyncedText: string;
  isRefreshing: boolean;
  onSynchronize: () => void;
  onOpenExport: () => void;
}

const DATE_RANGE_OPTIONS = [
  'Today',
  'Yesterday',
  'Last 7 Days',
  'Last 30 Days',
  'Last 90 Days',
  'This Month',
  'Last Month',
  'This Year',
  'Custom Range'
];

export default function DashboardHeader({
  dateRange,
  onDateRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  isLive,
  lastSyncedText,
  isRefreshing,
  onSynchronize,
  onOpenExport
}: DashboardHeaderProps) {
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [startDateInput, setStartDateInput] = useState(customStartDate || '');
  const [endDateInput, setEndDateInput] = useState(customEndDate || '');

  const handleSelectRange = (opt: string) => {
    setShowDateDropdown(false);
    if (opt === 'Custom Range') {
      setShowCustomModal(true);
    } else {
      onDateRangeChange(opt);
    }
  };

  const handleApplyCustomDates = () => {
    if (startDateInput && endDateInput && onCustomDateChange) {
      onCustomDateChange(startDateInput, endDateInput);
      onDateRangeChange('Custom Range');
      setShowCustomModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
              WORKSPACE OVERVIEW
            </span>

            {/* Live Connection Status Badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold transition-all ${
              isLive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{isLive ? 'Live' : 'Reconnecting...'}</span>
            </div>

            <span className="text-slate-400 text-xs font-mono hidden sm:inline">
              • Last synced {lastSyncedText}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171325] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-xl">
            Live metrics and operational standing derived directly from durable database records.
          </p>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Date Range Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(prev => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#e2e8f0] bg-white hover:bg-slate-50 text-xs font-semibold font-sans text-slate-700 transition-all shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#5b21b6]" />
              <span>
                {dateRange === 'Custom Range' && customStartDate && customEndDate
                  ? `${customStartDate} – ${customEndDate}`
                  : dateRange}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDateDropdown && (
              <div className="absolute left-0 lg:right-0 lg:left-auto top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 py-1.5">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Period
                </div>
                {DATE_RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSelectRange(opt)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-sans transition-colors flex items-center justify-between ${
                      dateRange === opt 
                        ? 'bg-[#5b21b6]/10 text-[#5b21b6] font-bold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt}</span>
                    {dateRange === opt && <Check className="w-3.5 h-3.5 text-[#5b21b6]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Synchronize Button */}
          <button
            onClick={onSynchronize}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white hover:bg-slate-50 text-xs font-semibold font-sans text-slate-700 transition-all kdw-button-press shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5b21b6] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Synchronize Data</span>
          </button>

          {/* Export Report Button */}
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans tracking-wide transition-all shadow-sm kdw-button-press"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Custom Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-slate-900">Custom Date Range</h3>
            <p className="text-xs text-slate-500 font-sans">
              Choose start and end dates to aggregate analytics and transaction records.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">End Date</label>
                <input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomDates}
                disabled={!startDateInput || !endDateInput}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5b21b6] text-white hover:bg-[#6d28d9] disabled:opacity-50"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
