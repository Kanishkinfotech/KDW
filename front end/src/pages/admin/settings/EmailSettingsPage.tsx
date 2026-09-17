import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Mail, Send, ShieldCheck, CheckCircle2, Server, Key } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/email', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
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
      const res = await fetch('/api/admin/settings/admin/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Email delivery settings saved successfully');
        setInitialSettings(settings);
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

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter a recipient email address for the test.');
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch('/api/admin/settings/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientEmail: testEmailAddress })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
      } else {
        toast.error(json.message || 'Failed to deliver test email');
      }
    } catch (err) {
      toast.error('Failed to contact test email service');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <SettingsLayout
      title="Email Provider & Sender Identity Settings"
      subtitle="Configure Resend / SMTP delivery gateways, sender email identities, transactional trigger toggles, and live dispatch tests."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
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
                value={settings.provider || 'RESEND'}
                onChange={e => handleChange('provider', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
              >
                <option value="RESEND">Resend API (Recommended)</option>
                <option value="SMTP">Custom SMTP (Self-Hosted / SendGrid)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">API Key / Auth Secret (Masked)</label>
              <input
                type="password"
                value={settings.api_key || ''}
                onChange={e => handleChange('api_key', e.target.value)}
                placeholder="re_••••••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            {settings.provider === 'SMTP' && (
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">SMTP Host *</label>
                    <input
                      type="text"
                      value={settings.smtp_host || ''}
                      onChange={e => handleChange('smtp_host', e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">SMTP Port *</label>
                    <input
                      type="number"
                      value={settings.smtp_port ?? 587}
                      onChange={e => handleChange('smtp_port', parseInt(e.target.value, 10))}
                      placeholder="587"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
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
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">SMTP Password / App Secret *</label>
                    <input
                      type="password"
                      value={settings.smtp_password || ''}
                      onChange={e => handleChange('smtp_password', e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
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
            )}

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

        {/* 2. Sender Identities & Live Test Tool */}
        <div className="space-y-6">
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

          {/* Real Test Email Dispatch Box */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Email Dispatch Test</h4>
            </div>
            <p className="text-xs text-slate-300">
              Send a real HTML test template to verify end-to-end SMTP/Resend delivery.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="email"
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                placeholder="your.email@domain.com"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-all whitespace-nowrap"
              >
                {sendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
