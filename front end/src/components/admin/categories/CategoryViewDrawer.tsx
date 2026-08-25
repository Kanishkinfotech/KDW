import { useState, useEffect } from 'react';
import { 
  X, Eye, Layers, Sparkles, FolderTree, Globe, Calendar, 
  Tag, IndianRupee, ExternalLink, CheckCircle2, ShieldCheck, 
  AlertTriangle, Package, Search, Filter, HardDrive, Check, Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface CategoryViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | null;
}

export default function CategoryViewDrawer({
  isOpen,
  onClose,
  categoryId
}: CategoryViewDrawerProps) {
  const [category, setCategory] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'attributes' | 'seo'>('overview');

  // Category Products Tab Search & Filter States
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const fetchCategoryDetails = () => {
    if (!categoryId) return;
    setIsLoading(true);
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    axios.get(`/api/categories/${categoryId}`, { headers })
      .then(res => {
        if (res.data.success) {
          setCategory(res.data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const fetchCategoryProducts = () => {
    if (!categoryId) return;
    setIsProductsLoading(true);
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    axios.get(`/api/categories/${categoryId}/products`, {
      headers,
      params: {
        search: productSearch || undefined,
        status: productStatusFilter !== 'ALL' ? productStatusFilter : undefined,
        limit: 50
      }
    })
      .then(res => {
        if (res.data.success) {
          setCategoryProducts(res.data.data.products || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsProductsLoading(false));
  };

  useEffect(() => {
    if (categoryId && isOpen) {
      fetchCategoryDetails();
    }
  }, [categoryId, isOpen]);

  useEffect(() => {
    if (categoryId && isOpen && activeTab === 'products') {
      fetchCategoryProducts();
    }
  }, [categoryId, isOpen, activeTab, productStatusFilter]);

  if (!isOpen) return null;

  const totalProducts = category?.productCount || 0;
  const activeProducts = category?.activeProductCount || 0;
  const scheduledProducts = category?.scheduledProductCount || 0;
  const draftProducts = category?.draftProductCount || 0;
  const archivedProducts = category?.archivedProductCount || 0;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden text-slate-900 border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-4 px-6 bg-[#0B1120] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary-light flex items-center justify-center font-bold">
              <FolderTree size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Detail</span>
              <h3 className="text-sm font-black text-white truncate max-w-xs">{category?.name || 'Loading...'}</h3>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="bg-slate-100 p-2 px-6 border-b border-slate-200 flex gap-2 text-xs font-bold shrink-0">
          {(['overview', 'products', 'attributes', 'seo'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'products' && <Package size={13} />}
              <span>{tab}</span>
              {tab === 'products' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-100 text-primary font-extrabold">
                  {totalProducts}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5 text-xs">
          {isLoading || !category ? (
            <div className="p-12 text-center text-slate-400">Loading category details...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Hero Banner preview */}
                  {category.banner && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-32 relative">
                      <img src={category.banner} alt={category.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 flex items-end">
                        <span className="text-white font-bold text-xs">{category.name}</span>
                      </div>
                    </div>
                  )}

                  {/* 5-Metric Product Count Breakdown Card (Clause 6) */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Package size={14} className="text-primary-light" />
                        <span>Assigned Products Breakdown</span>
                      </span>
                      <button 
                        onClick={() => setActiveTab('products')}
                        className="text-[11px] font-bold text-primary-light hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Products</span> &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-bold">Total</span>
                        <span className="text-base font-black text-white font-mono">{totalProducts}</span>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <span className="text-[10px] text-emerald-400 block font-bold">Active</span>
                        <span className="text-base font-black text-emerald-400 font-mono">{activeProducts}</span>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <span className="text-[10px] text-amber-400 block font-bold">Scheduled</span>
                        <span className="text-base font-black text-amber-400 font-mono">{scheduledProducts}</span>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-bold">Draft</span>
                        <span className="text-base font-black text-slate-300 font-mono">{draftProducts}</span>
                      </div>
                      <div className="p-2 bg-slate-800/80 rounded-xl">
                        <span className="text-[10px] text-rose-400 block font-bold">Archived</span>
                        <span className="text-base font-black text-rose-400 font-mono">{archivedProducts}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="text-slate-500 font-semibold block">Quality Score</span>
                      <span className="text-base font-black text-primary font-mono">{category.qualityScore || 0}%</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="text-slate-500 font-semibold block">Status</span>
                      <span className="text-xs font-black uppercase text-emerald-700">{category.status}</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="text-slate-500 font-semibold block">URL Slug</span>
                      <span className="text-xs font-mono text-slate-700 truncate block">/categories/{category.slug}</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="text-slate-500 font-semibold block">Hierarchy Position</span>
                      <span className="text-xs font-bold text-slate-800">{category.parentId ? `Subcategory (${category.parent?.name})` : 'Root Level 1'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-slate-800 block">Description</span>
                    <p className="text-slate-600 leading-relaxed">
                      {category.description || category.shortDescription || 'No description provided.'}
                    </p>
                  </div>

                  {/* Storefront Link */}
                  <div className="pt-2">
                    <Link
                      to={`/categories/${category.slug}`}
                      target="_blank"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink size={14} /> Preview Storefront Category Page
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS (Clause 7 Category Products Screen) */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Search and Status Filters */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchCategoryProducts()}
                        placeholder="Search products in category..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary text-slate-800"
                      />
                    </div>

                    <select
                      value={productStatusFilter}
                      onChange={(e) => setProductStatusFilter(e.target.value)}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  {/* Products Table */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    {isProductsLoading ? (
                      <div className="p-8 text-center text-slate-400">Loading category products...</div>
                    ) : categoryProducts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">No products found matching filters.</div>
                    ) : (
                      categoryProducts.map((p: any) => {
                        const hasDrive = (p.googleDriveFileId && p.googleDriveFileId.trim() !== '') || (p.googleDriveLinks && String(p.googleDriveLinks).length > 2);

                        return (
                          <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              {p.thumbnail || p.coverImage ? (
                                <img src={p.thumbnail || p.coverImage} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-[200px]">{p.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">₹{p.price}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">Sold: {p.totalUnitsSold || 0}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Drive link status */}
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                hasDrive 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                <HardDrive size={10} /> {hasDrive ? 'Drive Configured' : 'Missing Drive'}
                              </span>

                              {/* Product Status */}
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ATTRIBUTES */}
              {activeTab === 'attributes' && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 block">Configured Category Facets</span>
                  {category.attributeConfig && Object.keys(category.attributeConfig).length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {Object.entries(category.attributeConfig).map(([key, cfg]: [string, any]) => (
                        <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <div className="flex justify-between">
                            <span className="font-bold capitalize text-slate-800">{key}</span>
                            <span className="text-[10px] text-emerald-700 font-bold">Filterable</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {cfg.values?.map((v: string) => (
                              <span key={v} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 font-mono">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">Default global attributes active.</div>
                  )}
                </div>
              )}

              {/* TAB 4: SEO */}
              {activeTab === 'seo' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase">SEO Title</span>
                    <span className="font-bold text-slate-900 block">{category.seoTitle || 'Default Title'}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase">Meta Description</span>
                    <span className="text-slate-700 block">{category.seoDescription || 'Default Description'}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase">Canonical URL</span>
                    <span className="font-mono text-slate-700 block">{category.canonicalUrl || `/categories/${category.slug}`}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
