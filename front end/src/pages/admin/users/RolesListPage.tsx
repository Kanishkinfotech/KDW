import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { KeyRound, Shield, RefreshCw, Edit, Lock, CheckSquare, Users } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const RolesListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [rolePermIds, setRolePermIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        axios.get('/api/admin/users/roles', { withCredentials: true }),
        axios.get('/api/admin/users/permissions', { withCredentials: true })
      ]);

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data);
      }
      if (permsRes.data.success) {
        setPermissions(permsRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (role: any) => {
    setSelectedRole(role);
    const existingIds = role.permissionMappings?.map((m: any) => m.permissionId) || [];
    setRolePermIds(existingIds);
  };

  const handleTogglePerm = (permId: string) => {
    setRolePermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      const res = await axios.patch(
        `/api/admin/users/roles/${selectedRole.id}`,
        {
          permissionIds: rolePermIds,
          scopeType: 'ALL'
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedRole(null);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update role permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchData} isLoading={loading} />

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-400" />
            Configured System Roles & Scopes
          </h2>
          <p className="text-xs text-slate-400">10 base standard operational roles with scoped access control boundaries.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {r.name}
                    {r.name === 'Super Admin' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        CRITICAL
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                </div>

                <button
                  onClick={() => handleOpenEdit(r)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  Manage Scope
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span>Active Personnel: <strong className="text-white font-mono">{r._count?.users || 0}</strong></span>
                <span>Permissions: <strong className="text-blue-400 font-mono">{r.permissionMappings?.length || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Edit Modal */}
      {selectedRole && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                Configure Permissions for: {selectedRole.name}
              </h3>
              <p className="text-xs text-slate-400">Select granular actions granted to users holding this role.</p>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-2">
              {permissions.map((p) => {
                const isSelected = rolePermIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePerm(p.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{p.code}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          p.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.riskLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedRole(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                {saving ? 'Saving...' : 'Save Role Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RolesListPage;
