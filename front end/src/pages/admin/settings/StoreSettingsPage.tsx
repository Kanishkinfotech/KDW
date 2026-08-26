import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Store, Eye, Search, UserCheck, ShieldAlert } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/store', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load store settings');
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
      const res = await fetch('/api/admin/settings/admin/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Store settings saved successfully');
        setInitialSettings(settings);
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving store settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Storefront & Catalog Settings"
      subtitle="Configure store availability, maintenance banners, product visual metadata toggles, search optimization, and guest checkout."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Store Availability & Maintenance Mode */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Store Availability & Maintenance</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Availability State</label>
              <select
                value={settings.availability || 'ACTIVE'}
                onChange={e => handleChange('availability', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ACTIVE">🟢 Active (Open for All Purchases & Downloads)</option>
                <option value="PAUSED">🟡 Paused (Purchases Disabled, Existing Downloads Allowed)</option>
                <option value="MAINTENANCE">🔴 Maintenance Mode (Storefront Notice Active)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Note: Pausing or maintenance mode never revokes already purchased customer download access.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Maintenance Notice</label>
              <textarea
                rows={3}
                value={settings.maintenance_message || ''}
                onChange={e => handleChange('maintenance_message', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* 2. Storefront Visual Metadata Toggles */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Eye className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Storefront Visual Metadata Toggles</h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { id: 'show_product_ratings', label: 'Show Customer Star Ratings & Reviews' },
              { id: 'show_download_format', label: 'Show File Format Badges (ZIP, PDF, JSON)' },
              { id: 'show_file_size', label: 'Show Package File Size (MB / GB)' },
              { id: 'show_version', label: 'Show Version Number (e.g. v2.1.0)' },
              { id: 'show_licence_summary', label: 'Show Commercial Licence Tag & Summary' },
              { id: 'show_related_products', label: 'Show Related Bundle & Asset Recommendations' },
              { id: 'show_live_previews', label: 'Show Interactive Video / Demo Previews' }
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
          </div>
        </div>

        {/* 3. Search & Discovery Optimization */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Search className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Search & Discovery Optimization</h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { id: 'search_enabled', label: 'Enable Storefront Full-Text Search' },
              { id: 'search_typo_tolerance', label: 'Enable Typo Tolerance & Fuzzy Search' },
              { id: 'search_synonyms_enabled', label: 'Apply Keyword Synonyms (e.g. template = workflow)' },
              { id: 'exclude_draft_products', label: 'Exclude Draft & Archived Products from Search' }
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
          </div>
        </div>

        {/* 4. Customer Accounts & Guest Access */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Customer Accounts & Guest Access</h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { id: 'allow_registration', label: 'Allow Public Customer Account Registration' },
              { id: 'require_email_verification', label: 'Require Email Verification Before Download Access' },
              { id: 'allow_guest_checkout', label: 'Enable 1-Click Guest Checkout' },
              { id: 'require_guest_email_verification', label: 'Require OTP Verification for Guest Checkouts' },
              { id: 'allow_guest_purchase_claim', label: 'Allow Guests to Claim Purchases into Registered Account' },
              { id: 'allow_customer_reviews', label: 'Allow Verified Buyers to Leave Ratings & Reviews' }
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
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
