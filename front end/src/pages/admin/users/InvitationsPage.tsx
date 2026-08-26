import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Mail, RefreshCw, Plus, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const InvitationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<any[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Support Agent');
  const [department, setDepartment] = useState('SUPPORT');
  const [team, setTeam] = useState('CORE');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      // For demonstration, we fetch staff users to check status
      const res = await axios.get('/api/admin/users', { withCredentials: true });
      if (res.data.success) {
        // Mock / DB mapping
        setInvitations([
          {
            id: 'inv_01',
            email: 'sarah.ops@kanishkdigitalworld.com',
            roleName: 'Developer/Ops',
            department: 'ENGINEERING',
            team: 'CORE',
            expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
            status: 'PENDING',
            invitedByName: 'Super Admin'
          }
        ]);
      }
    } catch (err) {
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axios.post(
        '/api/admin/users/invite',
        { email, roleName, department, team },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowModal(false);
        setEmail('');
        fetchInvitations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchInvitations} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Staff Account Invitations
            </h2>
            <p className="text-xs text-slate-400">Cryptographically hashed one-time enrollment links with 48-hour expirations.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Send New Invitation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Recipient Work Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Department & Team</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires At</th>
                <th className="px-4 py-3">Invited By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">
                    {inv.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-400">
                      {inv.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {inv.department} • {inv.team}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(inv.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {inv.invitedByName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Invite Colleague to KDW Admin Panel
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@kanishkdigitalworld.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pre-Assigned Role</label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Support Agent">Support Agent</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Catalog Manager">Catalog Manager</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Developer/Ops">Developer/Ops</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  {submitting ? 'Generating...' : 'Send Secure Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InvitationsPage;
