import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Globe, 
  Radio, 
  Cpu, 
  Database, 
  PauseCircle, 
  AlertOctagon, 
  Bell, 
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface SystemLayoutProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

const navItems = [
  { to: '/admin/system/health', label: 'System Health', icon: Activity },
  { to: '/admin/system/errors', label: 'Error Logs', icon: AlertTriangle },
  { to: '/admin/system/api-logs', label: 'API Logs', icon: Globe },
  { to: '/admin/system/logins', label: 'Login Logs', icon: Shield },
  { to: '/admin/system/backups', label: 'Backup', icon: Database }
];

export const SystemLayout: React.FC<SystemLayoutProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl p-6 text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Infrastructure Telemetry
            </span>
            <span className="text-xs text-slate-500 font-medium">PostgreSQL 16 • Node.js v20</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            System & Infrastructure Management
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Operational control center, health thresholds, error triage, disaster recovery, and background worker queues.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLoading ? 'Polling Metrics...' : 'Refresh Metrics'}</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs in Light Blue Theme */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-sky-200 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-sky-800 hover:bg-sky-50'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Subpage Content */}
      <Outlet />
    </div>
  );
};
