import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Users, UserCheck, ShieldAlert, 
  ArrowRight, CheckSquare, Trash2, RotateCcw, Download, 
  ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
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

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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

      const res = await fetch(`/api/admin/support/tickets?${q.toString()}`, { credentials: 'include' });
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
    setSelectedIds([]);
  }, [statusFilter, priorityFilter, typeFilter, searchTerm, page]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(tickets.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBulk = async () => {
    if (selectedIds.length === 0 || !bulkAction || !bulkValue) {
      return alert('Please select tickets, an action, and a value.');
    }

    setIsBulkUpdating(true);
    try {
      const res = await fetch('/api/admin/support/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketIds: selectedIds,
          action: bulkAction,
          value: bulkValue
        })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedIds([]);
        setBulkAction('');
        setBulkValue('');
        fetchTickets();
      } else {
        alert(json.message || 'Bulk update failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkUpdating(false);
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
          <div className="relative w-full md:w-64">
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

          <select
            value={statusFilter}
            onChange={e => {
              const p = new URLSearchParams(searchParams);
              p.set('status', e.target.value);
              p.set('page', '1');
              setSearchParams(p);
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting on Customer</option>
            <option value="PENDING_FINANCE">Pending Finance</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => {
              const p = new URLSearchParams(searchParams);
              p.set('priority', e.target.value);
              p.set('page', '1');
              setSearchParams(p);
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => {
              const p = new URLSearchParams(searchParams);
              p.set('type', e.target.value);
              p.set('page', '1');
              setSearchParams(p);
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="DOWNLOAD_ISSUE">Download Issue</option>
            <option value="LICENCE_ISSUE">Licence Issue</option>
            <option value="REFUND_REQUEST">Refund Request</option>
            <option value="PAYMENT_QUERY">Payment Query</option>
            <option value="PRODUCT_QUESTION">Product Question</option>
            <option value="CONTACT_QUERY">Contact Query</option>
            <option value="CUSTOMER_REQUEST">Customer Request</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {total} tickets found
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50/75 border border-blue-200 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="font-bold text-blue-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>{selectedIds.length} tickets selected</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={e => {
                setBulkAction(e.target.value);
                setBulkValue('');
              }}
              className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-xl text-xs"
            >
              <option value="">Select Bulk Action</option>
              <option value="STATUS">Change Status</option>
              <option value="PRIORITY">Change Priority</option>
            </select>

            {bulkAction === 'STATUS' && (
              <select
                value={bulkValue}
                onChange={e => setBulkValue(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-xl text-xs"
              >
                <option value="">Select Target Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            )}

            {bulkAction === 'PRIORITY' && (
              <select
                value={bulkValue}
                onChange={e => setBulkValue(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-blue-200 rounded-xl text-xs"
              >
                <option value="">Select Target Priority</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            )}

            <button
              onClick={handleExecuteBulk}
              disabled={isBulkUpdating || !bulkValue}
              className="px-3.5 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isBulkUpdating ? 'Updating...' : 'Apply Bulk Action'}
            </button>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === tickets.length}
                    onChange={handleSelectAll}
                    className="rounded text-blue-600"
                  />
                </th>
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
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No support tickets found matching current filters.
                  </td>
                </tr>
              ) : (
                tickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t.id)}
                        onChange={() => handleSelectOne(t.id)}
                        className="rounded text-blue-600"
                      />
                    </td>
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
                      <SupportPriorityBadge priority={t.priority} />
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
                      <button
                        onClick={() => navigate(`/admin/support/tickets/${t.id}`)}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SupportLayout>
  );
}
