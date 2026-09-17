import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import type { DashboardCustomersData } from '../../../services/adminDashboardService';

export interface CustomerActivitySectionProps {
  customersData?: DashboardCustomersData;
  loading: boolean;
}

export default function CustomerActivitySection({ customersData, loading }: CustomerActivitySectionProps) {
  const customers = customersData || { total: 0, newToday: 0, newThisWeek: 0, returning: 0, guestPurchases: 0, verifiedAccounts: 0 };

  return (
    <div className="kdw-card p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            AUDIENCE & RETENTION
          </span>
          <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
            Customer Activity
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Account registrations, guest purchases, and customer retention standing.
          </p>
        </div>
        <Link
          to="/admin/customers"
          className="text-xs font-semibold text-[#5b21b6] hover:underline inline-flex items-center gap-1 font-sans"
        >
          <span>All customers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* New Today */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">New Today</span>
            <UserPlus className="w-3.5 h-3.5 text-[#5b21b6]" />
          </div>
          <div className="text-xl font-serif font-bold text-[#171325] font-mono mt-1">
            {loading ? '—' : customers.newToday}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            +{customers.newThisWeek} this week
          </span>
        </div>

        {/* Returning Customers */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Returning</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-serif font-bold text-[#171325] font-mono mt-1">
            {loading ? '—' : customers.returning}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            2+ paid orders
          </span>
        </div>

        {/* Guest Purchases */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Guest Buys</span>
            <Users className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-serif font-bold text-[#171325] font-mono mt-1">
            {loading ? '—' : customers.guestPurchases}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            Instant checkouts
          </span>
        </div>

        {/* Verified Accounts */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Verified</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-serif font-bold text-[#171325] font-mono mt-1">
            {loading ? '—' : customers.verifiedAccounts}
          </div>
          <span className="text-[11px] text-slate-500 font-sans mt-0.5 block">
            Email validated
          </span>
        </div>
      </div>
    </div>
  );
}
