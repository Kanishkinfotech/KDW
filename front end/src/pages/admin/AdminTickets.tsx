import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LifeBuoy, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Inbox, 
  RotateCw,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import { adminTicketsApi } from '../../api/adminTickets.api';
import type { AdminTicket, TicketStats } from '../../api/adminTickets.api';

export default function AdminTickets() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  // State
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
    unassigned: 0,
    urgent: 0,
    mine: 0
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminTicketsApi.getStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error('Failed to load ticket stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Tickets
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (assignmentFilter !== 'ALL') params.assignedAgentId = assignmentFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await adminTicketsApi.getTickets(params);
      if (res.success) {
        const ticketList = res.tickets || res.data || [];
        setTickets(ticketList);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, assignmentFilter, debouncedSearch]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleRefresh = () => {
    loadStats();
    loadTickets();
  };

  const handleStatusTabChange = (tab: string) => {
    startTransition(() => {
      setStatusFilter(tab);
      setPage(1);
    });
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'OPEN' || s === 'NEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          {s === 'NEW' ? 'New' : 'Open'}
        </span>
      );
    }
    if (s.includes('WAITING') || s.includes('PENDING') || s === 'IN_PROGRESS' || s === 'UNDER_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Pending
        </span>
      );
    }
    if (s === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    }
    if (s === 'CLOSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        {status}
      </span>
    );
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority: string) => {
    const p = String(priority || '').toUpperCase();
    if (p === 'URGENT' || p === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Urgent
        </span>
      );
    }
    if (p === 'HIGH') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
          High
        </span>
      );
    }
    if (p === 'NORMAL' || p === 'MEDIUM') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          Normal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        Low
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SEO title="Support Tickets | KDW Administration" description="Triage and manage customer tickets" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <LifeBuoy className="w-4 h-4" />
            <span>Support & Help Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Support Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Triage, assign, and resolve customer support tickets.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs self-start sm:self-center"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading || statsLoading ? 'animate-spin text-blue-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div 
          onClick={() => handleStatusTabChange('ALL')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tickets</span>
            <Inbox className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {statsLoading ? '-' : stats.total}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">All recorded tickets</span>
        </div>

        {/* Unassigned */}
        <div 
          onClick={() => {
            setAssignmentFilter('unassigned');
            setPage(1);
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Unassigned</span>
            <User className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {statsLoading ? '-' : stats.unassigned}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting staff pickup</span>
        </div>

        {/* Urgent */}
        <div 
          onClick={() => {
            setPriorityFilter('urgent');
            setPage(1);
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Urgent</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {statsLoading ? '-' : stats.urgent}
          </div>
          <span className="text-[11px] text-rose-700 font-medium">Immediate attention</span>
        </div>

        {/* Pending */}
        <div 
          onClick={() => handleStatusTabChange('pending')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {statsLoading ? '-' : stats.pending}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Waiting on customer</span>
        </div>

        {/* Assigned to me */}
        <div 
          onClick={() => {
            setAssignmentFilter('me');
            setPage(1);
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned to Me</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {statsLoading ? '-' : stats.mine}
          </div>
          <span className="text-[11px] text-blue-700 font-medium">Active assignments</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All', count: stats.total },
            { id: 'open', label: 'Open', count: stats.open },
            { id: 'pending', label: 'Pending', count: stats.pending },
            { id: 'resolved', label: 'Resolved', count: stats.resolved },
            { id: 'closed', label: 'Closed', count: stats.closed }
          ].map(tab => {
            const isActive = statusFilter.toLowerCase() === tab.id.toLowerCase();
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject, #, customer..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Select Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            {/* Assignment Filter */}
            <select
              value={assignmentFilter}
              onChange={e => {
                setAssignmentFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Agents</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>

            {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || assignmentFilter !== 'ALL' || searchInput) && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setAssignmentFilter('ALL');
                  setSearchInput('');
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tickets Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">Ticket</th>
                <th className="py-4 px-5">Customer</th>
                <th className="py-4 px-5">Priority</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Assigned</th>
                <th className="py-4 px-5">Updated</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-semibold">Loading ticket database...</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No tickets match these filters.</h4>
                      <p className="text-xs text-slate-400">
                        Try broadening your search query or selecting a different status tab.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Ticket Subject & Number */}
                    <td className="py-4 px-5 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-blue-600 text-[11px]">
                          {ticket.ticketNumber}
                        </span>
                        {ticket.messageCount && ticket.messageCount > 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <MessageSquare className="w-2.5 h-2.5 text-slate-400" />
                            {ticket.messageCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">
                        {ticket.subject}
                      </div>
                      {ticket.product && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3 text-sky-500" />
                          <span>{ticket.product.name}</span>
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-5 text-slate-700">
                      <div className="font-bold text-slate-900">
                        {ticket.customer?.name || ticket.user?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {ticket.customer?.email || ticket.user?.email || 'N/A'}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-5">
                      {renderPriorityBadge(ticket.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      {renderStatusBadge(ticket.status)}
                    </td>

                    {/* Assigned */}
                    <td className="py-4 px-5 text-slate-700 font-medium">
                      {ticket.assignedAgent ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {ticket.assignedAgent.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-800 font-semibold">{ticket.assignedAgent.name}</span>
                        </div>
                      ) : ticket.assignedToName ? (
                        <span className="text-xs text-slate-800 font-semibold">{ticket.assignedToName}</span>
                      ) : (
                        <span className="inline-block text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Updated */}
                    <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                      {new Date(ticket.updatedAt || ticket.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/tickets/${ticket.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{tickets.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalCount}</span> tickets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 shadow-2xs">
              Page {page} of {Math.max(1, totalPages)}
            </span>

            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
