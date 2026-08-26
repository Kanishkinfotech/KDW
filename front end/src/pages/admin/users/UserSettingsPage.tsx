import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Settings, ShieldCheck, Lock, Save, Smartphone, Key } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const UserSettingsPage: React.FC = () => {
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState(3);
  const [passwordMinLength, setPasswordMinLength] = useState(12);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('User and staff security policies updated successfully');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <UsersLayout />

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6 max-w-3xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            Staff Security & Session Governance Policies
          </h2>
          <p className="text-xs text-slate-400">Global identity policies applied across all administrative personnel.</p>
        </div>

        <div className="space-y-4 pt-2">
          {/* MFA Policy */}
          <div className="flex items-start justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                Mandatory Multi-Factor Authentication (MFA)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Require TOTP authenticator enrollment for Super Admin, Finance Manager, and Developer roles.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mfaEnforced}
                onChange={(e) => setMfaEnforced(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Session Inactivity Timeout */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-white block">Session Inactivity Timeout (Minutes)</label>
            <p className="text-[11px] text-slate-400">Automatically revoke administrative sessions after inactive duration.</p>
            <input
              type="number"
              min="15"
              max="480"
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value, 10))}
              className="w-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Max Concurrent Sessions */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-white block">Maximum Concurrent Staff Sessions</label>
            <p className="text-[11px] text-slate-400">Limit simultaneous device logins per individual staff account.</p>
            <input
              type="number"
              min="1"
              max="10"
              value={maxConcurrentSessions}
              onChange={(e) => setMaxConcurrentSessions(parseInt(e.target.value, 10))}
              className="w-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Minimum Password Length */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-white block">Minimum Password Character Length</label>
            <p className="text-[11px] text-slate-400">Enforce strong entropy for all personnel credentials.</p>
            <input
              type="number"
              min="8"
              max="32"
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(parseInt(e.target.value, 10))}
              className="w-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving Policies...' : 'Save Security Policies'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default UserSettingsPage;
