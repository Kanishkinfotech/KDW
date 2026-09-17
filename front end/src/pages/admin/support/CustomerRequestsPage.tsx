import React, { useState, useEffect } from 'react';
import { 
  Users, Search, CheckCircle2, XCircle, ShieldCheck, Clock, 
  AlertTriangle, MessageSquare, Send, X, ExternalLink, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SupportLayout } from '../../../components/admin/support/SupportLayout';
import { SupportStatusBadge } from '../../../components/admin/support/SupportStatusBadge';

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'COMPLETED' | 'WAITING_FOR_CUSTOMER'>('COMPLETED');
  const [submittingReply, setSubmittingReply] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('adminAuth');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);

      const res = await fetch(`/api/admin/support/customer-requests?${q.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setRequests(json.data || []);
      } else {
        toast.error(json.message || 'Failed to load customer requests.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading customer requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      fetchRequests();
    }, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/support/customer-requests/${id}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ verificationMethod: 'LOGIN_CONFIRMED' })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Customer identity verified.');
        fetchRequests();
      } else {
        toast.error(json.message || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to verify identity.');
    }
  };

  const handleComplete = async (id: string, requestType: string) => {
    const actionTaken = prompt(`Enter fulfillment note for ${requestType}:`) || 'Fulfilled as requested';
    try {
      const res = await fetch(`/api/admin/support/customer-requests/${id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ actionTaken })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Customer request marked as completed.');
        fetchRequests();
      } else {
        toast.error(json.message || 'Error completing request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete request.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Mandatory rejection reason:');
    if (!reason || !reason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/support/customer-requests/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason: reason.trim() })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Customer request rejected.');
        fetchRequests();
      } else {
        toast.error(json.message || 'Rejection failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject request.');
    }
  };

  const openReplyModal = (req: any) => {
    setSelectedRequest(req);
    setReplyText('');
    setReplyStatus('COMPLETED');
    setReplyModalOpen(true);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!replyText.trim()) {
      toast.error('Please enter a reply message.');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/support/customer-requests/${selectedRequest.id}/reply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          message: replyText.trim(),
          status: replyStatus
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Reply dispatched to customer and visible on their portal.');
        setReplyModalOpen(false);
        setSelectedRequest(null);
        setReplyText('');
        fetchRequests();
      } else {
        toast.error(json.message || 'Failed to dispatch reply.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error sending reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const getCustomerName = (r: any) => {
    return r.customer?.name || r.ticket?.customerName || r.dataAccessedJson?.name || 'Customer';
  };

  const getCustomerEmail = (r: any) => {
    return r.customer?.email || r.ticket?.customerEmail || r.dataAccessedJson?.email || 'N/A';
  };

  const getSubject = (r: any) => {
    return r.ticket?.subject || r.dataAccessedJson?.subject || r.requestType.replace(/_/g, ' ');
  };

  const getMessage = (r: any) => {
    return r.ticket?.description || r.dataAccessedJson?.message || 'No additional message details provided.';
  };

  return (
    <SupportLayout
      title="Customer Requests & Support Inquiries"
      subtitle="Fulfill customer contact inquiries, support questions, GDPR personal data exports, and account requests."
      onRefresh={fetchRequests}
      isLoading={loading}
    >
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {['ALL', 'NEW', 'UNDER_REVIEW', 'WAITING_FOR_CUSTOMER', 'COMPLETED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === st
                ? 'bg-[#5b21b6] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Request / Subject</th>
                <th className="py-3.5 px-4">Inquiry Details</th>
                <th className="py-3.5 px-4">Identity Verification</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No customer requests found.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Inquiries submitted from the storefront Contact Support form will appear here.</p>
                  </td>
                </tr>
              ) : (
                requests.map(r => {
                  const custName = getCustomerName(r);
                  const custEmail = getCustomerEmail(r);
                  const subject = getSubject(r);
                  const msg = getMessage(r);
                  const orderNum = r.ticket?.order?.orderNumber || r.dataAccessedJson?.orderNumber;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{custName}</span>
                          {r.verificationStatus === 'VERIFIED' && (
                            <span title="Verified Customer"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /></span>
                          )}
                        </div>
                        <div className="text-[11px] font-normal text-slate-400">{custEmail}</div>
                        {orderNum && (
                          <div className="text-[10px] font-mono text-[#5b21b6] mt-0.5 font-bold">
                            Order #{orderNum}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#5b21b6] border border-purple-100 uppercase tracking-wider block truncate mb-1">
                          {r.requestType.replace(/_/g, ' ')}
                        </span>
                        <p className="font-semibold text-slate-800 text-xs truncate" title={subject}>
                          {subject}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed" title={msg}>
                          {msg}
                        </p>
                        {r.actionTaken && (
                          <div className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 truncate">
                            <span className="font-bold">Staff Note:</span> {r.actionTaken}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {r.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <SupportStatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(r.requestedAt || r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Reply button */}
                        <button
                          onClick={() => openReplyModal(r)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-[#5b21b6] hover:bg-[#6d28d9] rounded-lg shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          title="Reply directly to customer inquiry"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Reply</span>
                        </button>

                        {r.verificationStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => handleVerify(r.id)}
                            className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 cursor-pointer"
                          >
                            Verify
                          </button>
                        )}

                        {r.status !== 'COMPLETED' && r.status !== 'REJECTED' && (
                          <>
                            <button
                              onClick={() => handleComplete(r.id, r.requestType)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply to Customer Modal */}
      {replyModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5b21b6] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Reply to Customer Inquiry</h3>
                  <p className="text-[11px] text-slate-400">Response will be shown to the customer on the Contact Support page</p>
                </div>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inquiry Summary Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{getCustomerName(selectedRequest)}</span>
                <span className="text-slate-400 font-mono">{getCustomerEmail(selectedRequest)}</span>
              </div>
              <p className="font-semibold text-[#5b21b6]">{getSubject(selectedRequest)}</p>
              <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed font-sans max-h-36 overflow-y-auto">
                {getMessage(selectedRequest)}
              </p>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Response *
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your official support response to the customer..."
                  className="w-full p-3 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Request Status After Reply
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReplyStatus('COMPLETED')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      replyStatus === 'COMPLETED'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold">Mark as Completed</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Inquiry is fully resolved</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyStatus('WAITING_FOR_CUSTOMER')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      replyStatus === 'WAITING_FOR_CUSTOMER'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold">Waiting for Customer</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Customer feedback needed</p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-5 py-2 bg-[#5b21b6] hover:bg-[#6d28d9] text-white font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingReply ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SupportLayout>
  );
}
