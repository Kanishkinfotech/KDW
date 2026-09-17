import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft as ArrowLeftIcon,
  User as UserIcon,
  Clock as ClockIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle2 as CheckCircleIcon,
  Lock as LockIcon,
  Send as SendIcon,
  RotateCw as RefreshIcon,
  Package as PackageIcon,
  ShoppingBag as OrderIcon,
  ExternalLink as ExternalLinkIcon,
  MessageSquare as MessageSquareIcon,
  Shield as ShieldIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import { adminTicketsApi } from '../../api/adminTickets.api';
import type {
  AdminTicket,
  TicketAgent,
  TicketMessageItem
} from '../../api/adminTickets.api';

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<AdminTicket | null>(null);
  const [agents, setAgents] = useState<TicketAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply Composer State
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Control Mutation States
  const [isMutatingStatus, setIsMutatingStatus] = useState(false);
  const [isMutatingPriority, setIsMutatingPriority] = useState(false);
  const [isMutatingAssignee, setIsMutatingAssignee] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Ticket Data
  const loadTicket = useCallback(async () => {
    if (!id) return;
    try {
      const res = await adminTicketsApi.getTicketById(id);
      if (res.success && res.ticket) {
        setTicket(res.ticket);
      } else {
        toast.error('Ticket not found');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load ticket workspace');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load Agents List
  const loadAgents = useCallback(async () => {
    try {
      const res = await adminTicketsApi.getAgents();
      if (res.success && res.agents) {
        setAgents(res.agents);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTicket();
    loadAgents();
  }, [loadTicket, loadAgents]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length]);

  // Handle Send Reply / Add Note
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyMessage.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const res = await adminTicketsApi.replyTicket(ticket.id, {
        message: replyMessage.trim(),
        isInternal: isInternalNote
      });

      if (res.success) {
        toast.success(isInternalNote ? 'Internal note added' : 'Reply sent to customer');
        setReplyMessage('');
        setIsInternalNote(false);
        // Refresh ticket authoritative state
        await loadTicket();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit message');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Status Mutation
  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || isMutatingStatus) return;
    setIsMutatingStatus(true);
    try {
      const res = await adminTicketsApi.updateStatus(ticket.id, newStatus);
      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
        await loadTicket();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsMutatingStatus(false);
    }
  };

  // Handle Priority Mutation
  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket || isMutatingPriority) return;
    setIsMutatingPriority(true);
    try {
      const res = await adminTicketsApi.updatePriority(ticket.id, newPriority);
      if (res.success) {
        toast.success(`Priority updated to ${newPriority}`);
        await loadTicket();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update priority');
    } finally {
      setIsMutatingPriority(false);
    }
  };

  // Handle Assignment Mutation
  const handleAssigneeChange = async (agentId: string) => {
    if (!ticket || isMutatingAssignee) return;
    setIsMutatingAssignee(true);
    try {
      const targetId = agentId === 'unassigned' ? null : agentId;
      const res = await adminTicketsApi.assignTicket(ticket.id, targetId);
      if (res.success) {
        toast.success(res.message || 'Assignment updated');
        await loadTicket();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update assignment');
    } finally {
      setIsMutatingAssignee(false);
    }
  };

  // Status mapping helper for select value
  const getStatusSelectValue = (statusStr: string) => {
    const s = String(statusStr || '').toUpperCase();
    if (s === 'OPEN' || s === 'NEW') return 'open';
    if (s.includes('WAITING') || s.includes('PENDING') || s === 'IN_PROGRESS' || s === 'UNDER_REVIEW') return 'pending';
    if (s === 'RESOLVED') return 'resolved';
    if (s === 'CLOSED') return 'closed';
    return s.toLowerCase();
  };

  // Priority mapping helper for select value
  const getPrioritySelectValue = (priorityStr: string) => {
    const p = String(priorityStr || '').toUpperCase();
    if (p === 'URGENT' || p === 'CRITICAL') return 'urgent';
    if (p === 'HIGH') return 'high';
    if (p === 'NORMAL' || p === 'MEDIUM') return 'normal';
    return 'low';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading ticket workspace...</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangleIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Ticket not found</h2>
        <p className="text-xs text-slate-500">
          The requested ticket does not exist or you may not have authorization to view it.
        </p>
        <button
          onClick={() => navigate('/admin/tickets')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Return to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <SEO title={`${ticket.ticketNumber} — ${ticket.subject} | KDW Admin`} description="Support Ticket Detail" />

      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/tickets')}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Back to Tickets Queue"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs text-slate-400">
                Opened on {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-1 line-clamp-1">
              {ticket.subject}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={loadTicket}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh ticket"
          >
            <RefreshIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2-Column Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Description, Thread & Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Inquiry Original Description */}
          {ticket.description && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <MessageSquareIcon className="w-4 h-4 text-blue-600" />
                <span>Customer Initial Inquiry</span>
              </div>
              <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal whitespace-pre-wrap break-words bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                {ticket.description}
              </div>
            </div>
          )}

          {/* Messages Thread */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>Conversation Thread</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                  {ticket.messages?.length || 0}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">Oldest to newest</span>
            </div>

            {/* Message List */}
            <div className="space-y-4">
              {(!ticket.messages || ticket.messages.length === 0) ? (
                <div className="py-12 text-center text-slate-400">
                  <MessageSquareIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">No messages yet.</p>
                </div>
              ) : (
                ticket.messages.map((msg: TicketMessageItem) => {
                  const isInternal = msg.isInternal;
                  const isAgent = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'STAFF' || msg.sender?.role === 'SUPER_ADMIN' || !isInternal && (msg.sender?.role !== 'CUSTOMER');

                  if (isInternal) {
                    // Internal Note Style (Amber with Lock indicator)
                    return (
                      <div
                        key={msg.id}
                        className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-5 shadow-xs space-y-2 ml-4 sm:ml-8"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                              <LockIcon className="w-2.5 h-2.5" />
                              Internal Note
                            </span>
                            <span className="text-xs font-bold text-amber-950">
                              {msg.sender?.name || 'Staff Member'}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-700/80 font-mono">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-amber-950 leading-relaxed whitespace-pre-wrap break-words font-medium">
                          {msg.message}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-amber-700/80 italic pt-1">
                          <LockIcon className="w-3 h-3 text-amber-600" />
                          <span>Not visible to customer</span>
                        </div>
                      </div>
                    );
                  }

                  if (isAgent) {
                    // Public Agent Reply Style (Blue)
                    return (
                      <div
                        key={msg.id}
                        className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 shadow-xs space-y-2 ml-4 sm:ml-8"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                              {msg.sender?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <span className="text-xs font-bold text-slate-900">
                              {msg.sender?.name || 'Support Agent'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-700">
                              Agent Reply
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  // Customer Message Style (Neutral Slate)
                  return (
                    <div
                      key={msg.id}
                      className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-2 mr-4 sm:mr-8"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                            {msg.sender?.name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            {msg.sender?.name || ticket.customer?.name || 'Customer'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">
                            Customer
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSubmitReply} className="pt-4 border-t border-slate-100 space-y-3">
              {/* Internal Note Mode Toggle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={e => setIsInternalNote(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span className={isInternalNote ? 'text-amber-800 flex items-center gap-1 font-bold' : 'text-slate-600'}>
                    {isInternalNote && <LockIcon className="w-3.5 h-3.5 text-amber-600" />}
                    Internal note (not visible to customer)
                  </span>
                </label>

                <span className="text-[11px] text-slate-400">
                  {isInternalNote ? 'Private staff observation' : 'Customer will receive this reply'}
                </span>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Write an internal note (agents only)...'
                      : 'Write a reply to the customer...'
                  }
                  className={`w-full p-4 text-xs sm:text-sm rounded-2xl border transition-all focus:outline-hidden focus:ring-2 shadow-2xs ${
                    isInternalNote
                      ? 'bg-amber-50/40 border-amber-300 focus:ring-amber-400 text-amber-950 placeholder-amber-400'
                      : 'bg-white border-slate-200 focus:ring-blue-500 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {replyMessage.length} characters
                </span>

                <button
                  type="submit"
                  disabled={isSubmittingReply || !replyMessage.trim()}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                    isInternalNote
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmittingReply ? (
                    <RefreshIcon className="w-4 h-4 animate-spin" />
                  ) : isInternalNote ? (
                    <LockIcon className="w-4 h-4" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmittingReply
                      ? 'Sending...'
                      : isInternalNote
                      ? 'Add Note'
                      : 'Send Reply'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Controls, Customer Context & Related Tickets */}
        <div className="space-y-6">
          {/* Ticket Controls Panel */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldIcon className="w-4 h-4 text-blue-600" />
              <span>Ticket Controls</span>
            </h3>

            {/* Status Control */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status</label>
              <select
                value={getStatusSelectValue(ticket.status)}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={isMutatingStatus}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all disabled:opacity-50"
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Control */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Priority</label>
              <select
                value={getPrioritySelectValue(ticket.priority)}
                onChange={e => handlePriorityChange(e.target.value)}
                disabled={isMutatingPriority}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Assigned Agent Control */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Assigned Agent</label>
              <select
                value={ticket.assignedToId || 'unassigned'}
                onChange={e => handleAssigneeChange(e.target.value)}
                disabled={isMutatingAssignee}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all disabled:opacity-50"
              >
                <option value="unassigned">Unassigned</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Context Panel */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span>Customer Context</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {ticket.customer?.name || ticket.user?.name || 'Customer'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Email</span>
                <span className="font-mono font-medium text-slate-800">
                  {ticket.customer?.email || ticket.user?.email || 'N/A'}
                </span>
              </div>

              {ticket.customer?.createdAt && (
                <div>
                  <span className="text-slate-400 font-medium block">Customer Since</span>
                  <span className="font-medium text-slate-700">
                    {new Date(ticket.customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {ticket.product && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-medium block">Related Product</span>
                  <div className="flex items-center gap-1.5 font-bold text-blue-600 mt-0.5">
                    <PackageIcon className="w-3.5 h-3.5" />
                    <span>{ticket.product.name}</span>
                  </div>
                </div>
              )}

              {ticket.order && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-medium block">Linked Order</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 mt-0.5">
                    <OrderIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ticket.order.orderNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Tickets Panel */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <span>Related Customer Tickets</span>
            </h3>

            {(!ticket.relatedTickets || ticket.relatedTickets.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-2">
                No other tickets found for this customer.
              </p>
            ) : (
              <div className="space-y-2">
                {ticket.relatedTickets.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => navigate(`/admin/tickets/${rel.id}`)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 cursor-pointer transition-all space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-blue-600 group-hover:underline">
                        {rel.ticketNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.2 bg-white rounded border border-slate-200">
                        {rel.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">
                      {rel.subject}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
