import React from 'react';
import { Info } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  formula?: string;
  icon: React.ElementType;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple' | 'slate';
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  subtitle,
  formula,
  icon: Icon,
  color = 'slate',
  onClick
}: KpiCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
          {formula && (
            <div className="group relative inline-block">
              <Info size={13} className="text-slate-400 hover:text-slate-600 cursor-help" />
              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-30 w-56 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl font-normal leading-relaxed">
                <span className="font-bold text-slate-200 block mb-0.5">Formula:</span>
                <code>{formula}</code>
              </div>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-xl border ${colorStyles[color]}`}>
          <Icon size={18} />
        </div>
      </div>

      <div>
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        {subtitle && (
          <div className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function KpiGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  const gridCols = cols === 5 ? 'lg:grid-cols-5' : (cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4');
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4`}>
      {children}
    </div>
  );
}
