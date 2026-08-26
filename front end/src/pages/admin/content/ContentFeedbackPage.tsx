import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Star, Search, Filter, AlertTriangle, 
  CheckCircle2, UserCheck, CornerDownRight, ShieldCheck, 
  Clock, ShieldAlert, ArrowUpRight, Send
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Slide-over / Details Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replying, setReplying] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (typeFilter !== 'ALL') q.set('type', typeFilter);
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (priorityFilter !== 'ALL') q.set('priority', priorityFilter);
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/content/feedback?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setFeedbackList(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [typeFilter, statusFilter, priorityFilter, searchTerm]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage || !selectedItem) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/content/feedback/${selectedItem.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyMessage, isInternalNote })
      });
      const json = await res.json();
      if (json.success) {
        setReplyMessage('');
        setSelectedItem(json.feedback);
        fetchFeedback();
      } else {
        alert(json.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/content/feedback/${id}/resolve`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        if (selectedItem?.id === id) setSelectedItem(json.feedback);
        fetchFeedback();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModerateReview = async (id: string, status: string) => {
    const reason = prompt(`Reason for setting review status to ${status}:`) || 'Moderation decision';
    try {
      const res = await fetch(`/api/admin/content/feedback/${id}/moderate-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, reason })
      });
      const json = await res.json();
      if (json.success) {
        if (selectedItem?.id === id) setSelectedItem(json.feedback);
        fetchFeedback();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="Customer Feedback & Review Moderation"
      subtitle="Triage bug reports, download issues, customer reviews, and coordinate staff resolution workflows."
      onRefresh={fetchFeedback}
      isLoading={loading}
    >
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search feedback or customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Feedback Types</option>
            <option value="PRODUCT_REVIEW">Public Review</option>
            <option value="DOWNLOAD_ISSUE">Download Issue</option>
            <option value="BUG_REPORT">Bug Report</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="LICENCE_ISSUE">Licence Issue</option>
            <option value="GENERAL_FEEDBACK">General Feedback</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting on Customer</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {feedbackList.length} feedback items
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Customer & Message</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {feedbackList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No feedback records match current filters.
                  </td>
                </tr>
              ) : (
                feedbackList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                      <div className="text-slate-600 line-clamp-1 mt-0.5">{item.message}</div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{item.customerName} ({item.customerEmail})</span>
                        {item.rating && (
                          <span className="flex items-center text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-500 mr-0.5" /> {item.rating}/5
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.feedbackType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        item.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ContentStatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.assignedToName || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                      >
                        Inspect & Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Resolution Slide-over Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Feedback Ticket</span>
                  <h2 className="text-base font-bold text-slate-900">{selectedItem.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 p-2"
                >
                  Close
                </button>
              </div>

              {/* Customer & Ticket Info */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block font-bold">Customer</span>
                    <span className="font-semibold text-slate-800">{selectedItem.customerName}</span>
                    <span className="text-slate-500 block">{selectedItem.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Classification</span>
                    <span className="font-semibold text-slate-800">{selectedItem.feedbackType}</span>
                    <span className="text-slate-500 block">Priority: {selectedItem.priority}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block font-bold">Customer Message</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">{selectedItem.message}</p>
                </div>
              </div>

              {/* Moderation Controls for Public Reviews */}
              {selectedItem.isPublicReview && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-xs">
                  <span className="font-bold text-purple-900 block">Public Review Moderation</span>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-700">Current Status: <strong>{selectedItem.moderationStatus}</strong></span>
                    <button
                      onClick={() => handleModerateReview(selectedItem.id, 'APPROVED')}
                      className="px-2.5 py-1 font-bold text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-300"
                    >
                      Approve Review
                    </button>
                    <button
                      onClick={() => handleModerateReview(selectedItem.id, 'REJECTED')}
                      className="px-2.5 py-1 font-bold text-rose-700 bg-white hover:bg-rose-50 rounded-lg border border-rose-300"
                    >
                      Reject Review
                    </button>
                  </div>
                </div>
              )}

              {/* Conversation History / Internal Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Activity & Notes</h4>
                {((selectedItem.internalNotes as any[]) || []).map((note, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs">
                    <div className="font-bold text-amber-900 flex items-center justify-between">
                      <span>Internal Note by {note.author}</span>
                      <span className="text-[10px] text-amber-700">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{note.note}</p>
                  </div>
                ))}

                {((selectedItem.replies as any[]) || []).map((rep, idx) => (
                  <div key={idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs">
                    <div className="font-bold text-blue-900 flex items-center justify-between">
                      <span>Reply from {rep.sender}</span>
                      <span className="text-[10px] text-blue-700">{new Date(rep.sentAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{rep.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply / Resolve Box */}
            <form onSubmit={handleReplySubmit} className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Add Response or Internal Note</label>
                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={isInternalNote}
                    onChange={e => setIsInternalNote(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor="internal" className="text-slate-600">Internal Note (Staff only)</label>
                </div>
              </div>

              <textarea
                rows={3}
                required
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder={isInternalNote ? 'Add internal observation or escalation note...' : 'Draft reply to customer...'}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />

              <div className="flex items-center justify-between">
                {selectedItem.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => handleResolve(selectedItem.id)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all"
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  type="submit"
                  disabled={replying}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> {isInternalNote ? 'Save Note' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
