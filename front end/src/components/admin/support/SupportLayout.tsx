import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LifeBuoy, Ticket, Clock, ShieldAlert, ArrowDownToLine, 
  RotateCcw, Users, MessageSquare, BarChart3, Plus, RefreshCw, 
  Settings, ThumbsUp
} from 'lucide-react';
import { CreateTicketModal } from './CreateTicketModal';

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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const navLinks = [
    { label: 'Overview', to: '/admin/support/overview', icon: LifeBuoy },
    { label: 'All Tickets', to: '/admin/support/tickets', icon: Ticket },
    { label: 'Unassigned', to: '/admin/support/unassigned', icon: Users },
    { label: 'Overdue (SLA)', to: '/admin/support/overdue', icon: ShieldAlert },
    { label: 'Download Issues', to: '/admin/support/download-issues', icon: ArrowDownToLine },
    { label: 'Refund Requests', to: '/admin/support/refund-requests', icon: RotateCcw },
    { label: 'Customer Requests', to: '/admin/support/customer-requests', icon: Users },
    { label: 'Canned Responses', to: '/admin/support/canned-responses', icon: MessageSquare },
    { label: 'CSAT', to: '/admin/support/satisfaction', icon: ThumbsUp },
    { label: 'Support Reports', to: '/admin/support/reports', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <LifeBuoy className="w-5 h-5" />
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

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Open Ticket
          </button>
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
