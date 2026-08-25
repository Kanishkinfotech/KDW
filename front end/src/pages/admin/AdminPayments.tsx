import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ChevronRight,
  DollarSign,
  FileText,
  SlidersHorizontal,
  Activity,
  Layers,
  Scale,
  Settings as SettingsIcon,
  RotateCcw,
  Send,
  User,
  ShoppingBag,
  TrendingUp,
  Percent,
  Lock,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';
import { AdminPaymentDetailModal } from '../../components/admin/AdminPaymentDetailModal';
import { PaymentRefundModal } from '../../components/admin/PaymentRefundModal';
import { DisputeEvidenceModal } from '../../components/admin/DisputeEvidenceModal';
import { ReconciliationModal } from '../../components/admin/ReconciliationModal';

export default function AdminPayments() {
  // Navigation & Sub-View state
  const [activeView, setActiveView] = useState<string>('overview');

  // Data states
  const [payments, setPayments] = useState<any[]>([]);
  const [counters, setCounters] = useState<any>({
    attempts: 0,
    successful: 0,
    successRate: 0,
    capturedValue: 0,
    failedCount: 0,
    failedValue: 0,
    pendingVerification: 0,
    refundedValue: 0,
    activeDisputes: 0,
    webhookFailures: 0,
    unreconciledCount: 0
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [fraudList, setFraudList] = useState<any[]>([]);
  const [gatewaySettings, setGatewaySettings] = useState<any>(null);

  // Pagination & Filtering
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Advanced Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('');
  const [fulfilmentFilter, setFulfilmentFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals state
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [refundModalOpen, setRefundModalOpen] = useState<boolean>(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<any>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState<boolean>(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState<boolean>(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Main Data Fetcher
  useEffect(() => {
    fetchViewData();
  }, [
    activeView,
    page,
    debouncedSearch,
    statusFilter,
    verificationFilter,
    fulfilmentFilter,
    methodFilter,
    minAmount,
    maxAmount,
    startDate,
    endDate
  ]);

  const fetchViewData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Analytics & Counters
      const [paymentsRes, analyticsRes] = await Promise.all([
        axios.get('/api/admin/payments', {
          params: {
            view: activeView !== 'overview' && activeView !== 'transactions' ? activeView : undefined,
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
            verificationStatus: verificationFilter || undefined,
            fulfilmentStatus: fulfilmentFilter || undefined,
            method: methodFilter || undefined,
            minAmount: minAmount || undefined,
            maxAmount: maxAmount || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page,
            limit: 20
          }
        }),
        axios.get('/api/admin/payments/analytics')
      ]);

      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.payments || []);
        setCounters(paymentsRes.data.counters || counters);
        setTotalPages(paymentsRes.data.pagination?.totalPages || 1);
      }

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }

      // 2. Fetch specific subview datasets
      if (activeView === 'webhooks') {
        const whRes = await axios.get('/api/admin/payments/webhooks');
        if (whRes.data.success) setWebhookEvents(whRes.data.events || []);
      } else if (activeView === 'refunds') {
        const refRes = await axios.get('/api/admin/payments/refunds');
        if (refRes.data.success) setRefunds(refRes.data.refunds || []);
      } else if (activeView === 'disputes') {
        const dispRes = await axios.get('/api/admin/payments/disputes');
        if (dispRes.data.success) setDisputes(dispRes.data.disputes || []);
      } else if (activeView === 'settlements') {
        const setRes = await axios.get('/api/admin/payments/settlements');
        if (setRes.data.success) setSettlements(setRes.data.settlements || []);
      } else if (activeView === 'reconciliation') {
        const recRes = await axios.get('/api/admin/payments/reconciliation');
        if (recRes.data.success) setReconciliations(recRes.data.records || []);
      } else if (activeView === 'fraud') {
        const fraudRes = await axios.get('/api/admin/payments/fraud-risk');
        if (fraudRes.data.success) setFraudList(fraudRes.data.flagged || []);
      } else if (activeView === 'settings') {
        const setgRes = await axios.get('/api/admin/payments/settings');
        if (setgRes.data.success) setGatewaySettings(setgRes.data.settings);
      }

    } catch (err: any) {
      console.error('Failed to fetch payment data:', err);
      toast.error(err.response?.data?.message || 'Error loading payment module data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: string = 'transactions') => {
    window.open(`/api/admin/payments/export?type=${type}`, '_blank');
    toast.success('Payments CSV export initiated');
  };

  const handleAutoReconcile = async () => {
    try {
      const res = await axios.post('/api/admin/payments/reconciliation/auto');
      if (res.data.success) {
        toast.success(`Reconciliation Complete: ${res.data.matchedCount} matched, ${res.data.mismatchCount} discrepancies`);
        fetchViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Auto reconciliation failed');
    }
  };

  const handleReplayWebhook = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/payments/webhooks/${id}/replay`);
      if (res.data.success) {
        toast.success(res.data.message || 'Webhook replayed successfully!');
        fetchViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to replay webhook');
    }
  };

  const handleUpdateRisk = async (id: string, riskScore: string) => {
    try {
      const res = await axios.post(`/api/admin/payments/fraud-risk/${id}/state`, { riskScore });
      if (res.data.success) {
        toast.success(`Risk state updated to ${riskScore}`);
        fetchViewData();
      }
    } catch (err: any) {
      toast.error('Failed to update risk score');
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setVerificationFilter('');
    setFulfilmentFilter('');
    setMethodFilter('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setPage(1);
    setFilterDrawerOpen(false);
  };

  const subViews = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'All Transactions' },
    { id: 'successful', label: 'Successful Payments' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'failed', label: 'Failed Payments' },
    { id: 'verification', label: 'Payment Verification' },
    { id: 'webhooks', label: 'Webhook Events' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'disputes', label: 'Disputes' },
    { id: 'settlements', label: 'Settlements' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'methods', label: 'Payment Methods' },
    { id: 'fraud', label: 'Fraud & Risk' },
    { id: 'reports', label: 'Payment Reports' },
    { id: 'settings', label: 'Gateway Settings' }
  ];

  return (
    <div className="space-y-6 pb-16 text-slate-800">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Payments & Gateway Operations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
              Razorpay Live Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stateful multi-gateway payment processing, dual verification, webhooks, refunds, disputes, and automated reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExport(activeView)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 px-3.5 rounded-xl shadow-sm transition-colors text-xs flex items-center gap-1.5"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={fetchViewData}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm transition-colors"
            title="Refresh payments"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-600' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Clickable Live KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        <button
          onClick={() => { setActiveView('transactions'); resetFilters(); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeView === 'transactions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border-indigo-600' : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeView === 'transactions' ? 'text-indigo-200' : 'text-slate-500'}`}>
              Attempts
            </span>
            <Activity size={16} className={activeView === 'transactions' ? 'text-indigo-200' : 'text-slate-400'} />
          </div>
          <p className={`text-xl font-black mt-2 ${activeView === 'transactions' ? 'text-white' : 'text-slate-900'}`}>
            {counters.attempts}
          </p>
        </button>

        <button
          onClick={() => { setActiveView('successful'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeView === 'successful' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border-emerald-600' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeView === 'successful' ? 'text-emerald-200' : 'text-slate-500'}`}>
              Captured ({counters.successRate}%)
            </span>
            <CheckCircle size={16} className={activeView === 'successful' ? 'text-emerald-200' : 'text-emerald-500'} />
          </div>
          <p className={`text-xl font-black mt-2 ${activeView === 'successful' ? 'text-white' : 'text-emerald-700'}`}>
            {formatCurrency(counters.capturedValue)}
          </p>
        </button>

        <button
          onClick={() => { setActiveView('failed'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeView === 'failed' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 border-rose-600' : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeView === 'failed' ? 'text-rose-200' : 'text-slate-500'}`}>
              Failed ({counters.failedCount})
            </span>
            <XCircle size={16} className={activeView === 'failed' ? 'text-rose-200' : 'text-rose-500'} />
          </div>
          <p className={`text-xl font-black mt-2 ${activeView === 'failed' ? 'text-white' : 'text-rose-700'}`}>
            {formatCurrency(counters.failedValue)}
          </p>
        </button>

        <button
          onClick={() => { setActiveView('refunds'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeView === 'refunds' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 border-purple-600' : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeView === 'refunds' ? 'text-purple-200' : 'text-slate-500'}`}>
              Refunded
            </span>
            <RotateCcw size={16} className={activeView === 'refunds' ? 'text-purple-200' : 'text-purple-500'} />
          </div>
          <p className={`text-xl font-black mt-2 ${activeView === 'refunds' ? 'text-white' : 'text-purple-700'}`}>
            {formatCurrency(counters.refundedValue)}
          </p>
        </button>

        <button
          onClick={() => { setActiveView('reconciliation'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeView === 'reconciliation' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 border-amber-600' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeView === 'reconciliation' ? 'text-amber-200' : 'text-slate-500'}`}>
              Unreconciled
            </span>
            <Scale size={16} className={activeView === 'reconciliation' ? 'text-amber-200' : 'text-amber-500'} />
          </div>
          <p className={`text-xl font-black mt-2 ${activeView === 'reconciliation' ? 'text-white' : 'text-amber-800'}`}>
            {counters.unreconciledCount} Record(s)
          </p>
        </button>

      </div>

      {/* 3. Sub-View Horizontal Tabs */}
      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto pb-px">
        {subViews.map((sub) => (
          <button
            key={sub.id}
            onClick={() => { setActiveView(sub.id); setPage(1); }}
            className={`py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeView === sub.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* 4. VIEW: OVERVIEW */}
      {activeView === 'overview' && analytics && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Visual Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Captured</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs flex items-center gap-1">
                  <TrendingUp size={14} /> {analytics.successRate}% Success
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(analytics.capturedValue)}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${analytics.successRate}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">From {analytics.capturedCount} completed checkouts</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Retained Revenue</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs">
                  After Refunds
                </span>
              </div>
              <p className="text-2xl font-black text-indigo-600">{formatCurrency(analytics.netCapturedValue)}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${100 - analytics.refundRate}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Refund Rate: {analytics.refundRate}% ({formatCurrency(analytics.refundValue)})</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reconciliation & Fulfilment</span>
                <span className="p-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs">
                  {analytics.fulfilmentRate}% Fulfilled
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">{analytics.reconciliationRate}% Reconciled</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${analytics.reconciliationRate}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Auto-matched with payment gateway settlements</p>
            </div>

          </div>

          {/* Payment Methods & Failure Categorization Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Payment Methods */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-600" />
                <span>Payment Method Distribution</span>
              </h3>

              <div className="space-y-3">
                {analytics.methods?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No method data recorded yet</p>
                ) : (
                  analytics.methods.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{m.method}</span>
                        <span className="text-slate-400 block text-[11px]">{m.count} transaction(s)</span>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(m.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Failure Categories */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <XCircle size={16} className="text-rose-600" />
                <span>Gateway Failure Reasons</span>
              </h3>

              <div className="space-y-3">
                {analytics.failureCategories?.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-semibold text-center py-6">
                    🎉 No payment failures recorded
                  </p>
                ) : (
                  analytics.failureCategories.map((f: any, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-900">{f.category}</span>
                      <span className="font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">{f.count} Failed</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 5. VIEW: ALL TRANSACTIONS / SUCCESSFUL / PENDING / FAILED / VERIFICATION */}
      {['transactions', 'successful', 'pending', 'failed', 'verification'].includes(activeView) && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Payment ID, Razorpay ID, Order No, Customer Email..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                className={`py-2.5 px-3.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
                  filterDrawerOpen || statusFilter || verificationFilter || minAmount || startDate
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
            </div>
          </div>

          {/* Expandable Filter Drawer */}
          {filterDrawerOpen && (
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="CAPTURED">Captured</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Verification</label>
                <select
                  value={verificationFilter}
                  onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">All Verification</option>
                  <option value="FULLY_VERIFIED">Fully Verified</option>
                  <option value="SIGNATURE_VERIFIED">Signature Verified</option>
                  <option value="VERIFICATION_FAILED">Failed</option>
                  <option value="NOT_VERIFIED">Not Verified</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                  placeholder="e.g. 500"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Transactions Data Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Payment Ref</th>
                    <th className="py-3 px-4">Order / Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Fulfilment</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                        No transaction records matching filter criteria
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.razorpayPaymentId || p.id.slice(0, 14) + '...'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.order?.orderNumber}</p>
                          <p className="text-slate-400 text-[11px]">{p.order?.guestEmail || p.customer?.email}</p>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {p.method || 'RAZORPAY'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            p.status === 'CAPTURED' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                            p.status === 'REFUNDED' ? 'bg-purple-100 text-purple-800' :
                            p.status === 'PARTIALLY_REFUNDED' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                            p.verificationStatus === 'FULLY_VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            p.verificationStatus === 'SIGNATURE_VERIFIED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            p.verificationStatus === 'VERIFICATION_FAILED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {p.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {p.fulfilmentStatus || 'NOT_STARTED'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => { setSelectedPaymentId(p.id); setDetailModalOpen(true); }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs"
                          >
                            Diagnostics
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Strip */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs font-semibold">
                <span className="text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 6. VIEW: WEBHOOK EVENTS */}
      {activeView === 'webhooks' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">External Event ID</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Received Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Signature Valid</th>
                    <th className="py-3 px-4">Failure Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {webhookEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-sans font-semibold">
                        No webhook events recorded in registry
                      </td>
                    </tr>
                  ) : (
                    webhookEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors font-sans">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {evt.externalEventId || evt.id.slice(0, 14)}
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {evt.eventType}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(evt.receivedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            evt.status === 'PROCESSED' ? 'bg-emerald-100 text-emerald-800' :
                            evt.status === 'REPLAYED' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {evt.signatureValid ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={12} /> Valid</span>
                          ) : (
                            <span className="text-rose-600 font-bold flex items-center gap-1"><XCircle size={12} /> Failed</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {evt.failureReason || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleReplayWebhook(evt.id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw size={12} />
                            Replay
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW: REFUNDS */}
      {activeView === 'refunds' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Refund ID</th>
                    <th className="py-3 px-4">Order / Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Access Revoked</th>
                    <th className="py-3 px-4">Processed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refunds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">
                        No refunds processed
                      </td>
                    </tr>
                  ) : (
                    refunds.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {r.razorpayRefundId || r.id.slice(0, 14)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{r.order?.orderNumber}</p>
                          <p className="text-slate-400 text-[11px]">{r.order?.guestEmail}</p>
                        </td>
                        <td className="py-3 px-4 font-black text-rose-600">
                          {formatCurrency(r.amount)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate">
                          {r.reason || 'Customer request'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-purple-100 text-purple-800">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {r.accessRevoked ? (
                            <span className="text-rose-600 font-bold">Yes (Revoked)</span>
                          ) : (
                            <span className="text-slate-500 font-semibold">No (Preserved)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. VIEW: DISPUTES */}
      {activeView === 'disputes' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Dispute ID</th>
                    <th className="py-3 px-4">Order / Customer</th>
                    <th className="py-3 px-4">Disputed Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Evidence Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disputes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">
                        No active chargebacks or disputes on record
                      </td>
                    </tr>
                  ) : (
                    disputes.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {d.razorpayDisputeId || d.id.slice(0, 14)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{d.order?.orderNumber}</p>
                          <p className="text-slate-400 text-[11px]">{d.order?.guestEmail}</p>
                        </td>
                        <td className="py-3 px-4 font-black text-amber-700">
                          {formatCurrency(d.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-100 text-amber-800">
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {d.evidenceStatus}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {d.deadlineAt ? new Date(d.deadlineAt).toLocaleDateString() : '7 Days'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => { setSelectedDispute(d); setDisputeModalOpen(true); }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors text-xs"
                          >
                            Evidence Dossier
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. VIEW: RECONCILIATION */}
      {activeView === 'reconciliation' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Automated Settlement Reconciliation</h3>
              <p className="text-xs text-slate-500">Cross-checks database capture registers against gateway settlements.</p>
            </div>
            <button
              onClick={handleAutoReconcile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw size={14} />
              Run Auto-Reconcile Job
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Internal Record</th>
                    <th className="py-3 px-4">Gateway Reference</th>
                    <th className="py-3 px-4">Expected Amount</th>
                    <th className="py-3 px-4">Actual Amount</th>
                    <th className="py-3 px-4">Difference</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciliations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">
                        No reconciliation records logged yet
                      </td>
                    </tr>
                  ) : (
                    reconciliations.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {rec.internalRecordId.slice(0, 14)}...
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {rec.externalRecordId}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatCurrency(rec.expectedAmount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatCurrency(rec.actualAmount)}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-600">
                          {formatCurrency(rec.difference)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            rec.status === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' :
                            rec.status === 'RESOLVED' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {rec.status !== 'MATCHED' && rec.status !== 'RESOLVED' && (
                            <button
                              onClick={() => { setSelectedReconciliation(rec); setReconciliationModalOpen(true); }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors text-xs"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 10. VIEW: FRAUD & RISK */}
      {activeView === 'fraud' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Payment Ref</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Risk State</th>
                    <th className="py-3 px-4">Risk Reason</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fraudList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">
                        🎉 No transactions flagged for high risk
                      </td>
                    </tr>
                  ) : (
                    fraudList.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {f.razorpayPaymentId || f.id.slice(0, 14)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {f.order?.guestEmail || f.customer?.email}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          {formatCurrency(f.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                            {f.riskScore}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {f.riskReason || 'High value check'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleUpdateRisk(f.id, 'CLEARED')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-bold text-[11px]"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => handleUpdateRisk(f.id, 'BLOCKED')}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-bold text-[11px]"
                          >
                            Block
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 11. VIEW: GATEWAY SETTINGS */}
      {activeView === 'settings' && gatewaySettings && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5 animate-in fade-in duration-200 text-xs">
          <div>
            <h3 className="font-bold text-base text-slate-900">Payment Gateway Configuration</h3>
            <p className="text-slate-500 mt-0.5">Manage Razorpay API and raw webhook listener settings.</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Key ID (Public)</label>
              <input
                type="text"
                disabled
                value={gatewaySettings.keyId || 'rzp_live_masked'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-600 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Key Secret (Masked)</label>
              <input
                type="password"
                disabled
                value="••••••••••••••••••••••••"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Webhook Endpoint URL</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700 font-bold flex items-center justify-between">
                <span>/api/payments/webhook</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-sans">Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Capture Mode</label>
                <select
                  value={gatewaySettings.captureMode || 'AUTO'}
                  onChange={(e) => setGatewaySettings({ ...gatewaySettings, captureMode: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  <option value="AUTO">Automatic (Instant)</option>
                  <option value="MANUAL">Manual Review</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Environment</label>
                <select
                  value={gatewaySettings.environment || 'LIVE'}
                  onChange={(e) => setGatewaySettings({ ...gatewaySettings, environment: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  <option value="LIVE">Live Production</option>
                  <option value="TEST">Test Sandbox</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await axios.put('/api/admin/payments/settings', gatewaySettings);
                    toast.success('Gateway settings updated');
                  } catch (e) {
                    toast.error('Failed to update settings');
                  }
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                Save Gateway Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AdminPaymentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        paymentId={selectedPaymentId}
        onRefundClick={(p) => {
          setDetailModalOpen(false);
          setSelectedPaymentForRefund(p);
          setRefundModalOpen(true);
        }}
        onRefreshParent={fetchViewData}
      />

      {/* Refund Modal */}
      <PaymentRefundModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        payment={selectedPaymentForRefund}
        onRefundSuccess={fetchViewData}
      />

      {/* Dispute Evidence Modal */}
      <DisputeEvidenceModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        dispute={selectedDispute}
        onEvidenceSubmitted={fetchViewData}
      />

      {/* Manual Reconciliation Modal */}
      <ReconciliationModal
        isOpen={reconciliationModalOpen}
        onClose={() => setReconciliationModalOpen(false)}
        record={selectedReconciliation}
        onResolved={fetchViewData}
      />

    </div>
  );
}
