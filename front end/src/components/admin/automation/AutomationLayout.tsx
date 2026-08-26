import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Zap,
  ShoppingCart,
  Mail,
  Users,
  DownloadCloud,
  KeyRound,
  GitBranch,
  Layers,
  Webhook,
  Activity,
  AlertTriangle,
  Flame,
  Calendar,
  Settings,
  RefreshCw
} from 'lucide-react';

interface AutomationLayoutProps {
  children?: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AutomationLayout: React.FC<AutomationLayoutProps> = ({
  children,
  onRefresh,
  isLoading = false
}) => {
  const navItems = [
    { label: 'Overview', to: '/admin/automation/overview', icon: Zap },
    { label: 'Order Rules', to: '/admin/automation/orders', icon: ShoppingCart },
    { label: 'Email Automation', to: '/admin/automation/emails', icon: Mail },
    { label: 'Customer Rules', to: '/admin/automation/customers', icon: Users },
    { label: 'Download Rules', to: '/admin/automation/downloads', icon: DownloadCloud },
    { label: 'Licence Rules', to: '/admin/automation/licences', icon: KeyRound },
    { label: 'Workflow Builder', to: '/admin/automation/builder', icon: GitBranch },
    { label: 'Templates (14)', to: '/admin/automation/templates', icon: Layers },
    { label: 'Webhooks', to: '/admin/automation/webhooks', icon: Webhook },
    { label: 'Workflow Runs', to: '/admin/automation/runs', icon: Activity },
    { label: 'Failed Jobs', to: '/admin/automation/failed-jobs', icon: AlertTriangle },
    { label: 'Dead-Letter (DLQ)', to: '/admin/automation/dead-letter', icon: Flame },
    { label: 'Schedules', to: '/admin/automation/schedules', icon: Calendar },
    { label: 'Settings', to: '/admin/automation/settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">KDW Automation & Workflow Engine</h1>
            <p className="text-xs text-slate-400">
              Event-driven business rules, durable queues, safe dead-letter replays, and webhooks.
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh Telemetry
          </button>
        )}
      </div>

      {/* Navigation Submenu Tabs */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1.5 overflow-x-auto shadow-inner flex gap-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {children}
    </div>
  );
};
export default AutomationLayout;
