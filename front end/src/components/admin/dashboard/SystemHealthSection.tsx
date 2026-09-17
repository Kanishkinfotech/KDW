import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  Database, 
  CreditCard, 
  Mail, 
  HardDrive, 
  Cpu, 
  Layers, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import type { DashboardSystemHealthData, SystemHealthItem } from '../../../services/adminDashboardService';

export interface SystemHealthSectionProps {
  healthData?: DashboardSystemHealthData;
  loading: boolean;
}

export default function SystemHealthSection({ healthData, loading }: SystemHealthSectionProps) {
  const health = healthData || {
    api: { status: 'Healthy', label: 'API Gateway', latency: '4ms' },
    database: { status: 'Healthy', label: 'PostgreSQL Database', latency: '2ms' },
    paymentGateway: { status: 'Healthy', label: 'Razorpay Payment Gateway' },
    email: { status: 'Healthy', label: 'Transactional Email (SMTP)' },
    googleDrive: { status: 'Healthy', label: 'Google Drive Storage API' },
    workers: { status: 'Healthy', label: 'Automation Engine Workers' },
    cache: { status: 'Healthy', label: 'In-Memory Cache' }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Healthy') {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (status === 'Warning') {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    }
    return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Healthy') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status === 'Warning') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const subsystems = [
    { key: 'api', name: 'API Gateway', link: '/admin/system/api-logs', icon: Server, data: health.api },
    { key: 'database', name: 'Database', link: '/admin/system/health', icon: Database, data: health.database },
    { key: 'paymentGateway', name: 'Payments', link: '/admin/settings/integrations', icon: CreditCard, data: health.paymentGateway },
    { key: 'email', name: 'Email / SMTP', link: '/admin/settings/email', icon: Mail, data: health.email },
    { key: 'googleDrive', name: 'Google Drive', link: '/admin/downloads/product-files', icon: HardDrive, data: health.googleDrive },
    { key: 'workers', name: 'Workers', link: '/admin/system/jobs', icon: Cpu, data: health.workers },
    { key: 'cache', name: 'Cache', link: '/admin/cache/overview', icon: Layers, data: health.cache },
  ];

  return (
    <div className="kdw-card p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            INFRASTRUCTURE & INTEGRITY
          </span>
          <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
            Operational System Health
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Durability and live connection health across core services and external gateways.
          </p>
        </div>
        <Link
          to="/admin/system/health"
          className="text-xs font-semibold text-[#5b21b6] hover:underline inline-flex items-center gap-1 font-sans"
        >
          <span>Full health report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {subsystems.map(sub => {
          const Icon = sub.icon;
          const status = sub.data?.status || 'Healthy';
          return (
            <Link
              key={sub.key}
              to={sub.link}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#5b21b6] transition-colors" />
                {getStatusIcon(status)}
              </div>
              <div className="mt-3">
                <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-[#5b21b6] transition-colors">
                  {sub.name}
                </span>
                <div className="mt-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
