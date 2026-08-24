import { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Database, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function AdminSystemHealth() {
  const { logout } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get('/api/admin/health', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
          setHealthData(res.data.data);
        } else {
          setError(res.data.message || 'Failed to fetch system health');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [logout]);

  if (loading && !healthData) {
    return <div className="p-8 text-center text-slate-500">Loading System Health...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-danger">
        <h2 className="text-xl font-bold mb-2">Error Loading System Health</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${healthData?.status === 'Healthy' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {healthData?.status || 'Unknown'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HealthCard 
          title="Database" 
          value={healthData?.database?.status} 
          subtitle={healthData?.database?.host} 
          icon={Database} 
        />
        <HealthCard 
          title="Memory Usage" 
          value={healthData?.server?.memory?.usagePercent} 
          subtitle={`${healthData?.server?.memory?.used} / ${healthData?.server?.memory?.total}`} 
          icon={Server} 
        />
        <HealthCard 
          title="CPU Cores" 
          value={healthData?.server?.cpu?.cores} 
          subtitle={healthData?.server?.cpu?.model} 
          icon={Cpu} 
        />
        <HealthCard 
          title="Uptime" 
          value={healthData?.server?.uptime?.system} 
          subtitle={`Node: ${healthData?.server?.uptime?.process}`} 
          icon={Clock} 
        />
      </div>
    </div>
  );
}

function HealthCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          <Icon className="text-slate-600" size={20} />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-xs text-slate-500 truncate" title={subtitle}>{subtitle}</div>
    </div>
  );
}

