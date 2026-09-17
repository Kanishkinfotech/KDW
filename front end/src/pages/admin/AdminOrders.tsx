import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search, Download, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Eye, Copy, Check, AlertCircle, CheckCircle2,
  Calendar, FileText, X, Clock, CheckCircle, XCircle, Ban, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatCurrency } from '../../utils/currency';
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal';

interface AdminOrdersProps {
  defaultView?: string;
}

export default function AdminOrders({ defaultView }: AdminOrdersProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Resolve Effective View from Route path, defaultView prop, or Query Params
  const currentView = useMemo(() => {
    if (defaultView) return defaultView.toLowerCase();
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/new')) return 'new';
    if (path.endsWith('/pending')) return 'pending';
    if (path.endsWith('/completed')) return 'completed';
    if (path.endsWith('/failed')) return 'failed';
    if (path.endsWith('/all')) return '';

    const paramView = searchParams.get('view');
    if (paramView) return paramView.toLowerCase();

    const paramStatus = searchParams.get('status')?.toUpperCase();
    if (paramStatus === 'COMPLETED' || paramStatus === 'PAID') return 'completed';
    if (paramStatus === 'PENDING' || paramStatus === 'PENDING_PAYMENT') return 'pending';
    if (paramStatus === 'NEW') return 'new';
    if (paramStatus === 'FAILED') return 'failed';

    return '';
  }, [defaultView, location.pathname, searchParams]);

  // 2. Orders & Counters State
  const [orders, setOrders] = useState<any[]>([]);
  const [counters, setCounters] = useState<any>({
    all: 0,
    new_orders: 0,
    pending_orders: 0,
    completed: 0,
    pending_payment: 0,
    payment_review: 0,
    paid: 0,
    awaiting_fulfilment: 0,
    failed: 0,
    cancelled: 0,
    refunded: 0,
    disputed: 0,
    without_access: 0
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // 3. Date Presets & Filters State
  // Presets: 'all' | '1day' | '7days' | 'custom'
  const [datePreset, setDatePreset] = useState<'all' | '1day' | '7days' | 'custom'>(() => {
    const p = searchParams.get('datePreset') || searchParams.get('days');
    if (p === '1' || p === '1day' || p === 'today') return '1day';
    if (p === '7' || p === '7days') return '7days';
    if (searchParams.get('startDate') || searchParams.get('endDate')) return 'custom';
    return 'all';
  });

  const [filterStartDate, setFilterStartDate] = useState(searchParams.get('startDate') || '');
  const [filterEndDate, setFilterEndDate] = useState(searchParams.get('endDate') || '');

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterOrderStatus, setFilterOrderStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterAccessStatus, setFilterAccessStatus] = useState('');
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('newest');

  // Modals & Selected Order
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // 4. Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params: any = {
        page,
        limit,
        sortBy: filterSortBy
      };

      if (currentView) params.view = currentView;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterOrderStatus) params.orderStatus = filterOrderStatus;
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      if (filterAccessStatus) params.accessStatus = filterAccessStatus;
      if (filterCustomerType) params.customerType = filterCustomerType;

      // Date filter applies only when New Orders view is active
      if (currentView === 'new') {
        if (datePreset === '1day') {
          params.datePreset = '1day';
        } else if (datePreset === '7days') {
          params.datePreset = '7days';
        } else if (datePreset === 'custom') {
          if (filterStartDate) params.startDate = filterStartDate;
          if (filterEndDate) params.endDate = filterEndDate;
        }
      }

      const res = await axios.get('/api/admin/orders', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalOrders(res.data.pagination.total || 0);
        if (res.data.counters) {
          setCounters(res.data.counters);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch admin orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, currentView, searchTerm, filterOrderStatus, filterPaymentStatus, filterAccessStatus, filterCustomerType, filterSortBy, datePreset, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Order Number copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectView = (viewKey: string) => {
    setPage(1);
    if (viewKey !== 'new') {
      setDatePreset('all');
      setFilterStartDate('');
      setFilterEndDate('');
    }
    if (!viewKey || viewKey === 'all') {
      navigate('/admin/orders');
    } else if (['new', 'pending', 'completed', 'failed'].includes(viewKey)) {
      navigate(`/admin/orders/${viewKey}`);
    } else {
      navigate(`/admin/orders?view=${viewKey}`);
    }
  };

  const handleSelectDatePreset = (preset: 'all' | '1day' | '7days' | 'custom') => {
    setDatePreset(preset);
    setPage(1);
    if (preset !== 'custom') {
      setFilterStartDate('');
      setFilterEndDate('');
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/orders/export', {
        params: {
          view: currentView,
          datePreset: datePreset !== 'custom' ? datePreset : undefined,
          startDate: datePreset === 'custom' ? filterStartDate : undefined,
          endDate: datePreset === 'custom' ? filterEndDate : undefined
        },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kwd_${currentView || 'all'}_orders_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Orders exported successfully!');
    } catch (err) {
      toast.error('Failed to export orders CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchFulfil = async () => {
    try {
      setIsBatchProcessing(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/orders/batch-fulfil', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Batch fulfilment completed successfully!');
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Batch fulfilment failed');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterOrderStatus('');
    setFilterPaymentStatus('');
    setFilterAccessStatus('');
    setFilterCustomerType('');
    setFilterStartDate('');
    setFilterEndDate('');
    setDatePreset('all');
    setFilterSortBy('newest');
    setSearchParams({});
    setPage(1);
    if (currentView) {
      navigate('/admin/orders');
    }
  };

  // 5. Header contextual metadata
  const headerMeta = useMemo(() => {
    switch (currentView) {
      case 'new':
        return {
          title: 'New Orders',
          subtitle: 'Recent customer orders placed within the last 24 hours (today) or incoming queue.',
          icon: Sparkles,
          color: 'text-sky-600',
          badge: 'New Incoming (Last 24h)'
        };
      case 'pending':
        return {
          title: 'Pending Orders',
          subtitle: 'Orders where customer added products to cart and proceeded to checkout but did not complete the payment.',
          icon: Clock,
          color: 'text-amber-600',
          badge: 'Awaiting Payment'
        };
      case 'completed':
        return {
          title: 'Completed Orders',
          subtitle: 'Orders with confirmed payment, captured funds, and provisioned digital download entitlements.',
          icon: CheckCircle,
          color: 'text-emerald-600',
          badge: 'Paid & Fulfilled'
        };
      case 'failed':
        return {
          title: 'Failed Orders',
          subtitle: 'Orders that failed during payment gateway processing, authentication, or token creation.',
          icon: XCircle,
          color: 'text-rose-600',
          badge: 'Payment & Fulfilment Failures'
        };
      default:
        return {
          title: 'Orders Management',
          subtitle: 'Operational dashboard for digital purchases, entitlements, licences, fulfilment, and refunds.',
          icon: FileText,
          color: 'text-blue-600',
          badge: 'Master Order Registry'
        };
    }
  }, [currentView]);

  const HeaderIcon = headerMeta.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <HeaderIcon className={headerMeta.color} size={26} />
              {headerMeta.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {totalOrders} order{totalOrders === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {headerMeta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={15} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* PRIMARY ORDER SUB-VIEW TABS */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto custom-scrollbar">
        {[
          { id: '', label: 'All Orders', count: counters.all },
          { id: 'new', label: 'New Orders', count: counters.new_orders },
          { id: 'pending', label: 'Pending Orders', count: counters.pending_orders || counters.pending_payment },
          { id: 'completed', label: 'Completed Orders', count: counters.completed || counters.paid },
          { id: 'failed', label: 'Failed Orders', count: counters.failed }
        ].map(tab => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LIVE STATUS COUNTERS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { id: '', label: 'All Orders', count: counters.all, color: 'border-slate-200 bg-white text-slate-900' },
          { id: 'new', label: 'New Orders (24h)', count: counters.new_orders, color: 'border-sky-200 bg-sky-50/50 text-sky-950' },
          { id: 'pending', label: 'Pending Orders', count: counters.pending_orders || counters.pending_payment, color: 'border-amber-200 bg-amber-50/50 text-amber-950' },
          { id: 'completed', label: 'Completed / Paid', count: counters.completed || counters.paid, color: 'border-emerald-200 bg-emerald-50/50 text-emerald-950' },
          { id: 'refunded', label: 'Refunded', count: counters.refunded, color: 'border-purple-200 bg-purple-50/50 text-purple-950' },
          { id: 'failed', label: 'Failed', count: counters.failed, color: 'border-rose-200 bg-rose-50/50 text-rose-950' }
        ].map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectView(item.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${item.color} ${
                isActive ? 'ring-2 ring-blue-600 ring-offset-1 font-bold shadow-xs' : 'hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70 truncate">{item.label}</span>
              <span className="text-lg font-black block mt-0.5">{item.count}</span>
            </button>
          );
        })}
      </div>

      {/* DATE RANGE FILTER BAR: SHOWN ONLY WHEN NEW ORDERS IS CLICKED */}
      {currentView === 'new' && (
        <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            
            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
                <Calendar size={13} className="text-blue-600" />
                Date Filter:
              </span>

              <button
                type="button"
                onClick={() => handleSelectDatePreset('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  datePreset === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Time
              </button>

              <button
                type="button"
                onClick={() => handleSelectDatePreset('1day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  datePreset === '1day'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Clock size={12} />
                1 Day Orders (Today)
              </button>

              <button
                type="button"
                onClick={() => handleSelectDatePreset('7days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  datePreset === '7days'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar size={12} />
                Latest 7 Days Orders
              </button>

              <button
                type="button"
                onClick={() => handleSelectDatePreset('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  datePreset === 'custom'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Custom Date Orders
              </button>
            </div>

            {/* Active Date Indicator / Clear */}
            {datePreset !== 'all' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 flex items-center gap-1.5">
                  <Calendar size={12} />
                  {datePreset === '1day' && 'Filtered: Past 24 Hours / Today'}
                  {datePreset === '7days' && 'Filtered: Latest 7 Days'}
                  {datePreset === 'custom' && (
                    filterStartDate || filterEndDate 
                      ? `Custom: ${filterStartDate || 'Start'} to ${filterEndDate || 'Today'}` 
                      : 'Custom Range Selected'
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectDatePreset('all')}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Reset date filter"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Custom Date Pickers Drawer */}
          {datePreset === 'custom' && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">From:</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">To:</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(filterStartDate || filterEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setPage(1);
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-rose-600 text-xs font-bold transition-colors"
                >
                  Clear Dates
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTROLS BAR: SEARCH, FILTERS & SORT */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Order #, Email, Name, Razorpay ID, Licence..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                showFilters || filterOrderStatus || filterPaymentStatus || filterAccessStatus || filterCustomerType
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              Filters
              {(filterOrderStatus || filterPaymentStatus || filterAccessStatus || filterCustomerType) && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={filterSortBy}
                onChange={(e) => {
                  setFilterSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_amount">Highest Amount</option>
                <option value="lowest_amount">Lowest Amount</option>
                <option value="recently_paid">Recently Paid</option>
                <option value="longest_pending">Longest Pending</option>
              </select>
            </div>

            {(searchTerm || filterOrderStatus || filterPaymentStatus || filterAccessStatus || filterCustomerType || currentView || datePreset !== 'all') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2.5 text-slate-400 hover:text-rose-600 rounded-2xl hover:bg-rose-50 transition-colors cursor-pointer"
                title="Clear all filters & return to All Orders"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* EXPANDABLE MULTI-FILTER DRAWER */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Order Status</label>
              <select
                value={filterOrderStatus}
                onChange={(e) => { setFilterOrderStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="">All Order Statuses</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAYMENT_REVIEW">Payment Review</option>
                <option value="PAID">Paid</option>
                <option value="FULFILMENT_PROCESSING">Fulfilment Processing</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                <option value="DISPUTED">Disputed</option>
                <option value="ACCESS_REVOKED">Access Revoked</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Payment Status</label>
              <select
                value={filterPaymentStatus}
                onChange={(e) => { setFilterPaymentStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="">All Payment Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="CAPTURED">Captured / Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                <option value="DISPUTED">Disputed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Access Status</label>
              <select
                value={filterAccessStatus}
                onChange={(e) => { setFilterAccessStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="">All Access States</option>
                <option value="NOT_GRANTED">Not Granted</option>
                <option value="ACTIVE">Active</option>
                <option value="REVOKED">Revoked</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Customer Type</label>
              <select
                value={filterCustomerType}
                onChange={(e) => { setFilterCustomerType(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="">All Types</option>
                <option value="ACCOUNT">Registered Account</option>
                <option value="GUEST">Guest Checkout</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* OPERATIONAL ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="animate-spin mx-auto text-blue-600" size={28} />
            <p className="text-sm font-medium">Loading orders from database...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <AlertCircle className="mx-auto text-slate-400" size={32} />
            <h3 className="font-bold text-slate-800 text-base">No orders found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No orders matched your active filters, date preset, or search criteria. Try selecting "All Time" or resetting filters.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Order Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Products / Bundles</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-center">Fulfilment</th>
                  <th className="py-3.5 px-4 text-center">Access</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o: any) => {
                  const customerName = o.guestName || o.customer?.name || 'Guest';
                  const email = o.guestEmail || o.customer?.email || 'N/A';

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* Order Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(o.id)}
                            className="font-mono font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer text-xs"
                          >
                            {o.orderNumber}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(o.orderNumber, o.id)}
                            className="p-1 text-slate-300 group-hover:text-slate-500 rounded hover:bg-slate-200/50 transition-colors"
                            title="Copy Order ID"
                          >
                            {copiedId === o.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                        {o.isHighValue && (
                          <span className="inline-block px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-100 text-amber-900 mt-1">
                            High Value
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-[140px]">{customerName}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">{email}</span>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-sm mt-0.5 ${
                          o.customerType === 'ACCOUNT' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {o.customerType === 'ACCOUNT' ? 'Account' : 'Guest'}
                        </span>
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 shrink-0">
                            {o.items?.slice(0, 3).map((item: any) => (
                              <img
                                key={item.id}
                                src={item.product?.thumbnail || item.bundle?.coverImage || '/placeholder.png'}
                                alt=""
                                className="w-7 h-7 rounded-lg object-cover border-2 border-white shadow-2xs bg-slate-100"
                              />
                            ))}
                          </div>
                          <div className="truncate max-w-[160px]">
                            <span className="font-bold text-slate-800 block truncate">
                              {o.items[0]?.productName || 'Product Asset'}
                            </span>
                            {o.items.length > 1 && (
                              <span className="text-[10px] text-slate-400 font-bold block">
                                + {o.items.length - 1} more items
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900 text-sm block">{formatCurrency(o.totalAmount)}</span>
                        {o.refundedAmount > 0 && (
                          <span className="text-[10px] text-purple-600 font-bold block">
                            Ref: -{formatCurrency(o.refundedAmount)}
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          o.paymentStatus === 'PAID' || o.paymentStatus === 'CAPTURED' ? 'bg-emerald-100 text-emerald-800' :
                          o.paymentStatus === 'REFUNDED' ? 'bg-purple-100 text-purple-800' :
                          o.paymentStatus === 'PARTIALLY_REFUNDED' ? 'bg-indigo-100 text-indigo-800' :
                          o.paymentStatus === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>

                      {/* Fulfilment Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          o.fulfilmentStatus === 'FULFILLED' ? 'bg-blue-100 text-blue-800' :
                          o.fulfilmentStatus === 'PROCESSING' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                          o.fulfilmentStatus === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {o.fulfilmentStatus}
                        </span>
                      </td>

                      {/* Access Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          o.accessStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          o.accessStatus === 'REVOKED' ? 'bg-rose-100 text-rose-800' :
                          o.accessStatus === 'EXPIRED' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.accessStatus}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <span className="block font-bold text-slate-800">{new Date(o.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] block opacity-70">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(o.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition-colors cursor-pointer"
                            title="View Full Order Diagnostics & Actions"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <span className="font-bold text-slate-900">{orders.length}</span> of{' '}
            <span className="font-bold text-slate-900">{totalOrders}</span> orders
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>

            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-2 font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE ORDER DETAIL MODAL */}
      {selectedOrderId && (
        <AdminOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
}
