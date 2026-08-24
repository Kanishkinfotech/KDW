import { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, Trash2, Edit2, Eye, Copy, 
  CheckCircle2, Clock, Pause, Archive, RefreshCw, AlertTriangle, 
  ExternalLink, HardDrive, ShieldCheck, Download, Activity, 
  SlidersHorizontal, ChevronDown, Check, X, FileText, ArrowRight,
  Shield, Layers, Star
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvExport';
import axios from 'axios';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    draftProducts: 0,
    filesConnected: 0,
    totalDownloads: 0
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & State
  const activeStatusTab = searchParams.get('status') || 'all';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDriveStatus, setSelectedDriveStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('updated-desc');
  const [featuredFilter, setFeaturedFilter] = useState('all');

  // Multi-select Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Modals & Drawers
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'files' | 'versions' | 'access' | 'storefront' | 'health' | 'audit'>('overview');
  const [healthData, setHealthData] = useState<any | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Archive Impact Modal
  const [archiveModalProduct, setArchiveModalProduct] = useState<any | null>(null);
  const [archiveImpact, setArchiveImpact] = useState<any | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Schedule Modal
  const [scheduleModalProduct, setScheduleModalProduct] = useState<any | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');

  const fetchProducts = async () => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      if (activeStatusTab !== 'all') params.append('status', activeStatusTab);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedType !== 'all') params.append('productType', selectedType);
      if (selectedDriveStatus !== 'all') params.append('driveStatus', selectedDriveStatus);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (featuredFilter !== 'all') params.append('featured', featuredFilter);
      if (selectedSort) params.append('sort', selectedSort);

      const res = await axios.get(`/api/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data || []);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchProducts();
  }, [activeStatusTab, selectedType, selectedDriveStatus, selectedCategory, selectedSort, featuredFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleStatusTabChange = (statusKey: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (statusKey === 'all') nextParams.delete('status');
    else nextParams.set('status', statusKey);
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Inspect Product & Load Health Check
  const handleOpenDetail = async (p: any) => {
    setDetailProduct(p);
    setDetailTab('overview');
    setHealthLoading(true);
    try {
      const res = await axios.get(`/api/products/${p.id}/health`);
      if (res.data.success) {
        setHealthData(res.data.data);
      }
    } catch (err) {
      console.error('Health check error:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  // Lifecycle Actions
  const handlePublish = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`"${name}" published successfully!`);
        fetchProducts();
        if (detailProduct?.id === id) handleOpenDetail(res.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Publishing failed';
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        toast.error(`${msg}: ${errors.join(', ')}`, { duration: 6000 });
      } else {
        toast.error(msg);
      }
    }
  };

  const handlePause = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/pause`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Sales paused for "${name}"`);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to pause product');
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Product "${name}" restored to Drafts`);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore product');
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Duplicated as Draft: "${res.data.data?.name}"`);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate product');
    }
  };

  // Safe Archive with Impact Modal
  const handleOpenArchiveModal = async (p: any) => {
    setArchiveModalProduct(p);
    setArchiveImpact({
      paidOrders: p._count?.orderItems || p.totalUnitsSold || 0,
      activeEntitlements: p._count?.purchases || 0,
      reviews: p.reviews || 0
    });
  };

  const handleConfirmArchive = async () => {
    if (!archiveModalProduct) return;
    try {
      setIsArchiving(true);
      const res = await axios.post(`/api/products/${archiveModalProduct.id}/archive`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success(`Product "${archiveModalProduct.name}" archived successfully`);
        setArchiveModalProduct(null);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to archive product');
    } finally {
      setIsArchiving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'DRAFT').toUpperCase();
    if (s === 'PUBLISHED' || s === 'ACTIVE') {
      return { label: 'Published', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (s === 'DRAFT') {
      return { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    if (s === 'PENDING_REVIEW') {
      return { label: 'Pending Review', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (s === 'SCHEDULED') {
      return { label: 'Scheduled', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (s === 'PAUSED') {
      return { label: 'Paused', bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    }
    if (s === 'ARCHIVED') {
      return { label: 'Archived', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: s, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const getProductTypeBadge = (type: string) => {
    const t = (type || 'DOWNLOADABLE_FILE').toUpperCase();
    const map: Record<string, string> = {
      'DOWNLOADABLE_FILE': 'Downloadable',
      'TEMPLATE_BUNDLE': 'Template Bundle',
      'AUTOMATION_WORKFLOW': 'Automation',
      'WEBSITE_KIT': 'Website Kit',
      'PROMPT_PACK': 'Prompt Pack',
      'VIDEO_PRODUCT': 'Video',
      'LICENCE_PRODUCT': 'Licence',
      'BUNDLE': 'Bundle'
    };
    return map[t] || t;
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header with Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Catalog</span>
            <span>/</span>
            <span className="text-primary font-bold">Products Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="text-primary" size={28} />
            Products
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Centralized digital catalog management, Google Drive delivery files, versions, and licences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Refresh Products"
          >
            <RefreshCw size={17} className={isRefreshing ? 'animate-spin text-primary' : ''} />
          </button>

          <Link
            to="/admin/products/new"
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>
      </div>

      {/* 2. 4 Focused Product Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalProducts}</span>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Catalog assets</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Draft Products</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.draftProducts}</span>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5">Incomplete drafts</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Files Connected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <HardDrive size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.filesConnected}</span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Google Drive ready</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Downloads</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Download size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalDownloads}</span>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">All-time deliveries</span>
          </div>
        </div>
      </div>

      {/* 3. Product Status Lifecycle Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 custom-scrollbar">
        {[
          { key: 'all', label: 'All Products' },
          { key: 'draft', label: 'Drafts' },
          { key: 'pending_review', label: 'Pending Review' },
          { key: 'published', label: 'Published' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'archived', label: 'Archived' },
        ].map((tab) => {
          const isActive = activeStatusTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleStatusTabChange(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Search & Multi-Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Product Name, Code (KDW-P-...), or Slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Product Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="DOWNLOADABLE_FILE">Downloadable File</option>
            <option value="TEMPLATE_BUNDLE">Template Bundle</option>
            <option value="AUTOMATION_WORKFLOW">Automation</option>
            <option value="WEBSITE_KIT">Website Kit</option>
            <option value="PROMPT_PACK">Prompt Pack</option>
            <option value="VIDEO_PRODUCT">Video Product</option>
            <option value="LICENCE_PRODUCT">Licence Product</option>
          </select>

          {/* Drive Status Filter */}
          <select
            value={selectedDriveStatus}
            onChange={(e) => setSelectedDriveStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Drive States</option>
            <option value="CONNECTED">Drive Connected</option>
            <option value="NOT_CONNECTED">Drive Missing</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="updated-desc">Recently Updated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* 5. Bulk Actions Toolbar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <CheckCircle2 size={16} />
            <span>{selectedIds.length} products selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const exportData = products.filter(p => selectedIds.includes(p.id)).map(p => ({
                  Code: p.productCode || p.id,
                  Name: p.name || p.title,
                  Type: p.productType,
                  Category: p.category,
                  Price: p.price,
                  Status: p.status
                }));
                exportToCSV(exportData, 'kdw_products_export');
                toast.success('Export completed');
              }}
              className="px-3 py-1.5 bg-white border border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Export Selected CSV
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Master Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
              <tr>
                <th className="px-4 py-3.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(products.map(p => p.id));
                      else setSelectedIds([]);
                    }}
                    className="w-3.5 h-3.5 text-primary rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3.5">Product & Code</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Drive Storage</th>
                <th className="px-4 py-3.5 text-center">Version</th>
                <th className="px-4 py-3.5 text-center">Downloads</th>
                <th className="px-4 py-3.5">Updated</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      Loading catalog products...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const statusBadge = getStatusBadge(p.status);
                  const isDriveConnected = Boolean(p.googleDriveFileId);
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr 
                      key={p.id}
                      onClick={() => handleOpenDetail(p)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedIds(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]);
                          }}
                          className="w-3.5 h-3.5 text-primary rounded border-slate-300"
                        />
                      </td>

                      {/* Product Name & Code */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail || p.coverImage || '/images/fallback/image-unavailable.png'}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 group-hover:text-primary group-hover:underline truncate max-w-[200px]">
                              {p.name || p.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-primary">
                                {p.productCode || p.id.slice(0, 8)}
                              </span>
                              {p.featured && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                          {getProductTypeBadge(p.productType)}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-slate-700 font-medium max-w-[130px] truncate">
                        {p.category}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900">
                          {formatCurrency(p.price)}
                        </div>
                        {p.discountPrice && p.discountPrice < p.price && (
                          <div className="text-[10px] text-emerald-600 font-bold">
                            Sale: {formatCurrency(p.discountPrice)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Drive Storage */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isDriveConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isDriveConnected ? (
                            <>
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              Private Drive
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} className="text-amber-600" />
                              Missing Link
                            </>
                          )}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="px-4 py-3 text-center font-bold text-slate-700 font-mono text-[11px]">
                        {p.currentVersion || p.version || 'v1.0.0'}
                      </td>

                      {/* Downloads */}
                      <td className="px-4 py-3 text-center font-black text-slate-900">
                        {p.totalDownloads || 0}
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 text-slate-500 font-medium">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect Detail */}
                          <button
                            onClick={() => handleOpenDetail(p)}
                            title="Inspect Details"
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Form */}
                          <Link
                            to={`/admin/products/edit/${p.id}`}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                          >
                            <Edit2 size={15} />
                          </Link>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(p.id, p.name || p.title)}
                            title="Duplicate as Draft"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy size={15} />
                          </button>

                          {/* Publish (if Draft or Paused) */}
                          {(p.status === 'DRAFT' || p.status === 'PAUSED') && (
                            <button
                              onClick={() => handlePublish(p.id, p.name || p.title)}
                              title="Publish Product"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {/* Pause (if Published) */}
                          {(p.status === 'PUBLISHED' || p.status === 'ACTIVE') && (
                            <button
                              onClick={() => handlePause(p.id, p.name || p.title)}
                              title="Pause Product Sales"
                              className="p-1.5 text-slate-400 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pause size={15} />
                            </button>
                          )}

                          {/* Archive (if not archived) */}
                          {p.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => handleOpenArchiveModal(p)}
                              title="Archive Product"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Archive size={15} />
                            </button>
                          )}

                          {/* Restore (if Archived) */}
                          {p.status === 'ARCHIVED' && (
                            <button
                              onClick={() => handleRestore(p.id, p.name || p.title)}
                              title="Restore to Draft"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. PRODUCT DETAIL HUB DRAWER */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={detailProduct.thumbnail || detailProduct.coverImage || '/images/fallback/image-unavailable.png'}
                    alt={detailProduct.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div>
                    <span className="font-mono text-xs font-bold text-primary block">
                      {detailProduct.productCode || detailProduct.id}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                      {detailProduct.name || detailProduct.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-[10px] font-bold text-slate-700">
                        {getProductTypeBadge(detailProduct.productType)}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {formatCurrency(detailProduct.price)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDetailProduct(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-1 mt-6 border-b border-slate-200/60 overflow-x-auto custom-scrollbar">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'files', label: 'Drive Files' },
                  { key: 'versions', label: 'Versions' },
                  { key: 'access', label: 'Access & Licences' },
                  { key: 'health', label: 'Health Check' },
                  { key: 'audit', label: 'Audit Log' }
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setDetailTab(t.key as any)}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      detailTab === t.key
                        ? 'border-primary text-primary font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* Tab: OVERVIEW */}
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Status</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{detailProduct.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Category</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{detailProduct.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Version</span>
                      <span className="font-mono font-bold text-primary mt-0.5 block">{detailProduct.version || 'v1.0.0'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">All-time Downloads</span>
                      <span className="font-black text-slate-900 mt-0.5 block">{detailProduct.totalDownloads || 0}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">Description</h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      {detailProduct.description || 'No description provided.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">SEO Details</h4>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1 text-slate-700">
                      <p><strong className="text-slate-900">SEO Title:</strong> {detailProduct.seoTitle || detailProduct.name}</p>
                      <p><strong className="text-slate-900">Slug:</strong> /{detailProduct.slug}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: FILES */}
              {detailTab === 'files' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-emerald-700" size={20} />
                      <div>
                        <h4 className="font-bold text-emerald-950">Restricted Google Drive Proxy</h4>
                        <p className="text-[11px] text-emerald-800">Files streamed server-side. Zero raw Drive URLs exposed to customers.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-slate-400 uppercase font-bold text-[10px] block">Drive File ID</span>
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      {detailProduct.googleDriveFileId || 'No Google Drive file connected yet.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab: HEALTH CHECK */}
              {detailTab === 'health' && (
                <div className="space-y-4">
                  {healthLoading ? (
                    <div className="p-8 text-center text-slate-400">Running diagnostic health checks...</div>
                  ) : healthData ? (
                    <>
                      <div className="p-5 rounded-3xl bg-slate-900 text-white flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Product Health Score</span>
                          <span className="text-3xl font-black text-white mt-1 block">{healthData.healthScore}%</span>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                            {healthData.healthScore >= 80 ? 'Ready for Commerce' : 'Optimization Recommended'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {healthData.checks.map((c: any) => (
                          <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {c.status === 'PASS' ? (
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              ) : c.status === 'WARN' ? (
                                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                              ) : (
                                <X size={16} className="text-rose-600 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <h5 className="font-bold text-slate-900 truncate">{c.title}</h5>
                                <p className="text-[11px] text-slate-500 truncate">{c.details}</p>
                              </div>
                            </div>

                            {c.action && (
                              <Link
                                to={`/admin/products/edit/${detailProduct.id}`}
                                className="px-2.5 py-1 bg-white border border-slate-200 text-primary font-bold text-[11px] rounded-lg shrink-0 hover:bg-slate-100"
                              >
                                Fix
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Tab: ACCESS & LICENCES */}
              {detailTab === 'access' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Download Limit</span>
                      <span className="font-black text-slate-900 mt-0.5 block">{detailProduct.downloadLimit || 5} downloads</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Access Expiry</span>
                      <span className="font-black text-slate-900 mt-0.5 block">{detailProduct.accessDurationDays || 365} days</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Licence Type</span>
                      <span className="font-black text-slate-900 mt-0.5 block">{detailProduct.licenceType || 'Commercial'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Refund Access Rule</span>
                      <span className="font-bold text-rose-700 mt-0.5 block">{detailProduct.refundPolicy || 'Revoke Access'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: VERSIONS */}
              {detailTab === 'versions' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-primary">{detailProduct.version || 'v1.0.0'}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">Active Production Release</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      Live
                    </span>
                  </div>
                </div>
              )}

              {/* Tab: AUDIT LOG */}
              {detailTab === 'audit' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">Chronological history of modifications to this product.</p>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                    Created at {new Date(detailProduct.createdAt).toLocaleString()} by Admin.
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <Link
                to={`/product/${detailProduct.id}`}
                target="_blank"
                className="text-xs font-bold text-slate-600 hover:text-primary flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Storefront Preview
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/products/edit/${detailProduct.id}`}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Edit Full Product
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. ARCHIVE IMPACT MODAL */}
      {archiveModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-rose-50/50">
              <div className="flex items-center gap-3 text-rose-700">
                <AlertTriangle size={22} />
                <h3 className="text-lg font-black text-slate-900">Archive Product Confirmation</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Archiving will stop new customer purchases while preserving existing customer access.
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Historical Impact</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white border border-slate-100">
                    <span className="text-base font-black text-slate-900 block">{archiveImpact?.paidOrders || 0}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Paid Orders</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-100">
                    <span className="text-base font-black text-slate-900 block">{archiveImpact?.activeEntitlements || 0}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Active Entitlements</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-100">
                    <span className="text-base font-black text-slate-900 block">{archiveImpact?.reviews || 0}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Reviews</span>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 leading-relaxed">
                Existing customers retain access according to their frozen order snapshot policy.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setArchiveModalProduct(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isArchiving ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
