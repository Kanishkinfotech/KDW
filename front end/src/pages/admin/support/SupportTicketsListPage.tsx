import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Users, UserCheck, ShieldAlert, 
  ArrowRight, Trash2, RotateCcw, Download, 
  ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle, ExternalLink, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SupportLayout } from '../../../components/admin/support/SupportLayout';
import { SupportStatusBadge, SupportPriorityBadge } from '../../../components/admin/support/SupportStatusBadge';
import { SlaTimerBadge } from '../../../components/admin/support/SlaTimerBadge';

interface SupportTicketsListPageProps {
  presetFilter?: {
    status?: string;
    priority?: string;
    type?: string;
    unassignedOnly?: boolean;
    overdueOnly?: boolean;
    title?: string;
    subtitle?: string;
  };
}

export default function SupportTicketsListPage({ presetFilter }: SupportTicketsListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters State
  const statusFilter = searchParams.get('status') || presetFilter?.status || 'ALL';
  const priorityFilter = searchParams.get('priority') || presetFilter?.priority || 'ALL';
  const typeFilter = searchParams.get('type') || presetFilter?.type || 'ALL';
  const searchTerm = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('adminAuth');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (priorityFilter !== 'ALL') q.set('priority', priorityFilter);
      if (typeFilter !== 'ALL') q.set('type', typeFilter);
      if (presetFilter?.unassignedOnly) q.set('unassignedOnly', 'true');
      if (presetFilter?.overdueOnly) q.set('overdueOnly', 'true');
      if (searchTerm) q.set('search', searchTerm);
      q.set('page', String(page));
      q.set('limit', '20');

      const res = await fetch(`/api/admin/support/tickets?${q.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setTickets(json.data || []);
        setTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, typeFilter, searchTerm, page]);

  const handleQuickPriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ priority: newPriority })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Priority updated to ${newPriority}`);
        fetchTickets();
      } else {
        toast.error(json.message || 'Failed to update priority');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating priority');
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete ticket #${ticketNumber}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Ticket #${ticketNumber} deleted successfully`);
        fetchTickets();
      } else {
        toast.error(json.message || 'Failed to delete ticket');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting ticket');
    }
  };

  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);

  const handleAcceptRefund = async (ticketId: string) => {
    if (!window.confirm('Accept this refund request and forward to Finance Desk for amount approval & payout?')) return;
    try {
      setProcessingTicketId(ticketId);
      const res = await fetch('/api/admin/support/refund/request-review', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ticketId })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Refund request accepted and forwarded to Payment Refunds desk!');
        fetchTickets();
      } else {
        toast.error(json.message || 'Failed to accept refund request.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating refund request.');
    } finally {
      setProcessingTicketId(null);
    }
  };

  const handleRejectRefund = async (ticketId: string) => {
    const reason = prompt('Mandatory rejection reason for the customer (minimum 5 characters):');
    if (!reason || reason.trim().length < 5) {
      toast.error('A clear rejection reason of at least 5 characters is required.');
      return;
    }

    try {
      setProcessingTicketId(ticketId);
      const res = await fetch('/api/admin/support/refund/reject', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ticketId, reason: reason.trim() })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Refund request declined and customer notified.');
        fetchTickets();
      } else {
        toast.error(json.message || 'Failed to decline refund request.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error declining refund.');
    } finally {
      setProcessingTicketId(null);
    }
  };

  const exportCsv = () => {
    const headers = ['TicketNumber', 'Subject', 'Type', 'Priority', 'Status', 'Customer', 'Email', 'Created'];
    const rows = tickets.map(t => [
      t.ticketNumber,
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      t.type,
      t.priority,
      t.status,
      `"${t.customerName || ''}"`,
      t.customerEmail || '',
      new Date(t.createdAt).toISOString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `support_tickets_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const title = presetFilter?.title || 'All Support Tickets';
  const subtitle = presetFilter?.subtitle || 'Search, filter, assign, and manage customer support tickets and SLA timers.';

  return (
    <SupportLayout
      title={title}
      subtitle={subtitle}
      onRefresh={fetchTickets}
      isLoading={loading}
      actions={
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      }
    >
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets, email, subject..."
              value={searchTerm}
              onChange={e => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('search', e.target.value);
                else p.delete('search');
                p.set('page', '1');
                setSearchParams(p);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {total} tickets found
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {(() => {
            const isRefundDesk = typeFilter === 'REFUND_REQUEST' || presetFilter?.type === 'REFUND_REQUEST';

            return (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  {isRefundDesk ? (
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Order / Product</th>
                      <th className="py-3.5 px-4">Customer Explanation Note</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Created</th>
                      <th className="py-3.5 px-4 text-right">Support Decision & Actions</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">SLA Countdown</th>
                      <th className="py-3.5 px-4">Assignee</th>
                      <th className="py-3.5 px-4">Created</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={isRefundDesk ? 8 : 9} className="py-12 text-center text-slate-400">
                        No {isRefundDesk ? 'refund requests' : 'support tickets'} found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    tickets.map(t => {
                      if (isRefundDesk) {
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              <div className="font-mono text-blue-600 text-[11px] font-bold">{t.ticketNumber}</div>
                              <div className="font-bold line-clamp-1 mt-0.5 text-slate-800">{t.subject}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <span>{t.customerName || t.user?.name || 'Customer'}</span>
                                <span title="Verified Customer" className="inline-flex"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" /></span>
                              </div>
                              <div className="text-[11px] text-slate-400">{t.customerEmail || t.user?.email}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-mono text-xs font-bold text-slate-900">
                                #{t.order?.orderNumber || (t.orderId ? t.orderId.slice(0, 10) : 'KDW-ORDER')}
                              </div>
                              {t.order?.totalAmount && (
                                <div className="text-[11px] font-black text-rose-600">
                                  ₹{t.order.totalAmount}
                                </div>
                              )}
                              {t.product?.name && (
                                <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                                  {t.product.name}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="text-slate-700 font-medium leading-relaxed line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100" title={t.description}>
                                {t.description || 'No explanation provided.'}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={t.priority}
                                onChange={(e) => handleQuickPriorityChange(t.id, e.target.value)}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-black border cursor-pointer transition-all shadow-2xs ${
                                  t.priority === 'CRITICAL'
                                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                                    : t.priority === 'HIGH'
                                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                                    : t.priority === 'MEDIUM'
                                    ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                                }`}
                                title="Click to quickly change priority"
                              >
                                <option value="CRITICAL">CRITICAL</option>
                                <option value="HIGH">HIGH</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="LOW">LOW</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4">
                              <SupportStatusBadge status={t.status} />
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {t.status === 'PENDING_FINANCE' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="px-2 py-1 bg-purple-50 text-[#5b21b6] border border-purple-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                    <span>In Finance Queue</span>
                                  </span>
                                  <button
                                    onClick={() => navigate('/admin/payments?tab=refunds')}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-[#5b21b6] hover:bg-[#6d28d9] rounded-lg shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                    title="Approve refund payout in Payments Desk"
                                  >
                                    <span>Payment Refunds &rarr;</span>
                                  </button>
                                </div>
                              ) : t.status === 'RESOLVED' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Refund Paid</span>
                                  </span>
                                  <button
                                    onClick={() => navigate(`/admin/support/tickets/${t.id}`)}
                                    className="p-1 text-slate-400 hover:text-blue-600"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : t.status === 'CLOSED' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>Declined</span>
                                  </span>
                                  <button
                                    onClick={() => navigate(`/admin/support/tickets/${t.id}`)}
                                    className="p-1 text-slate-400 hover:text-blue-600"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleAcceptRefund(t.id)}
                                    disabled={processingTicketId === t.id}
                                    className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs inline-flex items-center gap-1 cursor-pointer"
                                    title="Accept policy review and forward to Payment Refunds for finance payout approval"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{processingTicketId === t.id ? 'Accepting...' : 'Accept & Forward'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectRefund(t.id)}
                                    disabled={processingTicketId === t.id}
                                    className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                                    title="Decline refund request"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Decline</span>
                                  </button>
                                  <button
                                    onClick={() => navigate(`/admin/support/tickets/${t.id}`)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                                    title="Inspect Ticket"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="font-mono text-blue-600 text-[11px]">{t.ticketNumber}</div>
                            <div className="font-bold line-clamp-1 mt-0.5">{t.subject}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{t.customerName || t.user?.name || 'Customer'}</div>
                            <div className="text-[11px] text-slate-400">{t.customerEmail || t.user?.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {t.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={t.priority}
                              onChange={(e) => handleQuickPriorityChange(t.id, e.target.value)}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-black border cursor-pointer transition-all shadow-2xs ${
                                t.priority === 'CRITICAL'
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                                  : t.priority === 'HIGH'
                                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                                  : t.priority === 'MEDIUM'
                                  ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                              }`}
                              title="Click to quickly change priority"
                            >
                              <option value="CRITICAL">CRITICAL</option>
                              <option value="HIGH">HIGH</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="LOW">LOW</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <SupportStatusBadge status={t.status} />
                          </td>
                          <td className="py-3.5 px-4">
                            <SlaTimerBadge
                              slaStatus={t.slaStatus}
                              resolutionDueAt={t.slaRecord?.resolutionDueAt}
                              firstResponseDueAt={t.slaRecord?.firstResponseDueAt}
                              resolvedAt={t.resolvedAt}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {t.assignedToName || <span className="text-amber-600 font-semibold">Unassigned</span>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/admin/support/tickets/${t.id}`)}
                                className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all inline-flex items-center gap-1"
                              >
                                Inspect <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteTicket(t.id, t.ticketNumber)}
                                title="Delete Ticket"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </SupportLayout>
  );
}
