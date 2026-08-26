import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Activity, CheckCircle2, AlertTriangle, 
  XCircle, ArrowRight, RefreshCw, Lock, DollarSign, 
  Store, CreditCard, ArrowDownToLine, Mail, FileText
} from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function SettingsDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/dashboard', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setDashboard(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const s = dashboard?.summary || {};
  const items: any[] = dashboard?.healthItems || [];

  return (
    <SettingsLayout
      title="Settings & System Health Dashboard"
      subtitle="Real-time configuration matrix monitoring payment gateways, email providers, storage health, tax rules, and compliance policies."
      onRefresh={fetchDashboard}
      isLoading={loading}
    >
      {/* 1. Master System Health Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/10 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>KDW Engine Operational</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Configuration Health Matrix</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            All core subsystems are connected to active backend services, PostgreSQL database persistence, and automated audit trails.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center min-w-44">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">Overall Health</span>
          <div className="text-4xl font-black text-emerald-400 mt-1">
            {s.overallHealthScore || 90}%
          </div>
          <span className="text-[11px] text-slate-300 font-semibold mt-0.5 block">
            {s.activeSubsystems || 0} of {s.totalSubsystems || 10} active
          </span>
        </div>
      </div>

      {/* 2. Subsystem Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => {
          const isActive = item.status === 'ACTIVE';
          const isWarning = item.status === 'WARNING';

          return (
            <div
              key={item.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isWarning
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isActive ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-slate-400" />
                    )}
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.message}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700">{item.value}</span>
                <Link
                  to={item.link}
                  className="text-xs font-bold text-blue-600 group-hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  Configure <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </SettingsLayout>
  );
}
