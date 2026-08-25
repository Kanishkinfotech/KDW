import React, { useState, useEffect } from 'react';
import { 
  HardDrive, Search, Filter, RefreshCw, Send, ExternalLink, 
  Copy, CheckCircle2, AlertTriangle, Clock, X, Eye, FileText, Check, ShieldCheck,
  ChevronDown, ChevronRight, Package, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminDigitalDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [resendModalData, setResendModalData] = useState<any | null>(null);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.get('/api/digital-delivery/admin/all', {
        headers,
        params: {
          search: searchTerm || undefined,
          deliveryStatus: statusFilter !== 'ALL' ? statusFilter : undefined
        }
      });

      if (res.data.success) {
        setDeliveries(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load digital deliveries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const confirmResend = async () => {
    if (!resendModalData) return;
    const orderId = resendModalData.orderId;

    setResendingId(orderId);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await axios.post(`/api/digital-delivery/admin/orders/${orderId}/resend`, {}, { headers });
      if (res.data.success) {
        toast.success('Digital delivery email resent successfully');
        setResendModalData(null);
        fetchDeliveries();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success('Google Drive link copied to clipboard');
  };

  const toggleExpand = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-700 text-white flex items-center justify-center font-black shadow-md shadow-primary/25">
              <HardDrive size={16} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Digital Product Deliveries</h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Track automated Google Drive bundle link dispatches and customer login account email deliveries.
          </p>
        </div>

        <button
          onClick={fetchDeliveries}
          className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-primary' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDeliveries()}
            placeholder="Search by customer email, order number, or product name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="SENT">Sent & Verified</option>
            <option value="PROCESSING">Processing</option>
            <option value="RESENT">Resent</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="p-3.5 pl-4 font-extrabold w-8"></th>
                <th className="p-3.5 font-extrabold">Order / Customer Email</th>
                <th className="p-3.5 font-extrabold">Product / Bundle</th>
                <th className="p-3.5 font-extrabold text-center">Items</th>
                <th className="p-3.5 font-extrabold text-center">Payment</th>
                <th className="p-3.5 font-extrabold text-center">Delivery Status</th>
                <th className="p-3.5 font-extrabold text-center">Email Status</th>
                <th className="p-3.5 font-extrabold">Dispatched At</th>
                <th className="p-3.5 pr-4 text-right font-extrabold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline mr-2 text-primary" size={16} />
                    Loading digital deliveries...
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No digital delivery records found.
                  </td>
                </tr>
              ) : (
                deliveries.map(d => {
                  const order = d.order || {};
                  const product = d.product || {};
                  const bundle = d.bundle || {};
                  const isBundle = !!d.bundleId;
                  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED';
                  const itemsCount = d.items?.length || d.bundleProductCount || 1;
                  const isExpanded = expandedRowId === d.id;

                  return (
                    <React.Fragment key={d.id}>
                      <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-purple-50/20' : ''}`}>
                        {/* Expand Button */}
                        <td className="p-3.5 pl-4">
                          {isBundle && d.items?.length > 0 ? (
                            <button
                              onClick={() => toggleExpand(d.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="Expand bundle items"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="w-3.5 h-3.5 block" />
                          )}
                        </td>

                        {/* Order & Customer */}
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 font-mono block">
                            {order.orderNumber || 'N/A'}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                            {d.customerEmail}
                          </span>
                        </td>

                        {/* Product / Bundle Name */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {isBundle && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-mono">
                                <Package size={10} /> Bundle
                              </span>
                            )}
                            <span className="font-bold text-slate-800 truncate max-w-[220px]">
                              {bundle.title || product.name || 'Digital Asset'}
                            </span>
                          </div>
                          {product.category && (
                            <span className="text-[10px] text-primary font-semibold block mt-0.5">
                              {product.category.name}
                            </span>
                          )}
                        </td>

                        {/* Items count */}
                        <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                          {itemsCount} {itemsCount === 1 ? 'Link' : 'Links'}
                        </td>

                        {/* Payment */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>

                        {/* Delivery Status */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            d.deliveryStatus === 'SENT' || d.deliveryStatus === 'RESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.deliveryStatus === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {d.deliveryStatus}
                          </span>
                        </td>

                        {/* Email Status */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            d.emailStatus === 'SENT' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}>
                            {d.emailStatus}
                          </span>
                        </td>

                        {/* Sent At */}
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {d.sentAt ? new Date(d.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {d.deliveryLink && (
                              <>
                                <a
                                  href={d.deliveryLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open Google Drive Link"
                                  className="p-1.5 text-slate-500 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <ExternalLink size={14} />
                                </a>

                                <button
                                  onClick={() => handleCopyLink(d.deliveryLink)}
                                  title="Copy Drive Link"
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Copy size={14} />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setResendModalData({
                                orderId: d.orderId,
                                customerEmail: d.customerEmail,
                                title: bundle.title || product.name || 'Digital Bundle',
                                itemsCount: d.items?.length || d.bundleProductCount || 1
                              })}
                              title="Resend Delivery Email"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Bundle Items Sub-Table (Clause 30, 31 & 32) */}
                      {isExpanded && d.items && d.items.length > 0 && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={9} className="p-4 pl-12">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                                Bundle Included Items ({d.items.length} Products Delivered):
                              </span>
                              <div className="divide-y divide-slate-100">
                                {d.items.map((item: any, idx: number) => (
                                  <div key={item.id} className="py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-slate-400 text-[11px] w-5">
                                        #{idx + 1}
                                      </span>
                                      <span className="font-bold text-slate-800 text-xs">
                                        {item.productName || item.product?.name || 'Digital Product'}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        {item.deliveryStatus}
                                      </span>
                                      {item.deliveryLink && (
                                        <a
                                          href={item.deliveryLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary hover:underline text-[11px] font-bold flex items-center gap-1"
                                        >
                                          <ExternalLink size={12} /> Open Drive Asset
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resend Confirmation Modal (Clause 34) */}
      {resendModalData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900">
            <div className="p-4 px-6 bg-[#0B1120] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="text-primary-light" size={16} />
                <h3 className="text-sm font-black text-white">Resend Digital Delivery Email</h3>
              </div>
              <button onClick={() => setResendModalData(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to resend the digital delivery email to the customer's authenticated login account?
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-medium">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recipient Customer:</span>
                  <span className="font-bold text-slate-900">{resendModalData.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchased Bundle:</span>
                  <span className="font-bold text-slate-900">{resendModalData.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Products & Links Included:</span>
                  <span className="font-bold text-emerald-700">{resendModalData.itemsCount} Delivery Links</span>
                </div>
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setResendModalData(null)}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResend}
                disabled={resendingId === resendModalData.orderId}
                className="px-5 py-2 rounded-xl text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/25 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {resendingId === resendModalData.orderId ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Confirm & Resend Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
