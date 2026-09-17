import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Plus, Search, Filter, Trash2, Edit2, Eye, Copy, 
  CheckCircle2, Clock, Pause, Archive, RefreshCw, AlertTriangle, 
  ExternalLink, HardDrive, ShieldCheck, Download, Activity, 
  SlidersHorizontal, ChevronDown, Check, X, FileText, ArrowRight,
  Shield, Layers, Star, Calendar, ChevronLeft, ChevronRight,
  Key, ShoppingBag, History, AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';
import { exportToCSV } from '../../utils/csvExport';
import axios from 'axios';

interface DropdownOption {
  value: string;
  label: string;
}

function CustomFilterDropdown({
  value,
  onChange,
  options,
  placeholder,
  align = 'left'
}: {
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-between gap-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="truncate max-w-[150px] text-left">
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </span>
        <ChevronDown
          size={13}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 min-w-[190px] bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                  isSelected ? 'text-primary font-bold bg-primary/5' : 'text-slate-700'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const [editingSortOrderId, setEditingSortOrderId] = useState<string | null>(null);
  const [sortOrderInput, setSortOrderInput] = useState<number | string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Multi-select Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState('');

  // Modals & Drawers
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'files' | 'versions' | 'orders' | 'downloads' | 'licences' | 'health' | 'audit'>('overview');
  const [healthData, setHealthData] = useState<any | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Drawer Drilldown Data
  const [drilldownOrders, setDrilldownOrders] = useState<any[]>([]);
  const [drilldownDownloads, setDrilldownDownloads] = useState<any | null>(null);
  const [drilldownLicences, setDrilldownLicences] = useState<any[]>([]);
  const [drilldownAuditLogs, setDrilldownAuditLogs] = useState<any[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // Archive Impact Modal
  const [archiveModalProduct, setArchiveModalProduct] = useState<any | null>(null);
  const [archiveImpact, setArchiveImpact] = useState<any | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Schedule Modal
  const [scheduleModalProduct, setScheduleModalProduct] = useState<any | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Reject Modal
  const [rejectModalProduct, setRejectModalProduct] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Delete Modal
  const [deleteModalProduct, setDeleteModalProduct] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

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
    setCurrentPage(1);
  }, [activeStatusTab, selectedType, selectedDriveStatus, selectedCategory, selectedSort, featuredFilter]);

  // Debounced live search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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

  // Inspect Product & Load Health Check & Drilldowns
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

  const handleSaveProductSortOrder = async (productId: string) => {
    const val = parseInt(String(sortOrderInput));
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid positive number');
      setEditingSortOrderId(null);
      return;
    }
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      await axios.put(`/api/products/${productId}`, { sortOrder: val }, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, sortOrder: val } : p));
      toast.success(`Updated sort order to #${val}`);
    } catch (e: any) {
      toast.error('Failed to update sort order');
    } finally {
      setEditingSortOrderId(null);
    }
  };

  // Load drilldown tab data on demand
  useEffect(() => {
    if (!detailProduct) return;

    const loadDrilldown = async () => {
      setDrilldownLoading(true);
      try {
        if (detailTab === 'orders') {
          const res = await axios.get(`/api/products/${detailProduct.id}/orders`, getAuthHeaders());
          if (res.data.success) setDrilldownOrders(res.data.data || []);
        } else if (detailTab === 'downloads') {
          const res = await axios.get(`/api/products/${detailProduct.id}/downloads`, getAuthHeaders());
          if (res.data.success) setDrilldownDownloads(res.data.data);
        } else if (detailTab === 'licences') {
          const res = await axios.get(`/api/products/${detailProduct.id}/licences`, getAuthHeaders());
          if (res.data.success) setDrilldownLicences(res.data.data || []);
        } else if (detailTab === 'audit') {
          const res = await axios.get(`/api/products/${detailProduct.id}/audit-logs`, getAuthHeaders());
          if (res.data.success) setDrilldownAuditLogs(res.data.data || []);
        }
      } catch (err) {
        console.error('Error loading drilldown:', err);
      } finally {
        setDrilldownLoading(false);
      }
    };

    loadDrilldown();
  }, [detailTab, detailProduct]);

  // Lifecycle Actions
  const handleToggleFeatured = async (id: string, currentFeatured: boolean, name: string) => {
    try {
      const nextVal = !currentFeatured;
      const res = await axios.put(`/api/products/${id}`, {
        isFeatured: nextVal,
        featured: nextVal
      }, getAuthHeaders());
      if (res.data.success) {
        toast.success(nextVal ? `★ "${name}" marked as Featured!` : `"${name}" removed from Featured.`);
        fetchProducts();
        if (detailProduct?.id === id) setDetailProduct({ ...detailProduct, featured: nextVal, isFeatured: nextVal });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update featured status');
    }
  };

  const handlePublish = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/publish`, {}, getAuthHeaders());
      if (res.data.success) {
        toast.success(`"${name}" published successfully!`);
        fetchProducts();
        if (detailProduct?.id === id) setDetailProduct({ ...detailProduct, status: 'PUBLISHED' });
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
      const res = await axios.post(`/api/products/${id}/pause`, {}, getAuthHeaders());
      if (res.data.success) {
        toast.success(`Sales paused for "${name}"`);
        fetchProducts();
        if (detailProduct?.id === id) setDetailProduct({ ...detailProduct, status: 'PAUSED' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to pause product');
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/restore`, {}, getAuthHeaders());
      if (res.data.success) {
        toast.success(`Product "${name}" restored to Drafts`);
        fetchProducts();
        if (detailProduct?.id === id) setDetailProduct({ ...detailProduct, status: 'DRAFT' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore product');
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/duplicate`, {}, getAuthHeaders());
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
      const res = await axios.post(`/api/products/${archiveModalProduct.id}/archive`, {}, getAuthHeaders());
      if (res.data.success) {
        toast.success(`Product "${archiveModalProduct.name}" archived successfully`);
        setArchiveModalProduct(null);
        fetchProducts();
        if (detailProduct?.id === archiveModalProduct.id) {
          setDetailProduct({ ...detailProduct, status: 'ARCHIVED' });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to archive product');
    } finally {
      setIsArchiving(false);
    }
  };

  // Schedule Publication
  const handleConfirmSchedule = async () => {
    if (!scheduleModalProduct || !scheduledDate) {
      toast.error('Please select a valid scheduled date & time');
      return;
    }
    try {
      setIsScheduling(true);
      const res = await axios.post(`/api/products/${scheduleModalProduct.id}/schedule`, { scheduledDate }, getAuthHeaders());
      if (res.data.success) {
        toast.success(`Product scheduled for publication on ${new Date(scheduledDate).toLocaleString()}`);
        setScheduleModalProduct(null);
        setScheduledDate('');
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule publication');
    } finally {
      setIsScheduling(false);
    }
  };

  // Review Workflow Actions
  const handleApprove = async (id: string, name: string) => {
    try {
      const res = await axios.post(`/api/products/${id}/approve`, {}, getAuthHeaders());
      if (res.data.success) {
        toast.success(`Product "${name}" approved & published!`);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalProduct) return;
    try {
      setIsRejecting(true);
      const res = await axios.post(`/api/products/${rejectModalProduct.id}/reject`, { reason: rejectReason }, getAuthHeaders());
      if (res.data.success) {
        toast.success(`Product returned to Draft with feedback`);
        setRejectModalProduct(null);
        setRejectReason('');
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject product');
    } finally {
      setIsRejecting(false);
    }
  };

  // Safe Delete with Dependency Guard
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    try {
      setIsDeleting(true);
      const res = await axios.delete(`/api/products/${deleteModalProduct.id}`, getAuthHeaders());
      if (res.data.success) {
        toast.success('Product deleted successfully');
        setDeleteModalProduct(null);
        if (detailProduct?.id === deleteModalProduct.id) setDetailProduct(null);
        fetchProducts();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete product';
      toast.error(msg, { duration: 6000 });
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Operations
  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    if (action === 'CHANGE_CATEGORY') {
      setShowCategoryModal(true);
      return;
    }
    try {
      setIsBulkOperating(true);
      const res = await axios.post('/api/products/bulk-action', { action, ids: selectedIds }, getAuthHeaders());
      if (res.data.success) {
        toast.success(res.data.message || `Bulk ${action} completed`);
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Bulk ${action} failed`);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkCategorySubmit = async () => {
    if (!targetCategoryId) {
      toast.error('Please select a category');
      return;
    }
    try {
      setIsBulkOperating(true);
      const res = await axios.post('/api/products/bulk-action', {
        action: 'CHANGE_CATEGORY',
        ids: selectedIds,
        categoryId: targetCategoryId
      }, getAuthHeaders());
      if (res.data.success) {
        toast.success(res.data.message || 'Category updated');
        setShowCategoryModal(false);
        setTargetCategoryId('');
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change category');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // Export Filtered Dataset
  const handleExportFiltered = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    const exportData = products.map(p => ({
      ID: p.id,
      Code: p.productCode || p.id,
      Name: p.name || p.title,
      Type: p.productType,
      Category: p.category,
      Subcategory: p.subcategory || '',
      Price: p.price,
      DiscountPrice: p.discountPrice || '',
      Status: p.status,
      DriveState: p.googleDriveFileId ? 'CONNECTED' : 'NOT_CONNECTED',
      DriveFileId: p.googleDriveFileId || '',
      Version: p.version || 'v1.0.0',
      Downloads: p.totalDownloads || 0,
      UnitsSold: p.totalUnitsSold || 0,
      Rating: p.rating || 5,
      Reviews: p.reviews || 0,
      Featured: p.featured ? 'Yes' : 'No',
      BestSeller: p.bestSeller ? 'Yes' : 'No',
      CreatedAt: new Date(p.createdAt).toISOString(),
      UpdatedAt: new Date(p.updatedAt).toISOString()
    }));
    exportToCSV(exportData, `kdw_products_${activeStatusTab}_${new Date().toISOString().slice(0, 10)}`);
    toast.success(`Exported ${exportData.length} products to CSV`);
  };

  // Pagination slicing
  const totalPages = Math.ceil(products.length / pageSize) || 1;
  const paginatedProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      'SOFTWARE': 'Software',
      'COURSE': 'Course',
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
            onClick={handleExportFiltered}
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export filtered catalog to CSV"
          >
            <Download size={15} />
            Export
          </button>

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

      {/* 2. 4 Focused Product Summary KPI Cards (Interactive Filter Triggers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <button
          onClick={() => handleStatusTabChange('all')}
          className={`p-5 rounded-3xl text-left bg-white border shadow-xs flex flex-col justify-between transition-all cursor-pointer hover:border-primary/40 ${
            activeStatusTab === 'all' ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalProducts}</span>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Catalog assets</span>
          </div>
        </button>

        {/* Draft Products */}
        <button
          onClick={() => handleStatusTabChange('draft')}
          className={`p-5 rounded-3xl text-left bg-white border shadow-xs flex flex-col justify-between transition-all cursor-pointer hover:border-amber-400 ${
            activeStatusTab === 'draft' ? 'border-amber-400 ring-2 ring-amber-400/10' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Draft Products</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.draftProducts}</span>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5">Incomplete drafts</span>
          </div>
        </button>

        {/* Files Connected */}
        <button
          onClick={() => setSelectedDriveStatus(prev => prev === 'CONNECTED' ? 'all' : 'CONNECTED')}
          className={`p-5 rounded-3xl text-left bg-white border shadow-xs flex flex-col justify-between transition-all cursor-pointer hover:border-emerald-400 ${
            selectedDriveStatus === 'CONNECTED' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Files Connected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <HardDrive size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.filesConnected}</span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Google Drive ready</span>
          </div>
        </button>

        {/* Total Downloads */}
        <button
          onClick={() => setSelectedSort('downloads-desc')}
          className={`p-5 rounded-3xl text-left bg-white border shadow-xs flex flex-col justify-between transition-all cursor-pointer hover:border-violet-400 ${
            selectedSort === 'downloads-desc' ? 'border-violet-500 ring-2 ring-violet-500/10' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Downloads</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Download size={17} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalDownloads}</span>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">All-time deliveries</span>
          </div>
        </button>
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
            className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Drive Status Filter */}
          <CustomFilterDropdown
            value={selectedDriveStatus}
            onChange={setSelectedDriveStatus}
            options={[
              { value: 'all', label: 'All Drive States' },
              { value: 'CONNECTED', label: 'Drive Connected' },
              { value: 'NOT_CONNECTED', label: 'Missing Link' }
            ]}
            placeholder="Drive States"
          />

          {/* Category Filter */}
          <CustomFilterDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(c => ({ value: c.name, label: c.name }))
            ]}
            placeholder="All Categories"
          />

          {/* Sort Filter */}
          <CustomFilterDropdown
            value={selectedSort}
            onChange={setSelectedSort}
            align="right"
            options={[
              { value: 'sortOrder-asc', label: 'Sort Order: Low to High' },
              { value: 'sortOrder-desc', label: 'Sort Order: High to Low' },
              { value: 'updated-desc', label: 'Recently Updated' },
              { value: 'updated-asc', label: 'Oldest Updated' },
              { value: 'price-low', label: 'Price: Low to High' },
              { value: 'price-high', label: 'Price: High to Low' },
              { value: 'name-asc', label: 'Name: A to Z' },
              { value: 'name-desc', label: 'Name: Z to A' },
              { value: 'downloads-desc', label: 'Most Downloads' },
              { value: 'sales-desc', label: 'Most Sales' },
              { value: 'newest', label: 'Newest Created' },
              { value: 'oldest', label: 'Oldest Created' }
            ]}
            placeholder="Sort By"
          />
        </div>
      </div>

      {/* 5. Bulk Actions Toolbar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <CheckCircle2 size={16} />
            <span>{selectedIds.length} products selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkAction('PUBLISH')}
              disabled={isBulkOperating}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkAction('DRAFT')}
              disabled={isBulkOperating}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Move to Draft
            </button>
            <button
              onClick={() => handleBulkAction('ARCHIVE')}
              disabled={isBulkOperating}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Archive Selected
            </button>
            <button
              onClick={() => handleBulkAction('CHANGE_CATEGORY')}
              disabled={isBulkOperating}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Change Category
            </button>
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
                exportToCSV(exportData, 'kdw_selected_products');
                toast.success('Export completed');
              }}
              className="px-3 py-1.5 bg-white border border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Export Selected CSV
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title="Clear selection"
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
                    checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const pageIds = paginatedProducts.map(p => p.id);
                        setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
                      } else {
                        const pageIds = new Set(paginatedProducts.map(p => p.id));
                        setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
                      }
                    }}
                    className="w-3.5 h-3.5 text-primary rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3.5">Product & Code</th>
                <th className="px-3 py-3.5 text-center">Sort Order</th>
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
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      Loading catalog products...
                    </div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
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
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-primary">
                                {p.productCode || p.id.slice(0, 8)}
                              </span>
                              {p.slug && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  /{p.slug}
                                </span>
                              )}
                              {p.featured && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                                  Featured
                                </span>
                              )}
                              {p.bestSeller && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[9px] font-bold border border-purple-200">
                                  Best Seller
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sort Order */}
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {editingSortOrderId === p.id ? (
                          <div className="inline-flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              autoFocus
                              value={sortOrderInput}
                              onChange={(e) => setSortOrderInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveProductSortOrder(p.id);
                                if (e.key === 'Escape') setEditingSortOrderId(null);
                              }}
                              className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-center bg-white border border-primary rounded-md focus:outline-none ring-1 ring-primary/20"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveProductSortOrder(p.id)}
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
                              title="Save"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSortOrderId(null)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSortOrderId(p.id);
                              setSortOrderInput(p.sortOrder ?? 0);
                            }}
                            className="inline-flex items-center justify-center min-w-[32px] h-6 px-2 rounded-lg font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs hover:bg-indigo-100/80 transition-colors cursor-pointer"
                            title="Click to edit sort order"
                          >
                            #{p.sortOrder ?? 0}
                          </button>
                        )}
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
                          {/* View / Storefront Preview */}
                          <button
                            onClick={() => {
                              const targetUrl = `${p.canonicalUrl || `/product/${p.slug || p.id}`}${p.status !== 'PUBLISHED' ? '?preview=true' : ''}`;
                              window.open(targetUrl, '_blank');
                            }}
                            title={p.status === 'PUBLISHED' ? "View Storefront" : "Admin Preview Mode"}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          {/* 1-Click Toggle Featured */}
                          <button
                            onClick={() => handleToggleFeatured(p.id, Boolean(p.featured), p.name || p.title)}
                            title={p.featured ? "Remove from Featured" : "Mark as Featured"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.featured 
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-50' 
                                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50/50'
                            }`}
                          >
                            <Star size={15} className={p.featured ? 'fill-amber-400' : ''} />
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

                          {/* Review Workflow (Approve / Reject) */}
                          {p.status === 'PENDING_REVIEW' && (
                            <>
                              <button
                                onClick={() => handleApprove(p.id, p.name || p.title)}
                                title="Approve & Publish"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                onClick={() => setRejectModalProduct(p)}
                                title="Reject with Feedback"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <X size={15} />
                              </button>
                            </>
                          )}

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

                          {/* Safe Delete */}
                          <button
                            onClick={() => setDeleteModalProduct(p)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{products.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, products.length)}</span> of{' '}
            <span className="font-bold text-slate-900">{products.length}</span> products
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2 text-xs text-slate-500 font-medium">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
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
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs bg-slate-100"
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
                  { key: 'orders', label: 'Orders' },
                  { key: 'downloads', label: 'Downloads' },
                  { key: 'licences', label: 'Licences' },
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
                    {detailProduct.googleDriveFileId && (
                      <div className="pt-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await axios.post('/api/products/drive/validate', { driveUrl: detailProduct.googleDriveFileId });
                              if (res.data.success) toast.success(`Drive connection verified: ${res.data.data.fileName || 'OK'}`);
                              else toast.error('Drive validation returned invalid status');
                            } catch (e) {
                              toast.error('Drive connection test failed');
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-[11px] hover:bg-slate-100 cursor-pointer"
                        >
                          Test Drive Connection
                        </button>
                      </div>
                    )}
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
                      <div className="p-5 rounded-3xl bg-sky-50 border border-sky-200 text-slate-900 flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-xs text-sky-700 font-bold uppercase tracking-wider block">Product Health Score</span>
                          <span className="text-3xl font-black text-slate-900 mt-1 block">{healthData.healthScore}%</span>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs border ${
                            healthData.healthScore >= 80 
                              ? 'bg-emerald-100 border-emerald-200 text-emerald-800' 
                              : 'bg-amber-100 border-amber-200 text-amber-800'
                          }`}>
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

              {/* Tab: ORDERS */}
              {detailTab === 'orders' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">Recent Customer Orders</h4>
                  {drilldownLoading ? (
                    <div className="p-6 text-center text-slate-400">Loading order records...</div>
                  ) : drilldownOrders.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      No orders recorded for this product yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {drilldownOrders.map((item: any) => (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-primary text-xs">
                              {item.order?.orderNumber || 'Order'}
                            </span>
                            <p className="text-slate-600 text-[11px]">
                              Customer: {item.order?.guestEmail || item.order?.customerId || 'Guest'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                            <span className="text-[10px] text-slate-400 block">{new Date(item.order?.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: DOWNLOADS */}
              {detailTab === 'downloads' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">Download Entitlements & Activity</h4>
                  {drilldownLoading ? (
                    <div className="p-6 text-center text-slate-400">Loading download activity...</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <span className="text-lg font-black text-slate-900 block">
                            {drilldownDownloads?.purchases?.length || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Entitlements</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <span className="text-lg font-black text-slate-900 block">
                            {drilldownDownloads?.downloadHistories?.length || 0}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Logged Deliveries</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: LICENCES */}
              {detailTab === 'licences' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">Issued Licence Keys</h4>
                  {drilldownLoading ? (
                    <div className="p-6 text-center text-slate-400">Loading licences...</div>
                  ) : drilldownLicences.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      No commercial licence keys issued yet for this product.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {drilldownLicences.map((lic: any) => (
                        <div key={lic.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900 text-xs">{lic.keyMasked}</span>
                            <p className="text-[11px] text-slate-500">{lic.licenceType} • {lic.status}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(lic.issuedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">Audit History</h4>
                  {drilldownLoading ? (
                    <div className="p-6 text-center text-slate-400">Loading audit history...</div>
                  ) : drilldownAuditLogs.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 font-medium">
                      Created on {new Date(detailProduct.createdAt).toLocaleString()} by Admin.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {drilldownAuditLogs.map((log: any) => (
                        <div key={log.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900">{log.action}</span>
                            <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 mt-1">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const targetUrl = `${detailProduct.canonicalUrl || `/product/${detailProduct.slug || detailProduct.id}`}${detailProduct.status !== 'PUBLISHED' ? '?preview=true' : ''}`;
                  window.open(targetUrl, '_blank');
                }}
                className="text-xs font-bold text-slate-600 hover:text-primary flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={14} /> Storefront Preview
              </button>

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

      {/* 9. REJECT REASON MODAL */}
      {rejectModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-amber-50/50">
              <h3 className="text-lg font-black text-slate-900">Return Product with Feedback</h3>
              <p className="text-xs text-slate-600 mt-1">
                Provide feedback for why &quot;{rejectModalProduct.name}&quot; needs revisions.
              </p>
            </div>

            <div className="p-6 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Feedback / Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Please attach a higher-resolution cover image and verify Google Drive permissions..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 h-28"
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRejectModalProduct(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Submitting...' : 'Return to Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. SAFE DELETE CONFIRMATION MODAL */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-rose-50">
              <div className="flex items-center gap-2.5 text-rose-700">
                <Trash2 size={20} />
                <h3 className="text-lg font-black text-slate-900">Delete Product</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to permanently delete &quot;{deleteModalProduct.name}&quot;?
              </p>
            </div>

            <div className="p-6 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                The system checks for existing customer orders, purchases, licences, and bundle links. If historical transactional dependencies exist, deletion will be blocked and you will be advised to Archive instead.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. BULK CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Change Category</h3>
              <p className="text-xs text-slate-600 mt-1">
                Assign {selectedIds.length} selected products to a new category.
              </p>
            </div>

            <div className="p-6 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Select Target Category</label>
              <select
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="">-- Choose Category --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCategorySubmit}
                disabled={isBulkOperating}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Apply Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
