import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, UserCheck, UserX, UserPlus, ShieldAlert, Search, Filter,
  Download, RefreshCw, GitMerge, MoreVertical, Eye, Ban, CheckCircle2,
  Tag, Shield, ChevronLeft, ChevronRight, HardDrive, Key, AlertTriangle,
  ArrowUpDown, ExternalLink, Mail, Phone, Calendar, Copy, Check, Lock,
  ShoppingBag, Clock, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatCurrency } from '../../utils/currency';
import AdminCustomerDetailModal from '../../components/admin/AdminCustomerDetailModal';
import CustomerMergeModal from '../../components/admin/CustomerMergeModal';

export default function AdminCustomers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'all';

  const [customers, setCustomers] = useState<any[]>([]);
  const [counters, setCounters] = useState<any>({
    all: 0, new: 0, returning: 0, guest: 0, verified: 0, unverified: 0, blocked: 0, active_access: 0
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Selected Profile Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Merge Modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeMasterId, setMergeMasterId] = useState('');
  const [mergeDuplicateId, setMergeDuplicateId] = useState('');

  // Sub-view Data State (for Duplicates, Data Requests, Abandoned Checkouts, Activity)
  const [subViewData, setSubViewData] = useState<any[]>([]);
  const [subViewLoading, setSubViewLoading] = useState(false);

  // Copy helper
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(p => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Main Data Fetcher
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        view: currentView !== 'all' ? currentView : undefined,
        search: debouncedSearch || undefined,
        customerType: customerTypeFilter || undefined,
        emailVerified: emailVerifiedFilter !== '' ? emailVerifiedFilter : undefined,
        status: statusFilter || undefined,
        tag: tagFilter || undefined,
        sortBy
      };

      const res = await axios.get('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setCustomers(res.data.customers || []);
        setPagination(res.data.pagination);
        setCounters(res.data.counters || {});
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, currentView, debouncedSearch, customerTypeFilter, emailVerifiedFilter, statusFilter, tagFilter, sortBy]);

  // Sub-view Data Fetcher
  const fetchSubViewData = useCallback(async () => {
    if (!['duplicates', 'data-requests', 'abandoned', 'activity'].includes(currentView)) return;
    try {
      setSubViewLoading(true);
      const token = localStorage.getItem('token');
      let endpoint = '';
      if (currentView === 'duplicates') endpoint = '/api/admin/customers/duplicates';
      if (currentView === 'data-requests') endpoint = '/api/admin/customers/data-requests';
      if (currentView === 'abandoned') endpoint = '/api/admin/customers/abandoned-checkouts';
      if (currentView === 'activity') endpoint = '/api/admin/customers/activity';

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSubViewData(res.data.duplicates || res.data.requests || res.data.checkouts || res.data.events || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load sub-view records');
    } finally {
      setSubViewLoading(false);
    }
  }, [currentView]);

  useEffect(() => {
    if (['duplicates', 'data-requests', 'abandoned', 'activity'].includes(currentView)) {
      fetchSubViewData();
    } else {
      fetchCustomers();
    }
  }, [fetchCustomers, fetchSubViewData, currentView]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Customer code copied');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Generating Customer CSV Export...');
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/customers/export', {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: currentView },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kwd_customers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('Export downloaded successfully!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export customers');
    }
  };

  const handleProcessDataRequest = async (requestId: string, action: 'COMPLETE' | 'REJECT' | 'ANONYMIZE') => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/data-requests/${requestId}/process`, {
        action,
        resolutionNotes: `Processed as ${action} by console admin`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Data request processed');
        fetchSubViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process data request');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE TITLE & ACTION CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="text-primary" size={26} />
            Customer Management
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Stateful customer records, entitlements, licences, consents, duplicate merging, and compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setMergeMasterId('');
              setMergeDuplicateId('');
              setShowMergeModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <GitMerge size={14} />
            Merge Profiles
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => {
              if (['duplicates', 'data-requests', 'abandoned', 'activity'].includes(currentView)) {
                fetchSubViewData();
              } else {
                fetchCustomers();
              }
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading || subViewLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* LIVE KPI STAT STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'All Customers', count: counters.all, viewKey: 'all', icon: Users, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'New (<30d)', count: counters.new, viewKey: 'new', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
          { label: 'Returning', count: counters.returning, viewKey: 'returning', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Guest Buyers', count: counters.guest, viewKey: 'guest', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { label: 'Unverified', count: counters.unverified, viewKey: 'unverified', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50/50' },
          { label: 'Blocked', count: counters.blocked, viewKey: 'blocked', icon: Ban, color: 'text-rose-600', bg: 'bg-rose-50/50' }
        ].map(kpi => (
          <button
            key={kpi.viewKey}
            type="button"
            onClick={() => {
              setSearchParams({ view: kpi.viewKey });
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              currentView === kpi.viewKey
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{kpi.label}</span>
              <kpi.icon size={15} className={kpi.color} />
            </div>
            <span className={`text-xl font-black block mt-2 ${kpi.color}`}>
              {kpi.count}
            </span>
          </button>
        ))}
      </div>

      {/* SUBVIEW NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: 'All Customers' },
          { id: 'new', label: 'New Customers' },
          { id: 'returning', label: 'Returning' },
          { id: 'guest', label: 'Guest Buyers' },
          { id: 'unverified', label: 'Unverified' },
          { id: 'blocked', label: 'Blocked' },
          { id: 'duplicates', label: 'Duplicates & Merge' },
          { id: 'data-requests', label: 'GDPR Data Requests' },
          { id: 'abandoned', label: 'Abandoned Checkouts' },
          { id: 'activity', label: 'Activity Stream' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSearchParams({ view: tab.id });
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              currentView === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER DEDICATED SUB-VIEWS */}
      {currentView === 'duplicates' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <GitMerge className="text-primary" size={20} />
                Detected Duplicate Profiles
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Profiles identified with matching normalized email addresses or guest checkouts.
              </p>
            </div>
          </div>

          {subViewLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
              <p className="text-xs mt-2">Scanning database for duplicate records...</p>
            </div>
          ) : subViewData.length > 0 ? (
            <div className="space-y-3">
              {subViewData.map((dup: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="font-black text-emerald-800 text-[10px] uppercase block mb-1">Master Record (Earliest)</span>
                      <span className="font-bold text-slate-900 block">{dup.masterName}</span>
                      <span className="text-slate-500 font-mono text-[11px] block">{dup.masterEmail}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {dup.masterId.slice(0, 10)}...</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="font-black text-amber-800 text-[10px] uppercase block mb-1">Duplicate Record</span>
                      <span className="font-bold text-slate-900 block">{dup.duplicateName}</span>
                      <span className="text-slate-500 font-mono text-[11px] block">{dup.duplicateEmail}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {dup.duplicateId.slice(0, 10)}...</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMergeMasterId(dup.masterId);
                      setMergeDuplicateId(dup.duplicateId);
                      setShowMergeModal(true);
                    }}
                    className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 self-end sm:self-center shadow-xs cursor-pointer"
                  >
                    <GitMerge size={14} />
                    Review & Merge
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-xs font-bold text-slate-700">No duplicate customer records detected.</p>
            </div>
          )}
        </div>
      )}

      {currentView === 'data-requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <ShieldAlert className="text-primary" size={20} />
              Privacy & GDPR Data Requests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Access, correction, restriction, and safe deletion requests from customers.
            </p>
          </div>

          {subViewLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
            </div>
          ) : subViewData.length > 0 ? (
            <div className="space-y-3">
              {subViewData.map((req: any) => (
                <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 uppercase text-[11px]">{req.requestType}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 font-medium">Customer: {req.customer?.name} ({req.customer?.email})</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Reason: {req.reason || 'None specified'} • Submitted {new Date(req.createdAt).toLocaleString()}</p>
                  </div>

                  {req.status === 'SUBMITTED' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleProcessDataRequest(req.id, req.requestType === 'DELETION' ? 'ANONYMIZE' : 'COMPLETE')}
                        className="px-3.5 py-1.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark cursor-pointer"
                      >
                        {req.requestType === 'DELETION' ? 'Execute Anonymization' : 'Mark Completed'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessDataRequest(req.id, 'REJECT')}
                        className="px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400 text-xs">No pending data privacy requests.</p>
          )}
        </div>
      )}

      {currentView === 'abandoned' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Clock className="text-amber-600" size={20} />
              Abandoned Checkouts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sessions where customer initiated checkout but did not finalize payment.
            </p>
          </div>

          {subViewLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
            </div>
          ) : subViewData.length > 0 ? (
            <div className="space-y-3">
              {subViewData.map((chk: any) => (
                <div key={chk.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{chk.customerName || 'Guest User'} ({chk.customerEmail})</span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">Amount: {formatCurrency(chk.totalAmount)} • Abandoned {new Date(chk.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400 text-xs">No abandoned checkouts recorded.</p>
          )}
        </div>
      )}

      {currentView === 'activity' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              Global Customer Activity Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit log of creations, claims, licence activations, blocks, and privacy actions.
            </p>
          </div>

          {subViewLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
            </div>
          ) : subViewData.length > 0 ? (
            <div className="space-y-2">
              {subViewData.map((evt: any) => (
                <div key={evt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{evt.eventType}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{evt.description}</p>
                    <span className="text-slate-400 text-[10px]">Actor: {evt.actorName || 'SYSTEM'} • Customer: {evt.customer?.email}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{new Date(evt.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400 text-xs">No activity logged.</p>
          )}
        </div>
      )}

      {/* STANDARD CUSTOMER TABLE VIEW */}
      {!['duplicates', 'data-requests', 'abandoned', 'activity'].includes(currentView) && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* SEARCH & FILTERS HEADER */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, code, or order #..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isFilterOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Filter size={14} />
                Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          {/* FILTER DRAWER */}
          {isFilterOpen && (
            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Customer Type</label>
                <select
                  value={customerTypeFilter}
                  onChange={(e) => setCustomerTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">All Types</option>
                  <option value="ACCOUNT">Registered Accounts</option>
                  <option value="GUEST">Guest Buyers</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Email Verification</label>
                <select
                  value={emailVerifiedFilter}
                  onChange={(e) => setEmailVerifiedFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">All Verification</option>
                  <option value="true">Verified Email Only</option>
                  <option value="false">Unverified Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Account Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Customer Tag</label>
                <input
                  type="text"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  placeholder="e.g. vip, agency"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>
          )}

          {/* MAIN CUSTOMER TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-center">Paid Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
                      <p className="text-xs mt-2">Loading customers...</p>
                    </td>
                  </tr>
                ) : customers.length > 0 ? (
                  customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                            {c.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerId(c.id)}
                              className="font-bold text-slate-900 hover:text-primary transition-colors text-left block"
                            >
                              {c.name}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono">{c.customerCode || c.id.slice(0, 8)}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(c.customerCode || c.id)}
                                className="hover:text-slate-700 cursor-pointer"
                              >
                                {copiedCode === (c.customerCode || c.id) ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                              <span>•</span>
                              <span>{c.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Type */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.customerType === 'ACCOUNT' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.customerType}
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.emailVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>

                      {/* Paid Orders */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {c.paidOrdersCount || 0}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(c.totalSpent || 0)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white font-bold text-xs text-slate-700 transition-all cursor-pointer shadow-2xs"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-700">No customer records matching criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-900">{customers.length}</span> of <span className="font-bold text-slate-900">{pagination.total}</span> customers
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-slate-900">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15-TAB CUSTOMER DETAIL PROFILE MODAL */}
      {selectedCustomerId && (
        <AdminCustomerDetailModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onRefresh={fetchCustomers}
        />
      )}

      {/* ATOMIC MERGE MODAL */}
      {showMergeModal && (
        <CustomerMergeModal
          initialMasterId={mergeMasterId}
          initialDuplicateId={mergeDuplicateId}
          onClose={() => setShowMergeModal(false)}
          onSuccess={() => {
            fetchCustomers();
            if (currentView === 'duplicates') fetchSubViewData();
          }}
        />
      )}
    </div>
  );
}
