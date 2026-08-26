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
    { name: 'Cache Keys', href: '/admin/cache/keys', icon: Key },
    { name: 'Namespaces', href: '/admin/cache/namespaces', icon: FolderTree },
    { name: 'Statistics', href: '/admin/cache/statistics', icon: BarChart2 },
    { name: 'Invalidation', href: '/admin/cache/invalidation', icon: Zap },
    { name: 'Warming', href: '/admin/cache/warming', icon: Flame },
    { name: 'Maintenance', href: '/admin/cache/maintenance', icon: Wrench },
    { name: 'Failed Jobs', href: '/admin/cache/failed-jobs', icon: AlertTriangle },
    { name: 'Cache Audit', href: '/admin/cache/audit', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-time In-Memory / Redis Telemetry
            </span>
            <span className="text-xs text-slate-400">PostgreSQL Fallback Ready</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Cache & Temporary Data Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Key registry, namespace policies, event-driven invalidation, cache warming, and safe maintenance operations.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Telemetry
          </button>
        )}
      </div>

      {/* Navigation Submenu Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
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
