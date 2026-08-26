import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowDownToLine, Key, HardDrive, ShieldCheck, Zap } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function DownloadSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [initialSettings, setInitialSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/downloads', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setInitialSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load download settings');
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
      const res = await fetch('/api/admin/settings/admin/downloads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Download & delivery policies saved successfully');
        setInitialSettings(settings);
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving download settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestDrive = async () => {
    setTestingDrive(true);
    try {
      const res = await fetch('/api/admin/settings/admin/test/drive', {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
      }
    } catch (err) {
      toast.error('Google Drive health check failed');
    } finally {
      setTestingDrive(false);
    }
  };

  return (
    <SettingsLayout
      title="Download Security & Digital Delivery Settings"
      subtitle="Configure cryptographic download token lifetimes (15-min standard), rate-limiting, Google Drive streaming rules, and refund access revocation."
      isDirty={isDirty}
      onSave={handleSave}
      onReset={() => setSettings(initialSettings)}
      isSaving={saving}
      onRefresh={fetchSettings}
      isLoading={loading}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Default Download Policies & Tokens */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ArrowDownToLine className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Default Download & Token Policies</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Default Download Limit</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.default_download_limit ?? 5}
                  onChange={e => handleChange('default_download_limit', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Access Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={settings.default_access_duration_days ?? 365}
                  onChange={e => handleChange('default_access_duration_days', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Secure Token Lifetime (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.token_lifetime_minutes ?? 15}
                  onChange={e => handleChange('token_lifetime_minutes', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Industry standard is 15 minutes.</p>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Active Concurrent Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_active_tokens_per_user ?? 3}
                  onChange={e => handleChange('max_active_tokens_per_user', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Refund Access Revocation Rule</label>
              <select
                value={settings.refund_access_revocation || 'REVOKE_IMMEDIATELY'}
                onChange={e => handleChange('refund_access_revocation', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium bg-white"
              >
                <option value="REVOKE_IMMEDIATELY">Revoke Immediately upon Approved Refund</option>
                <option value="REVOKE_ON_REVIEW">Revoke after Manual Review</option>
                <option value="KEEP_ACCESS">Keep Download Access (Legacy Support)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. File Rules & Google Drive Delivery */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">File Rules & Google Drive Service</h3>
            </div>
            <button
              onClick={handleTestDrive}
              disabled={testingDrive}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all"
            >
              <Zap className={`w-3.5 h-3.5 ${testingDrive ? 'animate-spin' : ''}`} />
              Test Drive Health
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Upload / Package Size (MB)</label>
              <input
                type="number"
                min="10"
                max="50000"
                value={settings.max_file_size_mb ?? 5120}
                onChange={e => handleChange('max_file_size_mb', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">5120 MB = 5.0 GB maximum single file size.</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Google Drive Delivery Root Folder ID</label>
              <input
                type="text"
                value={settings.google_drive_parent_folder_id || 'root'}
                onChange={e => handleChange('google_drive_parent_folder_id', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-700"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors">
                <span className="font-medium text-slate-700">Cryptographically Hash Tokens in Database</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.hash_tokens_in_database)}
                  onChange={e => handleChange('hash_tokens_in_database', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors">
                <span className="font-medium text-slate-700">Log Full Download Telemetry (IP & User-Agent)</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.log_download_telemetry)}
                  onChange={e => handleChange('log_download_telemetry', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
