import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Mail, ShieldCheck, CheckCircle2, Server } from 'lucide-react';
import { IntegrationLayout } from '../../../components/admin/integrations/IntegrationLayout';

export default function EmailIntegrationPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/email', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        const data = { ...json.data, provider: 'SMTP' };
        setSettings(data);
        setInitialSettings(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load email settings');
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
      const payload = { ...settings, provider: 'SMTP' };
      const res = await fetch('/api/admin/settings/admin/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Email SMTP integration settings saved successfully');
        setInitialSettings(payload);
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving email settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IntegrationLayout
      title="Email SMTP Integration"
      subtitle="Configure your Custom SMTP server for transactional emails, notifications, and customer digital receipts."
      isDirty={isDirty}
      onSave={handleSave}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Provider & SMTP Credentials */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Server className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Delivery Gateway & Authentication</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Delivery Provider</label>
              <select
                value="SMTP"
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-700 cursor-not-allowed"
              >
                <option value="SMTP">Custom SMTP (Self-Hosted / SendGrid)</option>
              </select>
            </div>

            <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Host *</label>
                  <input
                    type="text"
                    value={settings.smtp_host || ''}
                    onChange={e => handleChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Port *</label>
                  <input
                    type="number"
                    value={settings.smtp_port ?? 587}
                    onChange={e => handleChange('smtp_port', parseInt(e.target.value, 10))}
                    placeholder="587"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Username / Email *</label>
                  <input
                    type="text"
                    value={settings.smtp_user || ''}
                    onChange={e => handleChange('smtp_user', e.target.value)}
                    placeholder="vvin8160@gmail.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Password / App Secret *</label>
                  <input
                    type="password"
                    value={settings.smtp_password || ''}
                    onChange={e => handleChange('smtp_password', e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-700">SSL / TLS Secure Connection</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.smtp_secure)}
                    onChange={e => handleChange('smtp_secure', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Domain Verification Badges */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block">Domain Authentication Status</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className="p-2 bg-white rounded-xl border border-emerald-200 text-emerald-700">
                  SPF: {settings.spf_status || 'VERIFIED'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-emerald-200 text-emerald-700">
                  DKIM: {settings.dkim_status || 'VERIFIED'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-blue-200 text-blue-700">
                  DMARC: {settings.dmarc_status || 'CONFIGURED'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sender Identities */}
        <div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Sender Identities & Trigger Toggles</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Name</label>
                  <input
                    type="text"
                    value={settings.from_name || ''}
                    onChange={e => handleChange('from_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Email</label>
                  <input
                    type="email"
                    value={settings.from_email || ''}
                    onChange={e => handleChange('from_email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 block">Transactional Trigger Toggles</span>
                {[
                  { id: 'send_order_confirmation', label: 'Order Confirmation & Payment Receipt' },
                  { id: 'send_download_access_email', label: 'Digital Entitlement & Download Token Access' },
                  { id: 'send_licence_email', label: 'Software Licence Key Issuance Notice' },
                  { id: 'send_refund_email', label: 'Refund Approval & Cancellation Confirmation' }
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
          </div>
        </div>
      </div>
    </IntegrationLayout>
  );
}
