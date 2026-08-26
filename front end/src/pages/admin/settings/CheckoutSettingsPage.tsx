import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard, Lock, ShieldCheck, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function CheckoutSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/checkout', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load checkout settings');
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
      const res = await fetch('/api/admin/settings/admin/checkout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Checkout & payment settings saved successfully');
        setInitialSettings(settings);
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving checkout settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGateway = async () => {
    setTestingGateway(true);
    setGatewayStatus(null);
    try {
      const res = await fetch('/api/admin/settings/admin/test/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyId: settings.razorpay_key_id })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setGatewayStatus({ success: true, message: json.message, mode: json.mode });
      } else {
        toast.error(json.message || 'Gateway test failed');
        setGatewayStatus({ success: false, message: json.message });
      }
    } catch (err) {
      toast.error('Failed to contact Razorpay integration test endpoint');
    } finally {
      setTestingGateway(false);
    }
  };

  return (
    <SettingsLayout
      title="Checkout & Razorpay Payment Settings"
      subtitle="Configure checkout customer requirements, Razorpay API credentials, signature verification, payment retry limits, and required legal acceptances."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Razorpay Gateway API Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Razorpay Payment Gateway API</h3>
            </div>
            <button
              onClick={handleTestGateway}
              disabled={testingGateway}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all"
            >
              <Zap className={`w-3.5 h-3.5 ${testingGateway ? 'animate-spin' : ''}`} />
              {testingGateway ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {gatewayStatus && (
            <div className={`p-3 rounded-xl border text-xs font-semibold ${gatewayStatus.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {gatewayStatus.message}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Razorpay Environment</label>
              <select
                value={settings.razorpay_environment || 'TEST'}
                onChange={e => handleChange('razorpay_environment', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
              >
                <option value="TEST">🟡 TEST Mode (rzp_test_...)</option>
                <option value="LIVE">🟢 LIVE Production Mode (rzp_live_...)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Razorpay Key ID *</label>
              <input
                type="text"
                value={settings.razorpay_key_id || ''}
                onChange={e => handleChange('razorpay_key_id', e.target.value)}
                placeholder="rzp_test_..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Razorpay Key Secret (Masked)</label>
              <input
                type="password"
                value={settings.razorpay_key_secret || ''}
                onChange={e => handleChange('razorpay_key_secret', e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Leave masked to preserve current stored secret.</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Webhook Endpoint URL</label>
              <input
                type="text"
                readOnly
                value={settings.razorpay_webhook_url || ''}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono bg-slate-50 text-slate-600 select-all"
              />
            </div>
          </div>
        </div>

        {/* 2. Checkout Flow & Required Legal Policies */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Checkout Mode & Policy Enforcement</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Checkout Mode</label>
              <select
                value={settings.checkout_mode || 'BOTH'}
                onChange={e => handleChange('checkout_mode', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
              >
                <option value="BOTH">Standard (Allow Both Registered & Guest Checkout)</option>
                <option value="ACCOUNT_ONLY">Account Only (Customer Must Login / Register)</option>
                <option value="GUEST_ONLY">Guest Focused (Fast 1-Click Checkout)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Retry Link Expiry (Hours)</label>
                <input
                  type="number"
                  value={settings.retry_link_validity_hours ?? 24}
                  onChange={e => handleChange('retry_link_validity_hours', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Retry Attempts</label>
                <input
                  type="number"
                  value={settings.max_retry_attempts ?? 3}
                  onChange={e => handleChange('max_retry_attempts', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block">Required Checkbox Acceptances at Checkout</span>
              {[
                { id: 'require_terms_acceptance', label: 'Require Terms of Service Acceptance' },
                { id: 'require_refund_policy_acceptance', label: 'Require Refund & Cancellation Policy Acceptance' },
                { id: 'require_privacy_acceptance', label: 'Require Privacy & Cookie Notice Acceptance' }
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
    </SettingsLayout>
  );
}
