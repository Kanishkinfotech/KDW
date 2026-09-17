import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard, Lock, ShieldCheck, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { IntegrationLayout } from '../../../components/admin/integrations/IntegrationLayout';

export default function PaymentGatewayIntegrationPage() {
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
      toast.error('Failed to load payment gateway settings');
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
        toast.success('Payment gateway credentials saved successfully');
        setInitialSettings(settings);
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving payment gateway settings');
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
    <IntegrationLayout
      title="Payment Gateway Integration"
      subtitle="Configure Razorpay API credentials, webhook sync endpoints, test live credentials, and payment verification."
      isDirty={isDirty}
      onSave={handleSave}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Razorpay Gateway API Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Razorpay API Credentials</h3>
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
              <label className="font-bold text-slate-700 block mb-1">Razorpay Key Secret</label>
              <input
                type="password"
                value={settings.razorpay_key_secret || ''}
                onChange={e => handleChange('razorpay_key_secret', e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Leave masked or enter a new secret key to update.</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Webhook Secret (Optional)</label>
              <input
                type="password"
                value={settings.razorpay_webhook_secret || ''}
                onChange={e => handleChange('razorpay_webhook_secret', e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Used to verify authenticity of incoming Razorpay webhooks.</p>
            </div>
          </div>
        </div>

        {/* Webhook & Integration Information */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Webhook Sync & Status</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Razorpay Webhook Endpoint URL</label>
              <input
                type="text"
                readOnly
                value={settings.razorpay_webhook_url || `${window.location.origin}/api/payments/razorpay/webhook`}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono bg-slate-50 text-slate-600 select-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Add this URL in your Razorpay Dashboard &rarr; Settings &rarr; Webhooks.</p>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
              <h4 className="font-bold text-blue-900">Supported Payment Methods</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                UPI (Google Pay, PhonePe, Paytm, BHIM), Credit & Debit Cards (Visa, MasterCard, Rupay), NetBanking (50+ Indian banks), and Wallets.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active Webhook Events to Subscribe
              </h4>
              <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                <li><code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-800">payment.captured</code> - Instant order fulfillment</li>
                <li><code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-800">payment.failed</code> - Retry email trigger</li>
                <li><code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-800">order.paid</code> - Secondary confirmation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </IntegrationLayout>
  );
}
