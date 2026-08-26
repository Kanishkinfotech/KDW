import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { PauseCircle, CheckCircle2, AlertTriangle, Shield, Save, RefreshCw } from 'lucide-react';
import { SystemLayout } from '../../../components/admin/system/SystemLayout';

export const SystemMaintenancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState('ACTIVE');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const fetchStoreSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/settings/group/STORE', { withCredentials: true });
      if (res.data.success) {
        setAvailability(res.data.data['store.availability'] || 'ACTIVE');
        setMaintenanceMessage(res.data.data['store.maintenance_message'] || 'We are performing scheduled platform maintenance. Existing customer library downloads remain active.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load maintenance settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.put('/api/admin/settings/group/STORE', {
        settings: {
          'store.availability': availability,
          'store.maintenance_message': maintenanceMessage
        },
        changeReason: `System maintenance mode updated to ${availability}`
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success(`Platform availability set to ${availability}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update maintenance settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SystemLayout onRefresh={fetchStoreSettings} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${
            availability === 'ACTIVE' 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : availability === 'PAUSED'
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-rose-500/10 text-rose-400'
          }`}>
            <PauseCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Platform Availability & Maintenance Control</h2>
            <p className="text-xs text-slate-400">Configure global storefront access while preserving existing buyer download rights.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Operating Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAvailability('ACTIVE')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  availability === 'ACTIVE'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Active / Open
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Normal operations. Storefront, checkouts, and customer downloads online.</p>
              </button>

              <button
                type="button"
                onClick={() => setAvailability('PAUSED')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  availability === 'PAUSED'
                    ? 'bg-amber-950/40 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Paused Checkouts
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Browsing active; checkout cart paused. Existing downloads unaffected.</p>
              </button>

              <button
                type="button"
                onClick={() => setAvailability('MAINTENANCE')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  availability === 'MAINTENANCE'
                    ? 'bg-rose-950/40 border-rose-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-rose-400" />
                  Maintenance Mode
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Displays maintenance notice. Admins retain full bypass access.</p>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Maintenance Notice Banner</label>
            <textarea
              rows={3}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div className="text-xs text-slate-400">
              <strong className="text-slate-200">Customer Entitlement Protection Invariant:</strong> In maintenance mode, authenticated customers can always access their previously purchased digital assets through direct secure tokens.
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Applying...' : 'Apply Availability State'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SystemMaintenancePage;
