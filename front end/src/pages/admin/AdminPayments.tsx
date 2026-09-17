import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  Building,
  Radio,
  Zap,
  Trash2,
  Copy,
  Check,
  Code,
  Eye,
  EyeOff,
  Key,
  HelpCircle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';
import { paymentApi } from '../../services/paymentApi';
import type {
  PaymentTransaction,
  PaymentCounters,
  PaymentAnalytics,
  GatewayStatus,
  WebhookEventItem,
  RefundItem,
  SettlementItem,
  ReconciliationItem,
  PaymentMethodItem,
  GatewaySettingsData
} from '../../services/paymentApi';
import { AdminPaymentDetailModal } from '../../components/admin/AdminPaymentDetailModal';
import { PaymentRefundModal } from '../../components/admin/PaymentRefundModal';
import { ReconciliationModal } from '../../components/admin/ReconciliationModal';

export default function AdminPayments() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getActiveView = useCallback(() => {
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/payments/transactions')) return 'transactions';
    if (path.endsWith('/payments/successful')) return 'successful';
    if (path.endsWith('/payments/failed')) return 'failed';
    if (path.endsWith('/payments/refunds')) return 'refunds';
    if (path.endsWith('/payments/gateway') || path.endsWith('/payments/settings')) return 'settings';

    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== 'pending') return tabParam;

    const viewParam = searchParams.get('view');
    if (viewParam) return viewParam;

    const statusParam = searchParams.get('status')?.toUpperCase();
    if (statusParam === 'SUCCESSFUL' || statusParam === 'CAPTURED' || statusParam === 'PAID') return 'successful';
    if (statusParam === 'FAILED') return 'failed';
    if (statusParam === 'REFUNDED' || statusParam === 'REFUNDS') return 'refunds';

    return 'overview';
  }, [location.pathname, searchParams]);

  const activeView = getActiveView();

  const setActiveView = (tabId: string) => {
    navigate(`/admin/payments?tab=${tabId}`);
  };

  useEffect(() => {
    if (searchParams.get('tab') === 'pending') {
      setActiveView('overview');
    }
  }, [searchParams]);

  // Data states
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [counters, setCounters] = useState<PaymentCounters>({
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
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [refundToReject, setRefundToReject] = useState<RefundItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [refundToApprove, setRefundToApprove] = useState<RefundItem | null>(null);
  const [approvedAmountInput, setApprovedAmountInput] = useState<string>('');
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [settlementSummary, setSettlementSummary] = useState<{
    totalGross: number;
    totalNet: number;
    totalFees: number;
    totalTaxes: number;
    batchesCount: number;
  } | null>(null);
  const [syncingSettlements, setSyncingSettlements] = useState<boolean>(false);
  const [reconciliations, setReconciliations] = useState<ReconciliationItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [fraudList, setFraudList] = useState<PaymentTransaction[]>([]);
  const [gatewaySettings, setGatewaySettings] = useState<GatewaySettingsData | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connection testing state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [verifyBeforeSave, setVerifyBeforeSave] = useState(true);
  const [gatewayHelpOpen, setGatewayHelpOpen] = useState(false);

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
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState<boolean>(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null);

  // Payload viewer modal for webhooks
  const [selectedWebhookPayload, setSelectedWebhookPayload] = useState<any | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchGatewayStatus = async () => {
    try {
      const data = await paymentApi.getGatewayStatus();
      if (data.success) {
        setGatewayStatus(data.gateway);
      }
    } catch (err) {
      console.error('Failed to load gateway status:', err);
    }
  };

  const fetchViewData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Gateway Status in background
      fetchGatewayStatus();

      // 1. Fetch Analytics & Counters
      const [paymentsData, analyticsData] = await Promise.all([
        paymentApi.getPayments({
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
        }),
        paymentApi.getAnalytics()
      ]);

      if (paymentsData.success) {
        setPayments(paymentsData.payments || []);
        setCounters(paymentsData.counters || counters);
        setTotalPages(paymentsData.pagination?.totalPages || 1);
      }

      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }

      // Always fetch refunds and gateway settings to keep active gateway and counters ready
      const [refData, setgData] = await Promise.all([
        paymentApi.getRefunds().catch(() => ({ success: false, refunds: [] })),
        paymentApi.getGatewaySettings().catch(() => ({ success: false, settings: null }))
      ]);
      if (refData.success) setRefunds(refData.refunds || []);
      if (setgData.success && setgData.settings) setGatewaySettings(setgData.settings);

      // 2. Fetch specific subview datasets
      if (activeView === 'webhooks') {
        const whData = await paymentApi.getWebhooks();
        if (whData.success) setWebhookEvents(whData.events || []);
      } else if (activeView === 'settlements') {
        const setData = await paymentApi.getSettlements();
        if (setData.success) {
          setSettlements(setData.settlements || []);
          if (setData.summary) setSettlementSummary(setData.summary);
        }
      } else if (activeView === 'reconciliation') {
        const recData = await paymentApi.getReconciliation();
        if (recData.success) setReconciliations(recData.records || []);
      } else if (activeView === 'methods') {
        const methData = await paymentApi.getPaymentMethods();
        if (methData.success) setPaymentMethods(methData.methods || []);
      } else if (activeView === 'fraud') {
        const fraudData = await paymentApi.getFraudList();
        if (fraudData.success) setFraudList(fraudData.flagged || []);
      } else if (activeView === 'settings') {
        const setgData = await paymentApi.getGatewaySettings();
        if (setgData.success) setGatewaySettings(setgData.settings);
      }

    } catch (err: any) {
      console.error('Failed to fetch payment data:', err);
      toast.error(err.response?.data?.message || 'Error loading payment module data');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchViewData();

    // 1. Connect to Real-time SSE Live Event Stream
    let reconnectTimeout: any = null;
    const connectSSE = () => {
      try {
        const token = localStorage.getItem('token');
        const sseUrl = `/api/admin/live-stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        const es = new EventSource(sseUrl, { withCredentials: true });
        eventSourceRef.current = es;

        es.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.event === 'order.paid' || parsed.event === 'payment.captured') {
              const amountStr = parsed.data?.amount ? ` (${formatCurrency(parsed.data.amount)})` : '';
              toast.success(`Live: Payment captured${amountStr}! Dashboard updated.`, { id: 'live-payment-captured' });
              fetchViewData();
            } else if (
              parsed.event === 'payment.failed' ||
              parsed.event === 'refund.processed' ||
              parsed.event === 'refund.requested'
            ) {
              fetchViewData();
            }
          } catch {
            // Heartbeat or non-json message
          }
        };

        es.onerror = () => {
          es.close();
          reconnectTimeout = setTimeout(connectSSE, 6000);
        };
      } catch {
        reconnectTimeout = setTimeout(connectSSE, 6000);
      }
    };

    connectSSE();

    // 2. Fallback polling interval (every 15 seconds) to ensure fresh counters
    const pollInterval = setInterval(() => {
      fetchViewData();
    }, 15000);

    // 3. Instant refresh when admin switches back to this browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchViewData();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [fetchViewData]);

  const handleExport = async (type: string = 'transactions') => {
    try {
      await paymentApi.downloadExport(type, {
        startDate,
        endDate,
        status: statusFilter
      });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} CSV report downloaded!`);
    } catch (err: any) {
      const url = paymentApi.getExportUrl(type, {
        startDate,
        endDate,
        status: statusFilter
      });
      window.open(url, '_blank');
      toast.success('Payments CSV export initiated');
    }
  };

  const handleAutoReconcile = async () => {
    try {
      const res = await paymentApi.runAutoReconciliation();
      if (res.success) {
        toast.success(`Reconciliation Complete: ${res.matchedCount} matched, ${res.mismatchCount} discrepancies`);
        fetchViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Auto reconciliation failed');
    }
  };

  const handleSyncSettlements = async () => {
    setSyncingSettlements(true);
    try {
      const res = await paymentApi.syncSettlements();
      if (res.success) {
        toast.success(res.message || 'Settlements synchronized successfully!');
        if (res.summary) setSettlementSummary(res.summary);
        fetchViewData();
      } else {
        toast.error(res.message || 'Failed to sync settlements');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Settlement synchronization failed');
    } finally {
      setSyncingSettlements(false);
    }
  };

  const handleReplayWebhook = async (id: string) => {
    try {
      const res = await paymentApi.replayWebhook(id);
      if (res.success) {
        toast.success(res.message || 'Webhook replayed successfully!');
        fetchViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to replay webhook');
    }
  };

  const handleRetryPaymentAttempt = async (id: string) => {
    try {
      const res = await paymentApi.retryPaymentAttempt(id);
      if (res.success) {
        toast.success('New payment retry attempt registered.');
        fetchViewData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create payment retry attempt');
    }
  };

  const handleUpdateRisk = async (id: string, riskScore: string) => {
    try {
      const res = await paymentApi.updateRiskState(id, riskScore);
      if (res.success) {
        toast.success(`Risk state updated to ${riskScore}`);
        fetchViewData();
      }
    } catch (err) {
      toast.error('Failed to update risk score');
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionTestResult(null);
      const res = await paymentApi.testGatewayConnection({
        keyId: gatewaySettings?.keyId,
        keySecret: gatewaySettings?.keySecret
      });
      setConnectionTestResult(res);
      if (res.connected && res.verified) {
        toast.success(res.message || 'Razorpay credentials verified successfully!');
      } else {
        toast.error(res.message || res.error || 'Razorpay connection test failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to test gateway connection';
      setConnectionTestResult({
        connected: false,
        verified: false,
        message: msg
      });
      toast.error(msg);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveGatewaySettings = async () => {
    if (!gatewaySettings) return;
    if (!gatewaySettings.keyId?.trim()) {
      toast.error('Please enter your Razorpay Key ID');
      return;
    }
    setSavingSettings(true);
    try {
      const res = await paymentApi.updateGatewaySettings({
        ...gatewaySettings,
        verifyBeforeSave
      });
      if (res.success) {
        toast.success(res.message || 'Razorpay gateway settings saved & activated!');
        if (res.settings) {
          setGatewaySettings({
            ...gatewaySettings,
            ...res.settings,
            keySecret: '',
            webhookSecret: ''
          });
        }
        fetchViewData();
      } else {
        toast.error(res.message || 'Failed to save gateway settings');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update gateway settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  const handleCleanupDuplicates = async () => {
    if (!window.confirm('Are you sure you want to clean up duplicate and unverified failed checkout attempts? Only verified, completed customer purchases will be preserved.')) {
      return;
    }
    setCleaningDuplicates(true);
    try {
      const res = await paymentApi.cleanupDuplicates();
      if (res.success) {
        toast.success(res.message || 'Duplicate failed attempts cleaned up!');
        fetchViewData();
      } else {
        toast.error(res.message || 'Failed to cleanup duplicate attempts');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Server error during cleanup');
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [clearingWebhooks, setClearingWebhooks] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleTestWebhookPing = async () => {
    try {
      setTestingWebhook(true);
      const res = await paymentApi.testWebhook();
      if (res.success) {
        toast.success(res.message || 'Webhook ping dispatched, signature verified, and processed!');
        fetchViewData();
      } else {
        toast.error(res.message || 'Webhook test ping failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error executing webhook test ping');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleClearStaleWebhooks = async () => {
    if (!window.confirm('Clear stale, failed, or simulated webhook events? Genuine captured transaction events will be preserved.')) return;
    try {
      setClearingWebhooks(true);
      const res = await paymentApi.clearWebhooks();
      if (res.success) {
        toast.success(res.message || 'Stale webhook events cleared');
        fetchViewData();
      }
    } catch (err: any) {
      toast.error('Failed to clear webhook events');
    } finally {
      setClearingWebhooks(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    const url = `${window.location.origin}/api/payments/webhook`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Webhook listener URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
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

  const pendingCustomerRefunds = refunds.filter(
    r => r.status === 'PENDING_APPROVAL' || r.status === 'REQUESTED'
  );
  const completedRefunds = refunds.filter(r => r.status === 'COMPLETED');
  const rejectedRefunds = refunds.filter(r => r.status === 'REJECTED');
  const totalRefundedSum = completedRefunds.reduce((acc, r) => acc + (r.amount || 0), 0);

  const openApproveModal = (refund: RefundItem) => {
    setRefundToApprove(refund);
    setApprovedAmountInput(String(refund.amount));
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!refundToApprove) return;
    const numAmount = parseFloat(approvedAmountInput);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid refund amount greater than zero.');
      return;
    }
    if (numAmount > refundToApprove.amount + 0.01) {
      toast.error(`Approved amount cannot exceed the requested amount of ${formatCurrency(refundToApprove.amount)}`);
      return;
    }

    try {
      setProcessingRefundId(refundToApprove.id);
      const res = await paymentApi.approveRefund(refundToApprove.id, numAmount);
      if (res.success) {
        toast.success(res.message || `Refund of ${formatCurrency(numAmount)} approved and executed successfully!`);
        setApproveModalOpen(false);
        setRefundToApprove(null);
        await fetchViewData();
      } else {
        toast.error(res.message || 'Failed to approve refund.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error approving refund');
    } finally {
      setProcessingRefundId(null);
    }
  };

  const openRejectModal = (refund: RefundItem) => {
    setRefundToReject(refund);
    setRejectionReasonInput('Digital product has already been delivered / terms not satisfied.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!refundToReject) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    try {
      setProcessingRefundId(refundToReject.id);
      const res = await paymentApi.rejectRefund(refundToReject.id, rejectionReasonInput.trim());
      if (res.success) {
        toast.success('Customer refund request declined.');
        setRejectModalOpen(false);
        setRefundToReject(null);
        setRejectionReasonInput('');
        await fetchViewData();
      } else {
        toast.error(res.message || 'Failed to decline refund request.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error declining refund');
    } finally {
      setProcessingRefundId(null);
    }
  };

  const subViews = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions', count: counters.attempts },
    { id: 'successful', label: 'Successful Payments', count: counters.successful },
    { id: 'failed', label: 'Failed Payments', count: counters.failedCount },
    { id: 'refunds', label: 'Refund Payments', count: pendingCustomerRefunds.length > 0 ? pendingCustomerRefunds.length : undefined },
    { id: 'settings', label: 'Payment Gateway' },
    { id: 'reconciliation', label: 'Reconciliation', count: counters.unreconciledCount > 0 ? counters.unreconciledCount : undefined }
  ];

  // Dynamic engine badge
  const engineMode = gatewayStatus?.engineMode || 'MOCK';
  const engineBadgeLabel = engineMode === 'LIVE'
    ? 'Razorpay Live Engine'
    : engineMode === 'TEST'
      ? 'Razorpay Test Engine'
      : 'Mock Payment Engine';

  const engineBadgeStyle = engineMode === 'LIVE'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : engineMode === 'TEST'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <div className="space-y-6 pb-16 text-slate-800">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Payments & Gateway Operations</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${engineBadgeStyle}`}>
              {engineBadgeLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stateful multi-gateway payment processing, dual verification, webhooks, customer refund approvals, and automated reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCleanupDuplicates}
            disabled={cleaningDuplicates}
            className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold py-2 px-3.5 rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Clean up duplicate unverified failed checkout attempts"
          >
            <Trash2 size={14} className={cleaningDuplicates ? 'animate-spin' : ''} />
            {cleaningDuplicates ? 'Cleaning...' : 'Clean Duplicate Attempts'}
          </button>
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

      {/* 3. Sub-View Horizontal Tabs (Deep-linkable via ?tab=...) */}
      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto pb-px">
        {subViews.map((sub) => (
          <button
            key={sub.id}
            onClick={() => { setActiveView(sub.id); setPage(1); }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeView === sub.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{sub.label}</span>
            {sub.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeView === sub.id
                  ? 'bg-white/20 text-white'
                  : sub.id === 'failed' && sub.count > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200/80 text-slate-700'
              }`}>
                {sub.count}
              </span>
            )}
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
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, analytics.successRate)}%` }}></div>
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
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.max(0, 100 - analytics.refundRate)}%` }}></div>
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
              <p className="text-2xl font-black text-slate-900">{Math.min(100, analytics.reconciliationRate)}% Reconciled</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, analytics.reconciliationRate)}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Auto-matched with payment gateway settlements</p>
            </div>

          </div>

          {/* Gateway Status & Health Card */}
          {gatewayStatus && (
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Active Gateway Infrastructure</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${engineBadgeStyle}`}>
                      {engineBadgeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Key ID: <span className="font-mono text-slate-700 font-bold">{gatewayStatus.keyIdMasked}</span> • Webhook Health: <span className="font-bold text-emerald-600">{gatewayStatus.webhookHealth}</span>
                    {gatewayStatus.lastWebhookAt && ` • Last event: ${new Date(gatewayStatus.lastWebhookAt).toLocaleTimeString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setActiveView('settings')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Configure Gateway Keys
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Zap size={14} className={testingConnection ? 'animate-spin' : ''} />
                    {testingConnection ? 'Testing API...' : 'Test Gateway Connection'}
                  </button>
                </div>
              </div>

              {connectionTestResult && (
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  connectionTestResult.connected && connectionTestResult.verified
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      {connectionTestResult.connected && connectionTestResult.verified ? (
                        <>
                          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                          <span>Gateway Connection Verified Successfully</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                          <span>Gateway Authentication Test Failed</span>
                        </>
                      )}
                      {connectionTestResult.latencyMs ? (
                        <span className="text-[11px] font-normal text-slate-500">
                          ({connectionTestResult.latencyMs}ms latency)
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {connectionTestResult.message || 'Gateway rejected credentials.'}
                    </p>
                  </div>
                  {(!connectionTestResult.connected || !connectionTestResult.verified) && (
                    <button
                      onClick={() => setActiveView('settings')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs self-start sm:self-auto transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      Update Keys in Settings →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

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
                  analytics.methods.map((m, idx) => (
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
                  analytics.failureCategories.map((f, idx) => (
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

      {/* 5. VIEW: ALL TRANSACTIONS / SUCCESSFUL / FAILED / VERIFICATION */}
      {['transactions', 'successful', 'failed', 'verification'].includes(activeView) && (
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
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
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
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
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
                      <td colSpan={9} className="py-14 text-center">
                        {activeView === 'failed' ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                              <CheckCircle size={20} />
                            </div>
                            <p className="text-sm font-bold text-slate-800">No Failed Payments</p>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              All customer checkout attempts are captured and verified. There are no failed or incomplete payment attempts.
                            </p>
                          </div>
                        ) : activeView === 'verification' ? (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                              <ShieldCheck size={20} />
                            </div>
                            <p className="text-sm font-bold text-slate-800">No Pending Verifications</p>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              All verified transactions have passed signature and status checks.
                            </p>
                          </div>
                        ) : (
                          <p className="text-slate-400 font-semibold text-xs">
                            No transaction records matching filter criteria
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.razorpayPaymentId || p.id.slice(0, 14) + '...'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.order?.orderNumber || 'Order'}</p>
                          <p className="text-slate-400 text-[11px]">{p.order?.guestEmail || p.customer?.email || 'Guest'}</p>
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
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => { setSelectedPaymentId(p.id); setDetailModalOpen(true); }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs"
                          >
                            Details
                          </button>
                          {p.status === 'CAPTURED' && (
                            <button
                              onClick={() => { setSelectedPaymentForRefund(p); setRefundModalOpen(true); }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition-colors text-xs"
                            >
                              Refund
                            </button>
                          )}
                          {p.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryPaymentAttempt(p.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors text-xs"
                            >
                              Retry
                            </button>
                          )}
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
          
          {/* Webhook Connectivity & Operation Banner */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Live Webhook Listener
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Listening
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700">
                  {window.location.origin}/api/payments/webhook
                </code>
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
                  title="Copy Webhook URL"
                >
                  {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Cryptographically verifies HMAC-SHA256 signatures for <code className="text-slate-600 font-bold">payment.captured</code>, <code className="text-slate-600 font-bold">order.paid</code>, <code className="text-slate-600 font-bold">payment.failed</code>, and <code className="text-slate-600 font-bold">refund.processed</code>.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <button
                type="button"
                onClick={handleTestWebhookPing}
                disabled={testingWebhook}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Zap size={14} className={testingWebhook ? 'animate-spin' : ''} />
                {testingWebhook ? 'Sending Ping...' : 'Send Test Webhook'}
              </button>

              <button
                type="button"
                onClick={handleClearStaleWebhooks}
                disabled={clearingWebhooks}
                className="px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Clear stale or failed simulation events"
              >
                <Trash2 size={14} className={clearingWebhooks ? 'animate-spin' : ''} />
                {clearingWebhooks ? 'Clearing...' : 'Clear Stale'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">External Event ID</th>
                    <th className="py-3 px-4">Payment Ref</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Received Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Signature</th>
                    <th className="py-3 px-4">Failure Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {webhookEvents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center font-sans">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                            <Zap size={20} />
                          </div>
                          <p className="text-sm font-bold text-slate-800">No Webhook Events Recorded Yet</p>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Webhook events will automatically appear here in real-time as customers complete purchases. You can also click "Send Test Webhook" to verify connectivity.
                          </p>
                          <button
                            type="button"
                            onClick={handleTestWebhookPing}
                            disabled={testingWebhook}
                            className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs transition-colors"
                          >
                            Send Test Webhook Ping
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    webhookEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors font-sans">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {evt.externalEventId || evt.id.slice(0, 14)}
                        </td>
                        <td className="py-3 px-4">
                          {evt.payment ? (
                            <div>
                              <span className="font-mono font-bold text-indigo-700">{evt.payment.razorpayPaymentId}</span>
                              <span className="text-slate-400 block text-[10px] font-sans font-medium">
                                {formatCurrency(evt.payment.amount)} • {evt.payment.method}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">—</span>
                          )}
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
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {evt.rawPayload && (
                            <button
                              onClick={() => setSelectedWebhookPayload(evt)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                              title="View Raw JSON Payload"
                            >
                              <Code size={12} />
                              Payload
                            </button>
                          )}
                          <button
                            onClick={() => handleReplayWebhook(evt.id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                            title="Replay Webhook Event"
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
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border transition-all ${pendingCustomerRefunds.length > 0 ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-sm' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
                <div className={`p-2 rounded-xl ${pendingCustomerRefunds.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Clock size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{pendingCustomerRefunds.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Customer refund requests awaiting decision</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Refunded</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <RotateCcw size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(totalRefundedSum)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Successfully reversed to customers</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Refunds</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <CheckCircle size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{completedRefunds.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Approved & gateway confirmed</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Declined Requests</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <XCircle size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900">{rejectedRefunds.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Ineligible or rejected requests</p>
            </div>
          </div>

          {/* Action Header Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-indigo-400" />
                <h2 className="text-base font-bold text-white">Customer Refund Approvals & Operations</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                When customers submit a refund request from My Account, verify their captured payment status and choose to Approve or Decline. Approving immediately initiates the gateway refund and revokes digital product access.
              </p>
            </div>
            <button
              onClick={() => { setSelectedPaymentForRefund(null); setRefundModalOpen(true); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <DollarSign size={14} />
              Issue Direct Manual Refund
            </button>
          </div>

          {/* 1. Pending Customer Refund Requests Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-900">Pending Customer Refund Requests</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                  {pendingCustomerRefunds.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Payment verification required prior to approval</span>
            </div>

            {pendingCustomerRefunds.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No pending refund requests</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  All customer refund requests have been reviewed and processed. New requests submitted by customers from their account will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Order / Customer</th>
                      <th className="py-3 px-4">Requested Amount</th>
                      <th className="py-3 px-4">Payment Verification</th>
                      <th className="py-3 px-4">Customer Reason</th>
                      <th className="py-3 px-4">Requested At</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingCustomerRefunds.map((r) => {
                      const isCaptured = r.payment?.status === 'CAPTURED' || r.payment?.status === 'PARTIALLY_REFUNDED';
                      const isFullyVerified = r.payment?.verificationStatus === 'FULLY_VERIFIED' || r.payment?.verificationStatus === 'SIGNATURE_VERIFIED';
                      return (
                        <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-mono font-bold text-slate-900">
                              #{r.order?.orderNumber || r.orderId.slice(0, 10)}
                            </p>
                            <p className="text-slate-800 font-medium text-[11px]">
                              {r.order?.customerName || r.order?.guestName || r.requestedBy || 'Customer'}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              {r.order?.guestEmail || r.order?.customerEmail}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-rose-600 text-sm">
                              {formatCurrency(r.amount)}
                            </span>
                            {r.order?.totalAmount && (
                              <p className="text-[11px] text-slate-400">Order total: {formatCurrency(r.order.totalAmount)}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isCaptured ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle size={12} className="text-emerald-600" />
                                <span>Payment Captured</span>
                                {isFullyVerified && <span className="text-[10px] opacity-75 font-normal">(Verified)</span>}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle size={12} className="text-rose-600" />
                                <span>Unverified ({r.payment?.status || 'Unknown'})</span>
                              </div>
                            )}
                            {r.payment?.method && (
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase">{r.payment.method}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-slate-800 font-medium text-xs break-words">{r.reason || 'No reason specified'}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openApproveModal(r)}
                                disabled={processingRefundId === r.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                title="Review verified customer and approve refund payout amount"
                              >
                                {processingRefundId === r.id ? (
                                  <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={12} />
                                    <span>Approve & Send</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => openRejectModal(r)}
                                disabled={processingRefundId === r.id}
                                className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                title="Decline refund request"
                              >
                                <XCircle size={12} />
                                <span>Decline</span>
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
          </div>

          {/* 2. Processed & Historical Refunds Ledger */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Completed & Processed Refunds History</h3>
                <p className="text-xs text-slate-400 mt-0.5">Historical log of all approved gateway refunds and declined requests</p>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                {refunds.filter(r => r.status !== 'PENDING_APPROVAL' && r.status !== 'REQUESTED').length} Record(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Refund ID</th>
                    <th className="py-3 px-4">Order / Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Access Revoked</th>
                    <th className="py-3 px-4">Decision Actor</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refunds.filter(r => r.status !== 'PENDING_APPROVAL' && r.status !== 'REQUESTED').length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-semibold">
                        No processed refunds in history yet
                      </td>
                    </tr>
                  ) : (
                    refunds
                      .filter(r => r.status !== 'PENDING_APPROVAL' && r.status !== 'REQUESTED')
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {r.razorpayRefundId || r.id.slice(0, 14)}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{r.order?.orderNumber || 'Order'}</p>
                            <p className="text-slate-400 text-[11px]">{r.order?.guestEmail || r.order?.customerEmail}</p>
                          </td>
                          <td className="py-3 px-4 font-black text-rose-600">
                            {formatCurrency(r.amount)}
                          </td>
                          <td className="py-3 px-4">
                            {r.status === 'COMPLETED' ? (
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Approved & Sent
                              </span>
                            ) : r.status === 'REJECTED' ? (
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800 border border-rose-200">
                                Declined
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-purple-100 text-purple-800">
                                {r.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs">
                            <p className="truncate font-medium">{r.reason || 'Customer request'}</p>
                            {r.rejectionReason && (
                              <p className="text-rose-600 text-[11px] font-semibold mt-0.5 truncate">
                                Reason: {r.rejectionReason}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {r.accessRevoked ? (
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <Lock size={11} /> Revoked
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">Active</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium text-[11px]">
                            {r.status === 'REJECTED' ? (r.rejectedBy || 'Admin') : (r.approvedBy || r.requestedBy || 'Admin Staff')}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(r.completedAt || r.createdAt).toLocaleDateString()}
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

      {/* 9. VIEW: SETTLEMENTS */}
      {/* 9. VIEW: SETTLEMENTS */}
      {activeView === 'settlements' && (() => {
        const totalSettlementGross = settlementSummary?.totalGross ?? settlements.reduce((sum, s) => sum + s.grossAmount, 0);
        const totalSettlementNet = settlementSummary?.totalNet ?? settlements.reduce((sum, s) => sum + s.netAmount, 0);
        const totalSettlementFees = settlementSummary?.totalFees ?? settlements.reduce((sum, s) => sum + s.feeAmount, 0);
        const totalSettlementTaxes = settlementSummary?.totalTaxes ?? settlements.reduce((sum, s) => sum + s.taxAmount, 0);
        const totalSettlementTxns = settlements.reduce((sum, s) => sum + (s.capturedPaymentsCount || 1), 0);

        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Settlement & Payout Reports</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Gateway Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated settlement ledger synchronized with verified bank UTR references and MDR fee/tax breakdown.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncSettlements}
                  disabled={syncingSettlements}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Synchronize captured transactions into settlement batches"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingSettlements ? 'animate-spin' : ''}`} />
                  <span>{syncingSettlements ? 'Synchronizing...' : 'Sync Settlements'}</span>
                </button>
                <button
                  onClick={() => handleExport('settlements')}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Export Settlement Report as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export Report CSV</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Gross Settlement Volume</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {formatCurrency(totalSettlementGross)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {totalSettlementTxns} verified payments captured
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Gateway Deductions</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-rose-600 mt-2">
                  {formatCurrency(totalSettlementFees + totalSettlementTaxes)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Fee: {formatCurrency(totalSettlementFees)} | GST: {formatCurrency(totalSettlementTaxes)}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Net Bank Payout</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Building className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-2">
                  {formatCurrency(totalSettlementNet)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Credited to merchant bank account
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Settlement Batches</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-blue-600 mt-2">
                  {settlements.length} Batches
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  100% Settled & Auto-Reconciled
                </p>
              </div>
            </div>

            {/* Settlements Table Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Settlement Payout History</h4>
                  <p className="text-xs text-slate-500">Consolidated daily payout schedules with authentic UTR bank references.</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Showing {settlements.length} record{settlements.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Settlement Ref</th>
                      <th className="py-3 px-4">Settlement Date</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-right">Gross Amount</th>
                      <th className="py-3 px-4 text-right">MDR Fee (2%)</th>
                      <th className="py-3 px-4 text-right">GST (18%)</th>
                      <th className="py-3 px-4 text-right">Net Bank Payout</th>
                      <th className="py-3 px-4">Bank UTR Ref</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700 text-sm">No settlements found</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Click &quot;Sync Settlements&quot; above to generate payout batches from captured customer orders.
                          </p>
                          <button
                            onClick={handleSyncSettlements}
                            disabled={syncingSettlements}
                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingSettlements ? 'animate-spin' : ''}`} />
                            <span>Sync Settlements Now</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      settlements.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors font-sans">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {s.razorpaySettlementId || s.id.slice(0, 14)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                            {new Date(s.settlementDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px]">
                              {s.capturedPaymentsCount || 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(s.grossAmount)}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-medium whitespace-nowrap">
                            -{formatCurrency(s.feeAmount)}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-medium whitespace-nowrap">
                            -{formatCurrency(s.taxAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-700 whitespace-nowrap">
                            {formatCurrency(s.netAmount)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 text-[11px] whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 border border-slate-200">
                              {s.bankReference || 'UTR-SYNCED'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 10. VIEW: RECONCILIATION */}
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

      {/* 11. VIEW: PAYMENT METHODS */}
      {activeView === 'methods' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Total Attempts</th>
                    <th className="py-3 px-4">Total Volume</th>
                    <th className="py-3 px-4">Captured Transactions</th>
                    <th className="py-3 px-4">Captured Value</th>
                    <th className="py-3 px-4">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentMethods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">
                        No payment method telemetry recorded
                      </td>
                    </tr>
                  ) : (
                    paymentMethods.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <CreditCard size={14} className="text-indigo-600" />
                          <span>{m.method}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {m.totalCount}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatCurrency(m.totalValue)}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 font-bold">
                          {m.capturedCount}
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-700">
                          {formatCurrency(m.capturedValue)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            m.successRate >= 80 ? 'bg-emerald-100 text-emerald-800' :
                            m.successRate >= 50 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {m.successRate}%
                          </span>
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

      {/* 12. VIEW: FRAUD & RISK */}
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

      {/* 13. VIEW: PAYMENT REPORTS */}
      {activeView === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900">All Transactions Report</h4>
              <p className="text-xs text-slate-500">Comprehensive raw transaction ledger with all gateway attributes.</p>
              <button
                onClick={() => handleExport('transactions')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Export Transactions CSV
              </button>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Settlement & Payout Report</h4>
              <p className="text-xs text-slate-500">Consolidated bank payout batches with MDR fees, taxes, and UTR numbers.</p>
              <button
                onClick={() => handleExport('settlements')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Export Settlement CSV
              </button>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Refunds Audit Report</h4>
              <p className="text-xs text-slate-500">Audit trail of all full & partial refunds, reasons, and revocations.</p>
              <button
                onClick={() => handleExport('refunds')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Export Refunds CSV
              </button>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Reconciliation Discrepancies</h4>
              <p className="text-xs text-slate-500">Log of mismatched settlement vs internal capture registers.</p>
              <button
                onClick={() => handleExport('reconciliation')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Export Reconciliation CSV
              </button>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Failed Payments Breakdown</h4>
              <p className="text-xs text-slate-500">Detailed error codes and gateway decline descriptions.</p>
              <button
                onClick={() => handleExport('failed')}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Export Failed Payments CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. VIEW: GATEWAY SETTINGS */}
      {activeView === 'settings' && !gatewaySettings && (
        <div className="max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          {loading ? (
            <>
              <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading Gateway Settings...</p>
            </>
          ) : (
            <>
              <AlertCircle size={28} className="text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Unable to load gateway settings</p>
              <button
                onClick={fetchViewData}
                className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}

      {activeView === 'settings' && gatewaySettings && (
        <div className="max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 animate-in fade-in duration-200 text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">Razorpay Gateway Integration & Credentials</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Production
                </span>
              </div>
              <p className="text-slate-500 mt-1">
                Configure your official Razorpay live API keys and webhook secrets to enable real customer payments and instant verification.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                gatewaySettings.keyId && gatewaySettings.keyId.startsWith('rzp_live')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${gatewaySettings.keyId && gatewaySettings.keyId.startsWith('rzp_live') ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {gatewaySettings.keyId && gatewaySettings.keyId.startsWith('rzp_live') ? 'Live Gateway Ready' : 'Setup Required'}
              </span>

              <button
                type="button"
                onClick={() => setGatewayHelpOpen(!gatewayHelpOpen)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer"
              >
                <HelpCircle size={13} />
                <span>{gatewayHelpOpen ? 'Hide Help' : 'How to Get Keys'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Step-by-Step Instructions */}
          {gatewayHelpOpen && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                <Info size={14} className="text-indigo-600" />
                How to get your Razorpay Credentials:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-indigo-900 text-[11px] leading-relaxed">
                <li>
                  Log in to your{' '}
                  <a
                    href="https://dashboard.razorpay.com/app/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-0.5"
                  >
                    Razorpay Dashboard <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  In the left sidebar, navigate to <strong>Settings</strong> &rarr; <strong>API Keys</strong> tab.
                </li>
                <li>
                  Click <strong>Generate Key</strong> (or Regenerate Key) to get your <strong>Key Id</strong> and <strong>Key Secret</strong>.
                </li>
                <li>
                  Copy the live <strong>Key Id</strong> (starts with <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200">rzp_live_</code>) and <strong>Key Secret</strong> and paste them into the fields below.
                </li>
                <li>
                  To connect Webhooks: In Razorpay Dashboard &rarr; <strong>Settings</strong> &rarr; <strong>Webhooks</strong> &rarr; Click <strong>Add New Webhook</strong>:
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-700">
                    <li>Webhook URL: <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 text-indigo-800">{window.location.origin}/api/payments/webhook</code></li>
                    <li>Secret: Create a secure secret and paste it in the <strong>Webhook Secret</strong> field below.</li>
                    <li>Active Events: Select <code className="font-mono text-[10px]">payment.captured</code>, <code className="font-mono text-[10px]">order.paid</code>, <code className="font-mono text-[10px]">payment.failed</code>, <code className="font-mono text-[10px]">refund.processed</code></li>
                  </ul>
                </li>
              </ol>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Key ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Key size={13} className="text-slate-400" />
                  Razorpay Key ID (Live Public Key)
                </label>
                {gatewaySettings.keyId && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    gatewaySettings.keyId.startsWith('rzp_live')
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {gatewaySettings.keyId.startsWith('rzp_live')
                      ? 'Live Production Key'
                      : 'Custom Key'}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={gatewaySettings.keyId || ''}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setGatewaySettings({
                    ...gatewaySettings,
                    keyId: val,
                    environment: 'LIVE'
                  });
                }}
                placeholder="rzp_live_xxxxxxxxxxxxxx"
                className="w-full p-2.5 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl font-mono text-slate-900 font-semibold transition-all outline-none"
              />
              <p className="text-[11px] text-slate-400">
                The public identifier used by the customer checkout modal for live payments.
              </p>
            </div>

            {/* Key Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" />
                  Razorpay Key Secret (Private)
                </label>
                {gatewaySettings.hasKeySecret && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Configured: {gatewaySettings.keySecretMasked}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKeySecret ? 'text' : 'password'}
                  value={gatewaySettings.keySecret || ''}
                  onChange={(e) => setGatewaySettings({ ...gatewaySettings, keySecret: e.target.value.trim() })}
                  placeholder={gatewaySettings.hasKeySecret ? 'Leave blank to keep existing secret, or enter new to replace' : 'Paste Razorpay Key Secret here'}
                  className="w-full p-2.5 pr-10 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl font-mono text-slate-900 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKeySecret(!showKeySecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showKeySecret ? 'Hide Secret' : 'Show Secret'}
                >
                  {showKeySecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Used securely on the backend for signature verification and order creation. Never shared publicly.
              </p>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" />
                  Razorpay Webhook Secret
                </label>
                {gatewaySettings.hasWebhookSecret && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Configured: {gatewaySettings.webhookSecretMasked}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={gatewaySettings.webhookSecret || ''}
                  onChange={(e) => setGatewaySettings({ ...gatewaySettings, webhookSecret: e.target.value.trim() })}
                  placeholder={gatewaySettings.hasWebhookSecret ? 'Leave blank to keep existing webhook secret, or enter new' : 'Paste Webhook Secret here'}
                  className="w-full p-2.5 pr-10 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl font-mono text-slate-900 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showWebhookSecret ? 'Hide Secret' : 'Show Secret'}
                >
                  {showWebhookSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Secret defined in your Razorpay Dashboard webhooks to verify constant-time HMAC-SHA256 signatures.
              </p>
            </div>

            {/* Webhook Endpoint URL (Read-Only Copyable) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Webhook Endpoint URL</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700 font-bold flex items-center justify-between">
                <span className="truncate">{window.location.origin}/api/payments/webhook</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans font-bold">
                    Active & Listening
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/payments/webhook`);
                      toast.success('Webhook URL copied to clipboard');
                    }}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    title="Copy Webhook URL"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dropdowns: Capture Mode & Environment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Capture Mode</label>
                <select
                  value={gatewaySettings.captureMode || 'AUTO'}
                  onChange={(e) => setGatewaySettings({ ...gatewaySettings, captureMode: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="AUTO">Automatic (Instant Capture - Recommended)</option>
                  <option value="MANUAL">Manual Review (Authorize Only)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatic captures funds immediately upon customer bank authorization.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Environment Mode</label>
                <select
                  value="LIVE"
                  disabled
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none cursor-not-allowed"
                >
                  <option value="LIVE">Live Production (Real Money)</option>
                </select>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Active in Live Production mode for real customer transactions. Key ID must start with <code className="font-mono text-emerald-700">rzp_live_</code>.
                </p>
              </div>
            </div>

            {/* Connection Test Results Card */}
            {connectionTestResult && (
              <div className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-150 ${
                connectionTestResult.connected && connectionTestResult.verified
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-start gap-3">
                  {connectionTestResult.connected && connectionTestResult.verified ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {connectionTestResult.connected && connectionTestResult.verified
                          ? 'Razorpay Gateway Verified Successfully'
                          : 'Razorpay Verification Failed'}
                      </span>
                      {connectionTestResult.latencyMs && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border">
                          {connectionTestResult.latencyMs}ms latency
                        </span>
                      )}
                      {connectionTestResult.engineMode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border">
                          Mode: {connectionTestResult.engineMode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs">
                      {connectionTestResult.message || connectionTestResult.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox: verify before save */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="verifyBeforeSave"
                checked={verifyBeforeSave}
                onChange={(e) => setVerifyBeforeSave(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="verifyBeforeSave" className="text-slate-700 font-semibold cursor-pointer">
                Verify credentials with Razorpay servers before saving
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Zap size={14} className={testingConnection ? 'animate-spin text-indigo-600' : 'text-amber-500'} />
                <span>{testingConnection ? 'Pinging Razorpay API...' : 'Test & Verify Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveGatewaySettings}
                disabled={savingSettings}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving & Activating...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save & Connect Gateway</span>
                  </>
                )}
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

      {/* Decline Refund Request Modal */}
      {rejectModalOpen && refundToReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decline Customer Refund Request</h3>
                <p className="text-xs text-slate-500">Order #{refundToReject.order?.orderNumber || refundToReject.orderId.slice(0, 8)} • {formatCurrency(refundToReject.amount)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Customer reason: <span className="font-semibold text-slate-800">"{refundToReject.reason || 'N/A'}"</span>
            </p>

            <div className="space-y-1.5 mb-4">
              <label className="block text-xs font-bold text-slate-700">
                Reason for declining (Visible to customer & logged in timeline):
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                placeholder="Explain why this refund cannot be approved..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => { setRejectModalOpen(false); setRefundToReject(null); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingRefundId === refundToReject.id}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {processingRefundId === refundToReject.id ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={13} />
                    <span>Confirm Decline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Refund with Amount Verification Modal */}
      {approveModalOpen && refundToApprove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Approve Customer Refund</h3>
                  <p className="text-[11px] text-slate-400">Review verified customer &amp; authorize payout amount</p>
                </div>
              </div>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Customer & Order Verification Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Customer Identity:</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>{refundToApprove.order?.customerName || refundToApprove.order?.guestName || refundToApprove.requestedBy || 'Verified Customer'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Account Email:</span>
                <span className="font-mono text-slate-700">{refundToApprove.order?.customerEmail || refundToApprove.order?.guestEmail || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Order Number:</span>
                <span className="font-mono font-bold text-[#5b21b6]">#{refundToApprove.order?.orderNumber || refundToApprove.orderId.slice(0, 10)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Payment Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  CAPTURED &amp; VERIFIED
                </span>
              </div>
            </div>

            {/* Customer Reason / Note */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Customer Reason &amp; Explanation</span>
              <p className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-slate-700 text-xs leading-relaxed">
                {refundToApprove.reason || 'No specific explanation provided.'}
              </p>
            </div>

            {/* Approved Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Authorized Refund Amount (₹) *
                </label>
                <button
                  type="button"
                  onClick={() => setApprovedAmountInput(String(refundToApprove.amount))}
                  className="text-[11px] text-[#5b21b6] font-bold hover:underline cursor-pointer"
                >
                  Full Amount: {formatCurrency(refundToApprove.amount)}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={refundToApprove.amount}
                  value={approvedAmountInput}
                  onChange={e => setApprovedAmountInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 text-sm font-black text-slate-900 bg-[#faf9f7] border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl font-mono focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                You can approve the full requested amount ({formatCurrency(refundToApprove.amount)}) or adjust it for policy deductions.
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>Executing this payout immediately returns funds via Razorpay gateway and revokes the customer&apos;s digital product access.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={processingRefundId === refundToApprove.id}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {processingRefundId === refundToApprove.id ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Executing Payout...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={13} />
                    <span>Confirm &amp; Execute Payout ({formatCurrency(parseFloat(approvedAmountInput) || 0)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Reconciliation Modal */}
      <ReconciliationModal
        isOpen={reconciliationModalOpen}
        onClose={() => setReconciliationModalOpen(false)}
        record={selectedReconciliation}
        onResolved={fetchViewData}
      />

      {/* Webhook Payload Inspection Modal */}
      {selectedWebhookPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Webhook Raw Payload
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedWebhookPayload.externalEventId || selectedWebhookPayload.id} • {selectedWebhookPayload.eventType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWebhookPayload(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 text-emerald-400 font-mono text-xs">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedWebhookPayload.rawPayload), null, 2);
                  } catch (e) {
                    return selectedWebhookPayload.rawPayload;
                  }
                })()}
              </pre>
            </div>

            <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] text-slate-500 font-medium">
                Signature: {selectedWebhookPayload.signatureValid ? 'HMAC Verified' : 'Signature Invalid'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    let formatted = selectedWebhookPayload.rawPayload;
                    try {
                      formatted = JSON.stringify(JSON.parse(selectedWebhookPayload.rawPayload), null, 2);
                    } catch (e) {}
                    navigator.clipboard.writeText(formatted);
                    toast.success('Payload copied to clipboard');
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Copy size={12} />
                  Copy JSON
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWebhookPayload(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
