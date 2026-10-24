import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Sliders,
  AlertCircle,
  Search,
  RotateCcw,
  Save,
  Filter,
  Minus,
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
  roleLabels?: Record<string, string>;
}

export default function AdminRoles() {
  const { user: currentAuthUser } = useAuth();
  const userRoleNormalized = (currentAuthUser?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  const isSuperAdmin = userRoleNormalized === 'super_admin' || userRoleNormalized === 'admin';

  const [activeTab, setActiveTab] = useState<'matrix' | 'overrides'>('matrix');
  const [catalog, setCatalog] = useState<PermissionsCatalogData | null>(null);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab 1: Role Permission Matrix State
  const [editableRoleDefaults, setEditableRoleDefaults] = useState<Record<string, string[]>>({});
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixRiskFilter, setMatrixRiskFilter] = useState('ALL');
  const [matrixSaveLoading, setMatrixSaveLoading] = useState(false);

  // Tab 2: Staff Overrides State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedStaffOverrides, setSelectedStaffOverrides] = useState<string[]>([]);
  const [overrideSearch, setOverrideSearch] = useState('');
  const [overrideStatusFilter, setOverrideStatusFilter] = useState<'ALL' | 'EFFECTIVE' | 'OVERRIDDEN' | 'REVOKED'>('ALL');
  const [staffSaveLoading, setStaffSaveLoading] = useState(false);

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
        const defaults = catalogRes.data.data.roleDefaults || {};
        setEditableRoleDefaults(JSON.parse(JSON.stringify(defaults)));
      }

      if (staffRes.data.success) {
        const staff: StaffUser[] = staffRes.data.data || [];
        setStaffList(staff);
        if (staff.length > 0) {
          const currentExists = staff.find((s) => s.id === selectedStaffId);
          const target = currentExists || staff[0];
          setSelectedStaffId(target.id);
          setSelectedStaffOverrides(target.permissions || []);
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
      setSelectedStaffOverrides(target.permissions || []);
    }
  };

  // Check if role matrix has unsaved edits
  const isMatrixDirty = useMemo(() => {
    if (!catalog?.roleDefaults) return false;
    const original = catalog.roleDefaults;
    const keys = Object.keys(editableRoleDefaults);
    for (const key of keys) {
      const origList = (original[key] || []).slice().sort();
      const currList = (editableRoleDefaults[key] || []).slice().sort();
      if (origList.length !== currList.length) return true;
      for (let i = 0; i < origList.length; i++) {
        if (origList[i] !== currList[i]) return true;
      }
    }
    return false;
  }, [catalog?.roleDefaults, editableRoleDefaults]);

  // Toggle role permission in matrix
  const handleToggleRolePermission = (roleKey: string, permCode: string) => {
    if (roleKey === 'super_admin') return;

    setEditableRoleDefaults((prev) => {
      const currentRolePerms = prev[roleKey] || [];
      const hasPerm = currentRolePerms.includes(permCode);
      const updated = hasPerm
        ? currentRolePerms.filter((p) => p !== permCode)
        : [...currentRolePerms, permCode];

      return {
        ...prev,
        [roleKey]: updated
      };
    });
  };

  // Quick action: Select/Clear all for role in matrix
  const handleSetAllForRole = (roleKey: string, selectAll: boolean) => {
    if (roleKey === 'super_admin' || !catalog) return;

    setEditableRoleDefaults((prev) => ({
      ...prev,
      [roleKey]: selectAll ? catalog.permissions.map((p) => p.code) : []
    }));
  };

  // Discard role matrix changes
  const handleDiscardMatrixChanges = () => {
    if (!catalog?.roleDefaults) return;
    setEditableRoleDefaults(JSON.parse(JSON.stringify(catalog.roleDefaults)));
    toast.success('Matrix changes discarded');
  };

  // Save Role Matrix to backend
  const handleSaveRoleMatrix = async () => {
    if (!isSuperAdmin) {
      toast.error('Only administrators can modify the role permission matrix');
      return;
    }

    try {
      setMatrixSaveLoading(true);
      const res = await axios.put(
        '/api/admin/users/role-defaults',
        { roleDefaults: editableRoleDefaults },
        { headers: getAuthHeader(), withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message || 'Role permissions matrix saved successfully');
        if (catalog) {
          setCatalog({
            ...catalog,
            roleDefaults: res.data.data.roleDefaults || editableRoleDefaults
          });
        }
        loadCatalogAndStaff();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save role permissions matrix');
    } finally {
      setMatrixSaveLoading(false);
    }
  };

  // Staff Overrides Logic:
  const selectedStaffMember = staffList.find((s) => s.id === selectedStaffId);
  const selectedStaffRoleDefaults = catalog?.roleDefaults[selectedStaffMember?.role || ''] || [];

  // Check if staff overrides are dirty compared to staff record
  const isStaffDirty = useMemo(() => {
    if (!selectedStaffMember) return false;
    const orig = (selectedStaffMember.permissions || []).slice().sort();
    const curr = selectedStaffOverrides.slice().sort();
    if (orig.length !== curr.length) return true;
    for (let i = 0; i < orig.length; i++) {
      if (orig[i] !== curr[i]) return true;
    }
    return false;
  }, [selectedStaffMember, selectedStaffOverrides]);

  // Toggle permission for selected staff member (Grant or Revoke)
  const handleToggleStaffPermission = (permCode: string) => {
    if (!isSuperAdmin) return;

    const isRoleDefault = selectedStaffRoleDefaults.includes(permCode);
    const revokeCode = `-${permCode}`;
    const isRevoked = selectedStaffOverrides.includes(revokeCode);
    const isExtraGrant = selectedStaffOverrides.includes(permCode);

    let nextOverrides = [...selectedStaffOverrides];

    if (isRoleDefault) {
      if (isRevoked) {
        nextOverrides = nextOverrides.filter((c) => c !== revokeCode);
      } else {
        nextOverrides.push(revokeCode);
      }
    } else {
      if (isExtraGrant) {
        nextOverrides = nextOverrides.filter((c) => c !== permCode);
      } else {
        nextOverrides.push(permCode);
      }
    }

    setSelectedStaffOverrides(nextOverrides);
  };

  // Reset staff overrides to role defaults
  const handleResetStaffOverrides = () => {
    setSelectedStaffOverrides([]);
    toast.success('Reset overrides to clean role defaults');
  };

  // Save Staff Permissions
  const handleSaveStaffPermissions = async () => {
    if (!selectedStaffId) return;

    try {
      setStaffSaveLoading(true);
      const res = await axios.put(
        `/api/admin/users/${selectedStaffId}/permissions`,
        { permissions: selectedStaffOverrides },
        { headers: getAuthHeader(), withCredentials: true }
      );

      if (res.data.success) {
        toast.success('Staff permissions updated successfully');
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
      setStaffSaveLoading(false);
    }
  };

  // Filtered permissions for Matrix
  const filteredMatrixPermissions = useMemo(() => {
    if (!catalog) return [];
    return catalog.permissions.filter((p) => {
      const matchesSearch =
        matrixSearch === '' ||
        p.code.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(matrixSearch.toLowerCase()));
      const matchesRisk = matrixRiskFilter === 'ALL' || p.riskLevel === matrixRiskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [catalog, matrixSearch, matrixRiskFilter]);

  // Filtered permissions for Staff Overrides
  const filteredOverridePermissions = useMemo(() => {
    if (!catalog || !selectedStaffMember) return [];
    return catalog.permissions.filter((p) => {
      const matchesSearch =
        overrideSearch === '' ||
        p.code.toLowerCase().includes(overrideSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(overrideSearch.toLowerCase()));

      if (!matchesSearch) return false;

      const isRoleDefault = selectedStaffRoleDefaults.includes(p.code);
      const isRevoked = selectedStaffOverrides.includes(`-${p.code}`);
      const isExtraGrant = selectedStaffOverrides.includes(p.code);
      const isEffective = (isRoleDefault && !isRevoked) || isExtraGrant;
      const isOverridden = isRevoked || isExtraGrant;

      if (overrideStatusFilter === 'EFFECTIVE') return isEffective;
      if (overrideStatusFilter === 'OVERRIDDEN') return isOverridden;
      if (overrideStatusFilter === 'REVOKED') return isRevoked;
      return true;
    });
  }, [catalog, selectedStaffMember, selectedStaffRoleDefaults, selectedStaffOverrides, overrideSearch, overrideStatusFilter]);

  // Calculate stats for selected staff
  const staffStats = useMemo(() => {
    if (!catalog || !selectedStaffMember) return { total: 0, inherited: 0, extra: 0, revoked: 0 };
    let inherited = 0;
    let extra = 0;
    let revoked = 0;

    for (const p of catalog.permissions) {
      const isRoleDef = selectedStaffRoleDefaults.includes(p.code);
      const isRev = selectedStaffOverrides.includes(`-${p.code}`);
      const isExt = selectedStaffOverrides.includes(p.code);

      if (isRoleDef && !isRev) inherited++;
      if (isExt) extra++;
      if (isRev) revoked++;
    }

    return {
      total: inherited + extra,
      inherited,
      extra,
      revoked
    };
  }, [catalog, selectedStaffMember, selectedStaffRoleDefaults, selectedStaffOverrides]);

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

  const formatRoleLabel = (roleKey: string) => {
    if (catalog?.roleLabels && catalog.roleLabels[roleKey]) {
      return catalog.roleLabels[roleKey];
    }
    return roleKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

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

      {/* Tabs Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 px-4 pt-3 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-primary text-primary bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={16} />
            Role Permission Matrix
            {isMatrixDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('overrides')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'overrides'
                ? 'border-primary text-primary bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders size={16} />
            Staff Permission Overrides
            {isStaffDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
            )}
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: ROLE PERMISSION MATRIX */}
        {/* =================================================================== */}
        {activeTab === 'matrix' && (
          <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
            {/* Unsaved Changes Banner */}
            {isMatrixDirty && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-xs text-amber-900 animate-in fade-in">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>Unsaved Matrix Changes:</strong> You have modified role default permissions. Click &quot;Save Role Matrix&quot; to apply these changes across all staff.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDiscardMatrixChanges}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Discard
                  </button>
                  <Button
                    size="sm"
                    onClick={handleSaveRoleMatrix}
                    isLoading={matrixSaveLoading}
                    className="text-xs h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Save size={13} className="mr-1" />
                    Save Matrix
                  </Button>
                </div>
              </div>
            )}

            {/* Matrix Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative min-w-[240px] max-w-sm flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search permissions by name or code..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {matrixSearch && (
                    <button
                      onClick={() => setMatrixSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Risk Filter */}
                <div className="flex items-center gap-1">
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
                    <button
                      key={risk}
                      onClick={() => setMatrixRiskFilter(risk)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                        matrixRiskFilter === risk
                          ? 'bg-primary text-white border-primary shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {risk === 'ALL' ? 'All Risks' : risk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save / Reset Actions */}
              <div className="flex items-center gap-2 justify-end">
                {isMatrixDirty && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardMatrixChanges}
                    className="text-xs h-8"
                  >
                    <RotateCcw size={13} className="mr-1" />
                    Discard
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleSaveRoleMatrix}
                  isLoading={matrixSaveLoading}
                  disabled={!isMatrixDirty}
                  className={`text-xs h-8 flex items-center gap-1.5 ${
                    isMatrixDirty
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <Save size={13} />
                  Save Role Matrix
                </Button>
              </div>
            </div>

            {/* Matrix Table */}
            {loading || !catalog ? (
              <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs font-medium">Loading permission matrix...</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 bg-slate-50 z-20 min-w-[230px] border-r border-slate-200">
                        Permission Code & Scope
                      </th>
                      <th className="px-3 py-3 text-center border-r border-slate-200 w-[90px]">Risk</th>
                      {catalog.roles.map((roleKey) => {
                        const isRoot = roleKey === 'super_admin';
                        const currentRolePerms = editableRoleDefaults[roleKey] || [];
                        const roleLabel = formatRoleLabel(roleKey);

                        return (
                          <th
                            key={roleKey}
                            className={`px-3 py-3 text-center border-r border-slate-200 last:border-r-0 min-w-[130px] ${
                              roleKey === 'admin'
                                ? 'bg-amber-50/40'
                                : roleKey === 'manager'
                                ? 'bg-indigo-50/40'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-slate-900 capitalize flex items-center gap-1">
                                {roleLabel}
                                {isRoot && (
                                  <span title="Full Root Control">
                                    <Lock size={10} className="text-slate-400" />
                                  </span>
                                )}
                              </span>

                              {/* Quick Select All / Clear All for non-root roles */}
                              {!isRoot && isSuperAdmin && (
                                <div className="flex items-center gap-1 pt-0.5">
                                  <button
                                    onClick={() => handleSetAllForRole(roleKey, true)}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 lowercase font-medium"
                                    title={`Grant all to ${roleLabel}`}
                                  >
                                    all
                                  </button>
                                  <button
                                    onClick={() => handleSetAllForRole(roleKey, false)}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 lowercase font-medium"
                                    title={`Clear all for ${roleLabel}`}
                                  >
                                    clear
                                  </button>
                                  <span className="text-[9px] text-slate-400 font-mono ml-0.5">
                                    ({currentRolePerms.length})
                                  </span>
                                </div>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMatrixPermissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={catalog.roles.length + 2}
                          className="py-12 text-center text-slate-400 text-xs"
                        >
                          No permissions match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredMatrixPermissions.map((perm) => (
                        <tr key={perm.code} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Permission Details */}
                          <td className="px-4 py-2.5 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 border-r border-slate-200">
                            <div className="font-mono font-bold text-slate-900">{perm.code}</div>
                            {perm.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1">{perm.description}</div>
                            )}
                          </td>

                          {/* Risk Level */}
                          <td className="px-3 py-2.5 text-center border-r border-slate-200">
                            {getRiskBadge(perm.riskLevel)}
                          </td>

                          {/* Role Checkboxes */}
                          {catalog.roles.map((roleKey) => {
                            const isRoot = roleKey === 'super_admin';
                            const hasGrant = isRoot || (editableRoleDefaults[roleKey] || []).includes(perm.code);

                            return (
                              <td
                                key={roleKey}
                                onClick={() => {
                                  if (!isRoot && isSuperAdmin) {
                                    handleToggleRolePermission(roleKey, perm.code);
                                  }
                                }}
                                className={`px-3 py-2.5 text-center border-r border-slate-200 last:border-r-0 select-none transition-colors ${
                                  !isRoot && isSuperAdmin ? 'cursor-pointer hover:bg-primary/5' : ''
                                } ${
                                  roleKey === 'admin'
                                    ? 'bg-amber-50/20'
                                    : roleKey === 'manager'
                                    ? 'bg-indigo-50/20'
                                    : ''
                                }`}
                              >
                                {isRoot ? (
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 text-slate-400 rounded-md border border-slate-200"
                                    title="Super Admin has permanently unrestricted platform access"
                                  >
                                    <Lock size={11} />
                                  </span>
                                ) : hasGrant ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-500 text-white rounded-md shadow-2xs hover:bg-emerald-600 transition-colors">
                                    <Check size={13} strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 border border-slate-300 rounded-md bg-white hover:border-slate-400 transition-colors text-transparent">
                                    <Minus size={10} />
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
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
          <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
            {/* View Only Notice for Non-Admins */}
            {!isSuperAdmin && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>
                  <strong>View Only:</strong> Only Super Administrators can configure granular per-staff permission overrides.
                </span>
              </div>
            )}

            {/* Staff Selector Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* Dropdown */}
              <div className="space-y-1 w-full lg:w-auto">
                <label className="block text-xs font-bold text-slate-700">Select Staff Member to Override:</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => handleSelectStaff(e.target.value)}
                  className="w-full lg:w-auto px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-primary min-w-[300px]"
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email}) — [{formatRoleLabel(staff.role)}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats & Actions */}
              {selectedStaffMember && (
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                  {/* Stats Pill Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                      <span className="text-slate-400">Role: </span>
                      <strong className="text-slate-900 font-bold capitalize">
                        {formatRoleLabel(selectedStaffMember.role)}
                      </strong>
                    </div>

                    <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">
                      <span>Inherited: </span>
                      <strong>{staffStats.inherited}</strong>
                    </div>

                    <div className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg font-medium">
                      <span>Extra Grants: </span>
                      <strong>{staffStats.extra}</strong>
                    </div>

                    <div className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-medium">
                      <span>Revoked: </span>
                      <strong>{staffStats.revoked}</strong>
                    </div>

                    <div className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold">
                      <span>Effective: </span>
                      <span className="font-mono">{staffStats.total}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetStaffOverrides}
                        disabled={selectedStaffOverrides.length === 0}
                        className="text-xs h-8"
                        title="Clear all overrides and reset to role defaults"
                      >
                        <RotateCcw size={13} className="mr-1" />
                        Reset Overrides
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleSaveStaffPermissions}
                        isLoading={staffSaveLoading}
                        className="text-xs h-8 flex items-center gap-1.5"
                      >
                        <Save size={13} />
                        Save Permissions
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter & Search Toolbar */}
            {catalog && selectedStaffMember && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200">
                <div className="relative min-w-[240px] max-w-sm flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={overrideSearch}
                    onChange={(e) => setOverrideSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {overrideSearch && (
                    <button
                      onClick={() => setOverrideSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setOverrideStatusFilter('ALL')}
                    className={`px-2.5 py-1 font-semibold rounded-lg border transition-all ${
                      overrideStatusFilter === 'ALL'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All ({catalog.permissions.length})
                  </button>

                  <button
                    onClick={() => setOverrideStatusFilter('EFFECTIVE')}
                    className={`px-2.5 py-1 font-semibold rounded-lg border transition-all ${
                      overrideStatusFilter === 'EFFECTIVE'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Active Effective ({staffStats.total})
                  </button>

                  <button
                    onClick={() => setOverrideStatusFilter('OVERRIDDEN')}
                    className={`px-2.5 py-1 font-semibold rounded-lg border transition-all ${
                      overrideStatusFilter === 'OVERRIDDEN'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Overridden ({staffStats.extra + staffStats.revoked})
                  </button>

                  <button
                    onClick={() => setOverrideStatusFilter('REVOKED')}
                    className={`px-2.5 py-1 font-semibold rounded-lg border transition-all ${
                      overrideStatusFilter === 'REVOKED'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Revoked ({staffStats.revoked})
                  </button>
                </div>
              </div>
            )}

            {/* Permissions Cards Grid */}
            {catalog && selectedStaffMember && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Click on any permission card to grant or revoke it for this staff member.</span>
                  <div className="flex items-center gap-3 text-[11px] font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      Inherited
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                      Extra Granted
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                      Revoked by Admin
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredOverridePermissions.map((perm) => {
                    const isRoleDefault = selectedStaffRoleDefaults.includes(perm.code);
                    const isRevoked = selectedStaffOverrides.includes(`-${perm.code}`);
                    const isExtraGrant = selectedStaffOverrides.includes(perm.code);
                    const isEffective = (isRoleDefault && !isRevoked) || isExtraGrant;

                    return (
                      <div
                        key={perm.code}
                        onClick={() => handleToggleStaffPermission(perm.code)}
                        className={`p-3.5 rounded-xl border transition-all select-none cursor-pointer flex flex-col justify-between ${
                          isRevoked
                            ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200 hover:bg-rose-50'
                            : isExtraGrant
                            ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-2xs hover:bg-primary/10'
                            : isRoleDefault
                            ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/70'
                            : 'bg-white border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">{perm.code}</span>
                            {getRiskBadge(perm.riskLevel)}
                          </div>

                          <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{perm.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                          {/* Status Badge */}
                          {isRevoked ? (
                            <span className="text-rose-700 font-bold flex items-center gap-1">
                              <X size={12} strokeWidth={3} /> Revoked by Super Admin
                            </span>
                          ) : isExtraGrant ? (
                            <span className="text-primary font-bold flex items-center gap-1">
                              <Check size={12} strokeWidth={3} /> Extra Granted
                            </span>
                          ) : isRoleDefault ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check size={12} strokeWidth={3} /> Inherited from {formatRoleLabel(selectedStaffMember.role)}
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Minus size={12} /> Not Granted
                            </span>
                          )}

                          {/* Interactive Toggle Button */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStaffPermission(perm.code);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                isRevoked
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : isExtraGrant
                                  ? 'bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700'
                                  : isRoleDefault
                                  ? 'bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-700'
                                  : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'
                              }`}
                            >
                              {isRevoked
                                ? 'Restore'
                                : isExtraGrant
                                ? 'Remove'
                                : isRoleDefault
                                ? 'Revoke'
                                : 'Grant'}
                            </button>
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
