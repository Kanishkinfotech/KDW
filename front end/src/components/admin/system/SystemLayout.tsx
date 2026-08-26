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
  { to: '/admin/system/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/admin/system/health', label: 'System Health', icon: Activity },
  { to: '/admin/system/errors', label: 'Error Logs', icon: AlertTriangle },
  { to: '/admin/system/logins', label: 'Login Logs', icon: Shield },
  { to: '/admin/system/audit-logs', label: 'Audit Logs', icon: FileText },
  { to: '/admin/system/api-logs', label: 'API Logs', icon: Globe },
  { to: '/admin/system/webhook-logs', label: 'Webhook Logs', icon: Radio },
  { to: '/admin/system/jobs', label: 'Background Jobs', icon: Cpu },
  { to: '/admin/system/backups', label: 'Backups & Recovery', icon: Database },
  { to: '/admin/system/maintenance', label: 'Maintenance Mode', icon: PauseCircle },
  { to: '/admin/system/incidents', label: 'Incidents', icon: AlertOctagon },
  { to: '/admin/system/alerts', label: 'Monitoring Alerts', icon: Bell },
  { to: '/admin/system/reports', label: 'System Reports', icon: BarChart3 }
];

export const SystemLayout: React.FC<SystemLayoutProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Infrastructure Telemetry
            </span>
            <span className="text-xs text-slate-400">PostgreSQL 16 • Node.js v20</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            System & Infrastructure Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Operational control center, health thresholds, error triage, disaster recovery, and background worker queues.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLoading ? 'Polling Metrics...' : 'Refresh Metrics'}</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
