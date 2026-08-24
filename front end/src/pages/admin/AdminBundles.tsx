import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Search, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminBundles() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/bundles');
      if (res.data.success) {
        setBundles(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load bundles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;
    try {
      // Optimistic delete for frontend
      setBundles(bundles.filter(b => b.id !== id));
      toast.success('Bundle deleted successfully');

      const token = localStorage.getItem('token');
      await axios.delete(`/api/bundles/${id}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.warn("Backend delete failed, but removed locally.", error);
    }
  };

  const filteredBundles = bundles.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manage Bundles</h1>
          <p className="text-slate-500 mt-1">Create and manage product bundles</p>
        </div>
        <Link 
          to="/admin/bundles/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} /> Add Bundle
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search bundles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="px-6 py-4">Bundle Info</th>
                <th className="px-6 py-4">Pricing</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                      Loading bundles...
                    </div>
                  </td>
                </tr>
              ) : filteredBundles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                      <Layers size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No bundles found</h3>
                    <p className="text-slate-500 text-sm">Create a new bundle to get started</p>
                  </td>
                </tr>
              ) : (
                filteredBundles.map(bundle => (
                  <tr key={bundle.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {bundle.coverImage ? (
                            <img src={bundle.coverImage} alt={bundle.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400"><Layers size={20} /></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{bundle.title}</div>
                          <div className="text-xs text-slate-500">{bundle.products?.length || 0} Products Included</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{formatCurrency(bundle.price)}</div>
                      <div className="text-xs text-slate-500 line-through">{formatCurrency(bundle.originalPrice)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        bundle.status === 'ACTIVE' 
                          ? 'bg-success/10 text-success border border-success/20' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {bundle.status}
                      </span>
                      {bundle.featured && (
                        <span className="ml-2 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Link 
                          to={`/admin/bundles/edit/${bundle.id}`}
                          className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(bundle.id)}
                          className="p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete"
                        >
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
      </div>
    </div>
  );
}

