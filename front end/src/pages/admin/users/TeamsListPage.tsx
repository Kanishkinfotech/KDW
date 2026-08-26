import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Layers, Users, RefreshCw, Briefcase, Shield } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const TeamsListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users/staff', { withCredentials: true });
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const departments = [
    { name: 'MANAGEMENT', desc: 'Store executive oversight and emergency platform administration' },
    { name: 'SUPPORT', desc: 'Customer ticketing, download issues, and licence support' },
    { name: 'FINANCE', desc: 'Payment auditing, tax compliance, and refunds' },
    { name: 'CATALOG', desc: 'Product listings, bundle curation, and Drive file mapping' },
    { name: 'MARKETING', desc: 'Campaign broadcasting, discount vouchers, and banners' },
    { name: 'ENGINEERING', desc: 'Infrastructure telemetry, Redis cache, and database reliability' }
  ];

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchStaff} isLoading={loading} />

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Departments & Functional Teams
          </h2>
          <p className="text-xs text-slate-400">Departmental breakdown with team member rosters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const members = staff.filter((s) => s.department === dept.name);
            return (
              <div key={dept.name} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {members.length} Members
                  </span>
                </div>
                <p className="text-xs text-slate-400">{dept.desc}</p>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned Personnel</span>
                  {members.length === 0 ? (
                    <span className="text-[11px] text-slate-600 italic">No staff assigned</span>
                  ) : (
                    members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs text-slate-300">
                        <span>{m.user?.name}</span>
                        <span className="text-[10px] text-slate-500">{m.team}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default TeamsListPage;
