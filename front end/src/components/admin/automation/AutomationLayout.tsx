import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Zap, ShoppingBag, Mail, Users, Download, 
  Calendar, Activity, Webhook, RefreshCw 
} from 'lucide-react';

interface AutomationLayoutProps {
  children?: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AutomationLayout({
  children,
  onRefresh,
  isLoading = false
}: AutomationLayoutProps) {
  const tabs = [
    { label: 'Order automation', to: '/admin/automation/orders', icon: ShoppingBag },
    { label: 'Email automation', to: '/admin/automation/emails', icon: Mail },
    { label: 'Customer automation', to: '/admin/automation/customers', icon: Users },
    { label: 'Download automation', to: '/admin/automation/downloads', icon: Download },
    { label: 'Schedules', to: '/admin/automation/schedules', icon: Calendar },
    { label: 'Workflow logs', to: '/admin/automation/runs', icon: Activity },
    { label: 'Webhooks', to: '/admin/automation/webhooks', icon: Webhook },
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            WORKFLOW CONTROLS
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171325] tracking-tight">
            Automation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-2xl">
            Event-driven business rules, automated webhook dispatchers, and deployment-ready background queue schedules.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] rounded-full shadow-2xs transition-all disabled:opacity-50 kdw-button-press self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5b21b6] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Rules</span>
          </button>
        )}
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-4 py-2 text-xs font-medium font-sans rounded-full transition-all whitespace-nowrap kdw-button-press ${
                  isActive
                    ? 'bg-[#5b21b6] text-white font-semibold shadow-xs'
                    : 'bg-white border border-[#e2e8f0] text-slate-600 hover:border-slate-300 hover:text-[#171325]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Content Canvas */}
      <div>{children}</div>
    </div>
  );
}

export default AutomationLayout;
