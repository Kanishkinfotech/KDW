import React, { useState, useEffect } from 'react';
import { 
  X, User, ShoppingBag, CreditCard, RotateCcw, Package, 
  ShieldCheck, Download, Ticket, KeyRound, Clock, LifeBuoy, CheckCircle2, Shield
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface CustomerMasterDrawerProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerMasterDrawer({ customerId, isOpen, onClose }: CustomerMasterDrawerProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!customerId || !isOpen) return;
    setLoading(true);
    fetch(`/api/admin/reports/customers/360/${encodeURIComponent(customerId)}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.customer);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [customerId, isOpen]);

  if (!isOpen || !customerId) return null;

  const customer = data || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: customer.orders?.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: customer.payments?.length },
    { id: 'refunds', label: 'Refunds', icon: RotateCcw, count: customer.refunds?.length },
    { id: 'entitlements', label: 'Entitlements', icon: ShieldCheck, count: customer.entitlements?.length },
    { id: 'downloads', label: 'Downloads', icon: Download, count: customer.downloads?.length },
    { id: 'coupons', label: 'Coupons', icon: Ticket, count: customer.coupons?.length },
    { id: 'logins', label: 'Login Activity', icon: KeyRound, count: customer.loginLogs?.length },
    { id: 'sessions', label: 'Sessions', icon: Clock, count: customer.sessions?.length },
    { id: 'support', label: 'Support Tickets', icon: LifeBuoy, count: customer.supportTickets?.length }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                {customer.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{customer.name || 'Customer 360'}</h2>
                <p className="text-xs text-slate-500">{customer.email} • {customer.customerType || 'ACCOUNT'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 border-b border-slate-200 overflow-x-auto bg-white flex gap-1">
            {tabs.map(t => {
              const TabIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeTab === t.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <TabIcon size={14} />
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                Loading customer 360 intelligence...
              </div>
            ) : activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-xs text-slate-500 block">Lifetime Spend</span>
                    <span className="text-xl font-black text-emerald-700">{formatCurrency(customer.totalSpent || 0)}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-xs text-slate-500 block">Total Orders</span>
                    <span className="text-xl font-black text-slate-900">{customer.orders?.length || 0}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <span className="text-xs text-slate-500 block">Active Entitlements</span>
                    <span className="text-xl font-black text-blue-600">{customer.entitlements?.length || 0}</span>
                  </div>
                </div>

                {/* Profile Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <h3 className="font-bold text-slate-900 mb-2">Customer Profile Attributes</h3>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-bold text-slate-800">{customer.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Phone Number:</span>
                    <span className="font-bold text-slate-800">{customer.mobile || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Customer Status:</span>
                    <span className="font-bold text-emerald-700">{customer.status || 'ACTIVE'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Customer Since:</span>
                    <span className="font-bold text-slate-800">{new Date(customer.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ) : activeTab === 'orders' ? (
              <div className="space-y-3">
                {(customer.orders || []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No order records.</p>
                ) : (
                  (customer.orders || []).map((o: any) => (
                    <div key={o.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">{o.orderNumber}</span>
                        <span className="text-slate-400">{new Date(o.createdAt).toLocaleDateString()} • {o.items?.length || 0} items</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">{formatCurrency(o.totalAmount)}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{o.paymentStatus}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'entitlements' ? (
              <div className="space-y-3">
                {(customer.entitlements || []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No digital entitlements found.</p>
                ) : (
                  (customer.entitlements || []).map((e: any) => (
                    <div key={e.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{e.product?.name || 'Digital Product'}</span>
                        <span className="text-slate-400">Downloads: {e.downloadCount} / {e.downloadLimit || 5}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">{e.status}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Data records for {activeTab} synced directly with PostgreSQL.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
