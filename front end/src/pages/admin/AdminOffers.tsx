import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Flame, Plus, Search, Filter, RefreshCw, Download, CheckCircle, Clock,
  Slash, ShieldAlert, FileText, Edit, Trash2, Users,
  TrendingUp, Package, Sparkles, AlertCircle, DollarSign, X, Tag, Layers
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminOffers() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sub-Navigation Tabs with URL Query Synchronization (Strictly: All Products Offers, Active Offers, Scheduled Offers, Bundle Offers)
  type TabType = 'ALL' | 'ACTIVE' | 'SCHEDULED' | 'BUNDLE_OFFERS' | 'FIRST_ORDER' | 'FLASH_SALES' | 'CUSTOMER_SPECIFIC';
  const validTabs = ['ALL', 'ACTIVE', 'SCHEDULED', 'BUNDLE_OFFERS', 'FIRST_ORDER', 'FLASH_SALES', 'CUSTOMER_SPECIFIC'];
  const queryTab = searchParams.get('tab')?.toUpperCase();
  const initialTab = queryTab && validTabs.includes(queryTab) ? (queryTab as any) : 'ALL';

  const [activeTab, setActiveTabState] = useState<TabType>(initialTab);

  const setActiveTab = (tab: typeof activeTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const t = searchParams.get('tab')?.toUpperCase();
    if (t && validTabs.includes(t) && t !== activeTab) {
      setActiveTabState(t as any);
    }
  }, [searchParams]);

  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalOffers: 0,
    activeOffers: 0,
    scheduledOffers: 0,
    flashSales: 0,
    bundleOffers: 0,
    totalViews: 0,
    totalClicks: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Conflict Warnings
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    internalTitle: '',
    description: '',
    offerType: 'PRODUCT_DISCOUNT',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    maxDiscountAmount: '',
    minOrderValue: 0,
    productIds: [] as string[],
    categoryIds: [] as string[],
    bundleIds: [] as string[],
    bundleId: '',
    customerSegment: '',
    priority: 1,
    stackingPolicy: 'EXCLUSIVE',
    marginProtectionThreshold: '',
    bannerText: '',
    badgeText: 'HOT DEAL',
    displayPlacement: 'ALL_PLACEMENTS',
    startAt: '',
    endAt: '',
    status: 'ACTIVE'
  });

  // Modal Scope Filter States
  const [modalScopeTab, setModalScopeTab] = useState<'PRODUCTS' | 'BUNDLES' | 'CATEGORIES'>('PRODUCTS');
  const [productSearch, setProductSearch] = useState('');
  const [bundleSearch, setBundleSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Customer Specific Targeting States
  const [registeredCustomers, setRegisteredCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('adminAuth')}`
  });

  const fetchRegisteredCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await axios.get('/api/admin/users?role=CUSTOMER&limit=100', {
        headers: getHeaders()
      });
      if (res.data?.users) {
        setRegisteredCustomers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load registered customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const getSelectedTargetEmails = (): string[] => {
    if (!formData.customerSegment) return [];
    try {
      const parsed = JSON.parse(formData.customerSegment);
      if (Array.isArray(parsed)) return parsed.map(String);
      if (parsed && typeof parsed === 'object') {
        const emails = Array.isArray(parsed.emails) ? parsed.emails : [];
        const ids = Array.isArray(parsed.customerIds) ? parsed.customerIds : [];
        return [...emails, ...ids].map(String);
      }
    } catch {
      return formData.customerSegment.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const setSelectedTargetEmails = (emails: string[]) => {
    const unique = Array.from(new Set(emails.map(e => e.trim().toLowerCase()))).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      customerSegment: JSON.stringify(unique)
    }));
  };

  const handleToggleCustomerEmail = (email: string) => {
    const current = getSelectedTargetEmails();
    const lower = email.toLowerCase().trim();
    if (current.includes(lower)) {
      setSelectedTargetEmails(current.filter(e => e !== lower));
    } else {
      setSelectedTargetEmails([...current, lower]);
    }
  };

  const handleAddCustomEmail = () => {
    if (!customEmailInput.trim()) return;
    const lower = customEmailInput.trim().toLowerCase();
    if (!lower.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    const current = getSelectedTargetEmails();
    if (!current.includes(lower)) {
      setSelectedTargetEmails([...current, lower]);
      toast.success(`Added ${lower} to targeted customers`);
    }
    setCustomEmailInput('');
  };

  const fetchCatalogData = async () => {
    try {
      const [prodRes, catRes, bundleRes] = await Promise.all([
        axios.get('/api/products?limit=200'),
        axios.get('/api/categories?limit=100'),
        axios.get('/api/bundles?limit=200')
      ]);
      const prodList = prodRes.data.products || prodRes.data.data || [];
      const catList = catRes.data.categories || catRes.data.data || [];
      const bundleList = bundleRes.data.bundles || bundleRes.data.data || [];
      setProducts(Array.isArray(prodList) ? prodList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setBundles(Array.isArray(bundleList) ? bundleList : []);
    } catch (e) {
      console.error('Error loading catalog reference items:', e);
    }
  };

  const fetchOffersData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/offers/admin', {
        headers: getHeaders(),
        params: {
          status: activeTab === 'ACTIVE' || activeTab === 'SCHEDULED' ? activeTab : 'ALL',
          offerType: activeTab === 'BUNDLE_OFFERS' ? 'BUNDLE_OFFER' : typeFilter,
          search: searchTerm
        }
      });
      if (res.data.success) {
        setOffers(res.data.offers || []);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      toast.error(err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  useEffect(() => {
    fetchOffersData();
  }, [activeTab, typeFilter, searchTerm]);


  const applyDurationPreset = (preset: 'WEEK' | 'MONTH' | 'QUARTER') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'WEEK') {
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, startAt: todayStr, endAt: weekLater.toISOString().split('T')[0], status: 'ACTIVE' }));
      toast.success('Offer duration set to 1 Week (7 Days)');
    } else if (preset === 'MONTH') {
      const monthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, startAt: todayStr, endAt: monthLater.toISOString().split('T')[0], status: 'ACTIVE' }));
      toast.success('Offer duration set to 1 Month (30 Days)');
    } else if (preset === 'QUARTER') {
      const quarterLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, startAt: todayStr, endAt: quarterLater.toISOString().split('T')[0], status: 'ACTIVE' }));
      toast.success('Offer duration set to 3 Months (90 Days)');
    }
  };

  const handleOpenCreateModal = () => {
    fetchCatalogData();
    fetchRegisteredCustomers();
    setEditingOffer(null);
    setConflicts([]);
    const isFirstOrderTab = activeTab === 'FIRST_ORDER';
    const isBundleTab = activeTab === 'BUNDLE_OFFERS';
    const isFlashTab = activeTab === 'FLASH_SALES';
    const isCustomerSpecificTab = activeTab === 'CUSTOMER_SPECIFIC';
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultEndStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const isScheduledTab = activeTab === 'SCHEDULED';
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultStartStr = isScheduledTab ? tomorrowStr : todayStr;

    setFormData({
      name: isFirstOrderTab ? 'First Order Welcome Offer' : (isCustomerSpecificTab ? 'VIP Customer Exclusive Offer' : ''),
      internalTitle: '',
      description: isFirstOrderTab ? 'Special discount for verified first-time buyers' : (isCustomerSpecificTab ? 'Exclusive discount reserved for selected customer accounts' : ''),
      offerType: isFirstOrderTab ? 'FIRST_ORDER_OFFER' : (isBundleTab ? 'BUNDLE_OFFER' : (isFlashTab ? 'FLASH_SALE' : (isCustomerSpecificTab ? 'CUSTOMER_SPECIFIC_OFFER' : 'PRODUCT_DISCOUNT'))),
      discountType: 'PERCENTAGE',
      discountValue: isFirstOrderTab ? 20 : 15,
      maxDiscountAmount: '',
      minOrderValue: 0,
      productIds: [],
      categoryIds: [],
      bundleIds: [],
      bundleId: '',
      customerSegment: '',
      priority: 1,
      stackingPolicy: 'EXCLUSIVE',
      marginProtectionThreshold: '',
      bannerText: isFirstOrderTab ? '🎉 Welcome! Enjoy 20% OFF your verified first purchase!' : (isCustomerSpecificTab ? '⭐ Exclusive Customer Offer! Special VIP pricing just for you.' : ''),
      badgeText: isFirstOrderTab ? 'FIRST ORDER DEAL' : (isCustomerSpecificTab ? 'VIP OFFER' : 'HOT DEAL'),
      displayPlacement: 'ALL_PLACEMENTS',
      startAt: defaultStartStr,
      endAt: defaultEndStr,
      status: isScheduledTab ? 'SCHEDULED' : 'ACTIVE'
    });
    setProductSearch('');
    setBundleSearch('');
    setCategorySearch('');
    setCustomerSearch('');
    setCustomEmailInput('');
    setModalScopeTab(isBundleTab ? 'BUNDLES' : 'PRODUCTS');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: any) => {
    fetchCatalogData();
    fetchRegisteredCustomers();
    setEditingOffer(offer);
    setConflicts([]);
    let pIds: string[] = [], cIds: string[] = [], bIds: string[] = [];
    try {
      if (offer.productIds) pIds = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
      if (offer.categoryIds) cIds = typeof offer.categoryIds === 'string' ? JSON.parse(offer.categoryIds) : offer.categoryIds;
      if (offer.bundleIds) bIds = typeof offer.bundleIds === 'string' ? JSON.parse(offer.bundleIds) : offer.bundleIds;
      if (!Array.isArray(bIds) && offer.bundleId) bIds = [offer.bundleId];
    } catch {
      if (offer.productIds) pIds = offer.productIds.split(',').map((s: string) => s.trim());
      if (offer.categoryIds) cIds = offer.categoryIds.split(',').map((s: string) => s.trim());
      if (offer.bundleIds) bIds = offer.bundleIds.split(',').map((s: string) => s.trim());
    }

    setFormData({
      name: offer.name,
      internalTitle: offer.internalTitle || offer.name,
      description: offer.description || '',
      offerType: offer.offerType || 'PRODUCT_DISCOUNT',
      discountType: offer.discountType || 'PERCENTAGE',
      discountValue: offer.discountValue || 0,
      maxDiscountAmount: offer.maxDiscountAmount ? String(offer.maxDiscountAmount) : '',
      minOrderValue: offer.minOrderValue || 0,
      productIds: pIds,
      categoryIds: cIds,
      bundleIds: Array.isArray(bIds) ? bIds : [],
      bundleId: offer.bundleId || (Array.isArray(bIds) && bIds[0]) || '',
      customerSegment: offer.customerSegment || '',
      priority: offer.priority || 1,
      stackingPolicy: offer.stackingPolicy || 'EXCLUSIVE',
      marginProtectionThreshold: offer.marginProtectionThreshold ? String(offer.marginProtectionThreshold) : '',
      bannerText: offer.bannerText || '',
      badgeText: offer.badgeText || 'HOT DEAL',
      displayPlacement: offer.displayPlacement || 'STOREFRONT_BANNER',
      startAt: offer.startAt ? new Date(offer.startAt).toISOString().split('T')[0] : '',
      endAt: offer.endAt ? new Date(offer.endAt).toISOString().split('T')[0] : '',
      status: offer.status || 'ACTIVE'
    });
    setCustomerSearch('');
    setCustomEmailInput('');
    setIsModalOpen(true);
  };

  const checkConflicts = async () => {
    try {
      const res = await axios.post('/api/admin/offers/admin/conflicts', {
        productIds: formData.productIds,
        categoryIds: formData.categoryIds,
        startAt: formData.startAt ? new Date(formData.startAt) : null,
        endAt: formData.endAt ? new Date(formData.endAt) : null,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        id: editingOffer?.id
      }, { headers: getHeaders() });

      if (res.data.success) {
        setConflicts(res.data.conflicts || []);
        if (res.data.hasConflicts) {
          toast('Notice: Potential overlapping offers detected.', { icon: '⚠️' });
        } else {
          toast.success('No overlapping offer conflicts detected.');
        }
      }
    } catch (e) {
      console.error('Error checking conflicts:', e);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Offer name is required');
      return;
    }

    if (!formData.endAt) {
      toast.error('Offer expiration date (End Date) is required. Promotional offers cannot be permanent.');
      return;
    }

    if (formData.status === 'SCHEDULED' && !formData.startAt) {
      toast.error('Schedule date (Start Date) is required for scheduled offers');
      return;
    }

    if (formData.minOrderValue < 0) {
      toast.error('Minimum order value cannot be negative');
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (formData.startAt && formData.endAt && new Date(formData.endAt) < new Date(formData.startAt)) {
      toast.error('End date cannot be earlier than start date');
      return;
    }

    try {
      if (editingOffer) {
        const res = await axios.put(`/api/admin/offers/admin/${editingOffer.id}`, formData, {
          headers: getHeaders()
        });
        if (res.data.success) {
          toast.success('Offer updated successfully');
          setIsModalOpen(false);
          fetchOffersData();
        }
      } else {
        const res = await axios.post('/api/admin/offers/admin', formData, {
          headers: getHeaders()
        });
        if (res.data.success) {
          toast.success('Offer created successfully');
          setIsModalOpen(false);
          fetchOffersData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save offer');
    }
  };

  const handleStatusChange = async (offerId: string, newStatus: string) => {
    try {
      const res = await axios.post(`/api/admin/offers/admin/${offerId}/status`, { status: newStatus }, {
        headers: getHeaders()
      });
      if (res.data.success) {
        toast.success(`Offer status changed to ${newStatus}`);
        fetchOffersData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleActivateImmediately = async (offerId: string, offerName: string) => {
    try {
      const res = await axios.post(`/api/admin/offers/admin/${offerId}/status`, { status: 'ACTIVE' }, {
        headers: getHeaders()
      });
      if (res.data.success) {
        toast.success(`Offer "${offerName}" activated live on storefront!`);
        fetchOffersData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error activating offer');
    }
  };

  const handleDeleteOffer = async (offerId: string, offerName: string) => {
    if (!window.confirm(`Are you sure you want to delete the offer "${offerName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await axios.delete(`/api/admin/offers/admin/${offerId}`, {
        headers: getHeaders()
      });
      if (res.data.success) {
        toast.success(res.data.message || `Offer "${offerName}" deleted successfully`);
        fetchOffersData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting offer');
    }
  };

  const exportOffersCSV = () => {
    window.open(`/api/admin/offers/admin/export?status=${activeTab}&offerType=${typeFilter}`, '_blank');
    toast.success('Offers CSV export started');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Offers & Promotions</h1>
              <p className="text-sm text-slate-500">Manage flash sales, bundle deals, and real-time conflict rules.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOffersData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportOffersCSV}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition flex items-center gap-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create Offer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === 'ALL' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">All Products Offers</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5">{kpis.totalOffers || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total product promotions</div>
        </div>

        <div
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === 'ACTIVE' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Offers</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1.5">{kpis.activeOffers || 0}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Currently live on store</div>
        </div>

        <div
          onClick={() => setActiveTab('SCHEDULED')}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === 'SCHEDULED' ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scheduled Offers</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1.5">{kpis.scheduledOffers || 0}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">Upcoming scheduled deals</div>
        </div>

        <div
          onClick={() => setActiveTab('BUNDLE_OFFERS')}
          className={`p-3.5 rounded-xl border transition cursor-pointer ${
            activeTab === 'BUNDLE_OFFERS' ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bundle Offers</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1.5">{kpis.bundleOffers || 0}</div>
          <div className="text-[11px] text-indigo-700 mt-0.5">Multi-product bundles</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Products Offers', icon: Flame },
          { id: 'ACTIVE', label: 'Active Offers', icon: CheckCircle },
          { id: 'SCHEDULED', label: 'Scheduled Offers', icon: Clock },
          { id: 'BUNDLE_OFFERS', label: 'Bundle Offers', icon: Package },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search offers by name, title, or badge text..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Offer Types</option>
            <option value="PRODUCT_DISCOUNT">Product Direct Discount</option>
            <option value="BUNDLE_OFFER">Bundle Combination Offer</option>
            <option value="FLASH_SALE">Flash Sale</option>
            <option value="FIRST_ORDER_OFFER">First-Order Offer</option>
            <option value="CUSTOMER_SPECIFIC_OFFER">Customer Specific Offer</option>
          </select>
        </div>
      </div>

      {/* Main Offers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Offer Name & Placement</th>
                <th className="px-5 py-3.5">Type & Discount</th>
                <th className="px-5 py-3.5">Min Order</th>
                <th className="px-5 py-3.5">Performance</th>
                <th className="px-5 py-3.5">Validity Window</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {activeTab === 'SCHEDULED' ? (
                      <div className="space-y-3 max-w-md mx-auto">
                        <Clock className="w-9 h-9 text-blue-500 mx-auto" />
                        <p className="font-bold text-slate-800 text-base">No scheduled offers found</p>
                        <p className="text-xs text-slate-500">
                          There are currently no upcoming scheduled promotions. To schedule an offer, create a new offer with a future start date.
                        </p>
                        <button
                          onClick={handleOpenCreateModal}
                          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus size={14} /> Schedule an Offer
                        </button>
                      </div>
                    ) : activeTab === 'ACTIVE' ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <CheckCircle className="w-9 h-9 text-emerald-500 mx-auto" />
                        <p className="font-bold text-slate-800 text-base">No active offers live</p>
                        <p className="text-xs text-slate-500">All registered offers are either scheduled, paused, or expired.</p>
                      </div>
                    ) : (
                      <p>No offers registered under current filter.</p>
                    )}
                  </td>
                </tr>
              ) : (
                offers.map((offer: any) => {
                  const views = offer.viewsCount ?? offer.viewCount ?? 0;
                  const clicks = offer.clicksCount ?? offer.clickCount ?? 0;
                  const orders = offer.ordersCount ?? offer.orderCount ?? 0;
                  const revenue = offer.revenueGenerated ?? 0;
                  const isScheduled = offer.status === 'SCHEDULED' || (offer.startAt && new Date(offer.startAt) > new Date());

                  return (
                    <tr key={offer.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-base">{offer.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {offer.badgeText && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-xs uppercase tracking-wide">
                              {offer.badgeText}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{offer.displayPlacement}</span>
                        </div>
                        <div className="mt-1.5 text-xs">
                          {['BUNDLE_OFFER', 'BUNDLE_DEAL'].includes(offer.offerType) ? (
                            offer.targetBundles && offer.targetBundles.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium border border-purple-200">
                                <Package size={11} /> Bundle: {offer.targetBundles.map((b: any) => b.title).join(', ')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium border border-purple-200">
                                <Package size={11} /> All Store Bundles
                              </span>
                            )
                          ) : ['CUSTOMER_SPECIFIC_OFFER', 'CUSTOMER_SPECIFIC'].includes(offer.offerType) ? (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                              <Users size={11} />
                              {offer.targetCustomers && offer.targetCustomers.length > 0
                                ? `${offer.targetCustomers.length} Targeted Customer(s): ${offer.targetCustomers.slice(0, 2).join(', ')}${offer.targetCustomers.length > 2 ? '...' : ''}`
                                : (offer.customerSegment ? `Target: ${offer.customerSegment.slice(0, 30)}...` : 'Selected Customers')}
                            </span>
                          ) : offer.targetProducts && offer.targetProducts.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                              <Tag size={11} /> {offer.targetProducts.length} Product(s): {offer.targetProducts.slice(0, 2).map((p: any) => p.name).join(', ')}{offer.targetProducts.length > 2 ? '...' : ''}
                            </span>
                          ) : null}
                        </div>
                        {offer.bannerText && (
                          <div className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">
                            Headline: "{offer.bannerText}"
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {offer.discountType === 'PERCENTAGE'
                            ? `${offer.discountValue}% OFF`
                            : offer.discountType === 'FLAT_PRICE'
                            ? `Flat Price: ₹${offer.discountValue}`
                            : `₹${offer.discountValue} Flat Off`}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{offer.offerType}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {offer.minOrderValue && offer.minOrderValue > 0 ? `₹${offer.minOrderValue}` : 'No Minimum'}
                        </div>
                        <div className="text-[10px] text-slate-400">Cart requirement</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-700">
                          <strong>{views}</strong> views · <strong>{clicks}</strong> clicks
                        </div>
                        <div className="text-xs font-semibold text-emerald-600">
                          ₹{revenue.toLocaleString('en-IN')} ({orders} orders)
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {isScheduled && offer.startAt ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
                              <Clock size={12} /> Starts: {new Date(offer.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {offer.endAt && (
                              <div className="text-[11px] text-slate-400 mt-1">
                                Ends: {new Date(offer.endAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500">
                            {offer.startAt ? new Date(offer.startAt).toLocaleDateString() : 'Immediate'}
                            {' → '}
                            {offer.endAt ? new Date(offer.endAt).toLocaleDateString() : 'No expiry'}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          offer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          offer.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          offer.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                          offer.status === 'EXPIRED' ? 'bg-slate-100 text-slate-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {offer.status === 'ACTIVE' && <CheckCircle size={11} />}
                          {offer.status === 'SCHEDULED' && <Clock size={11} />}
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Instant activation for scheduled offers */}
                        {isScheduled && (
                          <button
                            onClick={() => handleActivateImmediately(offer.id, offer.name)}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded transition inline-block"
                            title="Activate Immediately (Make Live Now)"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(offer)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition inline-block"
                          title="Edit Offer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {offer.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(offer.id, 'PAUSED')}
                            className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition inline-block"
                            title="Pause Offer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        ) : offer.status !== 'SCHEDULED' ? (
                          <button
                            onClick={() => handleStatusChange(offer.id, 'ACTIVE')}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded transition inline-block"
                            title="Activate Offer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleStatusChange(offer.id, 'DISABLED')}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition inline-block"
                          title="Disable Offer"
                        >
                          <Slash className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id, offer.name)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition inline-block"
                          title="Delete Offer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingOffer ? `Edit Offer (${editingOffer.name})` : 'Create New Promotional Offer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Conflict Warnings Box */}
              {conflicts.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Overlapping Offer Conflicts Detected ({conflicts.length})</span>
                  </div>
                  <ul className="text-xs text-amber-800 list-disc list-inside space-y-1">
                    {conflicts.map((c: any, i) => (
                      <li key={i}>{c.message} {c.existingOfferName && <>(Existing: <strong>{c.existingOfferName}</strong>)</>}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Row 1: Name & Internal Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Offer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Flash 40% Off Summer Pack"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="e.g. 40% OFF or FLASH SALE"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 2: Offer Type & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Offer Type *</label>
                  <select
                    value={formData.offerType}
                    onChange={e => setFormData({ ...formData, offerType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="PRODUCT_DISCOUNT">Product Direct Discount</option>
                    <option value="FLASH_SALE">Flash Sale</option>
                    <option value="BUNDLE_OFFER">Bundle Combination Offer</option>
                    <option value="FIRST_ORDER_OFFER">First-Order Welcome Offer</option>
                    <option value="CUSTOMER_SPECIFIC_OFFER">Customer Specific Offer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={e => {
                      const newType = e.target.value;
                      let updatedVal = formData.discountValue;
                      if (newType === 'PERCENTAGE' && updatedVal > 100) {
                        updatedVal = 20;
                      }
                      let suggestedBadge = formData.badgeText;
                      if (!suggestedBadge || suggestedBadge.includes('%') || suggestedBadge.includes('FLAT') || suggestedBadge.includes('HOT DEAL')) {
                        if (newType === 'PERCENTAGE') suggestedBadge = `${updatedVal}% OFF`;
                        else if (newType === 'FIXED') suggestedBadge = `₹${updatedVal} OFF`;
                        else if (newType === 'FLAT_PRICE') suggestedBadge = `₹${updatedVal} ONLY`;
                      }
                      setFormData({
                        ...formData,
                        discountType: newType,
                        discountValue: updatedVal,
                        badgeText: suggestedBadge
                      });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="FLAT_PRICE">Flat Promotional Price (₹)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formData.discountType === 'PERCENTAGE'
                      ? 'Deducts a percentage from item price (1% - 100%)'
                      : formData.discountType === 'FIXED'
                      ? 'Deducts a flat rupee amount from item price'
                      : 'Overrides item price with an exact flat promotional price'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {formData.discountType === 'PERCENTAGE'
                      ? 'Discount Percentage (%) *'
                      : formData.discountType === 'FIXED'
                      ? 'Discount Amount (₹) *'
                      : 'Promotional Flat Price (₹) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                      {formData.discountType === 'PERCENTAGE' ? '%' : '₹'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={formData.discountType === 'PERCENTAGE' ? '0.1' : '0'}
                      max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                      required
                      value={formData.discountValue}
                      onChange={e => {
                        let val = parseFloat(e.target.value) || 0;
                        if (formData.discountType === 'PERCENTAGE' && val > 100) val = 100;
                        if (val < 0) val = 0;
                        setFormData(prev => ({
                          ...prev,
                          discountValue: val,
                          badgeText:
                            prev.discountType === 'PERCENTAGE'
                              ? `${val}% OFF`
                              : prev.discountType === 'FIXED'
                              ? `₹${val} OFF`
                              : `₹${val} ONLY`
                        }));
                      }}
                      placeholder={
                        formData.discountType === 'PERCENTAGE'
                          ? 'e.g. 15 (for 15% discount)'
                          : formData.discountType === 'FIXED'
                          ? 'e.g. 199 (for ₹199 discount)'
                          : 'e.g. 499 (for ₹499 direct price)'
                      }
                      className="w-full pl-8 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formData.discountType === 'PERCENTAGE'
                      ? 'Enter 1 to 100 (e.g. 25 = 25% off customer pays 75%)'
                      : formData.discountType === 'FIXED'
                      ? 'Rupees deducted per qualifying product or combo in cart'
                      : 'Fixed price customer will pay regardless of original price'}
                  </span>
                </div>
              </div>

              {/* Customer Target Selector when CUSTOMER_SPECIFIC_OFFER */}
              {formData.offerType === 'CUSTOMER_SPECIFIC_OFFER' && (
                <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-900 uppercase">Targeted Customer Accounts *</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                        {getSelectedTargetEmails().length} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTargetEmails(registeredCustomers.map(c => c.email))}
                        className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                      >
                        Select All Customers
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTargetEmails([])}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800">
                    This offer will be strictly restricted and visible only to the specified customers in their account, promotional banners, and checkout.
                  </p>

                  {/* Custom Email Input */}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Add custom customer email (e.g. vip@client.com)..."
                      value={customEmailInput}
                      onChange={e => setCustomEmailInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomEmail(); } }}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomEmail}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      + Add Email
                    </button>
                  </div>

                  {/* Selected Customer Chips */}
                  {getSelectedTargetEmails().length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                      {getSelectedTargetEmails().map(email => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-xs font-medium border border-amber-200"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => handleToggleCustomerEmail(email)}
                            className="text-amber-700 hover:text-amber-950 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Registered Customer Quick Search & Checkbox List */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search registered customers by name or email..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                      {loadingCustomers ? (
                        <div className="p-3 text-center text-xs text-slate-400">Loading customers...</div>
                      ) : registeredCustomers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">No registered customers found. Add email addresses above.</div>
                      ) : (
                        registeredCustomers
                          .filter(c =>
                            !customerSearch ||
                            c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.email?.toLowerCase().includes(customerSearch.toLowerCase())
                          )
                          .map(c => {
                            const isChecked = getSelectedTargetEmails().includes(c.email.toLowerCase().trim());
                            return (
                              <label
                                key={c.id || c.email}
                                className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleCustomerEmail(c.email)}
                                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="font-semibold text-slate-800">{c.name || 'Customer'}</span>
                                    <span className="text-slate-400 ml-1.5 font-mono">{c.email}</span>
                                  </div>
                                </div>
                                {c._count?.orders !== undefined && (
                                  <span className="text-[10px] text-slate-400">
                                    {c._count.orders} order(s)
                                  </span>
                                )}
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Row 3: Target Scope (Products, Bundles, and Categories) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      Offer Target Scope (Products, Bundles & Categories)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Select specific items to discount. Leaving all empty applies this offer Storewide to all catalog items.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setModalScopeTab('PRODUCTS')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        modalScopeTab === 'PRODUCTS'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Products ({formData.productIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalScopeTab('BUNDLES')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        modalScopeTab === 'BUNDLES'
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bundles ({formData.bundleIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalScopeTab('CATEGORIES')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        modalScopeTab === 'CATEGORIES'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Categories ({formData.categoryIds.length})
                    </button>
                  </div>
                </div>

                {/* Tab 1: Products */}
                {modalScopeTab === 'PRODUCTS' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Search products by title..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full max-w-xs px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = products
                              .filter(p => (p.name || p.title || '').toLowerCase().includes(productSearch.toLowerCase()))
                              .map(p => p.id);
                            const combined = Array.from(new Set([...formData.productIds, ...filtered]));
                            setFormData({ ...formData, productIds: combined });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 rounded-md border border-amber-200 cursor-pointer"
                        >
                          Select Filtered
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, productIds: [] })}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-white rounded-md border border-slate-200 cursor-pointer"
                        >
                          Clear ({formData.productIds.length})
                        </button>
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-slate-200">
                      {products.length === 0 ? (
                        <p className="text-xs text-slate-400 p-3 text-center">No products found in catalog.</p>
                      ) : (
                        products
                          .filter(p => (p.name || p.title || '').toLowerCase().includes(productSearch.toLowerCase()))
                          .map(p => {
                            const isChecked = formData.productIds.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                                  isChecked ? 'bg-amber-50 border border-amber-300 font-semibold text-amber-950' : 'hover:bg-slate-50 border border-transparent text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setFormData({ ...formData, productIds: [...formData.productIds, p.id] });
                                      } else {
                                        setFormData({ ...formData, productIds: formData.productIds.filter(id => id !== p.id) });
                                      }
                                    }}
                                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                  />
                                  <span className="truncate">{p.name || p.title}</span>
                                  {p.category && (
                                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">({typeof p.category === 'object' ? p.category.name : p.category})</span>
                                  )}
                                </div>
                                <span className="font-mono text-slate-900 font-bold shrink-0 ml-2">₹{p.price}</span>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 2: Bundles */}
                {modalScopeTab === 'BUNDLES' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Search bundles by title..."
                        value={bundleSearch}
                        onChange={e => setBundleSearch(e.target.value)}
                        className="w-full max-w-xs px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = bundles
                              .filter(b => (b.title || '').toLowerCase().includes(bundleSearch.toLowerCase()))
                              .map(b => b.id);
                            const combined = Array.from(new Set([...formData.bundleIds, ...filtered]));
                            setFormData({ ...formData, bundleIds: combined });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 rounded-md border border-purple-200 cursor-pointer"
                        >
                          Select Filtered
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, bundleIds: [] })}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-white rounded-md border border-slate-200 cursor-pointer"
                        >
                          Clear ({formData.bundleIds.length})
                        </button>
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-purple-200">
                      {bundles.length === 0 ? (
                        <p className="text-xs text-slate-400 p-3 text-center">No bundles found in catalog.</p>
                      ) : (
                        bundles
                          .filter(b => (b.title || '').toLowerCase().includes(bundleSearch.toLowerCase()))
                          .map(b => {
                            const isChecked = formData.bundleIds.includes(b.id);
                            return (
                              <label
                                key={b.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                                  isChecked ? 'bg-purple-50 border border-purple-300 font-semibold text-purple-950' : 'hover:bg-slate-50 border border-transparent text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setFormData({ ...formData, bundleIds: [...formData.bundleIds, b.id] });
                                      } else {
                                        setFormData({ ...formData, bundleIds: formData.bundleIds.filter(id => id !== b.id) });
                                      }
                                    }}
                                    className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                  <span className="truncate">{b.title}</span>
                                  {b.itemsIncluded && (
                                    <span className="text-[10px] text-purple-600 shrink-0 font-mono">({b.itemsIncluded} items)</span>
                                  )}
                                </div>
                                <span className="font-mono text-purple-900 font-bold shrink-0 ml-2">₹{b.price}</span>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Categories */}
                {modalScopeTab === 'CATEGORIES' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                        className="w-full max-w-xs px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = categories
                              .filter(c => (c.name || '').toLowerCase().includes(categorySearch.toLowerCase()))
                              .map(c => c.id);
                            const combined = Array.from(new Set([...formData.categoryIds, ...filtered]));
                            setFormData({ ...formData, categoryIds: combined });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 rounded-md border border-blue-200 cursor-pointer"
                        >
                          Select Filtered
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, categoryIds: [] })}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-white rounded-md border border-slate-200 cursor-pointer"
                        >
                          Clear ({formData.categoryIds.length})
                        </button>
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-slate-200">
                      {categories.length === 0 ? (
                        <p className="text-xs text-slate-400 p-3 text-center">No categories found.</p>
                      ) : (
                        categories
                          .filter(c => (c.name || '').toLowerCase().includes(categorySearch.toLowerCase()))
                          .map(c => {
                            const isChecked = formData.categoryIds.includes(c.id);
                            return (
                              <label
                                key={c.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                                  isChecked ? 'bg-blue-50 border border-blue-300 font-semibold text-blue-950' : 'hover:bg-slate-50 border border-transparent text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setFormData({ ...formData, categoryIds: [...formData.categoryIds, c.id] });
                                      } else {
                                        setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== c.id) });
                                      }
                                    }}
                                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">Category</span>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80 flex items-center justify-between">
                  <span>Selected: {formData.productIds.length} Products, {formData.bundleIds.length} Bundles, {formData.categoryIds.length} Categories</span>
                  <span className="font-semibold text-amber-700">{formData.productIds.length === 0 && formData.bundleIds.length === 0 && formData.categoryIds.length === 0 ? '✨ Applied Storewide' : '🎯 Specific Target Items Active'}</span>
                </div>
              </div>

              {/* Row 3b: Headline Announcement & Placement Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Storefront Top Headline Banner Text (Customizable)
                  </label>
                  <input
                    type="text"
                    value={formData.bannerText}
                    onChange={e => setFormData({ ...formData, bannerText: e.target.value })}
                    placeholder={
                      formData.offerType === 'BUNDLE_OFFER'
                        ? 'e.g. 🎁 BUNDLE DEAL: The Ultimate Freelancer Bundle is 25% OFF!'
                        : 'e.g. ⚡ FLASH SALE: Winter Fest is Live! 15% OFF Storewide'
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                    Syncs live to the top announcement bar visible to all customers on every page.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Display Placement
                  </label>
                  <select
                    value={formData.displayPlacement}
                    onChange={e => setFormData({ ...formData, displayPlacement: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ALL_PLACEMENTS">All Placements (Top Headline, Store Banner & Product/Bundle Cards)</option>
                    <option value="STOREFRONT_HEADLINE">Storefront Top Headline Announcement Bar</option>
                    <option value="STOREFRONT_BANNER">Storefront Hero Banner</option>
                  </select>
                  <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                    Defines where the promotional badges, sale pricing, and banners appear.
                  </span>
                </div>
              </div>

              {/* Row 4: Min Order Requirement */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="max-w-md">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.minOrderValue}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setFormData({
                          ...formData,
                          minOrderValue: isNaN(val) || val < 0 ? 0 : val
                        });
                      }}
                      onBlur={() => {
                        if (formData.minOrderValue < 0 || isNaN(formData.minOrderValue)) {
                          setFormData({ ...formData, minOrderValue: 0 });
                        }
                      }}
                      placeholder="0 (No minimum order value required)"
                      className="w-full pl-8 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">
                    Cart subtotal must equal or exceed this amount for the offer discount to apply. Cannot be negative.
                  </span>
                </div>
              </div>

              {/* Duration Quick-Presets */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Offer Duration Presets
                  </label>
                  <span className="text-[11px] text-slate-500">Quickly apply standard time-limited duration</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyDurationPreset('WEEK')}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    1 Week Limited (7 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDurationPreset('MONTH')}
                    className="px-3 py-1.5 rounded-lg border border-blue-300 bg-white hover:bg-blue-100 text-blue-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    1 Month Limited (30 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDurationPreset('QUARTER')}
                    className="px-3 py-1.5 rounded-lg border border-purple-300 bg-white hover:bg-purple-100 text-purple-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    3 Months Limited (90 Days)
                  </button>
                </div>
              </div>

              {/* Row 5: Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Start Date {formData.status === 'SCHEDULED' && <span className="text-amber-600">* (Schedule Date)</span>}
                  </label>
                  <input
                    type="date"
                    required={formData.status === 'SCHEDULED'}
                    value={formData.startAt}
                    onChange={e => {
                      const newStart = e.target.value;
                      const isFuture = newStart && new Date(newStart) > new Date();
                      setFormData({
                        ...formData,
                        startAt: newStart,
                        status: isFuture && formData.status !== 'DRAFT' && formData.status !== 'DISABLED' ? 'SCHEDULED' : (formData.status === 'SCHEDULED' && !isFuture ? 'ACTIVE' : formData.status)
                      });
                    }}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 ${
                      formData.status === 'SCHEDULED' && !formData.startAt ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formData.status === 'SCHEDULED'
                      ? 'Select the activation date when this offer will automatically turn active'
                      : 'Leave empty to start immediately'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    End Date (Required Expiration) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endAt}
                    onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-rose-500 font-medium mt-1">Required: promotional offers cannot be permanent</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      let updatedStart = formData.startAt;
                      if (newStatus === 'SCHEDULED' && (!updatedStart || new Date(updatedStart) <= new Date())) {
                        updatedStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      }
                      setFormData({ ...formData, status: newStatus, startAt: updatedStart });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ACTIVE">Active (Live Immediately)</option>
                    <option value="SCHEDULED">Scheduled (Future Activation)</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DRAFT">Draft</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formData.status === 'SCHEDULED'
                      ? 'Offer will automatically go live when schedule date arrives'
                      : 'Live immediately on storefront'}
                  </p>
                </div>
              </div>

              {/* Conflict Checker Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={checkConflicts}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Run Overlap Conflict Scanner</span>
                </button>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition text-white ${
                    formData.status === 'SCHEDULED'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : formData.status === 'PAUSED'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {editingOffer
                    ? 'Save Changes'
                    : formData.status === 'SCHEDULED'
                    ? 'Schedule Offer'
                    : formData.status === 'PAUSED'
                    ? 'Save as Paused Offer'
                    : formData.status === 'DRAFT'
                    ? 'Save as Draft'
                    : formData.status === 'DISABLED'
                    ? 'Create Disabled Offer'
                    : 'Launch Active Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
