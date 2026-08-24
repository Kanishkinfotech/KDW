import { useState, useEffect } from 'react';
import { Search, Filter, Download, MoreVertical, Edit2, Users, Eye, Shield, Trash2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { exportToCSV } from '../../utils/csvExport';

export default function AdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'view' | 'edit' | 'users' | null>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const availablePermissions = [
    { id: 'view_dashboard', label: 'View Dashboard' },
    { id: 'manage_users', label: 'Manage Users' },
    { id: 'manage_products', label: 'Manage Products' },
    { id: 'manage_orders', label: 'Manage Orders' },
    { id: 'view_roles', label: 'View Roles' },
    { id: 'manage_roles', label: 'Manage Roles' },
    { id: 'manage_support', label: 'Manage Support' },
    { id: 'manage_coupons', label: 'Manage Coupons' },
  ];

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/roles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setRoles(res.data.roles);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    if (filteredRoles.length === 0) return;
    const exportData = filteredRoles.map(r => ({
      ID: r.id,
      Name: r.name,
      Description: r.description || '',
      'Users Count': r.usersCount,
      'Is System': r.isSystem,
      'Created At': r.createdAt
    }));
    exportToCSV(exportData, 'roles_export');
  };

  const openEditModal = (role: any) => {
    setSelectedRole(role);
    setEditForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setActiveModal('edit');
  };

  const openUsersModal = async (role: any) => {
    setSelectedRole(role);
    setActiveModal('users');
    setRoleUsers([]);
    try {
      const res = await axios.get(`/api/admin/roles/${role.id}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setRoleUsers(res.data.users);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load assigned users');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await axios.put(`/api/admin/roles/${selectedRole.id}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success('Role updated successfully');
        setActiveModal(null);
        fetchRoles();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: any) => {
    if (role.isSystem) return toast.error("System roles cannot be deleted.");
    if (role.usersCount > 0) return toast.error("Cannot delete a role with assigned users.");
    
    if (window.confirm(`Are you sure you want to delete the ${role.name} role?`)) {
      try {
        const res = await axios.delete(`/api/admin/roles/${role.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
          toast.success('Role deleted successfully');
          fetchRoles();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  const togglePermission = (permId: string) => {
    setEditForm(prev => {
      if (prev.permissions.includes('all')) return prev; // Cannot toggle if has 'all'
      
      const newPerms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: newPerms };
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Roles & Permissions</h1>
          <p className="text-slate-500 mt-1">Manage system roles and their access levels.</p>
        </div>
        <button onClick={handleExport} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 w-full sm:w-auto justify-center">
          <Download size={18} />
          Export Data
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Role Name</th>
                <th className="px-6 py-4">Assigned Users</th>
                <th className="px-6 py-4">Permissions Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 animate-pulse">Loading roles...</td></tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                      {role.name}
                      {role.isSystem && <span title="System Role"><Shield size={14} className="text-primary" /></span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {role.usersCount} users
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {role.permissions.includes('all') ? 'Full Access' : `${role.permissions.length} Custom`}
                    </td>
                    <td className="px-6 py-4 text-right relative group/menu">
                      <button className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-10 top-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 flex flex-col overflow-hidden">
                        <button onClick={() => { setSelectedRole(role); setActiveModal('view'); }} className="flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 text-slate-700">
                          <Eye size={14} /> View Role
                        </button>
                        <button onClick={() => openEditModal(role)} className="flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 text-slate-700">
                          <Edit2 size={14} /> Edit Role
                        </button>
                        <button onClick={() => openUsersModal(role)} className="flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-50 text-slate-700">
                          <Users size={14} /> Manage Assigned Users
                        </button>
                        {!role.isSystem && (
                          <button onClick={() => handleDelete(role)} className="flex items-center gap-2 px-4 py-2 text-left hover:bg-danger/5 text-danger border-t border-slate-100">
                            <Trash2 size={14} /> Delete Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>Showing {filteredRoles.length} records</span>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {activeModal === 'view' && 'Role Details'}
                {activeModal === 'edit' && 'Edit Role'}
                {activeModal === 'users' && 'Assigned Users'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {activeModal === 'view' && selectedRole && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Role Name</p>
                    <p className="font-semibold text-slate-900">{selectedRole.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Description</p>
                    <p className="text-slate-900">{selectedRole.description || 'No description provided.'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Permissions</p>
                    {selectedRole.permissions.includes('all') ? (
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-medium text-sm rounded-full">Full System Access</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedRole.permissions.map((p: string) => (
                          <span key={p} className="inline-block px-3 py-1 bg-slate-100 text-slate-700 font-medium text-sm rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'edit' && selectedRole && (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Role Name</label>
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      disabled={selectedRole.isSystem}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                    <textarea 
                      value={editForm.description} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Permissions</label>
                    {selectedRole.name === 'SUPER_ADMIN' ? (
                      <div className="p-3 bg-primary/5 text-primary rounded-lg text-sm font-medium">
                        SUPER_ADMIN role must retain all permissions.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-lg">
                        {availablePermissions.map(perm => (
                          <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editForm.permissions.includes(perm.id) || editForm.permissions.includes('all')}
                              onChange={() => togglePermission(perm.id)}
                              disabled={editForm.permissions.includes('all')}
                              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-slate-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'users' && selectedRole && (
                <div>
                  <p className="text-sm text-slate-500 mb-4">Users assigned to <strong>{selectedRole.name}</strong></p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {roleUsers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No users assigned to this role.</p>
                    ) : (
                      roleUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
