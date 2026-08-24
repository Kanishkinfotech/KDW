import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Plus, Tag, Download, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV } from '../../utils/csvExport';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        const mappedCoupons = res.data.coupons.map((c: any) => ({
          ...c,
          _id: c.id,
          discountPercentage: c.discountValue,
          maxUses: c.usageLimit || 0,
          currentUses: c.usedCount || 0,
          status: c.status === 'ACTIVE' ? 'Active' : 'Inactive'
        }));
        setCoupons(mappedCoupons);
      }
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [logout]);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discount.trim()) return;
    try {
      const res = await axios.post('/api/admin/coupons', { 
        code: code.trim().toUpperCase(), 
        discountType: 'PERCENTAGE',
        discountValue: Number(discount), 
        usageLimit: Number(maxUses) || null,
        status: 'ACTIVE'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        const c = res.data.coupon;
        const newCoupon = {
          ...c,
          _id: c.id,
          discountPercentage: c.discountValue,
          maxUses: c.usageLimit || 0,
          currentUses: c.usedCount || 0,
          status: c.status === 'ACTIVE' ? 'Active' : 'Inactive'
        };
        setCoupons([newCoupon, ...coupons]);
        setCode('');
        setDiscount('');
        setMaxUses('');
        setShowAddForm(false);
        toast.success('Coupon created successfully');
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      console.error("Failed to add coupon:", err);
      toast.error(err.response?.data?.message || 'Failed to add coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await axios.delete(`/api/admin/coupons/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setCoupons(coupons.filter(c => c._id !== id));
        toast.success('Coupon deleted');
      }
    } catch (err) {
      console.error("Failed to delete coupon:", err);
      toast.error('Failed to delete coupon');
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredCoupons.map(c => ({
      Code: c.code,
      Discount: `${c.discountPercentage}%`,
      Usage: `${c.currentUses} / ${c.maxUses || '∞'}`,
      Status: c.status
    }));
    exportToCSV(exportData, 'coupons_export');
    toast.success('Coupons exported successfully');
  };

  const handleMockAction = (action: string) => {
    toast.success(`${action} feature coming soon!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Coupons</h1>
          <p className="text-slate-500 mt-1">Manage discount codes and promotions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Download size={18} />
            Export Data
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            {showAddForm ? 'Cancel' : 'Create Coupon'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Coupon</h3>
          <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Coupon Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="SUMMER24" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900 uppercase" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount Percentage (%)</label>
              <input type="number" min="1" max="100" value={discount} onChange={e => setDiscount(e.target.value)} required placeholder="20" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Usage Limit (0 for unlimited)</label>
              <input type="number" min="0" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="100" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900" />
            </div>
            <div className="sm:col-span-3 pt-2">
              <button type="submit" className="bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2 px-6 rounded-lg shadow-sm transition-colors text-sm">
                Save Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Controls */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder="Search coupons..."
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
                <th className="px-6 py-4">Coupon Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Usage Limit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 animate-pulse">
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No coupons found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Tag size={18} className="text-primary" />
                        <p className="font-bold text-slate-900 font-mono">{coupon.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900">{coupon.discountPercentage}% OFF</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {coupon.maxUses === 0 ? 'Unlimited' : `${coupon.currentUses} / ${coupon.maxUses}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        coupon.status === 'Active' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDelete(coupon._id)} className="p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Delete Coupon">
                          <Trash2 size={16} />
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
          <span>Showing {filteredCoupons.length} records</span>
        </div>
      </div>
    </div>
  );
}

