import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Store, Building } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/general', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load general settings');
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
      const res = await fetch('/api/admin/settings/admin/general', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('General settings saved successfully');
        setInitialSettings(settings);
        // Instant sync with entire storefront & active sessions
        window.dispatchEvent(new CustomEvent('kdw:settings-updated'));
        try {
          localStorage.setItem('kdw_settings_updated', Date.now().toString());
        } catch (e) {}
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving general settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="General Settings"
      subtitle="Configure store identity, legal business entity details, localization, and branding."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Store Identity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Store Identity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Name *</label>
              <input
                type="text"
                value={settings.store_name || ''}
                onChange={e => handleChange('store_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Short Description</label>
              <textarea
                rows={2}
                value={settings.store_description || ''}
                onChange={e => handleChange('store_description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Website URL *</label>
              <input
                type="url"
                value={settings.primary_website_url || ''}
                onChange={e => handleChange('primary_website_url', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Support Email</label>
              <input
                type="email"
                value={settings.support_email || ''}
                onChange={e => handleChange('support_email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Legal Business & GST Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Legal Business & Invoicing</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Legal Business Name</label>
              <input
                type="text"
                value={settings.legal_business_name || ''}
                onChange={e => handleChange('legal_business_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Registered Business Address</label>
              <input
                type="text"
                value={settings.business_address || ''}
                onChange={e => handleChange('business_address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={settings.gst_number || ''}
                  onChange={e => handleChange('gst_number', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                <input
                  type="text"
                  value={settings.pan_number || ''}
                  onChange={e => handleChange('pan_number', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">State / Province</label>
                <input
                  type="text"
                  value={settings.business_state || ''}
                  onChange={e => handleChange('business_state', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={settings.invoice_prefix || ''}
                  onChange={e => handleChange('invoice_prefix', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
