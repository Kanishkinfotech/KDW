import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, ExternalLink, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import type { DashboardOrderItem, DashboardOrdersData } from '../../../services/adminDashboardService';
import AdminOrderDetailModal from '../AdminOrderDetailModal';

export interface RecentOrdersSectionProps {
  ordersData?: DashboardOrdersData;
  loading: boolean;
}

export default function RecentOrdersSection({ ordersData, loading }: RecentOrdersSectionProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const recentOrders = ordersData?.recentOrders || [];
  const statusCounts = ordersData?.statusCounts || { new: 0, pending: 0, paid: 0, processing: 0, completed: 0, refunded: 0, failed: 0, total: 0 };

  const getPaymentBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESSFUL') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    if (s === 'PENDING') {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    if (s === 'REFUNDED') {
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    }
    if (s === 'FAILED') {
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  return (
    <div className="kdw-card overflow-hidden">
      {/* Header with Status Filters */}
      <div className="p-6 sm:p-8 border-b border-[#e2e8f0] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            TRANSACTION STORE
          </span>
          <h3 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
            Recent Orders
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Real-time feed of persistent orders recorded into the transaction ledger.
          </p>
        </div>

        {/* Order Status Breakdown Counts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/orders?status=PAID"
            className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold hover:bg-emerald-100 transition-colors"
          >
            {statusCounts.paid} Paid
          </Link>
          <Link
            to="/admin/orders?status=PENDING"
            className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-bold hover:bg-amber-100 transition-colors"
          >
            {statusCounts.pending || statusCounts.new} Pending
          </Link>
          {statusCounts.failed > 0 && (
            <Link
              to="/admin/orders?status=FAILED"
              className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono font-bold hover:bg-rose-100 transition-colors"
            >
              {statusCounts.failed} Failed
            </Link>
          )}
          {statusCounts.refunded > 0 && (
            <Link
              to="/admin/reports/refunds"
              className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono font-bold hover:bg-purple-100 transition-colors"
            >
              {statusCounts.refunded} Refunded
            </Link>
          )}
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-[#5b21b6] hover:bg-[#ede9fe] transition-colors font-sans"
          >
            <span>View all ({statusCounts.total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-slate-50/60 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">Order ID</th>
              <th className="py-3.5 px-6">Customer</th>
              <th className="py-3.5 px-6">Product / Items</th>
              <th className="py-3.5 px-6">Amount</th>
              <th className="py-3.5 px-6">Payment</th>
              <th className="py-3.5 px-6">Date</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] font-sans">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#5b21b6] border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading recent orders...</span>
                  </div>
                </td>
              </tr>
            ) : recentOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
                  <span className="text-xs font-medium text-slate-600 block">No orders recorded in this period.</span>
                  <span className="text-[11px] text-slate-400">New transactions will appear here instantly.</span>
                </td>
              </tr>
            ) : (
              recentOrders.map((ord: DashboardOrderItem) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-6 font-mono font-bold text-[#5b21b6]">
                    <button
                      onClick={() => setSelectedOrderId(ord.id)}
                      className="hover:underline text-left"
                    >
                      {ord.orderNumber || ord.id.slice(0, 10)}
                    </button>
                  </td>
                  <td className="py-3.5 px-6 text-slate-700">
                    <div className="font-semibold text-slate-900">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">{ord.customerEmail}</div>
                  </td>
                  <td className="py-3.5 px-6 text-slate-700 font-medium">
                    <span className="truncate block max-w-[200px]">{ord.productName}</span>
                  </td>
                  <td className="py-3.5 px-6 font-mono font-bold text-[#171325]">
                    {formatCurrency(ord.totalAmount)}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${getPaymentBadge(ord.paymentStatus)}`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-500 font-mono text-[11px]">
                    {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-1.5">
                    <button
                      onClick={() => setSelectedOrderId(ord.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5b21b6] bg-[#ede9fe] hover:bg-[#ddd6fe] transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <AdminOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
}
