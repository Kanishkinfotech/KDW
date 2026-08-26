import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserCheck, RefreshCw, Plus, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UsersLayout } from '../../../components/admin/users/UsersLayout';

export const AccessReviewsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [recommendation, setRecommendation] = useState('MAINTAIN_ACCESS');
  const [actionTaken, setActionTaken] = useState('APPROVED_NO_CHANGE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/users/access-reviews', { withCredentials: true }),
        axios.get('/api/admin/users', { withCredentials: true })
      ]);

      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
        if (usersRes.data.data.length > 0) {
          setSelectedUserId(usersRes.data.data[0].id);
        }
      }
    } catch (err) {
      toast.error('Failed to load access reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConductReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axios.post(
        '/api/admin/users/access-reviews',
        {
          targetUserId: selectedUserId,
          recommendation,
          actionTaken,
          notes
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowModal(false);
        setNotes('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit access review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <UsersLayout onRefresh={fetchData} isLoading={loading} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Quarterly Staff Access Governance Reviews
            </h2>
            <p className="text-xs text-slate-400">Regular audits to identify inactive accounts, excessive permissions, or missing MFA.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Conduct Access Review
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="px-4 py-3">Review Date</th>
                <th className="px-4 py-3">Reviewed Staff Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3">Action Taken</th>
                <th className="px-4 py-3">Auditor Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(r.reviewDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {r.targetUserEmail}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-400">
                      {r.targetUserRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {r.recommendation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {r.actionTaken}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {r.notes || 'Certified nominal.'}
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
              <UserCheck className="w-4 h-4 text-blue-400" />
              Conduct Security Access Review
            </h3>

            <form onSubmit={handleConductReview} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Personnel</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Governance Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="MAINTAIN_ACCESS">Maintain Current Access</option>
                  <option value="REDUCE_PERMISSIONS">Reduce Unused Permissions</option>
                  <option value="SUSPEND_ACCOUNT">Suspend Inactive Account</option>
                  <option value="ENROLL_MFA">Require Immediate MFA Enrollment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Action Executed</label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="APPROVED_NO_CHANGE">Approved (No Change Required)</option>
                  <option value="PERMISSIONS_REDUCED">Permissions Reduced</option>
                  <option value="USER_SUSPENDED">User Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Auditor Notes</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Verified active employee status and appropriate scoping."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
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
                  {submitting ? 'Submitting...' : 'Log Governance Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AccessReviewsPage;
