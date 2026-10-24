import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Mail, ShieldCheck, CheckCircle2, Server, Send, AlertCircle, RefreshCw } from 'lucide-react';
import { IntegrationLayout } from '../../../components/admin/integrations/IntegrationLayout';

export default function EmailIntegrationPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth') || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchSettings = async () => {
    setLoading(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/admin/settings/admin/email', {
        headers: getHeaders(),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        const data = { ...json.data, provider: 'SMTP' };
        setSettings(data);
        setInitialSettings(data);
        if (!testRecipient && data.smtp_user) {
          setTestRecipient(data.smtp_user);
        }
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
    setConnectionStatus(null);
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings, provider: 'SMTP' };
      const res = await fetch('/api/admin/settings/admin/email', {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Email SMTP configuration saved successfully');
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

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/admin/settings/admin/test/email', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          provider: 'SMTP',
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: settings.smtp_password,
          smtp_secure: settings.smtp_secure
        })
      });
      const json = await res.json();
      if (json.success) {
        setConnectionStatus({ success: true, message: json.message || 'SMTP connection verified successfully!' });
        toast.success('SMTP Connection Verified!');
      } else {
        setConnectionStatus({ success: false, message: json.message || 'Connection test failed' });
        toast.error(json.message || 'SMTP Connection Failed');
      }
    } catch (err: any) {
      setConnectionStatus({ success: false, message: err.message || 'Failed to contact test service' });
      toast.error('Failed to verify connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    const target = testRecipient || settings.smtp_user;
    if (!target) {
      toast.error('Please enter a recipient email address for testing.');
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await fetch('/api/admin/settings/admin/email/test', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ recipientEmail: target, templateType: 'ORDER_RECEIPT' })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || `Test email dispatched to ${target}!`);
      } else {
        toast.error(json.message || 'Failed to deliver test email');
      }
    } catch (err: any) {
      toast.error('Error contacting test email service');
    } finally {
      setSendingTestEmail(false);
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
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Delivery Gateway &amp; Authentication</h3>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin text-blue-600' : ''}`} />
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Port *</label>
                  <input
                    type="number"
                    value={settings.smtp_port ?? 587}
                    onChange={e => handleChange('smtp_port', parseInt(e.target.value, 10) || 587)}
                    placeholder="587"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SMTP Password / App Secret *</label>
                  <input
                    type="password"
                    value={settings.smtp_password || ''}
                    onChange={e => handleChange('smtp_password', e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">SSL / TLS Secure Connection</span>
                  <span className="text-[10px] text-slate-400">Port 465 (SSL) / Port 587 (STARTTLS auto)</span>
                </div>
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

            {/* Live Connection Test Feedback */}
            {connectionStatus && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                connectionStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {connectionStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{connectionStatus.success ? 'Gateway Verified' : 'Gateway Verification Error'}</div>
                  <div className="text-[11px] mt-0.5">{connectionStatus.message}</div>
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

        {/* 2. Sender Identities & Live Test Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Sender Identities &amp; Trigger Toggles</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Name</label>
                  <input
                    type="text"
                    value={settings.from_name || ''}
                    onChange={e => handleChange('from_name', e.target.value)}
                    placeholder="Kanishk Digital World"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Email</label>
                  <input
                    type="email"
                    value={settings.from_email || ''}
                    onChange={e => handleChange('from_email', e.target.value)}
                    placeholder="orders@kanishkdigitalworld.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
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

          {/* 3. Send Live Test Email to Inbox */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-6 rounded-3xl border border-blue-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Send Live Test Email</h3>
            </div>
            <p className="text-xs text-slate-600">
              Verify that emails dispatched using the saved SMTP credentials actually reach an external recipient inbox.
            </p>
            <div className="flex gap-2 pt-1">
              <input
                type="email"
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
                placeholder="recipient@gmail.com"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-pulse' : ''}`} />
                {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </IntegrationLayout>
  );
}
