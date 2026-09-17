import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Settings, Store, DollarSign, CreditCard, ArrowDownToLine, 
  Mail, ShieldCheck, Lock, FileText, History, Bell, Palette, 
  Radio, RefreshCw, Save, AlertTriangle, MessageCircle
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
  const chipLinks = [
    { label: 'General', to: '/admin/settings/general', icon: Store },
    { label: 'Store', to: '/admin/settings/store', icon: Store },
    { label: 'Currency & tax', to: '/admin/settings/currency-tax', icon: DollarSign },
    { label: 'Checkout', to: '/admin/settings/checkout', icon: CreditCard },
    { label: 'Security', to: '/admin/settings/security', icon: ShieldCheck },
    { label: 'Privacy', to: '/admin/settings/privacy', icon: Lock },
    { label: 'Terms & Conditions', to: '/admin/settings/legal-documents', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header with Lavender Eyebrow and Serif Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e2e8f0] pb-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            ADMINISTRATION SETTINGS
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171325] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] rounded-full shadow-2xs transition-all disabled:opacity-50 kdw-button-press"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#5b21b6] ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}

          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#5b21b6] hover:bg-[#6d28d9] rounded-full shadow-xs transition-all kdw-button-press"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontally Scrollable Subtle Chip Rail */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {chipLinks.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium font-sans rounded-full transition-all whitespace-nowrap kdw-button-press ${
                  isActive
                    ? 'bg-[#5b21b6] text-white font-semibold shadow-xs'
                    : 'bg-white border border-[#e2e8f0] text-slate-600 hover:border-slate-300 hover:text-[#171325]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
