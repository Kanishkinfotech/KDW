import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Star, Download, ShoppingCart, DollarSign, 
  ExternalLink, RefreshCw, Filter, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import SEO from '../../../components/SEO';
import { formatCurrency } from '../../../utils/currency';

export default function AdminProductPerformance() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalCatalogItems: 0,
    totalUnitsSold: 0,
    totalRevenue: 0,
    totalDownloads: 0
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);

      const res = await fetch(`/api/admin/reports/product-performance?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        if (json.kpis) setKpis(json.kpis);
        if (json.categories) setCategories(json.categories);
      }
    } catch (err) {
      console.error('Error fetching product performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      <SEO title="Product Performance & Sales Analytics | KDW Admin" description="Live catalog sales, units purchased, downloads completed, and product revenue" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Performance & Analytics</h1>
            <p className="text-xs text-slate-500 mt-1">Real-time catalog analytics tracking units sold, revenue generated, digital downloads, and customer ratings.</p>
          </div>
        </div>
        <button
          onClick={fetchPerformance}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto disabled:opacity-50"
          title="Refresh Metrics"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Products</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{kpis.totalCatalogItems || records.length}</span>
            <p className="text-xs text-slate-400 mt-0.5">Active & draft digital assets</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Units Sold</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600">{kpis.totalUnitsSold?.toLocaleString() || '0'}</span>
            <p className="text-xs text-slate-400 mt-0.5">Verified completed orders</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Revenue</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(kpis.totalRevenue || 0)}</span>
            <p className="text-xs text-slate-400 mt-0.5">Gross revenue from captured orders</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Downloads</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Download size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-indigo-600">{kpis.totalDownloads?.toLocaleString() || '0'}</span>
            <p className="text-xs text-slate-400 mt-0.5">Customer downloads streamed</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchPerformance(); }} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <Filter size={14} className="text-slate-500" />
            <span className="font-semibold text-slate-600">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{records.length} items</span>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading product performance analytics...
          </div>
        ) : records.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Package size={40} className="opacity-20 mb-2" />
            <p className="font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Product & Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Units Sold</th>
                  <th className="px-5 py-3.5">Gross Revenue</th>
                  <th className="px-5 py-3.5">Downloads</th>
                  <th className="px-5 py-3.5">Storage & Delivery</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Storefront</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm max-w-xs truncate" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {p.category}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{formatCurrency(p.discountPrice || p.price)}</div>
                        {p.discountPrice && p.discountPrice < p.price && (
                          <div className="text-[10px] text-slate-400 line-through">{formatCurrency(p.price)}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-black text-slate-900">{p.unitsSold}</span>
                        <span className="text-[11px] text-slate-400 ml-1">({p.orders} orders)</span>
                      </td>
                      <td className="px-5 py-3.5 font-black text-emerald-700 text-sm">
                        {formatCurrency(p.revenue)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-blue-600">
                        {p.downloads}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.hasDriveFile ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Google Drive Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle size={12} /> File Missing
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.rating !== null ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            {p.rating} <span className="text-[11px] text-slate-400 font-normal">({p.reviewsCount})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No reviews yet</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'ACTIVE' || p.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {p.slug ? (
                          <a
                            href={`/product/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 inline-flex items-center justify-center transition-colors"
                            title="View on Store"
                          >
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
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
