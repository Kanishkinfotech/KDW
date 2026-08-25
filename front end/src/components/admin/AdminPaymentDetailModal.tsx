import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Download,
  Mail,
  Key,
  RefreshCw,
  ExternalLink,
  DollarSign,
  User,
  ShoppingBag,
  FileText,
  Copy,
  Layers,
  ArrowUpRight,
  Activity,
  History as HistoryIcon
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

interface AdminPaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
  onRefundClick?: (payment: any) => void;
  onRefreshParent?: () => void;
}

export const AdminPaymentDetailModal: React.FC<AdminPaymentDetailModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  onRefundClick,
  onRefreshParent
}) => {
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [retryingFulfilment, setRetryingFulfilment] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchPaymentDetail();
    } else {
      setPayment(null);
    }
  }, [isOpen, paymentId]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/payments/${paymentId}`);
      if (res.data.success) {
        setPayment(res.data.payment);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load payment diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFulfilment = async () => {
    if (!payment) return;
    try {
      setRetryingFulfilment(true);
      const res = await axios.post(`/api/admin/payments/${payment.id}/retry-fulfilment`);
      if (res.data.success) {
        toast.success(res.data.message || 'Digital fulfilment re-triggered successfully!');
        fetchPaymentDetail();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to retry digital fulfilment');
    } finally {
      setRetryingFulfilment(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CAPTURED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle size={12} /> Captured</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><XCircle size={12} /> Failed</span>;
      case 'PARTIALLY_REFUNDED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><RefreshCw size={12} /> Partially Refunded</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1"><RefreshCw size={12} /> Refunded</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><AlertTriangle size={12} /> Disputed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 flex items-center gap-1"><Clock size={12} /> {status}</span>;
    }
  };

  const getVerificationBadge = (vStatus: string) => {
    switch (vStatus) {
      case 'FULLY_VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><ShieldCheck size={12} /> Fully Verified</span>;
      case 'SIGNATURE_VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"><ShieldCheck size={12} /> Signature Verified</span>;
      case 'VERIFICATION_FAILED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"><ShieldAlert size={12} /> Failed</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200">Not Verified</span>;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'verification', label: 'Verification & Security' },
    { id: 'fulfilment', label: 'Fulfilment State' },
    { id: 'refunds', label: `Refunds (${payment?.refunds?.length || 0})` },
    { id: 'disputes', label: `Disputes (${payment?.disputes?.length || 0})` },
    { id: 'webhooks', label: `Webhooks (${payment?.events?.length || 0})` },
    { id: 'timeline', label: 'Timeline & Events' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
              <CreditCard size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-white">Payment Diagnostic Profile</h2>
                {payment && getStatusBadge(payment.status)}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {payment?.razorpayPaymentId || payment?.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {payment?.status === 'CAPTURED' && onRefundClick && (
              <button
                type="button"
                onClick={() => onRefundClick(payment)}
                className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <DollarSign size={14} />
                Issue Refund
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loading || !payment ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw size={28} className="animate-spin mx-auto text-indigo-600" />
            <p className="text-sm font-semibold">Loading diagnostic payload...</p>
          </div>
        ) : (
          <>
            {/* Top KPI Quick Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
              <div>
                <span className="text-slate-500 block font-medium">Captured Amount</span>
                <span className="font-bold text-slate-900 text-base">{formatCurrency(payment.amount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Refunded Balance</span>
                <span className={`font-bold text-base ${payment.refundedAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatCurrency(payment.refundedAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Verification Status</span>
                <div className="mt-0.5">{getVerificationBadge(payment.verificationStatus)}</div>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Payment Gateway</span>
                <span className="font-bold text-indigo-700 text-sm">{payment.method || 'RAZORPAY'}</span>
              </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex border-b border-slate-200 px-6 gap-2 bg-white overflow-x-auto shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Tab Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-in fade-in duration-150 text-xs">
                  
                  {/* Order & Customer Context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Customer Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <User size={16} className="text-indigo-600" />
                        <span>Customer Profile</span>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <p><span className="font-semibold text-slate-700">Name:</span> {payment.order?.guestName || payment.customer?.name || 'Guest'}</p>
                        <p><span className="font-semibold text-slate-700">Email:</span> {payment.order?.guestEmail || payment.customer?.email}</p>
                        <p><span className="font-semibold text-slate-700">Customer Code:</span> {payment.customer?.customerCode || 'N/A'}</p>
                        <p><span className="font-semibold text-slate-700">Customer Type:</span> {payment.customer?.customerType || 'GUEST'}</p>
                      </div>
                    </div>

                    {/* Order Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <ShoppingBag size={16} className="text-emerald-600" />
                        <span>Order Reference</span>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <div className="flex items-center justify-between">
                          <p><span className="font-semibold text-slate-700">Order No:</span> {payment.order?.orderNumber}</p>
                          <button
                            onClick={() => copyToClipboard(payment.order?.orderNumber, 'Order Number')}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <p><span className="font-semibold text-slate-700">Order Total:</span> {formatCurrency(payment.order?.totalAmount)}</p>
                        <p><span className="font-semibold text-slate-700">Order Status:</span> {payment.order?.orderStatus}</p>
                        <p><span className="font-semibold text-slate-700">Payment Status:</span> {payment.order?.paymentStatus}</p>
                      </div>
                    </div>

                  </div>

                  {/* Razorpay Gateway Identifiers */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Gateway Identifiers</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 font-mono text-[11px]">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-sans">Razorpay Payment ID</span>
                          <span className="font-bold text-slate-900">{payment.razorpayPaymentId || 'N/A'}</span>
                        </div>
                        {payment.razorpayPaymentId && (
                          <button onClick={() => copyToClipboard(payment.razorpayPaymentId, 'Payment ID')} className="text-slate-400 hover:text-slate-600">
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-sans">Razorpay Order ID</span>
                          <span className="font-bold text-slate-900">{payment.razorpayOrderId || 'N/A'}</span>
                        </div>
                        {payment.razorpayOrderId && (
                          <button onClick={() => copyToClipboard(payment.razorpayOrderId, 'Order ID')} className="text-slate-400 hover:text-slate-600">
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Failure Diagnostic Card (If Failed) */}
                  {payment.status === 'FAILED' && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                        <XCircle size={16} />
                        <span>Gateway Failure Breakdown</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <p><span className="font-semibold">Category:</span> {payment.failureCategory || 'TECHNICAL_ERROR'}</p>
                        <p><span className="font-semibold">Gateway Code:</span> {payment.failureCode || 'GATEWAY_ERROR'}</p>
                        <p className="col-span-2"><span className="font-semibold">Description:</span> {payment.failureDescription || 'Payment was declined by the bank or gateway.'}</p>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: VERIFICATION & SECURITY */}
              {activeTab === 'verification' && (
                <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">Dual Verification State</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Checkout Signature Verification</p>
                          <p className="text-slate-500 text-[11px]">HMAC-SHA256 constant-time check</p>
                        </div>
                        {payment.verificationBlock?.checkoutSignatureVerified ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Passed</span>
                        ) : (
                          <span className="text-slate-400 font-bold flex items-center gap-1"><XCircle size={14} /> None</span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Webhook Signature Verification</p>
                          <p className="text-slate-500 text-[11px]">Raw Request Body HMAC check</p>
                        </div>
                        {payment.verificationBlock?.webhookSignatureVerified ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Passed</span>
                        ) : (
                          <span className="text-slate-400 font-bold flex items-center gap-1"><XCircle size={14} /> None</span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Amount Consistency</p>
                          <p className="text-slate-500 text-[11px]">Order Total == Gateway Captured</p>
                        </div>
                        {payment.verificationBlock?.amountMatchesOrder ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Matched</span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={14} /> Mismatch</span>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Currency Consistency</p>
                          <p className="text-slate-500 text-[11px]">Expected INR == Gateway INR</p>
                        </div>
                        {payment.verificationBlock?.currencyMatchesOrder ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Matched</span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={14} /> Mismatch</span>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Fraud Risk Block */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Risk Assessment & Signals</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p><span className="font-semibold text-slate-700">Risk Score:</span> <span className="font-bold text-indigo-600">{payment.riskScore || 'NORMAL'}</span></p>
                        <p><span className="font-semibold text-slate-700">Reason:</span> {payment.riskReason || 'Standard transaction velocity'}</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-bold">
                        {payment.riskScore || 'NORMAL'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FULFILMENT STATE */}
              {activeTab === 'fulfilment' && (
                <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Payment-to-Fulfilment Pipeline</h4>
                      {payment.status === 'CAPTURED' && (
                        <button
                          type="button"
                          onClick={handleRetryFulfilment}
                          disabled={retryingFulfilment}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={retryingFulfilment ? 'animate-spin' : ''} />
                          {retryingFulfilment ? 'Retrying...' : 'Retry Fulfilment'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-700">1. Payment Captured</span>
                        {payment.status === 'CAPTURED' ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Completed</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Pending</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-700">2. Order Paid Status</span>
                        {payment.order?.paymentStatus === 'PAID' ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Paid</span>
                        ) : (
                          <span className="text-amber-600 font-medium">{payment.order?.paymentStatus || 'Pending'}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-700">3. Digital Entitlements Granted</span>
                        {payment.order?.accessStatus === 'ACTIVE' ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Active</span>
                        ) : (
                          <span className="text-amber-600 font-medium">{payment.order?.accessStatus || 'Not Granted'}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-700">4. Licence Keys Issued</span>
                        <span className="font-bold text-slate-700">{payment.order?.licenceKeys?.length || 0} Key(s)</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="font-semibold text-slate-700">5. Download Activity Logged</span>
                        <span className="font-bold text-slate-700">{payment.order?.downloadHistory?.length || 0} Attempt(s)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: REFUNDS */}
              {activeTab === 'refunds' && (
                <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                  {(!payment.refunds || payment.refunds.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <DollarSign className="mx-auto mb-1 text-slate-300" size={28} />
                      <p className="font-semibold">No Refunds Issued For This Payment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payment.refunds.map((ref: any) => (
                        <div key={ref.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{formatCurrency(ref.amount)}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                              {ref.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-slate-600">
                            <p><span className="font-semibold">Refund ID:</span> {ref.razorpayRefundId || ref.id}</p>
                            <p><span className="font-semibold">Processed:</span> {new Date(ref.createdAt).toLocaleString()}</p>
                            <p className="col-span-2"><span className="font-semibold">Reason:</span> {ref.reason || 'N/A'}</p>
                            <p><span className="font-semibold">Access Revoked:</span> {ref.accessRevoked ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: DISPUTES */}
              {activeTab === 'disputes' && (
                <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                  {(!payment.disputes || payment.disputes.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <ShieldAlert className="mx-auto mb-1 text-slate-300" size={28} />
                      <p className="font-semibold">No Chargebacks or Disputes on Record</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payment.disputes.map((disp: any) => (
                        <div key={disp.id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 text-sm">{formatCurrency(disp.amount)}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900">
                              {disp.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-slate-700">
                            <p><span className="font-semibold">Dispute ID:</span> {disp.razorpayDisputeId || disp.id}</p>
                            <p><span className="font-semibold">Evidence Status:</span> {disp.evidenceStatus}</p>
                            <p className="col-span-2"><span className="font-semibold">Reason:</span> {disp.reason || 'Chargeback'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: WEBHOOKS */}
              {activeTab === 'webhooks' && (
                <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                  {(!payment.events || payment.events.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Activity className="mx-auto mb-1 text-slate-300" size={28} />
                      <p className="font-semibold">No Direct Webhook Logs Linked</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {payment.events.map((evt: any) => (
                        <div key={evt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between font-sans font-bold">
                            <span className="text-slate-900">{evt.eventType}</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {evt.status}
                            </span>
                          </div>
                          <p className="text-slate-500">ID: {evt.externalEventId || evt.id}</p>
                          <p className="text-slate-500">Received: {new Date(evt.receivedAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: TIMELINE & EVENTS */}
              {activeTab === 'timeline' && (
                <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                  {(!payment.order?.timelineEvents || payment.order.timelineEvents.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <HistoryIcon className="mx-auto mb-1 text-slate-300" size={28} />
                      <p className="font-semibold">No Chronological Events Recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {payment.order.timelineEvents.map((event: any) => (
                        <div key={event.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                            <Activity size={14} />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{event.eventType}</span>
                              <span className="text-[11px] text-slate-400">{new Date(event.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-600">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-400 font-mono">DB Reference: {payment.id}</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Profile
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
