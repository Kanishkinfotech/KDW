import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, Filter, Edit3, X, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import toast from 'react-hot-toast';
import apiClient from '../../api/apiClient';

export default function AdminInventory() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number | ''>('');
  const [editMinStock, setEditMinStock] = useState<number>(0);
  const [editSku, setEditSku] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory');
      if (res.data && res.data.success) {
        setProducts(res.data.items || []);
      } else {
        const [productsRes, bundlesRes] = await Promise.all([
          apiClient.get('/products'),
          apiClient.get('/bundles')
        ]);
        const pList = (productsRes.data.data || []).map((p: any) => ({ ...p, type: 'product' }));
        const bList = (bundlesRes.data.data || []).map((b: any) => ({ ...b, type: 'bundle' }));
        setProducts([...pList, ...bList]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSave = async (id: string, type: string) => {
    try {
      setSaving(true);
      const res = await apiClient.patch(`/inventory/${type}/${id}`, {
        sku: editSku,
        stock: editStock === '' ? null : editStock,
        minStock: editMinStock
      });

      if (res.data.success) {
        toast.success('Inventory updated successfully');
        setProducts(prev => prev.map(p => {
          const pId = p.id || p._id;
          return pId === id ? { ...p, sku: editSku, stock: editStock === '' ? null : editStock, minStock: editMinStock } : p;
        }));
        setEditingId(null);
      } else {
        toast.error(res.data.message || 'Failed to update inventory');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id || p._id);
    setEditStock(p.stock === null || p.stock === undefined ? '' : p.stock);
    setEditMinStock(p.minStock || 0);
    setEditSku(p.sku || '');
  };

  const filteredProducts = products.filter(p => {
    const name = p.name || p.title || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const isUnlimited = p.stock === null || p.stock === undefined;
    const isLowStock = !isUnlimited && p.stock <= p.minStock && p.stock > 0;
    const isOutOfStock = !isUnlimited && p.stock <= 0;

    let matchesFilter = true;
    if (filter === 'In Stock') {
      matchesFilter = isUnlimited || (!isLowStock && !isOutOfStock);
    } else if (filter === 'Low Stock') {
      matchesFilter = isLowStock;
    } else if (filter === 'Out of Stock') {
      matchesFilter = isOutOfStock;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <SEO title="Inventory | Admin" description="Admin Inventory" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Track and adjust product stock levels and digital availability.</p>
        </div>
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search products or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900 bg-white"
          />
        </div>
        
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none flex items-center gap-2 px-4 pl-10 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors focus:outline-none focus:border-primary cursor-pointer bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Package size={48} className="mb-4 opacity-20" />
            <p>No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Product</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">SKU</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Current Stock</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Low Stock Alert</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const itemId = p.id || p._id;
                  const isEditing = editingId === itemId;
                  const isUnlimited = p.stock === null || p.stock === undefined;
                  const isLowStock = !isUnlimited && p.stock <= (p.minStock || 5) && p.stock > 0;
                  const isOutOfStock = !isUnlimited && p.stock <= 0;
                  
                  return (
                    <tr key={itemId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {(p.image || p.coverImage || p.thumbnail) ? (
                              <img src={p.image || p.coverImage || p.thumbnail} alt={p.name || p.title || 'Product'} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 m-2.5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-2">
                              {p.name || p.title || 'Untitled'}
                              {p.type === 'bundle' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">BUNDLE</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{typeof p.category === 'object' ? (p.category as any).name : p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editSku} 
                            onChange={e => setEditSku(e.target.value)}
                            className="w-full min-w-[120px] border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:border-primary text-xs"
                            placeholder="SKU"
                          />
                        ) : (
                          <span className="font-mono text-xs text-slate-700 font-semibold">{p.sku || 'N/A'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isUnlimited ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Check size={12} /> Unlimited
                          </span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle size={12} /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check size={12} /> In Stock
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input 
                            type="number" 
                            min="0"
                            value={editStock} 
                            onChange={e => setEditStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            className="w-20 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:border-primary text-xs"
                            placeholder="∞"
                          />
                        ) : (
                          <span className="font-mono text-slate-900 font-medium">
                            {isUnlimited ? '∞' : p.stock}
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input 
                            type="number" 
                            min="0"
                            value={editMinStock} 
                            onChange={e => setEditMinStock(parseInt(e.target.value, 10) || 0)}
                            className="w-20 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:border-primary text-xs"
                          />
                        ) : (
                          <span className="font-mono text-slate-500">{p.minStock || 0}</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSave(itemId, p.type || 'product')}
                              disabled={saving}
                              className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1"
                            >
                              <Check size={13} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                            >
                              <X size={13} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                        )}
                      </td>
                      
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
