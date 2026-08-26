import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Users, KeyRound, ShoppingBag, Ticket, Download, 
  AlertTriangle, RefreshCw, FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import SEO from '../../SEO';

export interface TabItem {
  id: string;
  label: string;
  href: string;
  badge?: number | string;
}

interface ReportLayoutProps {
  title: string;
  subtitle: string;
  module: 'customer' | 'login' | 'buy-analysis' | 'coupon' | 'download';
  tabs: TabItem[];
  children: React.ReactNode;
  onRefresh?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export default function ReportLayout({
  title,
  subtitle,
  module,
  tabs,
  children,
  onRefresh,
  onExport,
  isExporting = false
}: ReportLayoutProps) {
  const moduleIcons = {
    customer: Users,
    login: KeyRound,
    'buy-analysis': ShoppingBag,
    coupon: Ticket,
    download: Download
  };

  const Icon = moduleIcons[module] || Users;

  return (
    <div className="space-y-6">
      <SEO title={`${title} | KDW Intelligence Reports`} description={subtitle} />

      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Icon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{subtitle}</p>
          </div>
        </div>

        {/* Global Action Toolbar */}
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
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <FileSpreadsheet size={15} />
              {isExporting ? 'Exporting...' : 'Export Dataset'}
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white px-3 pt-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.href}
              end={tab.href.endsWith('/overview') || tab.href.split('/').length <= 4}
              className={({ isActive }) =>
                `px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-current">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Child Content */}
      <div>{children}</div>
    </div>
  );
}
