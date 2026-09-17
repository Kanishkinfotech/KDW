import React from 'react';
import { Download, FileSpreadsheet, Printer, X, CheckCircle2 } from 'lucide-react';
import type { DashboardResponse } from '../../../services/adminDashboardService';
import { AdminDashboardService } from '../../../services/adminDashboardService';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: DashboardResponse | null;
}

export default function ExportModal({ isOpen, onClose, dashboardData }: ExportModalProps) {
  if (!isOpen || !dashboardData) return null;

  const handleExportCSV = () => {
    AdminDashboardService.exportToCSV(dashboardData, 'kdw_operations_report');
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            REPORT EXPORT CENTER
          </span>
          <h3 className="text-xl font-serif font-bold text-[#171325] mt-1">
            Export Operations Data
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Download or print transactional metrics aggregated for <span className="font-semibold text-slate-800">{dashboardData.period.label}</span>.
          </p>
        </div>

        <div className="space-y-3">
          {/* Option 1: CSV */}
          <button
            onClick={handleExportCSV}
            className="w-full p-4 rounded-2xl border border-slate-200/80 hover:border-[#5b21b6]/40 hover:bg-slate-50/80 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block group-hover:text-[#5b21b6] transition-colors">
                  Comma-Separated Values (CSV)
                </span>
                <span className="text-xs text-slate-500 font-sans block mt-0.5">
                  Complete dataset formatted for data analysis and spreadsheets.
                </span>
              </div>
            </div>
          </button>

          {/* Option 2: Print */}
          <button
            onClick={handlePrint}
            className="w-full p-4 rounded-2xl border border-slate-200/80 hover:border-[#5b21b6]/40 hover:bg-slate-50/80 transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block group-hover:text-[#5b21b6] transition-colors">
                  Print / PDF Document
                </span>
                <span className="text-xs text-slate-500 font-sans block mt-0.5">
                  Formatted summary suitable for executive reporting or filing.
                </span>
              </div>
            </div>
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-[11px] text-slate-500 font-sans flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All metrics reflect durable records committed to PostgreSQL.</span>
        </div>
      </div>
    </div>
  );
}
