import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ShieldCheck, RefreshCw, User, Briefcase, Phone, Globe, Edit2, Save, X } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const StaffListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users/staff', { withCredentials: true });
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load staff profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSaveProfile = async () => {
    if (!editingStaff) return;
    try {
      setSaving(true);
      const res = await axios.patch(
        `/api/admin/users/${editingStaff.userId}/profile`,
        {
          department: editingStaff.department,
          team: editingStaff.team,
          timezone: editingStaff.timezone,
          phone: editingStaff.phone,
          employeeReference: editingStaff.employeeReference
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setEditingStaff(null);
        fetchStaff();
      }
    } catch (err) {
      toast.error('Failed to update staff profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchStaff} isLoading={loading} />

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Internal Staff & Operational Directory
          </h2>
          <p className="text-xs text-slate-400">Departmental organizational chart, team assignments, and employee references.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-8 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
              Loading staff profiles...
            </div>
          ) : staff.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500">
              No staff profiles found.
            </div>
          ) : (
            staff.map((s) => {
              const isEditing = editingStaff?.id === s.id;
              const current = isEditing ? editingStaff : s;
              return (
                <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                        {s.user?.name?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">{s.user?.name}</h3>
                        <span className="text-[10px] text-slate-400">{s.user?.email}</span>
                      </div>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => setEditingStaff({ ...s })}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Department</label>
                        <input
                          type="text"
                          value={current.department}
                          onChange={(e) => setEditingStaff({ ...current, department: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Team</label>
                        <input
                          type="text"
                          value={current.team}
                          onChange={(e) => setEditingStaff({ ...current, team: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingStaff(null)}
                          className="px-2.5 py-1 bg-slate-800 text-slate-400 text-[11px] rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Department:</span>
                        <strong className="text-slate-200">{s.department}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Team:</span>
                        <strong className="text-blue-400">{s.team}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Employee Ref:</span>
                        <span className="font-mono text-slate-300">{s.employeeReference || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Timezone:</span>
                        <span className="text-slate-400">{s.timezone}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default StaffListPage;
