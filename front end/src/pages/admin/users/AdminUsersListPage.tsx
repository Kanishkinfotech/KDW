import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Users, Search, Plus, ShieldCheck, UserX, UserCheck, RefreshCw, Mail, Smartphone, Lock } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const AdminUsersListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State for Invite
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Support Agent');
  const [inviteDept, setInviteDept] = useState('SUPPORT');
  const [inviteTeam, setInviteTeam] = useState('CORE');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users', {
        params: { role: roleFilter, search: searchTerm },
        withCredentials: true
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSuspend = async (id: string, email: string) => {
    const reason = window.prompt(`Enter reason for suspending ${email}:`);
    if (!reason) return;

    try {
      const res = await axios.post(`/api/admin/users/${id}/suspend`, { reason }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/users/${id}/activate`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to activate user');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error('Work email is required');
      return;
    }

    try {
      setSubmittingInvite(true);
      const res = await axios.post(
        '/api/admin/users/invite',
        {
          email: inviteEmail,
          roleName: inviteRole,
          department: inviteDept,
          team: inviteTeam
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setShowInviteModal(false);
        setInviteEmail('');
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmittingInvite(false);
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchUsers} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Filter
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="inventory_manager">Inventory Manager</option>
            </select>

            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Invite Staff
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Department & Team</th>
                <th className="px-4 py-3">MFA Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
                    Querying staff directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No admin staff users found matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-400">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 font-medium">{u.staffProfile?.department || 'MANAGEMENT'}</div>
                      <div className="text-[10px] text-slate-500">{u.staffProfile?.team || 'CORE'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.staffProfile?.mfaEnabled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          MFA ENABLED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          OPTIONAL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleSuspend(u.id, u.email)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-xs font-semibold transition"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(u.id)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold transition"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Invite Staff Member
            </h3>
            <p className="text-xs text-slate-400">
              Generates a secure, short-lived (48-hour) invitation token with role pre-assignment.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@kanishkdigitalworld.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="SUPPORT">Support</option>
                    <option value="CATALOG">Catalog</option>
                    <option value="FINANCE">Finance</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="ENGINEERING">Engineering</option>
                    <option value="MANAGEMENT">Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Team</label>
                  <select
                    value={inviteTeam}
                    onChange={(e) => setInviteTeam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="CORE">Core</option>
                    <option value="SUPPORT_TIER_1">Tier 1 Support</option>
                    <option value="SUPPORT_TIER_2">Tier 2 Support</option>
                    <option value="FINANCE_OPS">Finance Ops</option>
                    <option value="GROWTH">Growth</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  {submittingInvite ? 'Sending...' : 'Generate & Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminUsersListPage;
