import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Lock, FileText, Database, UserX, Clock } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/privacy', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/admin/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Privacy configuration & retention periods updated');
        setInitialSettings(settings);
        window.dispatchEvent(new CustomEvent('kdw:settings-updated'));
        try {
          localStorage.setItem('kdw_settings_updated', Date.now().toString());
        } catch (e) {}
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const rules: any[] = settings.retention_rules || [];

  return (
    <SettingsLayout
      title="Privacy, Cookies & Data Retention Settings"
      subtitle="Configure customer data collection disclosures, cookie consent banners, GDPR data export workflows, and automated retention cleanup periods."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Data Collection & Cookie Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Data Collection & Cookie Preferences</h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { id: 'enable_cookie_banner', label: 'Display GDPR Cookie Consent Banner on Storefront' },
              { id: 'require_explicit_cookie_consent', label: 'Require Explicit Opt-In Before Loading Analytics' },
              { id: 'allow_customer_data_export', label: 'Allow Customers to Request Full GDPR Data Export' },
              { id: 'allow_customer_account_deletion', label: 'Allow Customers to Request Account Anonymization / Deletion' }
            ].map(item => (
              <label key={item.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors">
                <span className="font-medium text-slate-700">{item.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[item.id])}
                  onChange={e => handleChange(item.id, e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </label>
            ))}

            <div className="pt-2">
              <label className="font-bold text-slate-700 block mb-1">Cookie Banner Position</label>
              <select
                value={settings.cookie_banner_position || 'BOTTOM_RIGHT'}
                onChange={e => handleChange('cookie_banner_position', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium bg-white"
              >
                <option value="BOTTOM_RIGHT">Floating Bottom Right</option>
                <option value="BOTTOM_FULL">Full-Width Bottom Bar</option>
                <option value="CENTER_MODAL">Center Modal Overlay</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Automated Retention Periods */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Compliance Retention Periods (Days)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Inactive Profiles</label>
                <input
                  type="number"
                  value={settings.retention_customer_profiles_days ?? 730}
                  onChange={e => handleChange('retention_customer_profiles_days', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Login Audit Logs</label>
                <input
                  type="number"
                  value={settings.retention_login_logs_days ?? 90}
                  onChange={e => handleChange('retention_login_logs_days', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Download Activity Logs</label>
                <input
                  type="number"
                  value={settings.retention_download_logs_days ?? 365}
                  onChange={e => handleChange('retention_download_logs_days', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolved Support Tickets</label>
                <input
                  type="number"
                  value={settings.retention_support_tickets_days ?? 730}
                  onChange={e => handleChange('retention_support_tickets_days', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Financial & Tax Records (GST Audit Requirement)</label>
              <input
                type="number"
                disabled
                value={2555}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono bg-slate-50 text-slate-600"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">2555 days (7 years) mandatory statutory retention under Indian GST regulations.</p>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
