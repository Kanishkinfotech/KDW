import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Lock, RefreshCw, Plus, Clock, ShieldCheck, User } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const PermissionsListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [tempGrants, setTempGrants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Modal State for Temporary Permission
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermCode, setSelectedPermCode] = useState('system.backup.restore');
  const [durationHours, setDurationHours] = useState(2);
  const [grantReason, setGrantReason] = useState('');
  const [submittingGrant, setSubmittingGrant] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [permsRes, grantsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/users/permissions', { withCredentials: true }),
        axios.get('/api/admin/users/temporary-permissions', { withCredentials: true }),
        axios.get('/api/admin/users', { withCredentials: true })
      ]);

      if (permsRes.data.success) {
        setPermissions(permsRes.data.data);
      }
      if (grantsRes.data.success) {
        setTempGrants(grantsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
        if (usersRes.data.data.length > 0) {
          setSelectedUserId(usersRes.data.data[0].id);
        }
      }
    } catch (err) {
      toast.error('Failed to load permissions catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantTemporary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !grantReason) {
      toast.error('Please fill in user and justification reason');
      return;
    }

    try {
      setSubmittingGrant(true);
      const res = await axios.post(
        '/api/admin/users/temporary-permission',
        {
          userId: selectedUserId,
          permissionCode: selectedPermCode,
          durationHours: Number(durationHours),
          reason: grantReason
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setShowGrantModal(false);
        setGrantReason('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to grant temporary access');
    } finally {
      setSubmittingGrant(false);
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchData} isLoading={loading} />

      {/* Temporary Elevated Access Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Active Time-Bound Elevated Permissions
            </h2>
            <p className="text-xs text-slate-400">Temporary permissions automatically expire after the granted window.</p>
          </div>

          <button
            onClick={() => setShowGrantModal(true)}
            className="px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Grant Temporary Access
          </button>
        </div>

        {tempGrants.length === 0 ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
            No active temporary elevated permissions currently granted.
          </div>
        ) : (
          <div className="space-y-2">
            {tempGrants.map((tg) => (
              <div key={tg.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold">{tg.permissionCode}</span>
                    <span className="text-slate-300 font-medium">to {tg.userEmail}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Reason: {tg.reason} • Approved by: {tg.approvedByName}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    tg.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tg.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Expires: {new Date(tg.expiresAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            System Permissions Master Catalog
          </h2>
          <p className="text-xs text-slate-400">All granular resource actions supported across the application platform.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Permission Code</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {permissions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-white font-bold text-xs">
                    {p.code}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {p.resource}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {p.action}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : p.riskLevel === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {p.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Temporary Permission Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Grant Temporary Elevated Access
            </h3>

            <form onSubmit={handleGrantTemporary} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Staff User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Permission to Elevate</label>
                <select
                  value={selectedPermCode}
                  onChange={(e) => setSelectedPermCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  {permissions.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} ({p.riskLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Justification / Reason</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Performing quarterly disaster recovery restore test"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGrant}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl"
                >
                  {submittingGrant ? 'Granting...' : 'Authorize Elevated Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PermissionsListPage;
