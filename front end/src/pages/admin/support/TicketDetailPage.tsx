import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Send, User, Package, Clock, ShieldCheck, 
  RotateCcw, ArrowDownToLine, Key, MessageSquare, AlertTriangle, 
  CheckCircle2, AlertCircle, FileText, Check, ShieldAlert, Sparkles
} from 'lucide-react';
import { SupportStatusBadge, SupportPriorityBadge } from '../../../components/admin/support/SupportStatusBadge';
import { SlaTimerBadge } from '../../../components/admin/support/SlaTimerBadge';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  // Canned Responses
  const [cannedResponses, setCannedResponses] = useState<any[]>([]);
  const [selectedCannedId, setSelectedCannedId] = useState('');

  // Active Context Tab
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'ORDER' | 'DOWNLOAD' | 'LICENCE' | 'REFUND' | 'AUDIT'>('CUSTOMER');

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const [resTicket, resCanned] = await Promise.all([
        fetch(`/api/admin/support/tickets/${id}`, { credentials: 'include' }),
        fetch('/api/admin/support/canned-responses', { credentials: 'include' })
      ]);

      const jsonTicket = await resTicket.json();
      const jsonCanned = await resCanned.json();

      if (jsonTicket.success) setTicket(jsonTicket.ticket);
      if (jsonCanned.success) setCannedResponses(jsonCanned.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const endpoint = isInternalNote
        ? `/api/admin/support/tickets/${ticket.id}/note`
        : `/api/admin/support/tickets/${ticket.id}/reply`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          [isInternalNote ? 'note' : 'message']: replyMessage
        })
      });

      const json = await res.json();
      if (json.success) {
        setReplyMessage('');
        setIsInternalNote(false);
        fetchTicket();
      } else {
        alert(json.message || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) fetchTicket();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInsertCanned = (cannedId: string) => {
    setSelectedCannedId(cannedId);
    const canned = cannedResponses.find(c => c.id === cannedId);
    if (!canned) return;

    let text = canned.body;
    text = text.replace(/\{\{customer\.first_name\}\}/g, ticket.customerName?.split(' ')[0] || 'Customer');
    text = text.replace(/\{\{ticket\.number\}\}/g, ticket.ticketNumber);
    text = text.replace(/\{\{order\.number\}\}/g, ticket.order?.orderNumber || 'your order');
    text = text.replace(/\{\{product\.name\}\}/g, ticket.product?.name || 'purchased product');
    text = text.replace(/\{\{download\.link\}\}/g, `https://kanishkdigitalworld.com/account/orders`);

    setReplyMessage(text);
  };

  // Context Actions Handlers
  const handleResendDownloadLink = async () => {
    try {
      const res = await fetch('/api/admin/support/download/resend-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketId: ticket.id, customerEmail: ticket.customerEmail })
      });
      const json = await res.json();
      alert(json.message);
      fetchTicket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDownloadLimit = async () => {
    if (!window.confirm('Reset download attempt limit for this customer?')) return;
    try {
      const res = await fetch('/api/admin/support/download/reset-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketId: ticket.id, orderId: ticket.orderId, productId: ticket.productId })
      });
      const json = await res.json();
      alert(json.message);
      fetchTicket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetLicence = async () => {
    if (!window.confirm('Reset licence key activation counter for machine migration?')) return;
    try {
      const res = await fetch('/api/admin/support/licence/reset-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketId: ticket.id })
      });
      const json = await res.json();
      alert(json.message);
      fetchTicket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRefund = async () => {
    const reason = prompt('Confirmation reason for approving refund:') || 'Approved by support';
    try {
      const res = await fetch('/api/admin/support/refund/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketId: ticket.id, orderId: ticket.orderId, reason })
      });
      const json = await res.json();
      alert(json.message);
      fetchTicket();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Support Ticket Not Found</h2>
        <Link to="/admin/support/tickets" className="text-xs text-blue-600 font-bold mt-2 inline-block">
          &larr; Back to Ticket Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/support/tickets')}
              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-blue-600 text-xs">{ticket.ticketNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {ticket.type.replace(/_/g, ' ')}
                </span>
                <SupportPriorityBadge priority={ticket.priority} />
                <SupportStatusBadge status={ticket.status} />
              </div>
              <h1 className="text-lg font-black text-slate-900 mt-1">{ticket.subject}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SlaTimerBadge
              slaStatus={ticket.slaStatus}
              resolutionDueAt={ticket.slaRecord?.resolutionDueAt}
              firstResponseDueAt={ticket.slaRecord?.firstResponseDueAt}
              resolvedAt={ticket.resolvedAt}
            />

            {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
              </button>
            )}

            {ticket.status === 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange('CLOSED')}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Close Ticket
              </button>
            )}

            {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
              <button
                onClick={() => handleStatusChange('REOPENED')}
                className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reopen Ticket
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Conversation Thread & Reply Editor (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages Thread */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conversation History</h3>

            <div className="space-y-4">
              {(ticket.messages || []).map((msg: any) => {
                const isStaff = msg.senderType === 'AGENT' || msg.senderType === 'SYSTEM';
                const isInternal = msg.visibility === 'INTERNAL_NOTE';

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 transition-all ${
                      isInternal
                        ? 'bg-amber-50/75 border-amber-200 text-amber-950'
                        : isStaff
                        ? 'bg-blue-50/60 border-blue-100 text-slate-900'
                        : 'bg-slate-50 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-1.5">
                        {isInternal && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-200 text-amber-900 uppercase">
                            Staff Note
                          </span>
                        )}
                        <span>{msg.senderName || msg.sender?.name || (isStaff ? 'Staff Agent' : 'Customer')}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({msg.senderType})
                        </span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="whitespace-pre-line text-slate-700">{msg.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply & Canned Response Editor */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Reply</span>
                  {cannedResponses.length > 0 && (
                    <select
                      value={selectedCannedId}
                      onChange={e => handleInsertCanned(e.target.value)}
                      className="text-xs px-2.5 py-1 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                    >
                      <option value="">Insert Canned Response...</option>
                      {cannedResponses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    id="internal_note"
                    checked={isInternalNote}
                    onChange={e => setIsInternalNote(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor="internal_note" className="text-slate-600 font-semibold cursor-pointer">
                    Internal Note (Staff only)
                  </label>
                </div>
              </div>

              <textarea
                rows={4}
                required
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder={
                  isInternalNote
                    ? 'Add internal investigation notes, logs, or next actions...'
                    : 'Compose response to customer...'
                }
                className={`w-full text-xs px-3.5 py-2.5 border rounded-2xl focus:outline-hidden transition-all ${
                  isInternalNote
                    ? 'border-amber-300 bg-amber-50/30 focus:ring-2 focus:ring-amber-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                }`}
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isInternalNote ? '⚠️ Invisible to customer.' : 'Dispatched via support portal & email.'}
                </span>

                <button
                  type="submit"
                  disabled={sending || !replyMessage.trim()}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                    isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending...' : isInternalNote ? 'Save Note' : 'Send Customer Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Context Panels & One-Click Actions (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            {/* Context Sub-Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => setActiveTab('CUSTOMER')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'CUSTOMER' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => setActiveTab('ORDER')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'ORDER' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Order
              </button>
              <button
                onClick={() => setActiveTab('DOWNLOAD')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'DOWNLOAD' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Download
              </button>
              <button
                onClick={() => setActiveTab('LICENCE')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'LICENCE' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Licence
              </button>
              <button
                onClick={() => setActiveTab('REFUND')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'REFUND' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Refund
              </button>
            </div>

            {/* Customer Context Tab */}
            {activeTab === 'CUSTOMER' && (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer Name</span>
                  <span className="font-bold text-slate-900">{ticket.customerName || ticket.user?.name || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address</span>
                  <span className="font-mono text-slate-700">{ticket.customerEmail || ticket.user?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Account Status</span>
                  <span className="font-semibold text-emerald-700">{ticket.isGuest ? 'Guest Purchase' : 'Registered Member'}</span>
                </div>
                {ticket.user?.orders && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Recent Orders</span>
                    <div className="space-y-1">
                      {ticket.user.orders.map((o: any) => (
                        <div key={o.id} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600">{o.orderNumber}</span>
                          <span className="font-bold text-slate-800">${o.totalAmount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Context Tab */}
            {activeTab === 'ORDER' && (
              <div className="space-y-3 text-xs">
                {ticket.order ? (
                  <>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Order Number</span>
                      <span className="font-mono font-bold text-slate-900">{ticket.order.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Order Amount</span>
                      <span className="font-bold text-emerald-700">${ticket.order.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Order Status</span>
                      <span className="font-semibold text-blue-600">{ticket.order.orderStatus}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Purchased Products</span>
                      {(ticket.order.orderItems || []).map((it: any) => (
                        <div key={it.id} className="p-2 bg-slate-50 rounded-xl text-[11px] font-semibold text-slate-800">
                          {it.product?.name || 'Product'} &bull; v{it.product?.version || '1.0'}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-slate-400">No linked order for this ticket.</div>
                )}
              </div>
            )}

            {/* Download Context Tab */}
            {activeTab === 'DOWNLOAD' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-800 block">Download Actions</span>
                <button
                  onClick={handleResendDownloadLink}
                  className="w-full py-2 px-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all text-left flex items-center justify-between"
                >
                  <span>Resend Secure Download Link</span>
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetDownloadLimit}
                  className="w-full py-2 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all text-left flex items-center justify-between"
                >
                  <span>Reset Download Attempts</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Licence Context Tab */}
            {activeTab === 'LICENCE' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-800 block">Licence Actions</span>
                <button
                  onClick={handleResetLicence}
                  className="w-full py-2 px-3 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all text-left flex items-center justify-between"
                >
                  <span>Reset Activation Slots</span>
                  <Key className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Refund Context Tab */}
            {activeTab === 'REFUND' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-800 block">Refund Evaluation</span>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-900 font-bold">Policy Check</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      Eligible
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800">
                    Order eligible for financial reversal upon supervisor confirmation.
                  </p>
                </div>

                <button
                  onClick={handleApproveRefund}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all text-center"
                >
                  Approve Refund
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
