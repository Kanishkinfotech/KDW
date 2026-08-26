import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Smartphone, RefreshCw, LogOut, ShieldCheck, AlertCircle, Laptop } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const SessionsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users/sessions?isRevoked=false', { withCredentials: true });
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string, email: string) => {
    if (!window.confirm(`Revoke session for ${email}?`)) return;

    try {
      const res = await axios.post(`/api/admin/users/sessions/${id}/revoke`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSessions();
      }
    } catch (err) {
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllUser = async (userId: string, email: string) => {
    if (!window.confirm(`Force terminate ALL sessions for ${email}?`)) return;

    try {
      const res = await axios.post(`/api/admin/users/${userId}/revoke-all-sessions`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSessions();
      }
    } catch (err) {
      toast.error('Failed to revoke user sessions');
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchSessions} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            Active Administrative Sessions
          </h2>
          <p className="text-xs text-slate-400">Live logged-in devices and tokens. Remote revocation immediately blocks further API calls.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">User & Identity</th>
                <th className="px-4 py-3">Device & User-Agent</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">MFA Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
                    Scanning active session tokens...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No active sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{s.userName}</div>
                      <div className="text-[11px] text-slate-400">{s.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                      {s.deviceReference || s.userAgent || 'Chrome on Windows'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {s.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-4 py-3">
                      {s.mfaVerified ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          PASSWORD ONLY
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(s.lastActiveAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRevoke(s.id, s.userEmail)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-xs font-semibold transition"
                        >
                          Revoke
                        </button>
                        <button
                          onClick={() => handleRevokeAllUser(s.userId, s.userEmail)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
                        >
                          Revoke All
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SessionsPage;
