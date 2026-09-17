import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  PhoneCall, Ticket, Clock, ShieldAlert, ArrowDownToLine, 
  RotateCcw, Users, MessageSquare, BarChart3, RefreshCw, 
  Settings, ThumbsUp
} from 'lucide-react';

interface SupportLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SupportLayout({
  title,
  subtitle,
  children,
  actions,
  onRefresh,
  isLoading
}: SupportLayoutProps) {
  const navLinks = [
    { label: 'Support Tickets', to: '/admin/support/tickets', icon: Ticket },
    { label: 'Customer Requests', to: '/admin/support/customer-requests', icon: Users },
    { label: 'Refund Requests', to: '/admin/support/refund-requests', icon: RotateCcw },
    { label: 'Contact & Queries', to: '/admin/support/contact-queries', icon: MessageSquare }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1 pl-10">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200/60 no-scrollbar">
        {navLinks.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {link.label}
            </NavLink>
          );
        })}
      </div>

      {/* Main Content */}
      <div>{children}</div>
    </div>
  );
}
