import { useState, useEffect, useMemo } from 'react';
import { Search, Download, MoreVertical, FileText, XCircle, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvExport';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('All Orders');
  const { logout } = useAuth();

  useEffect(() => {
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/admin/orders', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data && res.data.success) {
          const mappedOrders = res.data.orders.map((o: any) => ({
            ...o,
            _id: o.id,
            orderId: o.orderNumber,
            amount: o.totalAmount,
            status: o.paymentStatus.toLowerCase(),
            userId: o.customer,
            items: o.items || []
          }));
          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [logout]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${status.toUpperCase()}? ${status === 'refunded' ? 'This will revoke all digital access entitlements.' : ''}`)) return;
    try {
      const endpoint = status === 'refunded' ? `/api/admin/orders/${id}/refund` : `/api/admin/orders/${id}/status`;
      const body = status === 'refunded' ? {} : { paymentStatus: status.toUpperCase(), orderStatus: status.toUpperCase() };
      const method = status === 'refunded' ? 'post' : 'put';
      
      const res = await axios({
        method,
        url: endpoint,
        data: body,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setOrders(orders.map(o => (o._id === id || o.id === id ? { ...o, status } : o)));
      } else {
        alert(res.data.message);
      }
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      alert(err.response?.data?.message || "Failed to update order status");
    }
  };

  const handleResendEmail = async (id: string) => {
    try {
      const res = await axios.post(`/api/admin/orders/${id}/resend-email`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        alert('Access delivery email successfully resent to customer');
      } else {
        alert(res.data.message || 'Failed to resend email');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error resending email');
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const exportData = orders.map(o => ({
      'Order ID': o.orderId,
      'Customer Name': o.userId?.name || o.guestEmail || 'Unknown',
      'Customer Email': o.userId?.email || o.guestEmail || '',
      'Date': new Date(o.createdAt).toLocaleDateString(),
      'Amount': o.amount,
      'Status': o.status,
      'Payment Gateway': 'Razorpay'
    }));
    exportToCSV(exportData, 'kwd_orders');
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search matching
      const customerName = o.userId?.name || o.guestEmail || 'Unknown';
      const email = o.userId?.email || o.guestEmail || '';
      
      const matchesSearch = 
        (o.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());

      // Tab filtering
      const matchesTab = 
        filterTab === 'All Orders' ? true :
        filterTab === 'Paid' ? (o.status === 'paid' || o.status === 'completed') :
        filterTab === 'Pending' ? o.status === 'pending' : true;

      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, filterTab]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage all transactions, refunds, and digital access.</p>
        </div>
        <button onClick={handleExportCSV} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 w-full sm:w-auto justify-center">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Table Controls */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder="Search by Order ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button 
            onClick={() => setFilterTab('All Orders')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterTab === 'All Orders' ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            All Orders
          </button>
          <button 
            onClick={() => setFilterTab('Paid')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterTab === 'Paid' ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Paid
          </button>
          <button 
            onClick={() => setFilterTab('Pending')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterTab === 'Pending' ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 animate-pulse">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No orders found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const customerName = order.userId?.name || order.guestEmail || 'Unknown Customer';
                  const email = order.userId?.email || order.guestEmail || '';
                  const productNames = order.items.map((i: any) => i.name || i.productName).join(', ');
                  const isPaid = order.status === 'paid' || order.status === 'completed';
                  
                  return (
                    <tr key={order._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{order.orderId}</p>
                        <p className="text-xs text-slate-500 max-w-[200px] truncate" title={productNames}>{productNames}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{customerName}</p>
                        <p className="text-xs text-slate-500">{email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${
                            isPaid ? 'bg-success/10 text-success' :
                            order.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                            order.status === 'refunded' ? 'bg-slate-200 text-slate-600' :
                            'bg-danger/10 text-danger'
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium">Razorpay</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPaid && (
                            <>
                              <button onClick={() => handleResendEmail(order._id)} className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Resend Access Email">
                                <FileText size={16} />
                              </button>
                              <button onClick={() => handleStatusChange(order._id, 'refunded')} className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors" title="Refund & Revoke Access">
                                <RotateCcw size={16} />
                              </button>
                            </>
                          )}
                          {(order.status === 'pending' || isPaid) && (
                            <button onClick={() => handleStatusChange(order._id, 'failed')} className="p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Cancel Order">
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>Showing 1 to {filteredOrders.length} of {filteredOrders.length} orders</span>
        </div>
      </div>
    </div>
  );
}

