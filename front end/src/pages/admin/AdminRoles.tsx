import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Check,
  X,
  RefreshCw,
  UserCheck,
  Sliders,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

interface PermissionDef {
  code: string;
  resource: string;
  action: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isActive: boolean;
  permissions: string[];
  effectivePermissions: string[];
}

interface PermissionsCatalogData {
  roles: string[];
  permissions: PermissionDef[];
  roleDefaults: Record<string, string[]>;
}

export default function AdminRoles() {
  const { user: currentAuthUser } = useAuth();
  const userRoleNormalized = (currentAuthUser?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  const isSuperAdmin = userRoleNormalized === 'super_admin' || userRoleNormalized === 'admin';

  const [activeTab, setActiveTab] = useState<'matrix' | 'overrides'>('matrix');
  const [catalog, setCatalog] = useState<PermissionsCatalogData | null>(null);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Override Management
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedStaffExtraPermissions, setSelectedStaffExtraPermissions] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadCatalogAndStaff = useCallback(async () => {
    try {
      setLoading(true);
      const [catalogRes, staffRes] = await Promise.all([
        axios.get('/api/admin/users/permissions-catalog', {
          headers: getAuthHeader(),
          withCredentials: true
        }),
        axios.get('/api/admin/users', {
          headers: getAuthHeader(),
          withCredentials: true
        })
      ]);

      if (catalogRes.data.success) {
        setCatalog(catalogRes.data.data);
      }
      if (staffRes.data.success) {
        const staff = staffRes.data.data || [];
        setStaffList(staff);
        if (staff.length > 0 && !selectedStaffId) {
          setSelectedStaffId(staff[0].id);
          setSelectedStaffExtraPermissions(staff[0].permissions || []);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load permissions catalog');
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    loadCatalogAndStaff();
  }, [loadCatalogAndStaff]);

  // When staff selection changes
  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    const target = staffList.find((s) => s.id === staffId);
    if (target) {
      setSelectedStaffExtraPermissions(target.permissions || []);
    }
  };

  // Toggle an extra permission
  const handleToggleExtraPermission = (code: string) => {
    if (selectedStaffExtraPermissions.includes(code)) {
      setSelectedStaffExtraPermissions(selectedStaffExtraPermissions.filter((c) => c !== code));
    } else {
      setSelectedStaffExtraPermissions([...selectedStaffExtraPermissions, code]);
    }
  };

  // Save Extra Permissions
  const handleSavePermissions = async () => {
    if (!selectedStaffId) return;

    try {
      setSaveLoading(true);
      const res = await axios.put(
        `/api/admin/users/${selectedStaffId}/permissions`,
        { permissions: selectedStaffExtraPermissions },
        { headers: getAuthHeader(), withCredentials: true }
      );

      if (res.data.success) {
        toast.success('Staff permissions updated successfully');
        // Update local list
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === selectedStaffId
              ? {
                  ...s,
                  permissions: res.data.data.permissions,
                  effectivePermissions: res.data.data.effectivePermissions
                }
              : s
          )
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaveLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold rounded-md uppercase">
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md uppercase">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold rounded-md uppercase">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-md uppercase">
            Low
          </span>
        );
    }
  };

  const selectedStaffMember = staffList.find((s) => s.id === selectedStaffId);
  const selectedStaffRoleDefaults = catalog?.roleDefaults[selectedStaffMember?.role || ''] || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-primary w-7 h-7" />
            Roles & Permission Matrix (RBAC)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review default role permissions and assign granular per-staff permission overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadCatalogAndStaff}
            isLoading={loading}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-primary text-primary bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={16} />
            Role Permission Matrix
          </button>

          <button
            onClick={() => setActiveTab('overrides')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'overrides'
                ? 'border-primary text-primary bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders size={16} />
            Staff Permission Overrides
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: ROLE PERMISSION MATRIX */}
        {/* =================================================================== */}
        {activeTab === 'matrix' && (
          <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Shows the built-in system permissions granted automatically to each staff role.
              </div>
            </div>

            {loading || !catalog ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs">Loading permission matrix...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Permission Code</th>
                      <th className="px-3 py-3 text-center">Risk</th>
                      {catalog.roles.map((roleKey) => {
                        const roleLabel =
                          roleKey === 'super_admin'
                            ? 'Super Admin'
                            : roleKey === 'admin'
                            ? 'Admin'
                            : roleKey === 'inventory_manager'
                            ? 'Inventory Manager'
                            : roleKey.replace(/_/g, ' ');
                        return (
                          <th key={roleKey} className="px-3 py-3 text-center capitalize">
                            {roleLabel}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalog.permissions.map((perm) => (
                      <tr key={perm.code} className="hover:bg-slate-50/70 transition-colors">
                        {/* Permission Code & Description */}
                        <td className="px-4 py-3 sticky left-0 bg-white hover:bg-slate-50/70 z-10 space-y-0.5">
                          <div className="font-mono font-bold text-slate-900">{perm.code}</div>
                          {perm.description && (
                            <div className="text-[11px] text-slate-500">{perm.description}</div>
                          )}
                        </td>

                        {/* Risk Level */}
                        <td className="px-3 py-3 text-center">{getRiskBadge(perm.riskLevel)}</td>

                        {/* Role Default Grants */}
                        {catalog.roles.map((roleKey) => {
                          const hasGrant = catalog.roleDefaults[roleKey]?.includes(perm.code);

                          return (
                            <td key={roleKey} className="px-3 py-3 text-center">
                              {hasGrant ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: STAFF PERMISSION OVERRIDES */}
        {/* =================================================================== */}
        {activeTab === 'overrides' && (
          <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-150">
            {/* Super Admin Notice */}
            {!isSuperAdmin && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>
                  <strong>View Only:</strong> Only Super Administrators can configure extra per-staff permission overrides.
                </span>
              </div>
            )}

            {/* Staff Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Select Staff Member:</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => handleSelectStaff(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-primary min-w-[280px]"
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email}) — [{staff.role}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedStaffMember && (
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-600">
                    <div>
                      Role: <strong className="text-slate-900 uppercase">{selectedStaffMember.role}</strong>
                    </div>
                    <div>
                      Total Effective Permissions:{' '}
                      <strong className="text-primary font-mono">
                        {Array.from(new Set([...selectedStaffRoleDefaults, ...selectedStaffExtraPermissions])).length}
                      </strong>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <Button
                      onClick={handleSavePermissions}
                      isLoading={saveLoading}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      Save Permissions
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Permissions List with Role Default vs Extra Badge */}
            {catalog && selectedStaffMember && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Toggle additional permissions granted on top of the role defaults.</span>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      Role Default (Inherited)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                      Extra User Grant
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catalog.permissions.map((perm) => {
                    const isRoleDefault = selectedStaffRoleDefaults.includes(perm.code);
                    const isExtraGrant = selectedStaffExtraPermissions.includes(perm.code);
                    const isEffective = isRoleDefault || isExtraGrant;

                    return (
                      <div
                        key={perm.code}
                        onClick={() => {
                          if (isSuperAdmin && !isRoleDefault) {
                            handleToggleExtraPermission(perm.code);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all select-none ${
                          isRoleDefault
                            ? 'bg-emerald-50/50 border-emerald-200 cursor-not-allowed opacity-90'
                            : isExtraGrant
                            ? 'bg-primary/5 border-primary shadow-xs cursor-pointer'
                            : isSuperAdmin
                            ? 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                            : 'bg-white border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">{perm.code}</span>
                          {getRiskBadge(perm.riskLevel)}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{perm.description}</p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          {isRoleDefault ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check size={12} /> Inherited from {selectedStaffMember.role}
                            </span>
                          ) : isExtraGrant ? (
                            <span className="text-primary font-bold flex items-center gap-1">
                              <Check size={12} /> Extra Granted
                            </span>
                          ) : (
                            <span className="text-slate-400">Not Granted</span>
                          )}

                          {!isRoleDefault && isSuperAdmin && (
                            <input
                              type="checkbox"
                              checked={isExtraGrant}
                              onChange={() => handleToggleExtraPermission(perm.code)}
                              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
