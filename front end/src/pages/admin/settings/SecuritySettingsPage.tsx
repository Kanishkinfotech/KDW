import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Lock, Key, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/security', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load security settings');
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
      const res = await fetch('/api/admin/settings/admin/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Security & access policies saved successfully');
        setInitialSettings(settings);
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving security settings');
    } finally {
      setSaving(false);
    }
  };

  const permissions: string[] = settings.supported_permissions || [];

  return (
    <SettingsLayout
      title="Security & RBAC Access Control Settings"
      subtitle="Configure administrative MFA enforcement, password complexity policies, session idle timeouts, and granular role permissions."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Multi-Factor Authentication (MFA) Policy */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Multi-Factor Authentication (MFA)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 border border-blue-200/60 cursor-pointer">
              <div>
                <span className="font-bold text-blue-950 block">Enforce MFA Globally for All Staff</span>
                <span className="text-[11px] text-blue-800">Requires authenticator TOTP verification on every admin login</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.mfa_required)}
                onChange={e => handleChange('mfa_required', e.target.checked)}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </label>

            <span className="font-bold text-slate-800 block pt-2">Step-Up Re-Authentication for High-Risk Actions</span>
            {[
              { id: 'mfa_for_refund_approval', label: 'Financial Refund Approval & Gateways' },
              { id: 'mfa_for_secret_rotation', label: 'Payment / Email API Secret Key Rotation' },
              { id: 'mfa_for_data_export', label: 'Bulk Customer & Order Data Exports' },
              { id: 'mfa_for_licence_revocation', label: 'Licence Key Revocation & Reset Overrides' }
            ].map(item => (
              <label key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors">
                <span className="font-medium text-slate-700">{item.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[item.id])}
                  onChange={e => handleChange(item.id, e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </label>
            ))}
          </div>
        </div>

        {/* 2. Password & Session Security */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Password & Session Policies</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Password Length</label>
                <input
                  type="number"
                  min="8"
                  max="32"
                  value={settings.password_min_length ?? 8}
                  onChange={e => handleChange('password_min_length', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Failed Attempts</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.max_failed_login_attempts ?? 5}
                  onChange={e => handleChange('max_failed_login_attempts', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Session Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.admin_session_duration_hours ?? 24}
                  onChange={e => handleChange('admin_session_duration_hours', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Idle Timeout (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={settings.admin_idle_timeout_minutes ?? 60}
                  onChange={e => handleChange('admin_idle_timeout_minutes', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-800 block mb-2">Supported System RBAC Permissions</span>
              <div className="flex flex-wrap gap-1.5">
                {permissions.map(perm => (
                  <span key={perm} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded-md border border-slate-200">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
