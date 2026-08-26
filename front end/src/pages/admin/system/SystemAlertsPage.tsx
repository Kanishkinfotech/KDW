import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Bell, CheckCircle2, Sliders, RefreshCw, AlertTriangle, ShieldCheck, Save, Eye } from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemAlertsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, rulesRes] = await Promise.all([
        axios.get('/api/admin/system/alerts', { withCredentials: true }),
        axios.get('/api/admin/system/thresholds', { withCredentials: true })
      ]);

      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data);
      }
      if (rulesRes.data.success) {
        setThresholds(rulesRes.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch monitoring alerts and rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/system/alerts/${id}/acknowledge`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success('Alert acknowledged');
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/system/alerts/${id}/resolve`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success('Alert resolved');
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleSaveThreshold = async (rule: any) => {
    try {
      setSavingRule(true);
      const res = await axios.patch(
        `/api/admin/system/thresholds/${rule.id}`,
        {
          warningThreshold: rule.warningThreshold,
          criticalThreshold: rule.criticalThreshold,
          isEnabled: rule.isEnabled
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(`Rule '${rule.metricName}' saved`);
        setEditingRule(null);
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to update threshold rule');
    } finally {
      setSavingRule(false);
    }
  };

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchData} isLoading={loading} />

      {/* Monitoring Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              Active Monitoring Alerts Feed
            </h2>
            <p className="text-xs text-slate-400">Automated alerts triggered when infrastructure metrics cross critical thresholds.</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            <p className="text-xs">Checking live alert feeds...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">No Active Alerts</h4>
            <p className="text-xs text-slate-400 mt-1">All telemetry values are operating safely below warning thresholds.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : a.severity === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {a.source}
                    </span>
                    <h3 className="text-sm font-bold text-white">{a.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      a.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {a.status}
                    </span>

                    {a.status !== 'RESOLVED' && (
                      <>
                        {a.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleResolve(a.id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs rounded transition"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300">{a.message}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                  {a.metricValue && <span>Metric: <strong className="text-rose-400">{a.metricValue}</strong></span>}
                  {a.thresholdValue && <span>Threshold: <strong className="text-slate-400">{a.thresholdValue}</strong></span>}
                  <span>Detected: {new Date(a.lastDetectedAt).toLocaleString()}</span>
                  {a.ownerName && <span>Owner: <strong className="text-slate-300">{a.ownerName}</strong></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configurable Threshold Rules Matrix */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              Configurable Health Threshold Rules
            </h2>
            <p className="text-xs text-slate-400">Set warning and critical trigger levels for automated alert dispatch.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Metric Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Warning Level</th>
                  <th className="px-4 py-3">Critical Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {thresholds.map((r) => {
                  const isEditing = editingRule?.id === r.id;
                  const current = isEditing ? editingRule : r;
                  return (
                    <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {r.metricName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={current.warningThreshold}
                              onChange={(e) => setEditingRule({ ...current, warningThreshold: parseFloat(e.target.value) })}
                              className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                            <span className="text-slate-400">{r.unit}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-amber-400">&gt; {r.warningThreshold} {r.unit}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={current.criticalThreshold}
                              onChange={(e) => setEditingRule({ ...current, criticalThreshold: parseFloat(e.target.value) })}
                              className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                            <span className="text-slate-400">{r.unit}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-rose-400">&gt; {r.criticalThreshold} {r.unit}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {r.isEnabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingRule(null)}
                              className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveThreshold(current)}
                              disabled={savingRule}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-xs rounded font-medium"
                            >
                              {savingRule ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRule(r)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SystemAlertsPage;
