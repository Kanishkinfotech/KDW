import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Settings, Save, ShieldCheck, Cpu, Clock, Flame } from 'lucide-react';
import { AutomationLayout } from '../../../components/admin/automation/AutomationLayout';

export const AutomationSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    maxRetryAttempts: 5,
    initialBackoffSeconds: 30,
    maxBackoffSeconds: 3600,
    workerConcurrency: 8,
    webhookTimeoutSeconds: 15,
    webhookRateLimitPerMinute: 300,
    deadLetterRetentionDays: 90,
    eventRetentionDays: 60,
    enableSafeReplayIdempotency: true,
    autoPauseOnFailureSpike: true
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/automation/settings', { withCredentials: true });
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load automation settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axios.patch('/api/admin/automation/settings', settings, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AutomationLayout onRefresh={fetchSettings} isLoading={loading} />

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 max-w-4xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            Global Automation & Worker Queue Settings
          </h2>
          <p className="text-xs text-slate-400">
            Configure concurrency pools, exponential backoff policies, dead-letter retentions, and safe replay guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Worker Concurrency */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Worker Concurrency Pool
            </label>
            <p className="text-[11px] text-slate-400">Simultaneous asynchronous jobs processed concurrently per node.</p>
            <input
              type="number"
              min="1"
              max="32"
              value={settings.workerConcurrency}
              onChange={(e) => setSettings({ ...settings, workerConcurrency: parseInt(e.target.value, 10) })}
              className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Maximum Retries */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Maximum Retries Before DLQ
            </label>
            <p className="text-[11px] text-slate-400">Attempts executed with exponential backoff before isolating to DLQ.</p>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.maxRetryAttempts}
              onChange={(e) => setSettings({ ...settings, maxRetryAttempts: parseInt(e.target.value, 10) })}
              className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Webhook Timeout */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-white">Webhook Dispatch Timeout (Seconds)</label>
            <p className="text-[11px] text-slate-400">Network socket timeout for outgoing webhook delivery.</p>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.webhookTimeoutSeconds}
              onChange={(e) => setSettings({ ...settings, webhookTimeoutSeconds: parseInt(e.target.value, 10) })}
              className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Dead Letter Retention */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Dead-Letter Retention (Days)
            </label>
            <p className="text-[11px] text-slate-400">Days failed job records are retained before automatic pruning.</p>
            <input
              type="number"
              min="14"
              max="365"
              value={settings.deadLetterRetentionDays}
              onChange={(e) => setSettings({ ...settings, deadLetterRetentionDays: parseInt(e.target.value, 10) })}
              className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        {/* Guardrail Toggles */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Safe Replay Idempotency Enforcement</span>
              <span className="text-[11px] text-slate-400">Prevents duplicate emails, invoices, and entitlements during dead-letter replay.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSafeReplayIdempotency}
              onChange={(e) => setSettings({ ...settings, enableSafeReplayIdempotency: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default AutomationSettingsPage;
