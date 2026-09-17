import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  RotateCcw,
  Bug,
  Activity,
  Layers,
  Trash2
} from 'lucide-react';
import Button from '../../components/Button';
import { SystemLayout } from '../../components/admin/system/SystemLayout';

interface ErrorLogItem {
  id: string;
  errorCode: string;
  severity: string;
  service: string;
  message: string;
  stackTrace?: string | null;
  stack?: string | null;
  method?: string | null;
  path?: string | null;
  endpoint?: string | null;
  statusCode?: number | null;
  status: string;
  ip?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  actorName?: string | null;
  assignedOwner?: string | null;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
}

interface StatsData {
  total: number;
  open: number;
  resolved: number;
  last24h: number;
  critical: number;
}

export default function AdminErrorLogs() {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorLogItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    open: 0,
    resolved: 0,
    last24h: 0,
    critical: 0
  });

  // Filters & Pagination State
  const [statusTab, setStatusTab] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Expansion & Modal States
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLogItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/system/errors/stats', {
        headers: getAuthHeader(),
        withCredentials: true
      });
      if (res.data.success && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (_err) {
      console.error('Failed to load error stats');
    }
  }, []);

  // Fetch Error List
  const fetchErrors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/system/errors', {
        params: {
          status: statusTab,
          method: methodFilter,
          search: search.trim() || undefined,
          page,
          limit
        },
        headers: getAuthHeader(),
        withCredentials: true
      });

      if (res.data.success) {
        const items = res.data.data || res.data.errors || [];
        setErrors(items);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.total || items.length);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch error logs');
    } finally {
      setLoading(false);
    }
  }, [statusTab, methodFilter, search, page, limit]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const handleStatusChange = (newStatus: 'OPEN' | 'RESOLVED' | 'ALL') => {
    setStatusTab(newStatus);
    setPage(1);
  };

  const handleMethodChange = (newMethod: string) => {
    setMethodFilter(newMethod);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCopyTrace = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Stack trace copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResolveSubmit = async () => {
    if (!selectedError) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(
        `/api/admin/system/errors/${selectedError.id}/resolve`,
        { note: resolutionNote.trim() || 'Resolved by administrator' },
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      if (res.data.success) {
        toast.success('Error marked as resolved');
        setResolveModalOpen(false);
        setResolutionNote('');
        setSelectedError(null);
        fetchErrors();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      const res = await axios.patch(
        `/api/admin/system/errors/${id}/reopen`,
        {},
        {
          headers: getAuthHeader(),
          withCredentials: true
        }
      );

      if (res.data.success) {
        toast.success('Error reopened');
        fetchErrors();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reopen error');
    }
  };

  const handleDeleteError = async (id: string) => {
    if (!window.confirm('Delete this error log record?')) return;
    try {
      const res = await axios.delete(`/api/admin/system/errors/${id}`, {
        headers: getAuthHeader(),
        withCredentials: true
      });
      if (res.data.success) {
        toast.success('Error log deleted');
        fetchErrors();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete error');
    }
  };

  const handleClearAllErrors = async () => {
    if (!window.confirm('Are you sure you want to purge all error logs? This action cannot be undone.')) return;
    try {
      setActionLoading(true);
      const res = await axios.delete('/api/admin/system/errors/clear', {
        headers: getAuthHeader(),
        withCredentials: true
      });
      if (res.data.success) {
        toast.success(res.data.message || 'All error logs cleared successfully');
        fetchErrors();
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear error logs');
    } finally {
      setActionLoading(false);
    }
  };

  const getMethodBadgeClass = (method?: string | null) => {
    const m = (method || 'GET').toUpperCase();
    if (m === 'POST') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (m === 'PUT') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (m === 'PATCH') return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (m === 'DELETE') return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getStatusBadgeClass = (code?: number | null) => {
    const c = code || 500;
    if (c >= 500) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (c >= 400) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="space-y-6 font-sans">
      <SystemLayout onRefresh={() => { fetchStats(); fetchErrors(); }} isLoading={loading} />
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bug className="text-rose-600 w-7 h-7" />
            System Error Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Server and application error telemetry captured in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.total > 0 && (
            <button
              onClick={handleClearAllErrors}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Trash2 size={13} />
              Purge All Errors
            </button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              fetchStats();
              fetchErrors();
            }}
            isLoading={loading}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase">Total Errors</span>
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-600 block uppercase">Open</span>
            <span className="text-2xl font-bold text-slate-900">{stats.open}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-600 block uppercase">Resolved</span>
            <span className="text-2xl font-bold text-slate-900">{stats.resolved}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-600 block uppercase">Last 24 Hours</span>
            <span className="text-2xl font-bold text-slate-900">{stats.last24h}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-600 block uppercase">Critical (5xx)</span>
            <span className="text-2xl font-bold text-rose-600">{stats.critical}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 space-y-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => handleStatusChange('OPEN')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  statusTab === 'OPEN'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open ({stats.open})
              </button>
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  statusTab === 'RESOLVED'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resolved ({stats.resolved})
              </button>
              <button
                onClick={() => handleStatusChange('ALL')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  statusTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({stats.total})
              </button>
            </div>

            {/* HTTP Method Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => handleMethodChange(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              >
                <option value="ALL">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by error message, path, code, or stack trace..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Error Rows */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading system error telemetry...</p>
          </div>
        ) : errors.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              {search
                ? 'No errors match your search query'
                : statusTab === 'OPEN'
                ? 'No open system errors'
                : statusTab === 'RESOLVED'
                ? 'No resolved error records'
                : 'No system errors recorded'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'Try broadening your search keywords or resetting filters.'
                : 'All application endpoints and backend services are nominal.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {errors.map((item) => {
              const isExpanded = expandedId === item.id;
              const displayStack = item.stackTrace || item.stack || 'No stack trace captured.';
              const displayPath = item.path || item.endpoint || '-';
              const displayMethod = (item.method || (item.endpoint ? item.endpoint.split(' ')[0] : 'GET')).toUpperCase();
              const displayStatusCode = item.statusCode || 500;
              const isResolved = item.status === 'RESOLVED';

              return (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                  
                  {/* Top Row Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Badges & Route */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Method Badge */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getMethodBadgeClass(displayMethod)}`}>
                        {displayMethod}
                      </span>

                      {/* Status Code Badge */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getStatusBadgeClass(displayStatusCode)}`}>
                        {displayStatusCode}
                      </span>

                      {/* Path */}
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {displayPath}
                      </span>

                      {/* Error Code */}
                      <span className="text-[11px] font-mono text-slate-400">
                        [{item.errorCode}]
                      </span>

                      {/* Multi-occurrence Badge */}
                      {item.occurrenceCount > 1 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          {item.occurrenceCount}x
                        </span>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.status}
                      </span>

                      {!isResolved ? (
                        <button
                          onClick={() => {
                            setSelectedError(item);
                            setResolveModalOpen(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReopen(item.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          Reopen
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteError(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={16} />
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand stack trace'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Message & Context */}
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words">
                      {item.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span>Occurred: {new Date(item.createdAt).toLocaleString()}</span>
                      {item.ip && <span>IP: <code className="font-mono">{item.ip}</code></span>}
                      {item.userId && <span>User ID: <code className="font-mono">{item.userId}</code></span>}
                      {item.assignedOwner && <span>Owner: <strong>{item.assignedOwner}</strong></span>}
                    </div>
                  </div>

                  {/* Expanded Stack Trace & Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Stack Trace & Telemetry
                        </span>
                        <button
                          onClick={() => handleCopyTrace(displayStack, item.id)}
                          className="px-2.5 py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 flex items-center gap-1 font-medium transition-colors"
                        >
                          {copiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          {copiedId === item.id ? 'Copied' : 'Copy Stack'}
                        </button>
                      </div>

                      <pre className="bg-[#0f172a] p-4 rounded-xl text-xs font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800 max-h-96">
                        {displayStack}
                      </pre>

                      {/* Resolution Details Banner */}
                      {isResolved && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-800 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Resolved on {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : 'N/A'}
                            {item.assignedOwner && <span>by {item.assignedOwner}</span>}
                          </div>
                          {item.resolutionNote && (
                            <p className="text-emerald-700 pl-5">
                              <strong>Note:</strong> {item.resolutionNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && errors.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 bg-slate-50/50">
            <div>
              Showing page <span className="font-bold text-slate-900">{page}</span> of{' '}
              <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} total errors)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModalOpen && selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resolve Error Record
              </h3>
              <button
                onClick={() => setResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Mark this error as resolved. You can optionally include an engineering resolution note.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Resolution Note (Optional)</label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Fixed null pointer check in order controller / patched query..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
