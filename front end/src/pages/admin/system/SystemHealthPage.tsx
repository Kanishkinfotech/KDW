import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Database, 
  Cpu, 
  CreditCard, 
  Mail, 
  HardDrive, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Server,
  Layers
} from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemHealthPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/system/health', { withCredentials: true });
      if (res.data.success) {
        setHealthData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch detailed system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const services = healthData?.services || [];

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchHealth} isLoading={loading} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Detailed System Health & Diagnostics</h2>
          <p className="text-xs text-slate-400">Live operational diagnostics across all databases, cloud APIs, and compute clusters.</p>
        </div>
      </div>

      {loading && !healthData ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
          <p className="text-sm font-medium">Running active ping diagnostics on all services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((svc: any) => {
            const isHealthy = svc.status === 'HEALTHY';
            return (
              <div key={svc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {svc.id === 'postgresql' && <Database className="w-5 h-5" />}
                      {svc.id === 'backend_api' && <Server className="w-5 h-5" />}
                      {svc.id === 'razorpay' && <CreditCard className="w-5 h-5" />}
                      {svc.id === 'email_service' && <Mail className="w-5 h-5" />}
                      {svc.id === 'google_drive' && <HardDrive className="w-5 h-5" />}
                      {svc.id === 'background_workers' && <Activity className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{svc.name}</h3>
                      <span className="text-xs text-slate-400">{svc.category} • Last checked just now</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isHealthy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {svc.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  {svc.message}
                </p>

                {svc.details && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telemetry Properties</h4>
                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs font-mono text-slate-300 space-y-1 overflow-x-auto">
                      {Object.entries(svc.details).map(([k, v]: [string, any]) => (
                        <div key={k} className="flex justify-between gap-4 py-0.5 border-b border-slate-900 last:border-0">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-emerald-400">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SystemHealthPage;
