import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Settings, Store, DollarSign, CreditCard, ArrowDownToLine, 
  Mail, ShieldCheck, Lock, FileText, History, RefreshCw, 
  Save, AlertTriangle, CheckCircle2, Search
} from 'lucide-react';

interface SettingsLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isDirty?: boolean;
  onSave?: () => void;
  onReset?: () => void;
  isSaving?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SettingsLayout({
  title,
  subtitle,
  children,
  isDirty,
  onSave,
  onReset,
  isSaving,
  onRefresh,
  isLoading
}: SettingsLayoutProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Dashboard', to: '/admin/settings/dashboard', icon: Settings },
    { label: 'General', to: '/admin/settings/general', icon: Store },
    { label: 'Storefront', to: '/admin/settings/store', icon: Store },
    { label: 'Currency & Tax', to: '/admin/settings/currency-tax', icon: DollarSign },
    { label: 'Checkout & Payments', to: '/admin/settings/checkout', icon: CreditCard },
    { label: 'Downloads & Delivery', to: '/admin/settings/downloads', icon: ArrowDownToLine },
    { label: 'Email Provider', to: '/admin/settings/email', icon: Mail },
    { label: 'Security & Access', to: '/admin/settings/security', icon: ShieldCheck },
    { label: 'Privacy & GDPR', to: '/admin/settings/privacy', icon: Lock },
    { label: 'Legal Documents', to: '/admin/settings/legal-documents', icon: FileText },
    { label: 'Audit History', to: '/admin/settings/audit', icon: History }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Settings className="w-5 h-5" />
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

          {onReset && isDirty && (
            <button
              onClick={onReset}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Discard Changes
            </button>
          )}

          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                isDirty
                  ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400/50'
                  : 'bg-blue-600 hover:bg-blue-700 opacity-90'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          )}
        </div>
      </div>

      {/* Dirty-state Unsaved Notification */}
      {isDirty && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You have unsaved changes in this section. Be sure to save before navigating away.</span>
          </div>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all"
          >
            Save Now
          </button>
        </div>
      )}

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

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
