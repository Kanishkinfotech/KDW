import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import type { DashboardProductsData, DashboardTopProduct } from '../../../services/adminDashboardService';

export interface TopProductsSectionProps {
  productsData?: DashboardProductsData;
  loading: boolean;
}

export default function TopProductsSection({ productsData, loading }: TopProductsSectionProps) {
  const topProducts = productsData?.topProducts || [];

  return (
    <div className="kdw-card p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            CATALOG PERFORMANCE
          </span>
          <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
            Top Performing Products
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Leading digital assets ranked by units sold and gross revenue.
          </p>
        </div>
        <Link
          to="/admin/products"
          className="text-xs font-semibold text-[#5b21b6] hover:underline inline-flex items-center gap-1 font-sans"
        >
          <span>View catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-slate-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : topProducts.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          <Package className="w-6 h-6 mx-auto mb-2 text-slate-300" />
          No product sales recorded in this period.
        </div>
      ) : (
        <div className="space-y-3">
          {topProducts.map((p: DashboardTopProduct, idx: number) => (
            <div
              key={p.id || idx}
              className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/60 transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-[#5b21b6] shrink-0 shadow-2xs">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 truncate block group-hover:text-[#5b21b6] transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans block">
                    {p.category} • <span className="font-mono">{p.unitsSold} units sold</span>
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-sm text-[#171325] block">
                  {formatCurrency(p.revenue)}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Top Seller
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
