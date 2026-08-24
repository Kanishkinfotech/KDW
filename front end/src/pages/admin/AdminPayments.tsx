import { useState, useEffect } from 'react';
import { Search, Filter, Download, ExternalLink, RefreshCw, AlertCircle, MoreVertical } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV } from '../../utils/csvExport';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    
    
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/orders');
        if (res.data.success) {
          // Map orders to payment transaction logs
          const mappedPayments = res.data.data.map((order: any) => {
            
            // Mocking or pulling real transaction ID
            let txnId = order.razorpayPaymentId || order.paymentId;
            if (!txnId) {
                // generate a fake txn id for orders that don't have one (like mock data)
                txnId = order.orderId ? order.orderId.replace('ORD-', 'pay_') : `pay_${order._id.substring(0, 10)}`;
            }

            // Gateway logic
            const gateway = txnId.startsWith('pi_') || txnId.startsWith('txn_') ? 'Stripe' : 'Razorpay';
            
            // Status mapping
            let paymentStatus = 'Pending';
            if (order.status === 'paid' || order.status === 'completed') paymentStatus = 'Successful';
            if (order.status === 'failed') paymentStatus = 'Failed';
            if (order.status === 'refunded') paymentStatus = 'Refunded';

            return {
              id: order._id,
              transactionId: txnId,
              gateway,
              amount: order.amount,
              status: paymentStatus,
              customerName: order.user?.name || 'Guest',
              method: order.paymentMethod || 'Card',
              createdAt: order.createdAt || new Date().toISOString()
            };
          });
          setPayments(mappedPayments);
        }
      } catch (err) {
        console.error("Failed to fetch payments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [logout]);

  const filteredPayments = payments.filter(p => 
    p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredPayments.map(p => ({
      TransactionID: p.transactionId,
      Customer: p.customerName,
      Amount: formatCurrency(p.amount),
      Method: p.method,
      Status: p.status,
      Date: new Date(p.createdAt).toLocaleDateString()
    }));
    exportToCSV(exportData, 'payments_export');
    toast.success('Payments exported successfully');
  };

  const handleMockAction = (action: string) => {
    toast.success(`${action} feature coming soon!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">Transaction logs from Razorpay and Stripe.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Download size={18} />
          Export Data
        </button>
      </div>

      {/* Table Controls */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Gateway</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 animate-pulse">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No transactions found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900 font-mono text-xs">{payment.transactionId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{payment.gateway}</span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        payment.status === 'Successful' ? 'bg-success/10 text-success border-success/20' :
                        payment.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        payment.status === 'Refunded' ? 'bg-slate-200 text-slate-600 border-slate-300' :
                        'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleMockAction('View Gateway Details')} className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Gateway Details">
                          <ExternalLink size={16} />
                        </button>
                        {payment.status === 'Failed' && (
                          <button onClick={() => handleMockAction('Retry Payment')} className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors" title="Retry Payment">
                            <RefreshCw size={16} />
                          </button>
                        )}
                        {payment.status === 'Successful' && (
                          <button onClick={() => handleMockAction('Issue Refund')} className="p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Issue Refund">
                            <AlertCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleMockAction('More Options')} className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="More Options">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>Showing {filteredPayments.length} records</span>
        </div>
      </div>
    </div>
  );
}

