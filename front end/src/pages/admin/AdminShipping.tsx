import { useState, useEffect } from 'react';
import { Truck, MapPin, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

export default function AdminShipping() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/admin/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
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
      toast.error('Failed to load orders for shipping.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await axios.patch(`/api/admin/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Filter orders that need shipping/fulfillment attention
  const fulfillableOrders = orders.filter(o => 
    ['paid', 'processing', 'shipped', 'completed'].includes(o.status)
  ).filter(o => 
    o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.shippingAddress?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.guestEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle size={12}/> Needs Fulfillment</span>;
      case 'processing': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> Processing</span>;
      case 'shipped': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><Truck size={12}/> Shipped</span>;
      case 'completed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Completed</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="text-primary" />
            Shipping & Fulfillment
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage order fulfillment, update shipping statuses, and track deliveries.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Order ID / Date</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Customer & Address</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Items</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Fulfillment Status</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fulfillableOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{order.orderId}</div>
                    <div className="text-slate-500 text-xs mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{order.shippingAddress?.fullName || order.userId?.name || 'Guest'}</div>
                    <div className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                      <MapPin size={12} />
                      {order.shippingAddress?.city ? `${order.shippingAddress.city}, ${order.shippingAddress.country}` : 'Digital Delivery'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700">
                      {order.items.length} item(s) • {formatCurrency(order.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                    >
                      <option value="paid">Mark as Paid</option>
                      <option value="processing">Mark as Processing</option>
                      <option value="shipped">Mark as Shipped</option>
                      <option value="completed">Mark as Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {fulfillableOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Truck size={48} className="mx-auto text-slate-700 mb-4" />
                    <p className="font-medium text-slate-600">No orders require shipping right now.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
