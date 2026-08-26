import React from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContentLayoutProps {
  title: string;
  subtitle: string;
  backUrl?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  title,
  subtitle,
  backUrl,
  backLabel = 'Back',
  actions,
  onRefresh,
  isLoading = false,
  children
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          {backUrl && (
            <Link
              to={backUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {backLabel}
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl border border-slate-200 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              Refresh
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Main Content Body */}
      {children}
    </div>
  );
};
