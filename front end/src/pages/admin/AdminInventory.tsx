import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, Filter, Edit3, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import toast from 'react-hot-toast';

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

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [productsRes, bundlesRes] = await Promise.all([
        fetch('/api/products', { headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/bundles', { headers: { 'Content-Type': 'application/json' } })
      ]);
      
      const productsData = await productsRes.json();
      const bundlesData = await bundlesRes.json();
      
      const mappedProducts = (productsData.data || []).map((p: any) => ({
        ...p,
        type: 'product'
      }));
      
      const mappedBundles = (bundlesData.data || []).map((b: any) => ({
        ...b,
        type: 'bundle'
      }));
      
      setProducts([...mappedProducts, ...mappedBundles]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (id: string, type: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/inventory/${type}/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sku: editSku,
          stock: editStock === '' ? null : editStock,
          minStock: editMinStock
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Inventory updated successfully');
        setProducts(products.map(p => p._id === id || p.id === id ? { ...p, sku: data.data.sku, stock: data.data.stock, minStock: data.data.minStock } : p));
        setEditingId(null);
      } else {
        toast.error(data.message || 'Failed to update inventory');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving.');
    }
  };

  const startEdit = (p: any) => {
    setEditingId(p._id || p.id);
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
          <p className="text-slate-500 mt-1">Track and adjust product stock levels and alerts.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text" 
            placeholder="Search products or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-slate-900"
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
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <Package size={48} className="mb-4 opacity-20" />
            <p>No products found.</p>
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
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Low Stock Alert At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isEditing = editingId === p._id;
                  const isUnlimited = p.stock === null || p.stock === undefined;
                  const isLowStock = !isUnlimited && p.stock <= p.minStock && p.stock > 0;
                  const isOutOfStock = !isUnlimited && p.stock <= 0;
                  
                  return (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {p.coverImage ? (
                              <img src={p.coverImage} alt={p.name || p.title || 'Product'} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 m-2.5 text-slate-600" />
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
                            className="w-full min-w-[100px] border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-primary"
                            placeholder="SKU"
                          />
                        ) : (
                          p.sku || 'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isUnlimited ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            <Check size={12} /> Infinite
                          </span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <AlertTriangle size={12} /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
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
                            onChange={e => setEditStock(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-20 border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-primary"
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
                            onChange={e => setEditMinStock(parseInt(e.target.value) || 0)}
                            className="w-20 border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-primary"
                          />
                        ) : (
                          <span className="font-mono text-slate-500">{p.minStock || 0}</span>
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

