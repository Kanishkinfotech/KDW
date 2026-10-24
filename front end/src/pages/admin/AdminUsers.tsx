import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Key,
  Copy,
  Check,
  AlertCircle,
  X,
  Lock,
  ChevronDown
} from 'lucide-react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isActive: boolean;
  permissions: string[];
  effectivePermissions: string[];
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'admin', label: 'Admin', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'manager', label: 'Manager', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'inventory_manager', label: 'Inventory Manager', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'support_agent', label: 'Support Agent', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'marketing', label: 'Marketing', color: 'bg-purple-50 text-purple-700 border-purple-200' }
];

export default function AdminUsers() {
  const { user: currentAuthUser } = useAuth();
  const userRoleNormalized = (currentAuthUser?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  const isSuperAdmin = userRoleNormalized === 'super_admin' || userRoleNormalized === 'admin';

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('manager');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Temporary Password Modal
  const [tempPasswordModalOpen, setTempPasswordModalOpen] = useState(false);
  const [tempPasswordData, setTempPasswordData] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StaffUser | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Permissions Detail Modal
  const [permissionsModalUser, setPermissionsModalUser] = useState<StaffUser | null>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStaffUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users', {
        params: {
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search.trim() || undefined
        },
        headers: getAuthHeader(),
        withCredentials: true
      });
      if (res.data.success) {
        setStaffUsers(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchStaffUsers();
  }, [fetchStaffUsers]);

  // Handle Invite Submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setInviteSubmitting(true);
      const res = await axios.post(
        '/api/admin/users/invite',
        {
          name: inviteName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole
        },
        { headers: getAuthHeader(), withCredentials: true }
      );

      if (res.data.success && res.data.data) {
        toast.success('Staff invitation created successfully');
        setInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('support');

        // Show Temporary Password Dialog
        if (res.data.data.temporaryPassword) {
          setTempPasswordData({
            email: res.data.data.email,
            password: res.data.data.temporaryPassword
          });
          setTempPasswordModalOpen(true);
        }

        fetchStaffUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite staff member');
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Handle Role Change
  const handleRoleChange = async (user: StaffUser, newRole: string) => {
    if (user.role === newRole) return;

    try {
      const res = await axios.patch(
        `/api/admin/users/${user.id}/role`,
        { role: newRole },
        { headers: getAuthHeader(), withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Role updated to ${newRole}`);
        fetchStaffUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
      fetchStaffUsers(); // Reset UI
    }
  };

  // Handle Status Toggle (Suspend / Reactivate)
  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;

    try {
      setStatusLoading(true);
      const targetActive = !statusTarget.isActive;

      const res = await axios.patch(
        `/api/admin/users/${statusTarget.id}/status`,
        { isActive: targetActive },
        { headers: getAuthHeader(), withCredentials: true }
      );

      if (res.data.success) {
        toast.success(targetActive ? 'Account reactivated' : 'Account suspended');
        setStatusModalOpen(false);
        setStatusTarget(null);
        fetchStaffUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change account status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPasswordData?.password) {
      navigator.clipboard.writeText(tempPasswordData.password);
      setCopied(true);
      toast.success('Temporary password copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getRoleBadge = (roleName: string) => {
    const opt = ROLE_OPTIONS.find((r) => r.value === roleName.toLowerCase().replace(/[\s-]+/g, '_'));
    const label = opt ? opt.label : roleName;
    const color = opt ? opt.color : 'bg-slate-50 text-slate-700 border-slate-200';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${color}`}>
        <Shield size={11} />
        {label}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-primary w-7 h-7" />
            Admin Users & Staff Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage administrative and staff accounts, assign 3 roles, and control account status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchStaffUsers}
            isLoading={loading}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>

          {isSuperAdmin && (
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 text-xs"
            >
              <UserPlus size={14} />
              Invite Staff Member
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary bg-white w-full sm:w-44"
            >
              <option value="ALL">All Staff Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Directory Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading staff accounts...</p>
          </div>
        ) : staffUsers.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No staff accounts found.</h3>
            <p className="text-xs text-slate-500">
              {search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No staff members match your search criteria.'
                : 'Invite staff members to delegate store operations.'}
            </p>
            {isSuperAdmin && (
              <Button onClick={() => setInviteModalOpen(true)} className="text-xs">
                Invite Staff Member
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Effective Permissions</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffUsers.map((member) => {
                  const isSelf = member.id === currentAuthUser?.id || member.email === currentAuthUser?.email;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-4 space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {member.name}
                          {isSelf && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{member.email}</div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        {isSuperAdmin && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getRoleBadge(member.role)
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Permissions */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setPermissionsModalUser(member)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                          title="View all effective permissions for this user"
                        >
                          <Lock size={12} className="text-slate-400" />
                          <span>{member.effectivePermissions?.length || 0} permissions</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {!isSelf ? (
                            <button
                              onClick={() => {
                                setStatusTarget(member);
                                setStatusModalOpen(true);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                member.isActive
                                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {member.isActive ? 'Suspend' : 'Activate'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Self (Protected)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* INVITE STAFF MODAL */}
      {/* =================================================================== */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Invite Staff Member
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              A cryptographically secure temporary password will be generated and displayed once.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. eleanor.vance@kdw.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {inviteSubmitting ? 'Generating Invite...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TEMPORARY PASSWORD DISPLAY MODAL (ONCE) */}
      {/* =================================================================== */}
      {tempPasswordModalOpen && tempPasswordData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Temporary Password Generated</h3>
                <p className="text-xs text-slate-500">Account: {tempPasswordData.email}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-sm flex items-center justify-between border border-slate-800">
              <span className="select-all tracking-wider font-bold">{tempPasswordData.password}</span>
              <button
                onClick={handleCopyPassword}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong>Important Security Warning:</strong> This password is shown only once and is never stored in plaintext. Copy and securely share it with the staff member.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setTempPasswordModalOpen(false);
                  setTempPasswordData(null);
                }}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors"
              >
                I have securely copied this password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STATUS CHANGE CONFIRMATION MODAL */}
      {/* =================================================================== */}
      {statusModalOpen && statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full border ${statusTarget.isActive ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                {statusTarget.isActive ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {statusTarget.isActive ? 'Suspend Staff Account' : 'Reactivate Staff Account'}
                </h3>
                <p className="text-xs text-slate-500">{statusTarget.email}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to {statusTarget.isActive ? 'suspend' : 'reactivate'}{' '}
              <strong className="text-slate-900">{statusTarget.name}</strong>?
              {statusTarget.isActive && ' Suspended users are immediately denied access to the admin portal.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusTarget(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={statusLoading}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 ${
                  statusTarget.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusLoading ? 'Processing...' : statusTarget.isActive ? 'Confirm Suspension' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EFFECTIVE PERMISSIONS MODAL */}
      {/* =================================================================== */}
      {permissionsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Effective Permissions
                </h3>
                <p className="text-xs text-slate-500">
                  {permissionsModalUser.name} ({permissionsModalUser.role})
                </p>
              </div>
              <button
                onClick={() => setPermissionsModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Granted Permissions ({permissionsModalUser.effectivePermissions?.length || 0}):
              </div>
              <div className="max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5">
                {permissionsModalUser.effectivePermissions && permissionsModalUser.effectivePermissions.length > 0 ? (
                  permissionsModalUser.effectivePermissions.map((code) => (
                    <span
                      key={code}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-medium rounded-md shadow-2xs"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No permissions granted</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPermissionsModalUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
