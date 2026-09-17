import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Send, CheckCircle2, PhoneCall, AlertCircle, ArrowLeft,
  Mail, Clock, Sparkles, HelpCircle, Package, ShieldCheck,
  MessageSquare, CornerDownRight, RefreshCw, UserCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General Support & Guidance',
  DOWNLOAD_ISSUE: 'Digital Download & File Access',
  LICENCE_ISSUE: 'Licensing & Commercial Rights',
  PAYMENT_QUERY: 'Payments, UPI & Invoices',
  REFUND_REQUEST: 'Refund or Replacement Request'
};

export default function ContactSupportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [queryType, setQueryType] = useState('GENERAL');
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || searchParams.get('orderId') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || (searchParams.get('productName') ? 'Support for ' + searchParams.get('productName') : ''));
  const [message, setMessage] = useState('');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [sending, setSending] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);

  // Inquiries and Replies State
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [searchInquiryEmail, setSearchInquiryEmail] = useState('');

  // Customer Follow-up Reply State
  const [activeReplyTicketId, setActiveReplyTicketId] = useState<string | null>(null);
  const [customerReplyText, setCustomerReplyText] = useState('');
  const [sendingCustomerReply, setSendingCustomerReply] = useState(false);

  // Sync user details if authenticated
  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.email && !email) {
      setEmail(user.email);
      setSearchInquiryEmail(user.email);
    }
  }, [user]);

  // Fetch customer orders for quick dropdown association
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingOrders(true);
      axios.get('/api/orders/my-orders')
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.orders)) {
            setUserOrders(res.data.orders);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingOrders(false));
    }
  }, [isAuthenticated]);

  const fetchMyInquiries = async (lookupEmail?: string) => {
    const targetEmail = lookupEmail || email || searchInquiryEmail || user?.email;
    if (!isAuthenticated && !targetEmail) return;

    setLoadingInquiries(true);
    try {
      const q = new URLSearchParams();
      if (targetEmail) q.set('email', targetEmail.trim());

      const res = await axios.get(`/api/support/my-requests?${q.toString()}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setMyInquiries(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load submitted inquiries:', err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated || user?.email) {
      fetchMyInquiries(user?.email);
    }
  }, [isAuthenticated, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please complete Name, Email, and Message fields.');
      return;
    }

    const defaultSubject = `${CATEGORY_LABELS[queryType] || 'Support'} Inquiry from ${name.trim()}`;
    const finalSubject = subject.trim() || defaultSubject;

    setSending(true);
    try {
      const res = await axios.post('/api/support/contact', {
        name: name.trim(),
        email: email.trim(),
        queryType,
        orderNumber: orderNumber.trim() || undefined,
        subject: finalSubject,
        message: message.trim()
      });

      if (res.data?.success) {
        setTicketResult(res.data);
        toast.success('Support inquiry submitted successfully!');
        // Refresh inquiry list immediately
        fetchMyInquiries(email.trim());
      } else {
        toast.error(res.data?.message || 'Failed to submit inquiry');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error connecting to support service.');
    } finally {
      setSending(false);
    }
  };

  const handleCustomerReply = async (ticketId: string) => {
    if (!customerReplyText.trim()) {
      toast.error('Please enter your reply message.');
      return;
    }
    setSendingCustomerReply(true);
    try {
      const res = await axios.post(`/api/support/tickets/${ticketId}/reply`, {
        message: customerReplyText.trim(),
        name: name.trim() || user?.name || 'Customer',
        email: email.trim() || user?.email
      });
      if (res.data?.success) {
        toast.success('Reply sent to support staff!');
        setCustomerReplyText('');
        setActiveReplyTicketId(null);
        fetchMyInquiries(email.trim() || user?.email);
      } else {
        toast.error(res.data?.message || 'Failed to send reply');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error sending reply to ticket');
    } finally {
      setSendingCustomerReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171325] font-sans pb-24">
      <SEO 
        title="Contact Support | KDW" 
        description="Submit a verified inquiry to KDW customer support for help with downloads, payments, and licensing." 
      />

      {/* Top Header */}
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0] bg-white">
        <div className="max-w-[800px] mx-auto space-y-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/support" className="hover:text-[#5b21b6] transition-colors">Support Center</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">Contact Support</span>
          </nav>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/70 text-[#5b21b6] text-[10px] font-bold tracking-[0.2em] uppercase">
              <PhoneCall className="w-3.5 h-3.5 text-[#7c3aed]" />
              <span>DIRECT RESOLUTION QUEUE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171325]">
              Contact Support
            </h1>
            <p className="text-sm text-slate-600 font-sans">
              Our support team is here to assist with digital file access, licensing questions, and order issues.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Main Support Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e2e8f0] shadow-sm space-y-8">
          
          {ticketResult ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-[#171325]">
                  Support Inquiry Registered
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-sans">
                  Your ticket has been generated under ticket number{' '}
                  <strong className="font-mono text-[#5b21b6] font-bold px-2 py-0.5 bg-[#ede9fe] rounded-md">{ticketResult.ticketNumber}</strong>.
                  A confirmation has been sent to <strong>{email}</strong>.
                </p>
                {ticketResult.expectedResponseTime && (
                  <p className="text-xs text-slate-500 font-mono">
                    Expected initial response target: {ticketResult.expectedResponseTime}
                  </p>
                )}
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#submitted-inquiries"
                  className="px-6 py-2.5 bg-[#5b21b6] text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl shadow-xs hover:bg-[#6d28d9] transition-all"
                >
                  View Responses Below &darr;
                </a>
                <button
                  onClick={() => {
                    setTicketResult(null);
                    setSubject('');
                    setMessage('');
                  }}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold font-sans rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Inquiry Category *
                  </label>
                  <select
                    value={queryType}
                    onChange={e => setQueryType(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none cursor-pointer"
                  >
                    <option value="GENERAL">General Support & Guidance</option>
                    <option value="DOWNLOAD_ISSUE">Digital Download & File Access</option>
                    <option value="LICENCE_ISSUE">Licensing & Commercial Rights</option>
                    <option value="PAYMENT_QUERY">Payments, UPI & Invoices</option>
                    <option value="REFUND_REQUEST">Refund or Replacement Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Associated Order (Optional)
                  </label>
                  {userOrders.length > 0 ? (
                    <select
                      value={orderNumber}
                      onChange={e => setOrderNumber(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select an Order --</option>
                      {userOrders.map(o => (
                        <option key={o.id} value={o.orderNumber}>
                          {o.orderNumber} ({new Date(o.createdAt).toLocaleDateString()}) - ₹{o.totalAmount}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={e => setOrderNumber(e.target.value)}
                      placeholder="e.g. KDW-8821"
                      className="w-full text-xs px-3.5 py-2.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-mono focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief summary of your request (e.g. Cannot access drive files)"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Message / Details *
                </label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Please provide any relevant details or questions regarding your order, files, or requirements..."
                  className="w-full text-xs p-3.5 bg-[#faf9f7] border border-[#e2e8f0] focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] rounded-xl font-sans focus:outline-none resize-y"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5b21b6]" />
                  <span>Sub-12h standard response target</span>
                </p>

                <button
                  type="submit"
                  disabled={sending}
                  className="px-8 py-3 bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {sending ? 'Submitting...' : 'Submit Ticket'} <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section: Your Submitted Inquiries & Support Responses */}
        <div id="submitted-inquiries" className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-purple-50 text-[#5b21b6] rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-serif font-bold text-[#171325]">
                  Your Submitted Inquiries &amp; Support Responses
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Review your submitted requests and the direct replies provided by our support team.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={searchInquiryEmail}
                    onChange={e => setSearchInquiryEmail(e.target.value)}
                    placeholder="Enter email to check"
                    className="text-xs px-3 py-1.5 bg-[#faf9f7] border border-slate-200 rounded-xl font-sans focus:outline-none focus:border-[#5b21b6]"
                  />
                  <button
                    onClick={() => fetchMyInquiries(searchInquiryEmail)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Check
                  </button>
                </div>
              )}
              <button
                onClick={() => fetchMyInquiries()}
                disabled={loadingInquiries}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                title="Refresh replies"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingInquiries ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loadingInquiries ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5b21b6] mb-2" />
              <p className="text-xs">Checking for inquiries and staff responses...</p>
            </div>
          ) : myInquiries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-xs text-slate-600">No support inquiries found yet.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                When you submit a support form above, your ticket and all administrative replies will appear in this thread.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myInquiries.map((tkt) => {
                const agentMessages = (tkt.messages || []).filter((m: any) => m.senderType === 'AGENT');
                const actionTaken = tkt.customerRequest?.actionTaken;
                const hasReply = agentMessages.length > 0 || !!actionTaken;

                return (
                  <div 
                    key={tkt.id} 
                    className="border border-slate-200/90 rounded-2xl p-5 bg-[#faf9f7]/50 hover:bg-[#faf9f7] transition-all space-y-4 shadow-2xs"
                  >
                    {/* Inquiry Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#5b21b6] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            {tkt.ticketNumber}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {tkt.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Submitted on {new Date(tkt.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {tkt.order?.orderNumber && (
                            <>
                              <span>&bull;</span>
                              <span className="font-mono font-medium text-slate-700">Order #{tkt.order.orderNumber}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {tkt.status === 'RESOLVED' || tkt.status === 'CLOSED' || tkt.customerRequest?.status === 'COMPLETED' ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        ) : tkt.status === 'WAITING_FOR_CUSTOMER' || tkt.customerRequest?.status === 'WAITING_FOR_CUSTOMER' ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Staff Replied - Action Needed
                          </span>
                        ) : hasReply ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-[#5b21b6] border border-purple-200 inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> In Discussion
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Queued for Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Question */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Your Query
                      </p>
                      <p className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/70 leading-relaxed font-sans whitespace-pre-wrap">
                        {tkt.description}
                      </p>
                    </div>

                    {/* Admin / Staff Reply Card */}
                    {hasReply ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5b21b6]">
                          <CornerDownRight className="w-4 h-4" />
                          <span>Support Staff Official Response</span>
                        </div>

                        {agentMessages.map((msg: any) => (
                          <div 
                            key={msg.id}
                            className="bg-gradient-to-br from-purple-50/90 to-indigo-50/50 border border-purple-200/90 rounded-2xl p-4 space-y-2 shadow-xs"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 font-bold text-[#5b21b6]">
                                <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                                <span>{msg.senderName || 'Support Agent'}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-purple-200/60 text-purple-800 rounded font-semibold">Staff</span>
                              </div>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {new Date(msg.sentAt || msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                        ))}

                        {agentMessages.length === 0 && actionTaken && (
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 rounded-2xl p-4 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Staff Resolution Note
                              </span>
                              <span className="text-emerald-600 font-mono text-[10px]">
                                {tkt.customerRequest?.completedAt ? new Date(tkt.customerRequest.completedAt).toLocaleDateString() : 'Updated'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 font-sans leading-relaxed">
                              {actionTaken}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-100/70 border border-dashed border-slate-300 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Awaiting Support Team response. An agent will review your inquiry shortly.</span>
                      </div>
                    )}

                    {/* Customer Follow-up Reply Box */}
                    {tkt.status !== 'CLOSED' && (
                      <div className="pt-2 border-t border-slate-200/60">
                        {activeReplyTicketId === tkt.id ? (
                          <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs">
                            <label className="block text-xs font-bold text-slate-700">
                              Send a Follow-up Message
                            </label>
                            <textarea
                              rows={3}
                              value={customerReplyText}
                              onChange={e => setCustomerReplyText(e.target.value)}
                              placeholder="Type additional details or response for the support agent..."
                              className="w-full text-xs p-3 bg-[#faf9f7] border border-slate-200 rounded-xl focus:outline-none focus:border-[#5b21b6]"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReplyTicketId(null);
                                  setCustomerReplyText('');
                                }}
                                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomerReply(tkt.id)}
                                disabled={sendingCustomerReply}
                                className="px-4 py-1.5 bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                {sendingCustomerReply ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Send Follow-up</span>
                                    <Send className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyTicketId(tkt.id);
                              setCustomerReplyText('');
                            }}
                            className="text-xs font-bold text-[#5b21b6] hover:text-[#4c1d95] inline-flex items-center gap-1.5 cursor-pointer py-0.5"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>Reply or add information to this inquiry</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
