import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Database, 
  CreditCard, 
  Mail, 
  HardDrive, 
  Cpu, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/system/dashboard', { withCredentials: true });
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load system dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const health = dashboardData?.healthSummary;
  const kpis = dashboardData?.kpiCards || [];
  const services = health?.services || [];

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchDashboard} isLoading={loading} />

      {loading && !dashboardData ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
          <p className="text-sm font-medium">Querying infrastructure telemetry & active health checks...</p>
        </div>
      ) : (
        <>
          {/* Master Health Status Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${
                health?.overallStatus === 'HEALTHY' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : health?.overallStatus === 'WARNING'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {health?.overallStatus === 'HEALTHY' ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Operational Status</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">Updated just now</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {health?.overallStatus === 'HEALTHY' ? 'All Monitored Subsystems Operational' : 'Infrastructure Attention Required'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Host Memory: {health?.systemMetrics?.memoryUsedPercent}% • CPU Cores: {health?.systemMetrics?.cpuCores} • Uptime: {Math.floor((health?.systemMetrics?.uptimeSeconds || 0) / 3600)} hours
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-slate-950/60 border border-slate-800/80 rounded-xl px-6 py-4">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Health Score</div>
                <div className="text-3xl font-extrabold text-emerald-400">{health?.overallScore || 100}%</div>
              </div>
              <div className="h-10 w-px bg-slate-800"></div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Services Active</div>
                <div className="text-lg font-bold text-white">
                  {services.filter((s: any) => s.status === 'HEALTHY').length} / {services.length}
                </div>
              </div>
            </div>
          </div>

          {/* 8 Primary KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi: any) => (
              <Link
                key={kpi.id}
                to={kpi.link}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-xl transition shadow-sm group block"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>{kpi.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    kpi.status === 'HEALTHY' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : kpi.status === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {kpi.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {kpi.value}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span>{kpi.change}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-emerald-400" />
                </div>
              </Link>
            ))}
          </div>

          {/* Core Subsystem Operational Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Subsystem Health & Dependency Check
              </h3>
              <Link to="/admin/system/health" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
                Deep Dive Health <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc: any) => {
                const isHealthy = svc.status === 'HEALTHY';
                return (
                  <div key={svc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${
                          isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {svc.id === 'postgresql' && <Database className="w-4 h-4" />}
                          {svc.id === 'backend_api' && <Cpu className="w-4 h-4" />}
                          {svc.id === 'razorpay' && <CreditCard className="w-4 h-4" />}
                          {svc.id === 'email_service' && <Mail className="w-4 h-4" />}
                          {svc.id === 'google_drive' && <HardDrive className="w-4 h-4" />}
                          {svc.id === 'background_workers' && <Activity className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{svc.name}</h4>
                          <span className="text-[11px] text-slate-400">{svc.category}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isHealthy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {svc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{svc.message}</p>

                    {svc.latencyMs !== undefined && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span>Latency</span>
                        <span className="font-mono text-slate-300">{svc.latencyMs} ms</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default SystemDashboardPage;
