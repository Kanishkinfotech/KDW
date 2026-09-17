import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { MessageCircle, ShieldCheck, CheckCircle2, Server, Key, Smartphone, HelpCircle } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/whatsapp', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load WhatsApp settings');
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
      const res = await fetch('/api/admin/settings/admin/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('WhatsApp API credentials saved successfully');
        setInitialSettings(settings);
      } else {
        toast.error(json.message || 'Failed to save WhatsApp settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/admin/settings/admin/test/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setConnectionStatus({ success: true, message: json.message });
      } else {
        toast.error(json.message || 'WhatsApp connection verification failed');
        setConnectionStatus({ success: false, message: json.message });
      }
    } catch (err) {
      toast.error('Failed to contact WhatsApp verification endpoint');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <SettingsLayout
      title="WhatsApp Business API & Automation Settings"
      subtitle="Configure Meta Cloud API credentials, Phone Number ID, WhatsApp Business Account (WABA), Webhook callbacks, and real-time dispatches."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Meta Cloud API Credentials */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Meta WhatsApp Cloud API Credentials</h3>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all"
            >
              {testingConnection ? 'Verifying...' : 'Test Connection'}
            </button>
          </div>

          {connectionStatus && (
            <div className={`p-3 rounded-xl border text-xs font-semibold ${connectionStatus.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {connectionStatus.message}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Meta App ID</label>
                <input
                  type="text"
                  value={settings.meta_app_id || ''}
                  onChange={e => handleChange('meta_app_id', e.target.value)}
                  placeholder="e.g. 109283746591029"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp Business Account ID (WABA)</label>
                <input
                  type="text"
                  value={settings.waba_id || ''}
                  onChange={e => handleChange('waba_id', e.target.value)}
                  placeholder="e.g. 198273645019283"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number ID *</label>
                <input
                  type="text"
                  value={settings.phone_number_id || ''}
                  onChange={e => handleChange('phone_number_id', e.target.value)}
                  placeholder="e.g. 509182736450192"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Business Phone Number</label>
                <input
                  type="text"
                  value={settings.business_phone_number || ''}
                  onChange={e => handleChange('business_phone_number', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Permanent Meta System Access Token *</label>
              <input
                type="password"
                value={settings.access_token || ''}
                onChange={e => handleChange('access_token', e.target.value)}
                placeholder="EAA••••••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Generated from Meta Business Manager with whatsapp_business_messaging permission.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Webhook Verify Token</label>
                <input
                  type="password"
                  value={settings.webhook_verify_token || ''}
                  onChange={e => handleChange('webhook_verify_token', e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Graph API Version</label>
                <input
                  type="text"
                  value={settings.api_version || 'v20.0'}
                  onChange={e => handleChange('api_version', e.target.value)}
                  placeholder="v20.0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Webhook Callback URL</label>
              <input
                type="text"
                readOnly
                value={settings.webhook_url || 'http://localhost:5000/api/admin/automation/webhook/meta'}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-slate-50 text-slate-600 select-all"
              />
            </div>
          </div>
        </div>

        {/* 2. Automated Trigger Toggles & Real Test Message Tool */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Notification Automations</h3>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { id: 'send_order_confirmation_wa', label: 'Order Confirmation & Payment Receipt Notice' },
                { id: 'send_download_ready_wa', label: 'Instant Digital Download Token & Licence Delivery' },
                { id: 'send_abandoned_cart_wa', label: 'Abandoned Cart Recovery & Reminder Message' },
                { id: 'send_promotional_wa', label: 'Promotional Offers & Campaign Broadcasts' }
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings[item.id])}
                    onChange={e => handleChange(item.id, e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
