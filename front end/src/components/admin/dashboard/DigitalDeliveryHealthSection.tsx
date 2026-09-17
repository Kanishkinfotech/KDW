import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { DashboardDeliveryData } from '../../../services/adminDashboardService';

export interface DigitalDeliveryHealthSectionProps {
  deliveryData?: DashboardDeliveryData;
  loading: boolean;
}

export default function DigitalDeliveryHealthSection({ deliveryData, loading }: DigitalDeliveryHealthSectionProps) {
  const delivery = deliveryData || {
    downloadsToday: 0,
    successRate: 100,
    failedDownloads: 0,
    activeEntitlements: 0,
    expiringAccess: 0,
    licenceIssues: 0
  };

  return (
    <div className="kdw-card p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            ASSET FULFILMENT
          </span>
          <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
            Digital Delivery Health
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Real-time standing of download tokens, secure delivery links, and customer entitlements.
          </p>
        </div>
        <Link
          to="/admin/downloads"
          className="text-xs font-semibold text-[#5b21b6] hover:underline inline-flex items-center gap-1 font-sans"
        >
          <span>Delivery center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Downloads */}
        <Link
          to="/admin/downloads/activity"
          className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Downloads Recorded</span>
            <Download className="w-3.5 h-3.5 text-[#5b21b6]" />
          </div>
          <div className="text-xl font-serif font-bold text-[#171325] font-mono mt-1">
            {loading ? '—' : delivery.downloadsToday}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            Lifetime logs
          </span>
        </Link>

        {/* Success Rate */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Success Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-serif font-bold text-emerald-600 font-mono mt-1">
            {loading ? '—' : `${delivery.successRate}%`}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            Google Drive streaming
          </span>
        </div>

        {/* Active Entitlements */}
        <Link
          to="/admin/downloads/entitlements"
          className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Entitlements</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-serif font-bold text-[#171325] font-mono mt-1">
            {loading ? '—' : delivery.activeEntitlements}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            Active access grants
          </span>
        </Link>

        {/* Failed Downloads / Alerts */}
        <Link
          to="/admin/downloads/failed"
          className={`p-4 rounded-2xl border transition-colors ${
            delivery.failedDownloads > 0 
              ? 'bg-rose-50/50 border-rose-200 text-rose-700 hover:bg-rose-50' 
              : 'bg-slate-50 border-slate-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Delivery Failures</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${delivery.failedDownloads > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-xl font-serif font-bold font-mono mt-1 ${delivery.failedDownloads > 0 ? 'text-rose-600' : 'text-[#171325]'}`}>
            {loading ? '—' : delivery.failedDownloads}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            {delivery.failedDownloads > 0 ? 'Action required' : 'Zero errors'}
          </span>
        </Link>
      </div>
    </div>
  );
}
