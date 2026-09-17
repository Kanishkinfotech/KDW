import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign, Percent, Receipt, ShieldCheck } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function CurrencyTaxSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/currency-tax', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load currency & tax settings');
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
      const res = await fetch('/api/admin/settings/admin/currency-tax', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Currency & Tax settings updated successfully');
        setInitialSettings(settings);
        window.dispatchEvent(new CustomEvent('kdw:settings-updated'));
        try {
          localStorage.setItem('kdw_settings_updated', Date.now().toString());
        } catch (e) {}
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving currency & tax settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Currency & Tax (GST) Settings"
      subtitle="Configure store base currency formatting, multi-currency display, GST tax calculation modes, and invoice tax descriptions."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Base Currency Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Base Currency & Formatting</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Base Currency Code</label>
                <select
                  value={settings.default_currency || 'INR'}
                  onChange={e => {
                    const code = e.target.value;
                    handleChange('default_currency', code);
                    if (code === 'INR') handleChange('currency_symbol', '₹');
                    else if (code === 'USD') handleChange('currency_symbol', '$');
                    else if (code === 'EUR') handleChange('currency_symbol', '€');
                    else if (code === 'GBP') handleChange('currency_symbol', '£');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={settings.currency_symbol || '₹'}
                  onChange={e => handleChange('currency_symbol', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Symbol Position</label>
                <select
                  value={settings.symbol_position || 'BEFORE'}
                  onChange={e => handleChange('symbol_position', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium bg-white"
                >
                  <option value="BEFORE">Before Amount (₹999.00)</option>
                  <option value="AFTER">After Amount (999.00 ₹)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Decimal Places</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={settings.decimal_places ?? 2}
                  onChange={e => handleChange('decimal_places', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors mt-2">
              <span className="font-medium text-slate-700">Enable Multi-Currency Support (Experimental)</span>
              <input
                type="checkbox"
                checked={Boolean(settings.multi_currency_enabled)}
                onChange={e => handleChange('multi_currency_enabled', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </label>
          </div>
        </div>

        {/* 2. Goods & Services Tax (GST) Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Goods & Services Tax (GST) Rules</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tax Calculation Mode</label>
                <select
                  value={settings.tax_mode || 'INCLUSIVE'}
                  onChange={e => handleChange('tax_mode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
                >
                  <option value="INCLUSIVE">Tax Inclusive (Prices include 18% GST)</option>
                  <option value="EXCLUSIVE">Tax Exclusive (GST added at Checkout)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.gst_rate ?? 18}
                  onChange={e => handleChange('gst_rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Place of Supply Valuation Rule</label>
              <select
                value={settings.place_of_supply_rule || 'BILLING_STATE'}
                onChange={e => handleChange('place_of_supply_rule', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium bg-white"
              >
                <option value="BILLING_STATE">Billing Address State (IGST vs CGST/SGST)</option>
                <option value="STORE_LOCATION">Always Store Home State (Karnataka)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Invoice Tax Disclosure Note</label>
              <textarea
                rows={2}
                value={settings.invoice_tax_note || ''}
                onChange={e => handleChange('invoice_tax_note', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              <strong>Historical Tax Snapshot Guarantee:</strong> Updating GST rates or tax modes applies solely to future checkout sessions. All historical orders, invoices, and payment receipts remain permanently immutable.
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
