import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { MessageCircle, ShieldCheck, CheckCircle2, Server, Key, Smartphone, HelpCircle, ExternalLink, ChevronDown, ChevronUp, BookOpen, AlertTriangle } from 'lucide-react';
import { IntegrationLayout } from '../../../components/admin/integrations/IntegrationLayout';

export default function WhatsAppIntegrationPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(true);

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
    <IntegrationLayout
      title="WhatsApp Business API Integration"
      subtitle="Connect Meta Cloud API to automatically deliver order confirmations, license deliveries, and customer updates directly on WhatsApp."
      isDirty={isDirty}
      onSave={handleSave}
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Found on developers.facebook.com app dashboard header.</p>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp Business Account ID (WABA)</label>
                <input
                  type="text"
                  value={settings.waba_id || ''}
                  onChange={e => handleChange('waba_id', e.target.value)}
                  placeholder="e.g. 198273645019283"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">From Meta App &gt; WhatsApp &gt; API Setup &gt; WhatsApp Business Account ID.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Phone Number ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.phone_number_id || ''}
                  onChange={e => handleChange('phone_number_id', e.target.value)}
                  placeholder="e.g. 509182736450192"
                  className={`w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 ${
                    settings.phone_number_id?.includes('@') ? 'border-amber-400 bg-amber-50/40 text-amber-900' : 'border-slate-200'
                  }`}
                />
                {settings.phone_number_id?.includes('@') ? (
                  <div className="mt-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-1.5 leading-tight">
                    ⚠️ <strong>Phone Number ID is numeric</strong> (e.g. 509182736450192), not an email address. Copy it from Meta Developer &gt; API Setup.
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    15–16 digit numeric ID from Meta Developer &gt; API Setup (NOT your email or phone number).
                  </p>
                )}
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Business Phone Number</label>
                <input
                  type="text"
                  value={settings.business_phone_number || ''}
                  onChange={e => handleChange('business_phone_number', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Your registered WhatsApp phone number with country code.</p>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Permanent Meta System Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={settings.access_token || ''}
                onChange={e => handleChange('access_token', e.target.value)}
                placeholder="EAA••••••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Generated via Meta Business Settings &gt; System Users with <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">whatsapp_business_messaging</code> permission (Permanent token).</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Webhook Verify Token</label>
                <input
                  type="password"
                  value={settings.webhook_verify_token || ''}
                  onChange={e => handleChange('webhook_verify_token', e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Any secret passphrase (must match Meta Webhook config).</p>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Graph API Version</label>
                <input
                  type="text"
                  value={settings.api_version || 'v20.0'}
                  onChange={e => handleChange('api_version', e.target.value)}
                  placeholder="v20.0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Standard Meta Cloud API version (default v20.0).</p>
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
              <p className="text-[10px] text-slate-400 mt-1">Paste this into Meta Developer App Dashboard &gt; WhatsApp &gt; Configuration &gt; Callback URL.</p>
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

      {/* 3. Step-by-Step Meta Credentials Setup Guide */}
      <div className="mt-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-emerald-50/40 hover:from-slate-100/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">How to Obtain Your Meta WhatsApp Cloud API Credentials</h3>
              <p className="text-[11px] text-slate-500">Official walkthrough from Meta for Developers &amp; Business Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-xl">
            <span>{showGuide ? 'Hide Instructions' : 'Show Full Guide'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showGuide && (
          <div className="p-6 border-t border-slate-100 space-y-5 text-xs text-slate-700 divide-y divide-slate-100">
            {/* Step 1 */}
            <div className="pt-2 first:pt-0">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Create a Meta Developer App &amp; Add WhatsApp</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-6 text-slate-600 text-xs">
                <li>Log in to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold inline-flex items-center gap-0.5">Meta for Developers <ExternalLink className="w-3 h-3" /></a> and click <strong>My Apps</strong> &gt; <strong>Create App</strong>.</li>
                <li>Select <strong>Other</strong> &gt; Click Next &gt; Select <strong>Business</strong> as the app type.</li>
                <li>Enter an App Name (e.g. <em>KDW Notifications</em>) and link your Meta Business Account.</li>
                <li>Once the app dashboard opens, scroll down to <strong>WhatsApp</strong> and click <strong>Set up</strong>.</li>
                <li>Your <strong>Meta App ID</strong> is shown in the top header bar next to your app name.</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="pt-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Locate Phone Number ID &amp; WABA ID</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-2 text-amber-900">
                <strong>CRITICAL:</strong> Phone Number ID is a <strong>15-to-16 digit numeric ID</strong> created by Meta (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">509182736450192</code>). <strong>DO NOT</strong> enter your email address or raw phone number in that field!
              </div>
              <ul className="list-disc list-inside space-y-1 pl-6 text-slate-600 text-xs">
                <li>In your Meta App Dashboard, navigate to <strong>WhatsApp</strong> &gt; <strong>API Setup</strong> in the left menu.</li>
                <li>Under <strong>Step 1: Select phone numbers</strong>, look at the two boxes:
                  <ul className="list-circle list-inside pl-5 mt-1 space-y-1">
                    <li><strong>Phone number ID</strong>: Copy the 15-digit numeric ID &rarr; Paste into <strong>Phone Number ID</strong>.</li>
                    <li><strong>WhatsApp Business Account ID</strong>: Copy the 15-digit numeric ID &rarr; Paste into <strong>WABA ID</strong>.</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="pt-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Add Your Real Business Phone Number</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-6 text-slate-600 text-xs">
                <li>Meta initially provides a test phone number. To send messages from your real brand number:</li>
                <li>In <strong>API Setup</strong>, scroll down to <strong>Step 5: Add a phone number</strong> &gt; Click <strong>Add phone number</strong>.</li>
                <li>Enter your brand display name, category, and real phone number.</li>
                <li>Verify ownership via OTP (SMS or Phone call). Note: This number must not currently be registered on the consumer WhatsApp app.</li>
                <li>Once verified, select it from the dropdown to get its real <strong>Phone number ID</strong> and enter it into <strong>Display Business Phone Number</strong> (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">+91 98765 43210</code>).</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="pt-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                <span>Generate Permanent System Access Token (Never Expires)</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-2 text-blue-900">
                <strong>NOTE:</strong> The token on the API Setup page is temporary and expires in 24 hours. Follow these steps to generate a permanent token that never expires:
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-6 text-slate-600 text-xs">
                <li>Go to <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold inline-flex items-center gap-0.5">Meta Business Settings <ExternalLink className="w-3 h-3" /></a>.</li>
                <li>In the left sidebar, click <strong>Users</strong> &gt; <strong>System Users</strong>.</li>
                <li>Click <strong>Add</strong> &rarr; Name: <em>KDW WhatsApp Bot</em> &rarr; Role: <strong>Admin</strong> &rarr; Click Create.</li>
                <li>Click <strong>Assign Assets</strong> &rarr; Select <strong>Apps</strong> &rarr; Choose your WhatsApp App &rarr; Toggle <strong>Full Control (Manage App)</strong> &rarr; Click <strong>Save Changes</strong>.</li>
                <li>Click <strong>Generate New Token</strong> &rarr; Select your WhatsApp App.</li>
                <li>Set Token Expiration to: <strong>Never</strong>.</li>
                <li>Under Available Permissions, check both:
                  <div className="ml-5 mt-1 space-x-2 font-mono text-[11px]">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">whatsapp_business_messaging</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">whatsapp_business_management</span>
                  </div>
                </li>
                <li className="mt-1">Click <strong>Generate Token</strong>, copy the full token starting with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">EAAB...</code>, and paste it into <strong>Permanent Meta System Access Token</strong>.</li>
              </ol>
            </div>

            {/* Step 5 */}
            <div className="pt-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">5</span>
                <span>Configure Webhooks for Real-Time Status</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-6 text-slate-600 text-xs">
                <li>Create any custom secret passphrase (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">kdw_secure_wa_token_2026</code>) and enter it into <strong>Webhook Verify Token</strong>.</li>
                <li>In Meta Developer App Dashboard, go to <strong>WhatsApp</strong> &gt; <strong>Configuration</strong> in the left sidebar.</li>
                <li>Under <strong>Webhook</strong>, click <strong>Edit</strong>:
                  <ul className="list-circle list-inside pl-5 mt-1 space-y-1">
                    <li><strong>Callback URL</strong>: Paste the URL from the Webhook Callback URL box above (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://yourdomain.com/api/admin/automation/webhook/meta</code>).</li>
                    <li><strong>Verify Token</strong>: Enter the exact same secret passphrase you typed in step 1.</li>
                  </ul>
                </li>
                <li>Click <strong>Verify and Save</strong>.</li>
                <li>Under Webhook fields, click <strong>Manage</strong> and click <strong>Subscribe</strong> for <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">messages</code>.</li>
              </ul>
            </div>

            {/* Step 6 */}
            <div className="pt-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">6</span>
                <span>Save, Test Connection &amp; Send Live Message</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-6 text-slate-600 text-xs">
                <li>Click <strong>Save Changes</strong> at the top right of this screen.</li>
                <li>Click the <strong>Test Connection</strong> button next to the credentials header. You should see a green confirmation badge with your registered WhatsApp business display name!</li>
                <li>In the <strong>Live WhatsApp Dispatch Test</strong> card on the right, enter your personal mobile number (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">+919876543210</code>) and click <strong>Send WhatsApp Test Message</strong>.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </IntegrationLayout>
  );
}
