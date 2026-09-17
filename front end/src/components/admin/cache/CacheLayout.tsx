import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Database,
  Layers,
  Key,
  FolderTree,
  BarChart2,
  Zap,
  Flame,
  Wrench,
  AlertTriangle,
  FileText,
  RefreshCw
} from 'lucide-react';

interface CacheLayoutProps {
  children?: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const CacheLayout: React.FC<CacheLayoutProps> = ({ children, onRefresh, isLoading }) => {
  const navItems = [
    { name: 'Cache Overview', href: '/admin/cache/overview', icon: Database },
    { name: 'Temporary Data', href: '/admin/cache/temporary-data', icon: Layers },
    { name: 'Maintenance', href: '/admin/cache/maintenance', icon: Wrench },
    { name: 'Statistics', href: '/admin/cache/statistics', icon: BarChart2 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl p-6 shadow-xs text-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time In-Memory / Redis Telemetry
            </span>
            <span className="text-xs text-sky-700 font-medium">PostgreSQL Fallback Ready</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Cache & Temporary Data Management
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time key registry, memory inspection, automated maintenance, and live telemetry.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start md:self-auto px-4 py-2 bg-white hover:bg-sky-50 text-sky-800 text-xs font-semibold rounded-xl transition border border-sky-200 shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : 'text-sky-600'}`} />
            Refresh Telemetry
          </button>
        )}
      </div>

      {/* Navigation Submenu Tabs - Only 4 Core Options */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-sky-100">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-600 hover:text-sky-700 hover:bg-sky-50 border-sky-200/80 shadow-2xs'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {children}
    </div>
  );
};
export default CacheLayout;
