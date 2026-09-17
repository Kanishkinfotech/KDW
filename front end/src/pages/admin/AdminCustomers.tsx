import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, UserCheck, UserX, UserPlus, ShieldAlert, Search, Filter,
  Download, RefreshCw, GitMerge, MoreVertical, Eye, Ban, CheckCircle2,
  Tag, Shield, ChevronLeft, ChevronRight, HardDrive, Key, AlertTriangle,
  ArrowUpDown, ExternalLink, Mail, Phone, Calendar, Copy, Check, Lock,
  ShoppingBag, Clock, FileSpreadsheet, Trash2, Sparkles, LogIn, Activity,
  AlertCircle, X, ShieldCheck, UserMinus, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatCurrency } from '../../utils/currency';
import AdminCustomerDetailModal from '../../components/admin/AdminCustomerDetailModal';
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal';
import CustomerMergeModal from '../../components/admin/CustomerMergeModal';

export default function AdminCustomers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'all';

  const [customers, setCustomers] = useState<any[]>([]);
  const [counters, setCounters] = useState<any>({
    all: 0, new: 0, new_1d: 0, new_7d: 0, new_30d: 0,
    returning: 0, returning_1d: 0, returning_2d: 0, returning_3d: 0, returning_7d: 0, returning_30d: 0,
    guest: 0, guest_paid: 0, guest_zero_orders: 0,
    verified: 0, unverified: 0, blocked: 0, regular: 0, irregular: 0, active_access: 0
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

  // View-Specific Filter States
  const [activityFilter, setActivityFilter] = useState<string>(searchParams.get('activity') || '');
  const [returningDays, setReturningDays] = useState<string>(searchParams.get('returningDays') || '');
  const [returningMode, setReturningMode] = useState<'recency' | 'gap'>((searchParams.get('returningMode') as any) || 'recency');
  const [guestFilter, setGuestFilter] = useState<string>(searchParams.get('guestFilter') || '');
  const [unverifiedAge, setUnverifiedAge] = useState<string>(searchParams.get('unverifiedAge') || '');

  // Block Modal & Action State
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingCustomer, setBlockingCustomer] = useState<any | null>(null);
  const [blockScope, setBlockScope] = useState<'FULL' | 'PURCHASES' | 'DOWNLOADS' | 'LOGIN'>('FULL');
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);

  // Verifying inline indicator
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Activity Stream State
  const [activityCategory, setActivityCategory] = useState<'all' | 'orders' | 'auth' | 'account' | 'security'>('all');
  const [activityDateRange, setActivityDateRange] = useState<string>('');
  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>('');
  const [activitySearch, setActivitySearch] = useState('');
  const [debouncedActivitySearch, setDebouncedActivitySearch] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const [activityPagination, setActivityPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [activityCounters, setActivityCounters] = useState<{ all: number; orders: number; auth: number; account: number; security: number }>({
    all: 0, orders: 0, auth: 0, account: 0, security: 0
  });

  // Date Range Filters (Supports 1d, 7d, 30d, custom)
  const [dateRange, setDateRange] = useState<string>(searchParams.get('dateRange') || (currentView === 'new' ? '30d' : ''));
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '');

  // Selected Profile Modal & Order Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Purchase History State
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [debouncedPurchaseSearch, setDebouncedPurchaseSearch] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('ALL');
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasePagination, setPurchasePagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [purchaseSummary, setPurchaseSummary] = useState({ totalRevenue: 0, completedCount: 0, totalOrders: 0, failedCount: 0 });

  // Download History State
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadSearch, setDownloadSearch] = useState('');
  const [debouncedDownloadSearch, setDebouncedDownloadSearch] = useState('');
  const [downloadResultFilter, setDownloadResultFilter] = useState('ALL');
  const [downloadEventTypeFilter, setDownloadEventTypeFilter] = useState('ALL');
  const [downloadPage, setDownloadPage] = useState(1);
  const [downloadPagination, setDownloadPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [downloadMetrics, setDownloadMetrics] = useState<any>({ totalEvents: 0, avgDurationMs: 0, medianDurationMs: 0, p95DurationMs: 0 });

  // Merge Modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeMasterId, setMergeMasterId] = useState('');
  const [mergeDuplicateId, setMergeDuplicateId] = useState('');

  // Sub-view Data State (for Duplicates, Data Requests, Abandoned Checkouts, Activity)
  const [subViewData, setSubViewData] = useState<any[]>([]);
  const [subViewLoading, setSubViewLoading] = useState(false);
  const [abandonedFilter, setAbandonedFilter] = useState<'ALL' | 'ABANDONED' | 'RECOVERED'>('ALL');
  const [abandonedMetrics, setAbandonedMetrics] = useState({ abandonedCount: 0, recoveredCount: 0, totalAbandonedRevenue: 0 });
  const [recoveringId, setRecoveringId] = useState<string | null>(null);

  // Copy helper
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Debounce customer search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(p => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Debounce purchase search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPurchaseSearch(purchaseSearch);
      setPurchasePage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [purchaseSearch]);

  // Debounce download search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDownloadSearch(downloadSearch);
      setDownloadPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [downloadSearch]);

  // Synchronize URL date range params & customerId
  useEffect(() => {
    const dr = searchParams.get('dateRange');
    if (dr) {
      setDateRange(dr);
    } else if (currentView === 'new') {
      setDateRange('30d');
    } else {
      setDateRange('');
    }
    setStartDate(searchParams.get('startDate') || '');
    setEndDate(searchParams.get('endDate') || '');

    const cid = searchParams.get('customerId');
    if (cid) {
      setSelectedCustomerId(cid);
    }
  }, [searchParams, currentView]);

  const handleDateRangeSelect = (range: string) => {
    setDateRange(range);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('dateRange', range);
    if (range !== 'custom') {
      newParams.delete('startDate');
      newParams.delete('endDate');
      setStartDate('');
      setEndDate('');
    }
    setSearchParams(newParams);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleApplyCustomDate = () => {
    if (!startDate && !endDate) {
      toast.error('Please select at least a start date or end date');
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set('dateRange', 'custom');
    if (startDate) newParams.set('startDate', startDate);
    else newParams.delete('startDate');
    if (endDate) newParams.set('endDate', endDate);
    else newParams.delete('endDate');
    setSearchParams(newParams);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleResetDateFilter = () => {
    const defaultRange = currentView === 'new' ? '30d' : '';
    setDateRange(defaultRange);
    setStartDate('');
    setEndDate('');
    const newParams = new URLSearchParams(searchParams);
    if (defaultRange) newParams.set('dateRange', defaultRange);
    else newParams.delete('dateRange');
    newParams.delete('startDate');
    newParams.delete('endDate');
    setSearchParams(newParams);
    setPagination(p => ({ ...p, page: 1 }));
  };

  // Main Customer Data Fetcher
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
        status: currentView === 'blocked' ? 'BLOCKED' : (statusFilter || undefined),
        tag: tagFilter || undefined,
        activity: activityFilter || undefined,
        returningDays: currentView === 'returning' ? (returningDays || undefined) : undefined,
        returningMode: currentView === 'returning' ? returningMode : undefined,
        guestFilter: currentView === 'guest' ? (guestFilter || undefined) : undefined,
        unverifiedAge: currentView === 'unverified' ? (unverifiedAge || undefined) : undefined,
        dateRange: dateRange || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
  }, [pagination.page, pagination.limit, currentView, debouncedSearch, customerTypeFilter, emailVerifiedFilter, statusFilter, tagFilter, activityFilter, returningDays, returningMode, guestFilter, unverifiedAge, dateRange, startDate, endDate, sortBy]);

  // Sub-view Data Fetcher (Activity, Duplicates, Requests, Abandoned, Purchases, Downloads)
  const fetchSubViewData = useCallback(async () => {
    if (!['duplicates', 'data-requests', 'abandoned', 'activity', 'purchases', 'downloads'].includes(currentView)) return;
    try {
      setSubViewLoading(true);
      const token = localStorage.getItem('token');
      let endpoint = '';
      let params: any = undefined;

      if (currentView === 'duplicates') endpoint = '/api/admin/customers/duplicates';
      if (currentView === 'data-requests') endpoint = '/api/admin/customers/data-requests';
      if (currentView === 'abandoned') endpoint = `/api/admin/customers/abandoned-checkouts${abandonedFilter !== 'ALL' ? `?status=${abandonedFilter}` : ''}`;
      if (currentView === 'activity') {
        endpoint = '/api/admin/customers/activity';
        params = {
          category: activityCategory !== 'all' ? activityCategory : undefined,
          dateRange: activityDateRange || undefined,
          startDate: activityStartDate || undefined,
          endDate: activityEndDate || undefined,
          search: debouncedActivitySearch || undefined,
          page: activityPage,
          limit: 25
        };
      }
      if (currentView === 'purchases') {
        setPurchaseLoading(true);
        endpoint = '/api/admin/orders';
        params = {
          page: purchasePage,
          limit: 20,
          search: debouncedPurchaseSearch || undefined,
          status: purchaseStatusFilter !== 'ALL' ? purchaseStatusFilter : undefined
        };
      }
      if (currentView === 'downloads') {
        setDownloadLoading(true);
        endpoint = '/api/admin/downloads/activity';
        params = {
          page: downloadPage,
          limit: 25,
          search: debouncedDownloadSearch || undefined,
          result: downloadResultFilter !== 'ALL' ? downloadResultFilter : undefined,
          eventType: downloadEventTypeFilter !== 'ALL' ? downloadEventTypeFilter : undefined
        };
      }

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        if (currentView === 'activity') {
          setSubViewData(res.data.events || []);
          if (res.data.counters) setActivityCounters(res.data.counters);
          if (res.data.pagination) setActivityPagination(res.data.pagination);
        } else if (currentView === 'purchases') {
          const ords = res.data.orders || [];
          setPurchaseOrders(ords);
          if (res.data.pagination) setPurchasePagination(res.data.pagination);
          const comp = ords.filter((o: any) => o.paymentStatus === 'PAID' || o.orderStatus === 'COMPLETED' || o.orderStatus === 'FULFILLED');
          const failed = ords.filter((o: any) => o.paymentStatus === 'FAILED' || o.orderStatus === 'FAILED');
          const rev = comp.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
          setPurchaseSummary({
            totalOrders: res.data.pagination?.total || ords.length,
            completedCount: comp.length,
            totalRevenue: rev,
            failedCount: failed.length
          });
        } else if (currentView === 'downloads') {
          setDownloadLogs(res.data.data || []);
          if (res.data.metrics) setDownloadMetrics(res.data.metrics);
          if (res.data.pagination) setDownloadPagination(res.data.pagination);
        } else {
          setSubViewData(res.data.duplicates || res.data.requests || res.data.checkouts || []);
          if (res.data.metrics) {
            setAbandonedMetrics(res.data.metrics);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load sub-view records');
    } finally {
      setSubViewLoading(false);
      setPurchaseLoading(false);
      setDownloadLoading(false);
    }
  }, [
    currentView, abandonedFilter, activityCategory, activityDateRange, activityStartDate, activityEndDate, debouncedActivitySearch, activityPage,
    purchasePage, debouncedPurchaseSearch, purchaseStatusFilter,
    downloadPage, debouncedDownloadSearch, downloadResultFilter, downloadEventTypeFilter
  ]);

  useEffect(() => {
    if (['duplicates', 'data-requests', 'abandoned', 'activity', 'purchases', 'downloads'].includes(currentView)) {
      fetchSubViewData();
    } else {
      fetchCustomers();
    }
  }, [
    fetchCustomers, fetchSubViewData, currentView, abandonedFilter, activityCategory, activityDateRange, activityStartDate, activityEndDate, debouncedActivitySearch, activityPage,
    purchasePage, debouncedPurchaseSearch, purchaseStatusFilter,
    downloadPage, debouncedDownloadSearch, downloadResultFilter, downloadEventTypeFilter
  ]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Customer code copied');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1-Click Verification Handler
  const handleVerifyCustomer = async (customerId: string, customerName?: string) => {
    try {
      setVerifyingId(customerId);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${customerId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || `Customer ${customerName || ''} marked as verified`);
        fetchCustomers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify customer');
    } finally {
      setVerifyingId(null);
    }
  };

  // Block Modal Handlers
  const handleOpenBlockModal = (customer: any) => {
    setBlockingCustomer(customer);
    setBlockScope('FULL');
    setBlockReason('');
    setBlockModalOpen(true);
  };

  const handleSubmitBlock = async () => {
    if (!blockingCustomer) return;
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking this customer.');
      return;
    }
    try {
      setBlockLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${blockingCustomer.id}/block`, {
        scope: blockScope,
        reason: blockReason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || `Customer ${blockingCustomer.name} has been blocked.`);
        setBlockModalOpen(false);
        setBlockingCustomer(null);
        fetchCustomers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to block customer');
    } finally {
      setBlockLoading(false);
    }
  };

  // 1-Click Unblock Handler
  const handleUnblockCustomer = async (customerId: string, customerName?: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/${customerId}/unblock`, {
        reason: 'Administrative unblock from customer management'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || `Customer ${customerName || ''} unblocked successfully`);
        fetchCustomers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unblock customer');
    }
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

  const handleRecoverAbandonedCheckout = async (checkoutId: string) => {
    try {
      setRecoveringId(checkoutId);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/customers/abandoned-checkouts/${checkoutId}/recover`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Recovery email dispatched successfully');
        fetchSubViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch recovery email');
    } finally {
      setRecoveringId(null);
    }
  };

  const handleDeleteAbandonedCheckout = async (checkoutId: string) => {
    if (!window.confirm('Are you sure you want to remove this abandoned checkout record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/admin/customers/abandoned-checkouts/${checkoutId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Abandoned checkout removed');
        fetchSubViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove record');
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
              if (['duplicates', 'data-requests', 'abandoned', 'activity', 'purchases', 'downloads'].includes(currentView)) {
                fetchSubViewData();
              } else {
                fetchCustomers();
              }
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading || subViewLoading || purchaseLoading || downloadLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* LIVE KPI STAT STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'All Customers', count: counters.all, viewKey: 'all', icon: Users, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'New Customers', count: counters.new, viewKey: 'new', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
          { label: 'Returning', count: counters.returning, viewKey: 'returning', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
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
          { id: 'details', label: 'Customer Details' },
          { id: 'purchases', label: 'Purchase History' },
          { id: 'downloads', label: 'Download History' },
          { id: 'blocked', label: 'Blocked Users' }
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
        <div className="space-y-4">
          {/* Header Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Abandoned</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{abandonedMetrics.abandonedCount}</span>
              <span className="text-[11px] text-slate-500">Unfinalized checkout sessions</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recovered Sessions</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">{abandonedMetrics.recoveredCount}</span>
              <span className="text-[11px] text-slate-500">Customers who returned & completed</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Revenue At Risk</span>
              <span className="text-2xl font-black text-slate-900 block mt-1">{formatCurrency(abandonedMetrics.totalAbandonedRevenue)}</span>
              <span className="text-[11px] text-slate-500">Recoverable cart total</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Clock className="text-amber-600" size={20} />
                  Abandoned Checkouts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers who entered checkout with items but left before completing payment.
                </p>
              </div>

              {/* Status Filter Tabs & Refresh */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {(['ALL', 'ABANDONED', 'RECOVERED'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAbandonedFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        abandonedFilter === tab
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab === 'ALL' ? 'All Sessions' : tab === 'ABANDONED' ? 'Abandoned' : 'Recovered'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={fetchSubViewData}
                  disabled={subViewLoading}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Refresh checkouts"
                >
                  <RefreshCw size={15} className={subViewLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {subViewLoading ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="animate-spin mx-auto text-primary mb-2" size={24} />
                <p className="text-xs">Loading abandoned checkout sessions...</p>
              </div>
            ) : subViewData.length > 0 ? (
              <div className="space-y-3">
                {subViewData.map((chk: any) => {
                  const cartItems = Array.isArray(chk.cartData) ? chk.cartData : [];
                  const isRecovered = chk.status === 'RECOVERED';

                  return (
                    <div
                      key={chk.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs shadow-2xs"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {chk.customerName || chk.customer?.name || 'Guest Customer'}
                          </span>
                          <span className="text-slate-400 font-mono text-xs">
                            &lt;{chk.customerEmail}&gt;
                          </span>
                          {chk.customerPhone && (
                            <span className="text-slate-500 text-[11px] flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                              <Phone size={10} /> {chk.customerPhone}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            chk.customerId ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {chk.customerId ? 'Registered Account' : 'Guest Buyer'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isRecovered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {chk.status}
                          </span>
                        </div>

                        {/* Cart items preview */}
                        {cartItems.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {cartItems.map((item: any, idx: number) => (
                              <div
                                key={`${chk.id}-item-${idx}-${item.id || item.productId || idx}`}
                                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                              >
                                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                                  {item.title || item.name || 'Product'}
                                </span>
                                <span className="text-slate-400 font-mono">
                                  ×{item.quantity || 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                          <span>
                            Total Cart Value: <strong className="text-slate-900 font-mono">{formatCurrency(chk.totalAmount)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Last Activity: {new Date(chk.updatedAt || chk.createdAt).toLocaleString()}
                          </span>
                          {chk.recoveryEmailSent && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={12} /> Recovery Email Sent ({new Date(chk.recoveryEmailSentAt).toLocaleTimeString()})
                              </span>
                            </>
                          )}
                          {isRecovered && chk.recoveredAt && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">
                                Recovered at {new Date(chk.recoveredAt).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        {!isRecovered && (
                          <button
                            type="button"
                            onClick={() => handleRecoverAbandonedCheckout(chk.id)}
                            disabled={recoveringId === chk.id}
                            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Mail size={13} className={recoveringId === chk.id ? 'animate-spin' : ''} />
                            <span>{recoveringId === chk.id ? 'Sending...' : 'Send Recovery Email'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAbandonedCheckout(chk.id)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No abandoned checkouts recorded</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  When customers enter checkout and leave without completing payment, their sessions will automatically appear here with recovery actions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. DEDICATED GLOBAL CUSTOMER ACTIVITY STREAM */}
      {currentView === 'activity' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Activity className="text-primary" size={20} />
                Global Customer Activity Stream
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time chronological audit trail of orders, payments, site visits, registrations, verifications, and security events.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchSubViewData}
                disabled={subViewLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={subViewLoading ? 'animate-spin' : ''} />
                <span>Live Refresh</span>
              </button>
            </div>
          </div>

          {/* Category Filter Tabs with Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Activities', count: activityCounters.all, icon: Activity },
              { id: 'orders', label: 'Orders & Payments', count: activityCounters.orders, icon: ShoppingBag },
              { id: 'auth', label: 'Logins & Visits', count: activityCounters.auth, icon: Clock },
              { id: 'account', label: 'Registrations & Verifications', count: activityCounters.account, icon: UserCheck },
              { id: 'security', label: 'Security & Blocks', count: activityCounters.security, icon: ShieldAlert }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActivityCategory(cat.id as any);
                  setActivityPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  activityCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <cat.icon size={13} />
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activityCategory === cat.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cat.count || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Bar: Search + Date Presets */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search event type, actor, or customer..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
              {[
                { id: '', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'custom', label: 'Custom' }
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setActivityDateRange(d.id);
                    setActivityPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    activityDateRange === d.id
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Pickers for Activity */}
          {activityDateRange === 'custom' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 text-[11px] uppercase">From:</span>
                <input
                  type="date"
                  value={activityStartDate}
                  onChange={(e) => setActivityStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 text-[11px] uppercase">To:</span>
                <input
                  type="date"
                  value={activityEndDate}
                  onChange={(e) => setActivityEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivityPage(1);
                  fetchSubViewData();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* Event Stream List */}
          {subViewLoading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto text-primary mb-2" size={24} />
              <p className="text-xs">Loading activity stream records...</p>
            </div>
          ) : subViewData.length > 0 ? (
            <div className="space-y-2.5">
              {subViewData.map((evt: any) => {
                const isOrder = evt.eventType?.includes('ORDER') || evt.eventType?.includes('PAYMENT');
                const isLogin = evt.eventType?.includes('LOGIN') || evt.eventType?.includes('SESSION');
                const isBlock = evt.eventType?.includes('BLOCK') || evt.eventType?.includes('SUSPEND');
                const isVerify = evt.eventType?.includes('VERIF') || evt.eventType?.includes('CREATE');

                return (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isOrder ? 'bg-emerald-100 text-emerald-700' :
                        isLogin ? 'bg-sky-100 text-sky-700' :
                        isBlock ? 'bg-rose-100 text-rose-700' :
                        isVerify ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {isOrder ? <ShoppingBag size={16} /> :
                         isLogin ? <Clock size={16} /> :
                         isBlock ? <Ban size={16} /> :
                         isVerify ? <CheckCircle2 size={16} /> :
                         <Activity size={16} />}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {evt.eventType?.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                            evt.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            evt.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            evt.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {evt.status || 'INFO'}
                          </span>
                        </div>

                        <p className="text-slate-600 text-xs font-medium">
                          {evt.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>Actor: <strong className="text-slate-600">{evt.actorName || evt.actorType || 'SYSTEM'}</strong></span>
                          {evt.customer && (
                            <>
                              <span>•</span>
                              <span>Customer:</span>
                              <button
                                type="button"
                                onClick={() => setSelectedCustomerId(evt.customer.id)}
                                className="font-bold text-primary hover:underline cursor-pointer"
                              >
                                {evt.customer.name || evt.customer.email}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-center text-right">
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {new Date(evt.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Activity size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No activity events found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your filters or date range.</p>
            </div>
          )}

          {/* Activity Stream Pagination */}
          {activityPagination.totalPages > 1 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <strong className="text-slate-900">{subViewData.length}</strong> of <strong className="text-slate-900">{activityPagination.total}</strong> events
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activityPage <= 1}
                  onClick={() => setActivityPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="font-bold text-slate-900">
                  Page {activityPage} of {activityPagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={activityPage >= activityPagination.totalPages}
                  onClick={() => setActivityPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. DEDICATED CUSTOMER PURCHASE HISTORY SUB-VIEW */}
      {(currentView === 'purchases' || currentView === 'purchase-history') && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Purchase History</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                      Live Transaction Ledger
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Audit real customer purchases, ordered digital assets, software licences, payment gateways, and monetary settlements.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={fetchSubViewData}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
                  title="Refresh Purchase Ledger"
                >
                  <RefreshCw size={16} className={purchaseLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Orders</span>
                <span className="text-2xl font-black text-slate-900 block mt-1">{purchasePagination.total}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Completed / Paid</span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">{purchaseSummary.completedCount}</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Total Realized Revenue</span>
                <span className="text-2xl font-black text-blue-700 block mt-1">{formatCurrency(purchaseSummary.totalRevenue)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">Failed Checkouts</span>
                <span className="text-2xl font-black text-rose-700 block mt-1">{purchaseSummary.failedCount}</span>
              </div>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by customer name, email, order #, or product..."
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              {purchaseSearch && (
                <button
                  type="button"
                  onClick={() => setPurchaseSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: 'All Orders' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'FAILED', label: 'Failed' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setPurchaseStatusFilter(st.id);
                    setPurchasePage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    purchaseStatusFilter === st.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order & Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items Purchased</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="animate-spin mx-auto text-blue-600" size={24} />
                        <p className="text-xs mt-2">Loading customer purchase history...</p>
                      </td>
                    </tr>
                  ) : purchaseOrders.length > 0 ? (
                    purchaseOrders.map((order: any) => {
                      const custName = order.customer?.name || order.guestName || 'Guest Buyer';
                      const custEmail = order.customer?.email || order.guestEmail || '—';
                      const custId = order.customerId || order.customer?.id;
                      const isPaid = order.paymentStatus === 'PAID' || order.orderStatus === 'COMPLETED' || order.orderStatus === 'FULFILLED';
                      const isFailed = order.paymentStatus === 'FAILED' || order.orderStatus === 'FAILED';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-slate-900 block">{order.orderNumber}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                                {custName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                {custId ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerId(custId)}
                                    className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left block"
                                  >
                                    {custName}
                                  </button>
                                ) : (
                                  <span className="font-bold text-slate-900 block">{custName}</span>
                                )}
                                <span className="text-[11px] text-slate-400 font-mono block">{custEmail}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1 max-w-xs">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((it: any, iIdx: number) => (
                                  <div key={iIdx} className="flex items-center gap-1.5 text-xs">
                                    <span className="font-bold text-slate-800 truncate">{it.productName || it.productNameSnapshot}</span>
                                    {it.quantity > 1 && (
                                      <span className="px-1 py-0.2 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-600">
                                        x{it.quantity}
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">No items listed</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {formatCurrency(order.totalAmount)}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isFailed
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isPaid ? <CheckCircle2 size={11} /> : isFailed ? <AlertCircle size={11} /> : <Clock size={11} />}
                              <span>{order.paymentStatus || order.orderStatus}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderId(order.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                View Order
                              </button>
                              {custId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCustomerId(custId)}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                                >
                                  <Eye size={12} />
                                  <span>Profile</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <ShoppingBag className="mx-auto text-slate-300" size={32} />
                        <p className="text-xs font-bold text-slate-600 mt-2">No purchase records found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search query or status filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {purchasePagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Showing <strong className="text-slate-900">{purchaseOrders.length}</strong> of{' '}
                  <strong className="text-slate-900">{purchasePagination.total}</strong> orders
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={purchasePage <= 1}
                    onClick={() => setPurchasePage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="font-bold text-slate-900">
                    Page {purchasePage} of {purchasePagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={purchasePage >= purchasePagination.totalPages}
                    onClick={() => setPurchasePage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. DEDICATED CUSTOMER DOWNLOAD HISTORY SUB-VIEW */}
      {(currentView === 'downloads' || currentView === 'download-history') && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Download size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Download History</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                      Live Delivery Stream
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Telemetry on digital asset deliveries, token validations, file stream latency, and customer download events.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={fetchSubViewData}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
                  title="Refresh Download History"
                >
                  <RefreshCw size={16} className={downloadLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Events</span>
                <span className="text-2xl font-black text-slate-900 block mt-1">
                  {downloadMetrics.totalEvents || downloadPagination.total}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Avg Stream Latency</span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">
                  {downloadMetrics.avgDurationMs ? `${downloadMetrics.avgDurationMs}ms` : '—'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Median Duration</span>
                <span className="text-2xl font-black text-indigo-700 block mt-1">
                  {downloadMetrics.medianDurationMs ? `${downloadMetrics.medianDurationMs}ms` : '—'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">P95 Latency</span>
                <span className="text-2xl font-black text-amber-700 block mt-1">
                  {downloadMetrics.p95DurationMs ? `${downloadMetrics.p95DurationMs}ms` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search customer email, product name, or IP..."
                value={downloadSearch}
                onChange={(e) => setDownloadSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
              />
              {downloadSearch && (
                <button
                  type="button"
                  onClick={() => setDownloadSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['ALL', 'SUCCESS', 'FAILED'].map(res => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => {
                      setDownloadResultFilter(res);
                      setDownloadPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      downloadResultFilter === res ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {res === 'ALL' ? 'All' : res === 'SUCCESS' ? 'Success' : 'Failed'}
                  </button>
                ))}
              </div>

              <select
                aria-label="Filter by Event Type"
                value={downloadEventTypeFilter}
                onChange={(e) => {
                  setDownloadEventTypeFilter(e.target.value);
                  setDownloadPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="ALL">All Event Types</option>
                <option value="download_completed">Completed Downloads</option>
                <option value="download_started">Started</option>
                <option value="download_failed">Failed</option>
                <option value="token_opened">Token Opened</option>
                <option value="limit_reached">Limit Reached</option>
              </select>
            </div>
          </div>

          {/* Downloads Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Product & Version</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Telemetry</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {downloadLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="animate-spin mx-auto text-indigo-600" size={24} />
                        <p className="text-xs mt-2">Loading download history...</p>
                      </td>
                    </tr>
                  ) : downloadLogs.length > 0 ? (
                    downloadLogs.map((log: any) => {
                      const custName = log.customer?.name || log.customerEmail?.split('@')[0] || 'Customer';
                      const custEmail = log.customer?.email || log.customerEmail || '—';
                      const custId = log.customerId || log.customer?.id;
                      const isSuccess = log.result === 'SUCCESS';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                {custName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                {custId ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerId(custId)}
                                    className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left block"
                                  >
                                    {custName}
                                  </button>
                                ) : (
                                  <span className="font-bold text-slate-900 block">{custName}</span>
                                )}
                                <span className="text-[11px] text-slate-400 font-mono block">{custEmail}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{log.productName || log.product?.name}</span>
                              {log.productVersion && (
                                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600">
                                  {log.productVersion}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              {log.eventType}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                              <span>{log.result}</span>
                            </span>
                            {log.failureReason && (
                              <span className="text-[10px] text-rose-500 block mt-0.5 truncate max-w-xs" title={log.failureReason}>
                                {log.failureReason}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            <div>{log.ipAddress || '—'}</div>
                            {log.durationMs > 0 && (
                              <div className="text-[10px] text-slate-400">{log.durationMs}ms latency</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {custId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCustomerId(custId)}
                                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                                >
                                  <Eye size={12} />
                                  <span>Profile</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Download className="mx-auto text-slate-300" size={32} />
                        <p className="text-xs font-bold text-slate-600 mt-2">No download activity logs found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or search query.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {downloadPagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Showing <strong className="text-slate-900">{downloadLogs.length}</strong> of{' '}
                  <strong className="text-slate-900">{downloadPagination.total}</strong> events
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={downloadPage <= 1}
                    onClick={() => setDownloadPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="font-bold text-slate-900">
                    Page {downloadPage} of {downloadPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={downloadPage >= downloadPagination.totalPages}
                    onClick={() => setDownloadPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* 2. DEDICATED NEW CUSTOMERS DATE FILTER CARD */}
      {currentView === 'new' && (
        <div className="bg-white rounded-3xl border border-indigo-100 p-4 sm:p-5 shadow-2xs space-y-3 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <UserPlus size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    New Customers Date Filters
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {dateRange === '1d' ? '⚡ 1 Day New (24h)' :
                     dateRange === '7d' ? '📅 1 Week New (7 Days)' :
                     dateRange === 'custom' ? '📆 Custom Range' : '🗓️ 30 Days New'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Filter new customer registrations and guest conversions by specific time frames.
                </p>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => handleDateRangeSelect('1d')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  dateRange === '1d'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>⚡ 1 Day New</span>
                {counters.new_1d !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    dateRange === '1d' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.new_1d}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDateRangeSelect('7d')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  dateRange === '7d'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>📅 1 Week New</span>
                {counters.new_7d !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    dateRange === '7d' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.new_7d}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDateRangeSelect('30d')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  dateRange === '30d' || !dateRange
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>🗓️ 30 Days</span>
                {counters.new_30d !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    dateRange === '30d' || !dateRange ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.new_30d}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDateRangeSelect('custom')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  dateRange === 'custom'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>📆 Custom Date</span>
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && (
            <div className="pt-3 border-t border-indigo-100/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 text-[11px] uppercase">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 text-[11px] uppercase">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyCustomDate}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white transition-colors cursor-pointer shadow-2xs"
              >
                Apply Range
              </button>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetDateFilter}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. DEDICATED RETURNING CUSTOMERS DAYS FILTER CARD */}
      {currentView === 'returning' && (
        <div className="bg-white rounded-3xl border border-emerald-100 p-4 sm:p-5 shadow-2xs space-y-3 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <UserCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    Returning Customers Frequency & Intervals
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {returningDays === '1d' ? '⚡ 1 Day Return' :
                     returningDays === '2d' ? '⚡ 2 Days Return' :
                     returningDays === '3d' ? '⚡ 3 Days Return' :
                     returningDays === '7d' ? '📅 1 Week Return' :
                     returningDays === '30d' ? '🗓️ 1 Month Return' :
                     returningDays === 'custom' ? '📆 Custom Range' : '👥 All Returning'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Filter returning shoppers by days since last return or by consecutive purchase intervals.
                </p>
              </div>
            </div>

            {/* Returning Mode Toggle + Returning Days Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Mode Toggle */}
              <div className="flex items-center bg-emerald-100/60 p-0.5 rounded-xl border border-emerald-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setReturningMode('recency')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    returningMode === 'recency' ? 'bg-white text-emerald-900 shadow-2xs font-black' : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                  title="Filter based on days since most recent purchase"
                >
                  Last Returned (Recency)
                </button>
                <button
                  type="button"
                  onClick={() => setReturningMode('gap')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    returningMode === 'gap' ? 'bg-white text-emerald-900 shadow-2xs font-black' : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                  title="Filter based on time gap between consecutive orders"
                >
                  Return Gap (Interval)
                </button>
              </div>

              {/* Quick Returning Days Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setReturningDays('');
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    returningDays === ''
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  All ({counters.returning || 0})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReturningDays('1d');
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    returningDays === '1d'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>⚡ 1 Day</span>
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-mono ${
                    returningDays === '1d' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.returning_1d || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReturningDays('2d');
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    returningDays === '2d'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>⚡ 2 Days</span>
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-mono ${
                    returningDays === '2d' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.returning_2d || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReturningDays('3d');
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    returningDays === '3d'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>⚡ 3 Days</span>
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-mono ${
                    returningDays === '3d' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.returning_3d || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReturningDays('7d');
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    returningDays === '7d'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>📅 1 Week</span>
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-mono ${
                    returningDays === '7d' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.returning_7d || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReturningDays('30d');
                    setPagination(p => ({ ...p, page: 1 }));
                  }}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    returningDays === '30d'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>🗓️ 1 Month</span>
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-mono ${
                    returningDays === '30d' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {counters.returning_30d || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReturningDays('custom')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    returningDays === 'custom'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>📆 Custom</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Inputs for Returning Days */}
          {returningDays === 'custom' && (
            <div className="pt-3 border-t border-emerald-100/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 text-[11px] uppercase">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 text-[11px] uppercase">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomDate}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white transition-colors cursor-pointer shadow-2xs"
              >
                Apply Range
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetDateFilter}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. DEDICATED GUEST BUYERS SEGMENTATION CARD */}
      {currentView === 'guest' && (
        <div className="bg-white rounded-3xl border border-amber-100 p-4 sm:p-5 shadow-2xs space-y-3 bg-gradient-to-r from-amber-50/50 via-white to-yellow-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    Guest Buyers Segmentation
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {guestFilter === 'paid' ? '💰 Paid Guests' :
                     guestFilter === 'zero_orders' ? '⚠️ Zero Orders / Incomplete' :
                     guestFilter === 'has_phone' ? '📱 With Phone' : '👥 All Guests'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Customers who checked out as guests without an existing password or account.
                </p>
              </div>
            </div>

            {/* Quick Guest Filters */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  setGuestFilter('');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  guestFilter === ''
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                All Guests ({counters.guest || 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setGuestFilter('paid');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  guestFilter === 'paid'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>💰 Paid Orders</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  guestFilter === 'paid' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {counters.guest_paid || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGuestFilter('zero_orders');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  guestFilter === 'zero_orders'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>⚠️ Zero Orders</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  guestFilter === 'zero_orders' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {counters.guest_zero_orders || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGuestFilter('has_phone');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  guestFilter === 'has_phone'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>📱 With Phone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DEDICATED UNVERIFIED CUSTOMERS VERIFICATION QUEUE CARD */}
      {currentView === 'unverified' && (
        <div className="bg-white rounded-3xl border border-orange-100 p-4 sm:p-5 shadow-2xs space-y-3 bg-gradient-to-r from-orange-50/50 via-white to-rose-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    Unverified Customers Verification Queue
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                    {unverifiedAge === '24h' ? '⚡ < 24 Hours' :
                     unverifiedAge === '7d' ? '📅 1–7 Days' :
                     unverifiedAge === '30d' ? '🗓️ 7–30 Days' :
                     unverifiedAge === 'stale' ? '⚠️ Stale (>30d)' : '👥 All Unverified'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real customer accounts pending verification. Verify with 1-click directly in each table row.
                </p>
              </div>
            </div>

            {/* Quick Age Filters */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUnverifiedAge('');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  unverifiedAge === ''
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                All ({counters.unverified || 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnverifiedAge('24h');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  unverifiedAge === '24h'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                ⚡ &lt; 24h
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnverifiedAge('7d');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  unverifiedAge === '7d'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                📅 1–7 Days
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnverifiedAge('30d');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  unverifiedAge === '30d'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                🗓️ 7–30 Days
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnverifiedAge('stale');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  unverifiedAge === 'stale'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                ⚠️ Stale (&gt;30d)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DEDICATED BLOCKED CUSTOMER DIRECTORY CARD */}
      {currentView === 'blocked' && (
        <div className="bg-white rounded-3xl border border-rose-100 p-4 sm:p-5 shadow-2xs space-y-3 bg-gradient-to-r from-rose-50/50 via-white to-red-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Ban size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm">
                    Blocked Customer Enforcement Directory
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {counters.blocked || 0} Blocked Accounts
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Restricted accounts barred from platform access, purchases, or downloads. Click <strong>Unblock</strong> to restore permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ALL CUSTOMERS VIEW: TELEMETRY & REGULARITY STRIP */}
      {(currentView === 'all' || currentView === 'details') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Activity Telemetry:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActivityFilter('');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  activityFilter === '' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Activity ({counters.all || 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityFilter('regular');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activityFilter === 'regular' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>🟢 Regular (≤7d)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  activityFilter === 'regular' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {counters.regular || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityFilter('irregular');
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activityFilter === 'irregular' ? 'bg-orange-600 text-white shadow-2xs' : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                }`}
              >
                <span>🟠 Irregular (&gt;7d)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  activityFilter === 'irregular' ? 'bg-orange-700 text-white' : 'bg-orange-200 text-orange-900'
                }`}>
                  {counters.irregular || 0}
                </span>
              </button>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            Real customers verified via login session tracking
          </span>
        </div>
      )}

      {/* STANDARD CUSTOMER TABLE VIEW */}
      {!['duplicates', 'data-requests', 'abandoned', 'activity', 'purchases', 'purchase-history', 'downloads', 'download-history'].includes(currentView) && (
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
                <option value="highest_spend">Highest Spend</option>
                <option value="lowest_spend">Lowest Spend</option>
                <option value="most_orders">Most Orders</option>
                <option value="fewest_orders">Fewest Orders</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="last_login">Recently Active</option>
                <option value="returning_recent">Returning (Recency)</option>
                <option value="returning_gap">Returning (Shortest Gap)</option>
              </select>
            </div>
          </div>

          {/* FILTER DRAWER */}
          {isFilterOpen && (
            <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
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
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Activity Regularity</label>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="">All Telemetry</option>
                    <option value="regular">Regular (≤7d)</option>
                    <option value="irregular">Irregular (&gt;7d)</option>
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
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Registration Date</label>
                  <select
                    value={dateRange}
                    onChange={(e) => handleDateRangeSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="">All Time</option>
                    <option value="1d">1 Day New (Today)</option>
                    <option value="7d">1 Week New (7 Days)</option>
                    <option value="30d">30 Days New</option>
                    <option value="custom">Custom Date Range</option>
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

              {dateRange === 'custom' && (
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px] uppercase">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px] uppercase">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCustomDate}
                    className="px-3.5 py-1.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-dark cursor-pointer shadow-2xs"
                  >
                    Apply Filter
                  </button>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={handleResetDateFilter}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MAIN CUSTOMER TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type & Regularity</th>
                  <th className="py-3 px-4">Verification</th>
                  {currentView === 'returning' && (
                    <th className="py-3 px-4 text-center">Returning Metrics</th>
                  )}
                  <th className="py-3 px-4 text-center">Paid Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={currentView === 'returning' ? 8 : 7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
                      <p className="text-xs mt-2">Loading customer records...</p>
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
                                title="Copy code"
                              >
                                {copiedCode === (c.customerCode || c.id) ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                              <span>•</span>
                              <span>{c.email}</span>
                              {c.mobile && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px]">{c.mobile}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Type & Regularity Telemetry */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              c.customerType === 'ACCOUNT' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.customerType}
                            </span>

                            {/* Regular vs Irregular Badge */}
                            {c.activityStatus === 'REGULAR' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Regular
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                Irregular
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 block">
                            {c.activitySummary || 'No recent activity recorded'}
                          </span>
                        </div>
                      </td>

                      {/* Verification Status & 1-Click Action */}
                      <td className="py-3.5 px-4">
                        {c.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                              <AlertTriangle size={10} /> Unverified
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVerifyCustomer(c.id, c.name)}
                              disabled={verifyingId === c.id}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs w-fit"
                              title="1-Click Verify Customer Account"
                            >
                              <CheckCircle2 size={10} className={verifyingId === c.id ? 'animate-spin' : ''} />
                              <span>{verifyingId === c.id ? '...' : 'Verify'}</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Returning Metrics (when in returning view) */}
                      {currentView === 'returning' && (
                        <td className="py-3.5 px-4 text-center">
                          {c.returningData?.isReturning ? (
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                                {c.returningData.lastReturnedLabel || 'Repeat Buyer'}
                              </span>
                              {c.returningData.returnGapLabel && (
                                <span className="block text-[10px] font-medium text-slate-500">
                                  {c.returningData.returnGapLabel}
                                </span>
                              )}
                              {c.returningData.avgReturnGapDays !== null && (
                                <span className="block text-[9px] text-slate-400 font-mono">
                                  Avg cycle: {c.returningData.avgReturnGapDays}d
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Single order</span>
                          )}
                        </td>
                      )}

                      {/* Paid Orders */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {c.paidOrdersCount || 0}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(c.totalSpent || 0)}
                      </td>

                      {/* Status & Block enforcement scope */}
                      <td className="py-3.5 px-4 text-center">
                        {c.status === 'BLOCKED' ? (
                          <div className="text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 block mx-auto w-fit">
                              BLOCKED
                            </span>
                            <span className="text-[9px] text-rose-600 font-bold block mt-0.5">
                              Scope: {c.blockScope || 'FULL'}
                            </span>
                            {c.blockReason && (
                              <span className="text-[9px] text-slate-400 block truncate max-w-[110px] mx-auto" title={c.blockReason}>
                                {c.blockReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerId(c.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                              currentView === 'details'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-primary hover:text-white text-slate-700'
                            }`}
                          >
                            <Eye size={12} />
                            <span>{currentView === 'details' ? 'Inspect Details' : 'Profile'}</span>
                          </button>

                          {/* Block or Unblock Action Button */}
                          {c.status === 'BLOCKED' ? (
                            <button
                              type="button"
                              onClick={() => handleUnblockCustomer(c.id, c.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Restore customer account permissions"
                            >
                              <CheckCircle2 size={12} />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenBlockModal(c)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Block customer account"
                            >
                              <Ban size={12} />
                              <span>Block</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={currentView === 'returning' ? 8 : 7} className="py-12 text-center text-slate-400">
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

      {/* CUSTOMER BLOCK MODAL */}
      {blockModalOpen && blockingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Block Customer Account</h3>
                  <p className="text-xs text-slate-500">Apply administrative restrictions on this profile.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target customer card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{blockingCustomer.name}</span>
                <span className="font-mono text-[11px] text-slate-400">{blockingCustomer.customerCode || blockingCustomer.id.slice(0, 8)}</span>
              </div>
              <p className="text-slate-500">{blockingCustomer.email}</p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-600">
                <span>Lifetime spend: <strong className="text-slate-900">{formatCurrency(blockingCustomer.totalSpent || 0)}</strong></span>
                <span>•</span>
                <span>Orders: <strong className="text-slate-900">{blockingCustomer.paidOrdersCount || 0}</strong></span>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Enforcement Scope
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { scope: 'FULL', label: 'Full Lockout', desc: 'Login, Purchases, & Downloads' },
                  { scope: 'PURCHASES', label: 'Block Purchases', desc: 'Prevent checkout & payments' },
                  { scope: 'LOGIN', label: 'Block Login', desc: 'Disallow portal authentication' }
                ].map(s => (
                  <button
                    key={s.scope}
                    type="button"
                    onClick={() => setBlockScope(s.scope as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      blockScope === s.scope
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-black text-slate-900 block text-xs">{s.label}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Reason for Block <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Chargeback risk, abusive behavior, fraud detection, policy violation..."
                rows={3}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                disabled={blockLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBlock}
                disabled={blockLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Ban size={14} className={blockLoading ? 'animate-spin' : ''} />
                <span>{blockLoading ? 'Blocking Customer...' : 'Confirm Block'}</span>
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

      {/* ORDER DETAIL MODAL (FOR PURCHASE HISTORY) */}
      {selectedOrderId && (
        <AdminOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRefresh={() => {
            if (currentView === 'purchases' || currentView === 'purchase-history') {
              fetchSubViewData();
            }
          }}
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
