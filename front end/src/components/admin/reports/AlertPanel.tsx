import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, X, RefreshCw } from 'lucide-react';

interface AlertPanelProps {
  category?: string;
  onRefreshTrigger?: () => void;
}

export default function AlertPanel({ category = 'ALL', onRefreshTrigger }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/alerts?category=${category}&status=OPEN`);
      const json = await res.json();
      if (json.success) {
        setAlerts(json.alerts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [category]);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reports/alerts/${id}/acknowledge`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage('Alert acknowledged.');
        fetchAlerts();
        if (onRefreshTrigger) onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id: string) => {
    const notes = prompt('Enter resolution notes:') || 'Resolved by administrator';
    try {
      const res = await fetch(`/api/admin/reports/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage('Alert marked as resolved.');
        fetchAlerts();
        if (onRefreshTrigger) onRefreshTrigger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (alerts.length === 0 && !loading) return null;

  return (
    <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-rose-600" size={18} />
          <h3 className="font-bold text-sm text-rose-950">Active Operational & Security Alerts</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
            {alerts.length} OPEN
          </span>
        </div>
        <button onClick={fetchAlerts} className="text-rose-500 hover:text-rose-700">
          <RefreshCw size={14} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-2 bg-rose-100/80 rounded-lg text-xs font-bold text-rose-900 flex justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)}>✕</button>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map(a => (
          <div key={a.id} className="p-3.5 bg-white rounded-xl border border-rose-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.2 rounded font-black text-[9px] bg-rose-100 text-rose-800 uppercase tracking-wider">
                  {a.severity}
                </span>
                <span className="font-bold text-slate-900">{a.title}</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">{a.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleAcknowledge(a.id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
              >
                Acknowledge
              </button>
              <button
                onClick={() => handleResolve(a.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
              >
                Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
