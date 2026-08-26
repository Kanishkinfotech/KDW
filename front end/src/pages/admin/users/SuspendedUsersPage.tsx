import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserX, RefreshCw, UserCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const SuspendedUsersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  const fetchSuspended = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users?status=SUSPENDED', { withCredentials: true });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load suspended users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspended();
  }, []);

  const handleActivate = async (id: string, email: string) => {
    try {
      const res = await axios.post(`/api/admin/users/${id}/activate`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSuspended();
      }
    } catch (err) {
      toast.error('Failed to activate account');
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchSuspended} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-400" />
            Suspended Staff & Administrator Accounts
          </h2>
          <p className="text-xs text-slate-400">Accounts temporarily blocked from logging in or executing privileged API actions.</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
            Scanning directory for suspended accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Zero Suspended Accounts</h4>
            <p className="text-xs text-slate-500">All registered administrative staff are in good standing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      SUSPENDED
                    </span>
                    <span className="font-bold text-white text-xs">{u.name}</span>
                    <span className="text-slate-400 text-xs">({u.email})</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Role: <strong className="text-blue-400">{u.role}</strong> • Reason: <span className="text-rose-300">{u.blockReason || 'Administrative suspension'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleActivate(u.id, u.email)}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Reactivate Account
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default SuspendedUsersPage;
