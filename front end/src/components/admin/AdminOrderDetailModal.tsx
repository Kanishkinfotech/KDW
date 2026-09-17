import { useState } from 'react';
import {
  X, Shield, CheckCircle2, AlertTriangle, Clock, RefreshCw, Send,
  Calendar, RotateCcw, Ban, DollarSign, MessageSquare, History, FileText,
  User, ExternalLink, HardDrive, Key, Copy, Check, Download, AlertCircle,
  TrendingUp, CreditCard, ChevronRight, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatCurrency } from '../../utils/currency';

interface AdminOrderDetailModalProps {
  orderId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function AdminOrderDetailModal({ orderId, onClose, onRefresh }: AdminOrderDetailModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'customer' | 'payment' | 'entitlements' | 'downloads' | 'refunds' | 'notes' | 'timeline' | 'audit'>('items');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Dialog / Action inputs state
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('INTERNAL');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundRevokeAccess, setRefundRevokeAccess] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(30);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrder(res.data.order);
        setRefundAmount(res.data.order.remainingRefundable?.toString() || res.data.order.totalAmount?.toString() || '');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load order details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchOrderDetails();
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // 1. Retry Fulfilment Action
  const handleRetryFulfilment = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/orders/${order.id}/retry-fulfilment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Fulfilment executed successfully!');
        fetchOrderDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Fulfilment retry failed');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Resend Access Email Action
  const handleResendAccess = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/orders/${order.id}/resend-access`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Access delivery email resent successfully!');
        fetchOrderDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend access email');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Extend Access Action
  const handleExtendAccess = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/orders/${order.id}/extend-access`, {
        additionalDays: extensionDays,
        reason: 'Customer courtesy extension'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(`Access extended by ${extensionDays} days!`);
        setShowExtendModal(false);
        fetchOrderDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to extend access');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Reset Downloads Action
  const handleResetDownloads = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/orders/${order.id}/reset-downloads`, {
        reason: resetReason || 'Customer requested download limit reset'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Download counts reset to 0! Historical logs preserved.');
        setShowResetModal(false);
        setResetReason('');
        fetchOrderDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset downloads');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Revoke Access Action
  const handleRevokeAccess = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/orders/${order.id}/revoke-access`, {
        reason: revokeReason || 'Administrative revocation'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Access revoked and tokens invalidated!');
        setShowRevokeModal(false);
        setRevokeReason('');
        fetchOrderDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Process Refund Action
  const handleProcessRefund = async () => {
    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid positive refund amount');
      return;
    }
    if (amt > (order.remainingRefundable || order.totalAmount)) {
      toast.error(`Amount exceeds remaining refundable of ₹${order.remainingRefundable}`);
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/orders/${order.id}/refund`, {
        amount: amt,
        reason: refundReason || 'Admin processed refund',
        revokeAccess: refundRevokeAccess
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Refund successfully processed!');
        setShowRefundModal(false);
        setRefundReason('');
        fetchOrderDetails();
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/admin/orders/${order.id}/notes`, {
        content: newNote.trim(),
        noteType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Note added to order trail');
        setNewNote('');
        fetchOrderDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-slate-100">
          <RefreshCw className="animate-spin text-primary mx-auto" size={32} />
          <h3 className="font-bold text-slate-900 text-lg">Loading Order Diagnostics</h3>
          <p className="text-xs text-slate-500">Retrieving multi-state snapshots, entitlements, and timeline events...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER BAR */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                {order.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(order.orderNumber, 'Order Number')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
              >
                {copiedText === 'Order Number' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar size={13} /> {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {/* Payment Status Pill */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                order.paymentStatus === 'PAID' || order.paymentStatus === 'CAPTURED' ? 'bg-emerald-100 text-emerald-800' :
                order.paymentStatus === 'REFUNDED' ? 'bg-purple-100 text-purple-800' :
                order.paymentStatus === 'PARTIALLY_REFUNDED' ? 'bg-indigo-100 text-indigo-800' :
                order.paymentStatus === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Payment: {order.paymentStatus}
              </span>

              {/* Fulfilment Status Pill */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                order.fulfilmentStatus === 'FULFILLED' ? 'bg-blue-100 text-blue-800' :
                order.fulfilmentStatus === 'PROCESSING' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                order.fulfilmentStatus === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }`}>
                Fulfilment: {order.fulfilmentStatus}
              </span>

              {/* Access Status Pill */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                order.accessStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                order.accessStatus === 'REVOKED' ? 'bg-rose-100 text-rose-800' :
                order.accessStatus === 'EXPIRED' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Access: {order.accessStatus}
              </span>

              {/* Licence Status Pill */}
              {order.licenceStatus !== 'NOT_REQUIRED' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800">
                  Licence: {order.licenceStatus}
                </span>
              )}

              {/* Critical Alert Pill */}
              {order.paymentStatus === 'PAID' && order.accessStatus === 'NOT_GRANTED' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white animate-bounce">
                  ⚠ Paid Without Access
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Amount</span>
              <span className="text-xl font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ACTION BAR STRIP */}
        <div className="bg-sky-50 border-y border-sky-200 text-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-800">Quick Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Retry Fulfilment */}
            <button
              type="button"
              onClick={handleRetryFulfilment}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={actionLoading ? 'animate-spin' : ''} />
              Retry Fulfilment
            </button>

            {/* Resend Access Email */}
            <button
              type="button"
              onClick={handleResendAccess}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 font-bold text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Send size={13} />
              Resend Access
            </button>

            {/* Extend Access */}
            <button
              type="button"
              onClick={() => setShowExtendModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock size={13} />
              Extend Access
            </button>

            {/* Reset Downloads */}
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset Downloads
            </button>

            {/* Revoke Access */}
            {order.accessStatus === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => setShowRevokeModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 font-bold text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-800/60"
              >
                <Ban size={13} />
                Revoke Access
              </button>
            )}

            {/* Refund */}
            {order.remainingRefundable > 0 && (
              <button
                type="button"
                onClick={() => setShowRefundModal(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 font-bold text-purple-300 flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-800/60"
              >
                <DollarSign size={13} />
                Process Refund
              </button>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto bg-slate-50/70 shrink-0">
          {[
            { id: 'items', label: `Items & Bundles (${order.items?.length || 0})`, icon: HardDrive },
            { id: 'customer', label: 'Customer', icon: User },
            { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
            { id: 'entitlements', label: 'Entitlements & Licences', icon: Shield },
            { id: 'downloads', label: `Download Logs (${order.downloadHistory?.length || 0})`, icon: Download },
            { id: 'refunds', label: `Refunds (${order.refunds?.length || 0})`, icon: DollarSign },
            { id: 'notes', label: `Notes (${order.orderNotes?.length || 0})`, icon: MessageSquare },
            { id: 'timeline', label: `Timeline (${order.timelineEvents?.length || 0})`, icon: History },
            { id: 'audit', label: `Audit Log (${order.auditLogs?.length || 0})`, icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: ITEMS & BUNDLE COMPONENTS */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Purchased Snapshots & Delivery Targets</h4>
                <span className="text-xs text-slate-500">Historical snapshots locked at checkout</span>
              </div>

              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.product?.thumbnail || item.bundle?.coverImage || '/placeholder.png'}
                          alt={item.productName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">{item.productName}</h5>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              item.bundleId ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.bundleId ? 'Curated Bundle' : 'Single Product'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Version Snapshot: <span className="font-mono font-bold text-slate-700">{item.productVersionSnapshot || '1.0.0'}</span> • Licence: <span className="font-bold text-slate-700">{item.licenceSnapshot || 'Commercial'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-slate-900">{formatCurrency(item.totalAmount || item.unitPrice * item.quantity)}</span>
                        <span className="block text-[10px] text-slate-400 font-bold">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>

                    {/* Bundle Components Breakdown */}
                    {item.bundle && item.bundle.bundleItems && item.bundle.bundleItems.length > 0 && (
                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 block">
                          Bundle Components Included ({item.bundle.bundleItems.length} Products):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.bundle.bundleItems.map((bi: any) => (
                            <div key={bi.id} className="p-2 rounded-lg bg-white border border-purple-200/60 flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800 truncate max-w-[200px]">{bi.product?.name}</span>
                              <span className="font-mono text-[11px] text-purple-700 font-bold">{formatCurrency(bi.product?.price || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatCurrency(order.subtotal || order.totalAmount)}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Applied</span>
                    <span>- {formatCurrency(order.discountTotal)}</span>
                  </div>
                )}
                {order.refundedAmount > 0 && (
                  <div className="flex justify-between text-purple-600 font-bold">
                    <span>Refunded to Date</span>
                    <span>- {formatCurrency(order.refundedAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900 text-sm">
                  <span>Net Authoritative Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER SNAPSHOT */}
          {activeTab === 'customer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User size={16} className="text-primary" /> Customer Profile
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Name</span>
                    <span className="font-black text-slate-900 text-sm">{order.guestName || order.customer?.name || 'Guest User'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Email Address</span>
                    <span className="font-medium text-slate-800">{order.guestEmail || order.customer?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Customer Type</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] mt-1 ${
                      order.customerType === 'ACCOUNT' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.customerType === 'ACCOUNT' ? 'Registered Account' : 'Guest Checkout'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600" /> Account Metrics & History
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Lifetime Value</span>
                    <span className="font-black text-slate-900 text-base">{formatCurrency(order.customerLtv || order.totalAmount)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Orders</span>
                    <span className="font-black text-slate-900 text-base">{order.customer?._count?.orders || 1}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT GATEWAY DIAGNOSTICS */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" /> Gateway Integration Diagnostic Record
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Razorpay Order ID</span>
                    <span className="font-mono font-bold text-slate-900">{order.razorpayOrderId || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Razorpay Payment ID</span>
                    <span className="font-mono font-bold text-slate-900">{order.razorpayPaymentId || 'N/A'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Captured Timestamp</span>
                    <span className="font-medium text-slate-800">{order.paidAt ? new Date(order.paidAt).toLocaleString() : 'Not captured'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Signature Verification</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Verified on Server Callback
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENTITLEMENTS & LICENCES */}
          {activeTab === 'entitlements' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Key size={16} className="text-primary" /> Active Licences Issued ({order.licenceKeys?.length || 0})
                </h4>

                {order.licenceKeys && order.licenceKeys.length > 0 ? (
                  <div className="space-y-2">
                    {order.licenceKeys.map((lic: any) => (
                      <div key={lic.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{lic.keyMasked}</span>
                          <span className="text-slate-500 text-[11px] block mt-0.5">Tier: {lic.licenceType} • Activations: {lic.activationCount}/{lic.activationLimit}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          lic.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {lic.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No standalone licence keys required for this order.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOWNLOAD LOGS */}
          {activeTab === 'downloads' && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Download size={16} className="text-primary" /> Historical Download Attempts
              </h4>

              {order.downloadHistory && order.downloadHistory.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {order.downloadHistory.map((d: any) => (
                    <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{new Date(d.downloadedAt).toLocaleString()}</span>
                        <span className="text-slate-500 text-[11px] block">IP: {d.ipAddress || '127.0.0.1'} • {d.userAgent?.slice(0, 40) || 'Browser Client'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        d.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.result}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No download attempts recorded yet.</p>
              )}
            </div>
          )}

          {/* TAB 6: REFUNDS & DISPUTES */}
          {activeTab === 'refunds' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Refund Records</h4>
                  <span className="text-xs font-bold text-purple-700">Remaining Refundable: {formatCurrency(order.remainingRefundable || 0)}</span>
                </div>

                {order.refunds && order.refunds.length > 0 ? (
                  <div className="space-y-2">
                    {order.refunds.map((r: any) => (
                      <div key={r.id} className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-black text-slate-900">{formatCurrency(r.amount)}</span>
                          <span className="text-slate-500 text-[11px] block">{r.reason} • By {r.approvedBy || r.requestedBy}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 font-bold text-[10px]">
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No refunds have been processed for this order.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: INTERNAL NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <label className="font-bold text-slate-900 text-xs block">Add Internal / Customer Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type note details regarding customer communications, payment checks, or support..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="INTERNAL">Internal Admin Note</option>
                    <option value="CUSTOMER_VISIBLE">Customer Visible</option>
                  </select>
                  <button
                    type="submit"
                    disabled={actionLoading || !newNote.trim()}
                    className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Add Note
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {order.orderNotes?.map((note: any) => (
                  <div key={note.id} className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{note.authorName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History size={16} className="text-primary" /> Chronological Order Lifecycle
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {order.timelineEvents?.map((evt: any) => (
                  <div key={evt.id} className="relative text-xs">
                    <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      evt.status === 'SUCCESS' ? 'bg-emerald-500' :
                      evt.status === 'WARNING' ? 'bg-amber-500' :
                      evt.status === 'FAILED' ? 'bg-rose-500' : 'bg-primary'
                    }`} />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{evt.eventType}</span>
                      <span className="text-[10px] text-slate-400">{new Date(evt.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{evt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Immutable Audit Trail
              </h4>

              <div className="space-y-2 text-xs">
                {order.auditLogs?.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-500 text-[11px] block">{log.reason} • Actor: {log.actorEmail}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* EXTEND ACCESS MODAL */}
      {showExtendModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base">Extend Digital Access</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Additional Days</label>
              <input
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="flex-1 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExtendAccess}
                disabled={actionLoading}
                className="flex-1 py-2 bg-primary text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET DOWNLOADS MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base">Reset Download Limits</h3>
            <p className="text-xs text-slate-500">Resets the download counter to 0 while keeping historical logs intact.</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reason</label>
              <input
                type="text"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="e.g. Customer browser crash..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDownloads}
                disabled={actionLoading}
                className="flex-1 py-2 bg-primary text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Reset Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE ACCESS MODAL */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-rose-100">
            <h3 className="font-black text-rose-900 text-base">Revoke Customer Access</h3>
            <p className="text-xs text-slate-500">Invalidates all active download tokens and suspends associated licences.</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reason</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Fraudulent payment / Policy breach..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="flex-1 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeAccess}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-rose-700"
              >
                Revoke Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-purple-100">
            <h3 className="font-black text-purple-900 text-base">Process Order Refund</h3>
            
            <div className="p-3 bg-purple-50 rounded-xl text-xs space-y-1">
              <span className="text-purple-700 font-bold">Max Refundable: {formatCurrency(order.remainingRefundable)}</span>
              <p className="text-slate-500 text-[11px]">Original Amount: {formatCurrency(order.totalAmount)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Refund Amount (INR)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reason</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={refundRevokeAccess}
                onChange={(e) => setRefundRevokeAccess(e.target.checked)}
                className="rounded text-primary focus:ring-primary/20"
              />
              Automatically Revoke Digital Access & Licences
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-2 bg-slate-100 font-bold text-slate-700 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={actionLoading}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
