import { useState, useEffect, useMemo } from 'react';
import {
  Tag, Plus, Search, Filter, RefreshCw, Download, CheckCircle, Clock,
  AlertTriangle, Slash, ShieldAlert, FileText, ChevronRight, Eye, Edit,
  TrendingUp, Users, DollarSign, Calendar, Lock, X, Sparkles,
  Package, Gift, ChevronDown, ChevronUp, UserCheck, Layers
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  // Navigation Sub-Views
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED' | 'REDEMPTIONS' | 'ABUSE' | 'REPORTS'>('ALL');

  const [coupons, setCoupons] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [abuseLogs, setAbuseLogs] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalCoupons: 0,
    activeCoupons: 0,
    scheduledCoupons: 0,
    expiredCoupons: 0,
    disabledCoupons: 0,
    redemptionsToday: 0,
    totalDiscountGiven: 0
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Products and Categories for eligibility selectors
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableBundles, setAvailableBundles] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [bundleSearch, setBundleSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [showExcludedProducts, setShowExcludedProducts] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [detailCoupon, setDetailCoupon] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    internalName: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: '',
    currency: 'INR',
    minOrderValue: 0,
    eligibleProducts: [] as string[],
    excludedProducts: [] as string[],
    eligibleCategories: [] as string[],
    eligibleCustomerSegments: [] as string[],
    eligibleBundles: [] as string[],
    freeProductId: '',
    affiliateId: '',
    commissionRate: '',
    startAt: '',
    endAt: '',
    totalUsageLimit: '',
    perCustomerLimit: 1,
    stackingPolicy: 'EXCLUSIVE',
    internalNote: '',
    status: 'ACTIVE'
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('adminAuth')}`
  });

  const fetchCouponsData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/coupons/admin', {
        headers: getHeaders(),
        params: {
          status: activeTab === 'ACTIVE' || activeTab === 'SCHEDULED' || activeTab === 'EXPIRED' || activeTab === 'DISABLED' ? activeTab : 'ALL',
          discountType: typeFilter,
          search: searchTerm
        }
      });
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/coupons/admin/redemptions', { headers: getHeaders() });
      if (res.data.success) setRedemptions(res.data.redemptions || []);
    } catch (err: any) {
      console.error('Error fetching redemptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAbuseLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/coupons/admin/abuse', { headers: getHeaders() });
      if (res.data.success) setAbuseLogs(res.data.abuseLogs || []);
    } catch (err: any) {
      console.error('Error fetching abuse logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [prodRes, catRes, bunRes, userRes] = await Promise.all([
        axios.get('/api/products').catch(() => ({ data: { data: [] } })),
        axios.get('/api/categories').catch(() => ({ data: { data: [] } })),
        axios.get('/api/bundles').catch(() => ({ data: { data: [] } })),
        axios.get('/api/admin/users?role=CUSTOMER', { headers: getHeaders() }).catch(() => ({ data: { users: [] } }))
      ]);
      const prods = prodRes.data?.products || prodRes.data?.data || (Array.isArray(prodRes.data) ? prodRes.data : []);
      const cats = catRes.data?.categories || catRes.data?.data || (Array.isArray(catRes.data) ? catRes.data : []);
      const buns = bunRes.data?.bundles || bunRes.data?.data || (Array.isArray(bunRes.data) ? bunRes.data : []);
      const users = userRes.data?.users || userRes.data?.data || (Array.isArray(userRes.data) ? userRes.data : []);

      setAvailableProducts(Array.isArray(prods) ? prods : []);
      setAvailableCategories(Array.isArray(cats) ? cats : []);
      setAvailableBundles(Array.isArray(buns) ? buns : []);
      setAvailableUsers(Array.isArray(users) ? users : []);
    } catch (e) {
      console.error('Error fetching dependencies:', e);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (activeTab === 'REDEMPTIONS') {
      fetchRedemptions();
    } else if (activeTab === 'ABUSE') {
      fetchAbuseLogs();
    } else {
      fetchCouponsData();
    }
  }, [activeTab, typeFilter, searchTerm]);

  const toggleItemInArray = (field: 'eligibleProducts' | 'excludedProducts' | 'eligibleCategories' | 'eligibleBundles' | 'eligibleCustomerSegments', id: string) => {
    setFormData(prev => {
      const current = (prev[field] as string[]) || [];
      const exists = current.includes(id);
      return {
        ...prev,
        [field]: exists ? current.filter(item => item !== id) : [...current, id]
      };
    });
  };

  const handleAddCustomEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = customEmailInput.trim().toLowerCase();
    if (!email) return;
    if (formData.eligibleCustomerSegments.includes(email)) {
      toast.error('Email already added');
      return;
    }
    setFormData(prev => ({
      ...prev,
      eligibleCustomerSegments: [...prev.eligibleCustomerSegments, email]
    }));
    setCustomEmailInput('');
    toast.success(`Target email "${email}" added`);
  };

  const handleOpenCreateModal = () => {
    fetchDependencies();
    setEditingCoupon(null);
    setProductSearch('');
    setCategorySearch('');
    setBundleSearch('');
    setCustomerSearch('');
    setCustomEmailInput('');
    setShowExcludedProducts(false);
    const isScheduledTab = activeTab === 'SCHEDULED';
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultStartStr = isScheduledTab ? tomorrowStr : new Date().toISOString().split('T')[0];

    setFormData({
      code: '',
      internalName: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscountAmount: '',
      currency: 'INR',
      minOrderValue: 0,
      eligibleProducts: [],
      excludedProducts: [],
      eligibleCategories: [],
      eligibleCustomerSegments: [],
      eligibleBundles: [],
      freeProductId: '',
      affiliateId: '',
      commissionRate: '',
      startAt: defaultStartStr,
      endAt: '',
      totalUsageLimit: '',
      perCustomerLimit: 1,
      stackingPolicy: 'EXCLUSIVE',
      internalNote: '',
      status: isScheduledTab ? 'SCHEDULED' : 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const applyDurationPreset = (preset: 'WEEK' | 'MONTH' | 'PERMANENT') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'WEEK') {
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, startAt: todayStr, endAt: weekLater.toISOString().split('T')[0] }));
      toast.success('Duration set to 1 Week (7 Days)');
    } else if (preset === 'MONTH') {
      const monthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, startAt: todayStr, endAt: monthLater.toISOString().split('T')[0] }));
      toast.success('Duration set to 1 Month (30 Days)');
    } else if (preset === 'PERMANENT') {
      setFormData(prev => ({ ...prev, startAt: todayStr, endAt: '' }));
      toast.success('Duration set to Permanent / Lifetime');
    }
  };

  const handleOpenEditModal = (coupon: any) => {
    fetchDependencies();
    setEditingCoupon(coupon);
    setProductSearch('');
    setCategorySearch('');
    setBundleSearch('');
    setCustomerSearch('');
    setCustomEmailInput('');
    setShowExcludedProducts(false);

    let ep: string[] = [], exp: string[] = [], ec: string[] = [], ecs: string[] = [], eb: string[] = [];
    try {
      if (coupon.eligibleProducts) ep = typeof coupon.eligibleProducts === 'string' ? JSON.parse(coupon.eligibleProducts) : coupon.eligibleProducts;
    } catch {
      if (coupon.eligibleProducts) ep = String(coupon.eligibleProducts).split(',').map((s: string) => s.trim());
    }
    try {
      if (coupon.excludedProducts) exp = typeof coupon.excludedProducts === 'string' ? JSON.parse(coupon.excludedProducts) : coupon.excludedProducts;
    } catch {
      if (coupon.excludedProducts) exp = String(coupon.excludedProducts).split(',').map((s: string) => s.trim());
    }
    try {
      if (coupon.eligibleCategories) ec = typeof coupon.eligibleCategories === 'string' ? JSON.parse(coupon.eligibleCategories) : coupon.eligibleCategories;
    } catch {
      if (coupon.eligibleCategories) ec = String(coupon.eligibleCategories).split(',').map((s: string) => s.trim());
    }
    try {
      if (coupon.eligibleCustomerSegments) ecs = typeof coupon.eligibleCustomerSegments === 'string' ? JSON.parse(coupon.eligibleCustomerSegments) : coupon.eligibleCustomerSegments;
    } catch {
      if (coupon.eligibleCustomerSegments) ecs = String(coupon.eligibleCustomerSegments).split(',').map((s: string) => s.trim());
    }
    try {
      if (coupon.eligibleBundles) eb = typeof coupon.eligibleBundles === 'string' ? JSON.parse(coupon.eligibleBundles) : coupon.eligibleBundles;
    } catch {
      if (coupon.eligibleBundles) eb = String(coupon.eligibleBundles).split(',').map((s: string) => s.trim());
    }

    setFormData({
      code: coupon.code,
      internalName: coupon.internalName || coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType || 'PERCENTAGE',
      discountValue: coupon.discountValue || 0,
      maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '',
      currency: coupon.currency || 'INR',
      minOrderValue: coupon.minOrderValue || 0,
      eligibleProducts: Array.isArray(ep) ? ep : [],
      excludedProducts: Array.isArray(exp) ? exp : [],
      eligibleCategories: Array.isArray(ec) ? ec : [],
      eligibleCustomerSegments: Array.isArray(ecs) ? ecs : [],
      eligibleBundles: Array.isArray(eb) ? eb : [],
      freeProductId: coupon.freeProductId || '',
      affiliateId: coupon.affiliateId || '',
      commissionRate: coupon.commissionRate ? String(coupon.commissionRate) : '',
      startAt: coupon.startAt ? new Date(coupon.startAt).toISOString().split('T')[0] : '',
      endAt: coupon.endAt ? new Date(coupon.endAt).toISOString().split('T')[0] : '',
      totalUsageLimit: coupon.totalUsageLimit ? String(coupon.totalUsageLimit) : '',
      perCustomerLimit: coupon.perCustomerLimit || 1,
      stackingPolicy: coupon.stackingPolicy || 'EXCLUSIVE',
      internalNote: coupon.internalNote || '',
      status: coupon.status || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (formData.status === 'SCHEDULED' && !formData.startAt) {
      toast.error('Schedule date (Start Date) is required for scheduled coupons');
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
      if (editingCoupon) {
        const res = await axios.put(`/api/admin/coupons/admin/${editingCoupon.id}`, formData, {
          headers: getHeaders()
        });
        if (res.data.success) {
          toast.success('Coupon updated successfully');
          setIsModalOpen(false);
          fetchCouponsData();
        }
      } else {
        const res = await axios.post('/api/admin/coupons/admin', formData, {
          headers: getHeaders()
        });
        if (res.data.success) {
          toast.success('Coupon created successfully');
          setIsModalOpen(false);
          fetchCouponsData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleStatusChange = async (couponId: string, newStatus: string) => {
    try {
      const res = await axios.post(`/api/admin/coupons/admin/${couponId}/status`, { status: newStatus }, {
        headers: getHeaders()
      });
      if (res.data.success) {
        toast.success(`Coupon status changed to ${newStatus}`);
        fetchCouponsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const exportCouponsCSV = () => {
    const rows = coupons.map(c => ({
      Code: c.code,
      Name: c.internalName,
      Type: c.discountType,
      Value: c.discountValue,
      MaxDiscount: c.maxDiscountAmount || 'N/A',
      MinOrder: c.minOrderValue || 0,
      UsedCount: c.usedCount,
      Limit: c.totalUsageLimit || 'Unlimited',
      Status: c.status,
      Expiry: c.endAt ? new Date(c.endAt).toLocaleDateString() : 'None'
    }));

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kdw_coupons_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupons & Promo Codes</h1>
              <p className="text-sm text-slate-500">Manage discounts, first-order bonuses, segment rules, and abuse prevention.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'REDEMPTIONS') fetchRedemptions();
              else if (activeTab === 'ABUSE') fetchAbuseLogs();
              else fetchCouponsData();
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCouponsCSV}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition flex items-center gap-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'ALL' ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Coupons</span>
            <Tag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalCoupons}</div>
          <div className="text-xs text-slate-400 mt-1">All registered codes</div>
        </div>

        <div
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'ACTIVE' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.activeCoupons}</div>
          <div className="text-xs text-emerald-700 mt-1">Ready for checkout</div>
        </div>

        <div
          onClick={() => setActiveTab('SCHEDULED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'SCHEDULED' ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Scheduled</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{kpis.scheduledCoupons}</div>
          <div className="text-xs text-blue-700 mt-1">Upcoming promotions</div>
        </div>

        <div
          onClick={() => setActiveTab('EXPIRED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'EXPIRED' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Expired</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{kpis.expiredCoupons}</div>
          <div className="text-xs text-amber-700 mt-1">Past validity window</div>
        </div>

        <div
          onClick={() => setActiveTab('DISABLED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'DISABLED' ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Disabled</span>
            <Slash className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{kpis.disabledCoupons}</div>
          <div className="text-xs text-rose-700 mt-1">Paused / Inactive</div>
        </div>

        <div
          onClick={() => setActiveTab('REDEMPTIONS')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'REDEMPTIONS' ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Uses Today</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{kpis.redemptionsToday}</div>
          <div className="text-xs text-purple-700 mt-1">Redemptions recorded</div>
        </div>

        <div
          onClick={() => setActiveTab('REPORTS')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'REPORTS' ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Discount Total</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600 mt-2">₹{kpis.totalDiscountGiven.toLocaleString('en-IN')}</div>
          <div className="text-xs text-teal-700 mt-1">Total customer savings</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Coupons', icon: Tag },
          { id: 'ACTIVE', label: 'Active Coupons', icon: CheckCircle },
          { id: 'SCHEDULED', label: 'Scheduled', icon: Clock },
          { id: 'EXPIRED', label: 'Expired', icon: AlertTriangle },
          { id: 'DISABLED', label: 'Disabled', icon: Slash },
          { id: 'REDEMPTIONS', label: 'Coupon Redemptions', icon: TrendingUp },
          { id: 'ABUSE', label: 'Coupon Abuse Monitor', icon: ShieldAlert },
          { id: 'REPORTS', label: 'Coupon Reports', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar (Coupons View) */}
      {activeTab !== 'REDEMPTIONS' && activeTab !== 'ABUSE' && activeTab !== 'REPORTS' && (
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, internal name, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Discount Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed (₹)</option>
              <option value="FIRST_ORDER">First Order Only</option>
              <option value="PRODUCT_SPECIFIC">Product Specific</option>
              <option value="CATEGORY_SPECIFIC">Category Specific</option>
              <option value="BUNDLE_SPECIFIC">Bundle Specific</option>
              <option value="CUSTOMER_SEGMENT">Customer Segment</option>
              <option value="AFFILIATE">Affiliate / Referral</option>
              <option value="FREE_PRODUCT">Free Product Add-on</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'REDEMPTIONS' ? (
        /* Redemptions Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Real-time Coupon Redemption Ledger</h3>
            <span className="text-xs text-slate-500">Showing {redemptions.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Coupon Code</th>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Customer / Email</th>
                  <th className="px-5 py-3.5">Discount Saved</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Redeemed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {redemptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No coupon redemptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  redemptions.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-mono font-semibold text-indigo-600">{r.coupon?.code || 'N/A'}</td>
                      <td className="px-5 py-4 font-mono text-slate-900">{r.order?.orderNumber || 'Pending / Reserved'}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">{r.customer?.name || 'Guest'}</div>
                        <div className="text-xs text-slate-400">{r.guestEmail || r.customer?.email}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-600">₹{r.discountAmount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'REDEEMED' ? 'bg-emerald-100 text-emerald-700' :
                          r.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' :
                          r.status === 'REVERSED' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {r.redeemedAt ? new Date(r.redeemedAt).toLocaleString('en-IN') : new Date(r.reservedAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'ABUSE' ? (
        /* Abuse Logs Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-sm">Coupon Abuse & Rapid Submission Monitor</h3>
            </div>
            <span className="text-xs text-rose-600 font-medium">{abuseLogs.length} Flagged Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Coupon</th>
                  <th className="px-5 py-3.5">Abuse Type</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {abuseLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No abusive patterns detected. Coupon system is operating securely.
                    </td>
                  </tr>
                ) : (
                  abuseLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{log.coupon?.code}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{log.abuseType}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          log.severity === 'BLOCKED' ? 'bg-rose-100 text-rose-700' :
                          log.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{log.details || 'Rapid submission burst detected'}</td>
                      <td className="px-5 py-4 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'REPORTS' ? (
        /* Reports View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Top Performing Coupons</h3>
            <div className="space-y-3">
              {coupons.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <div className="font-mono font-bold text-indigo-600">{c.code}</div>
                    <div className="text-xs text-slate-500">{c.internalName} ({c.discountType})</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{c.usedCount} redemptions</div>
                    <div className="text-xs text-emerald-600">Active Campaign</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Discount Policy & Stacking Defaults</h3>
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-sm text-indigo-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <span>Deterministic Stacking Rules</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                By default, KDW enforces <strong>one coupon per order</strong> with automatic bundle discount precedence. Stacking is strictly evaluated server-side and never depends on database insertion order.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={exportCouponsCSV}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Coupon Audit Report</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Coupons List Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Code & Name</th>
                  <th className="px-5 py-3.5">Type & Value</th>
                  <th className="px-5 py-3.5">Usage / Limit</th>
                  <th className="px-5 py-3.5">Min Order</th>
                  <th className="px-5 py-3.5">Validity Window</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No coupons found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon: any) => (
                    <tr key={coupon.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-600 text-base">{coupon.code}</span>
                          {coupon.discountType === 'FIRST_ORDER' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              1st Order
                            </span>
                          )}
                          {coupon.discountType === 'PRODUCT_SPECIFIC' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              <Tag className="w-2.5 h-2.5" /> Product
                            </span>
                          )}
                          {coupon.discountType === 'CATEGORY_SPECIFIC' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Layers className="w-2.5 h-2.5" /> Category
                            </span>
                          )}
                          {coupon.discountType === 'BUNDLE_SPECIFIC' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              <Package className="w-2.5 h-2.5" /> Bundle
                            </span>
                          )}
                          {coupon.discountType === 'CUSTOMER_SEGMENT' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                              <Users className="w-2.5 h-2.5" /> Segment
                            </span>
                          )}
                          {coupon.discountType === 'FREE_PRODUCT' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                              <Gift className="w-2.5 h-2.5" /> Free Gift
                            </span>
                          )}
                          {coupon.discountType === 'AFFILIATE' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              <UserCheck className="w-2.5 h-2.5" /> Affiliate
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{coupon.internalName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` :
                           coupon.discountType === 'FIXED' ? `₹${coupon.discountValue} FLAT` :
                           coupon.discountType === 'FIRST_ORDER' ? `${coupon.discountValue}% 1st Order` :
                           coupon.discountType === 'FREE_PRODUCT' ? 'FREE GIFT BONUS' :
                           coupon.discountType === 'PRODUCT_SPECIFIC' ? `${coupon.discountValue}% Specific Item` :
                           coupon.discountType === 'CATEGORY_SPECIFIC' ? `${coupon.discountValue}% Category Item` :
                           coupon.discountType === 'BUNDLE_SPECIFIC' ? `₹${coupon.discountValue} Bundle Off` :
                           coupon.discountType === 'CUSTOMER_SEGMENT' ? `${coupon.discountValue}% VIP Segment` :
                           coupon.discountType === 'AFFILIATE' ? `${coupon.discountValue}% Partner Promo` :
                           `${coupon.discountValue} (${coupon.discountType})`}
                        </div>
                        {coupon.maxDiscountAmount && (
                          <div className="text-xs text-slate-400">Max ₹{coupon.maxDiscountAmount}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {coupon.usedCount} <span className="text-xs text-slate-400 font-normal">/ {coupon.totalUsageLimit ? coupon.totalUsageLimit : '∞'}</span>
                        </div>
                        <div className="text-xs text-slate-400">{coupon.perCustomerLimit || 1} per customer</div>
                      </td>
                      <td className="px-5 py-4 text-slate-800 font-medium">
                        {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : '₹0'}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {!coupon.endAt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                            Permanent / Lifetime
                          </span>
                        ) : (() => {
                          const startMs = coupon.startAt ? new Date(coupon.startAt).getTime() : new Date(coupon.createdAt).getTime();
                          const endMs = new Date(coupon.endAt).getTime();
                          const spanDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
                          const daysLeft = Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)));
                          const isWeek = spanDays <= 8;
                          const isMonth = spanDays <= 32;

                          return (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                                isWeek ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                isMonth ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                'bg-purple-100 text-purple-800 border border-purple-300'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {isWeek ? '1 Week Limited' : isMonth ? '1 Month Limited' : 'Limited'} ({daysLeft}d left)
                              </span>
                              <div className="text-[11px] text-slate-400">
                                {coupon.startAt ? new Date(coupon.startAt).toLocaleDateString() : 'Now'} → {new Date(coupon.endAt).toLocaleDateString()}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          coupon.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          coupon.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          coupon.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                          coupon.status === 'EXHAUSTED' ? 'bg-purple-100 text-purple-700' :
                          coupon.status === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {coupon.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(coupon)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition"
                          title="Edit Coupon"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {coupon.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(coupon.id, 'PAUSED')}
                            className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition"
                            title="Pause Coupon"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(coupon.id, 'ACTIVE')}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded transition"
                            title="Activate Coupon"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(coupon.id, 'DISABLED')}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition"
                          title="Disable Coupon"
                        >
                          <Slash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCoupon ? `Edit Coupon (${editingCoupon.code})` : 'Create New Coupon'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE20"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Internal Name</label>
                  <input
                    type="text"
                    value={formData.internalName}
                    onChange={e => setFormData({ ...formData, internalName: e.target.value })}
                    placeholder="e.g. Monsoon 20% Off"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={e => {
                      const newType = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        discountType: newType,
                        perCustomerLimit: newType === 'FIRST_ORDER' ? 1 : prev.perCustomerLimit
                      }));
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="FIRST_ORDER">First Order Only (%)</option>
                    <option value="PRODUCT_SPECIFIC">Product Specific</option>
                    <option value="CATEGORY_SPECIFIC">Category Specific</option>
                    <option value="BUNDLE_SPECIFIC">Bundle Specific</option>
                    <option value="CUSTOMER_SEGMENT">Customer Segment</option>
                    <option value="AFFILIATE">Affiliate / Referral</option>
                    <option value="FREE_PRODUCT">Free Product Add-on</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Value *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    placeholder="No Cap"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* First Order Strict Verification Notice */}
              {formData.discountType === 'FIRST_ORDER' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Verified First-Order Protection Active:</span>
                    <p className="mt-0.5 text-amber-800">
                      This offer is strictly restricted to verified first-time buyers with 0 prior paid purchases across both account ID and email address. Single-use constraint (1 per customer) is enforced automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. PRODUCT SPECIFIC TARGETING */}
              {formData.discountType === 'PRODUCT_SPECIFIC' && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      Eligible Products ({formData.eligibleProducts.length} Selected) *
                    </label>
                    <span className="text-[11px] text-slate-500">Only selected items receive discount</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search products by title or ID..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = availableProducts.filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()));
                        const allIds = Array.from(new Set([...formData.eligibleProducts, ...filtered.map(p => p.id)]));
                        setFormData(prev => ({ ...prev, eligibleProducts: allIds }));
                      }}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
                    >
                      Select Filtered
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, eligibleProducts: [] }))}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                    {availableProducts
                      .filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
                      .map(p => {
                        const isChecked = formData.eligibleProducts.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItemInArray('eligibleProducts', p.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-medium text-slate-800">{p.name}</span>
                              {p.category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                                  {p.category.name || p.category}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-indigo-700">₹{p.price}</span>
                          </label>
                        );
                      })}
                    {availableProducts.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400">No products loaded.</div>
                    )}
                  </div>

                  {/* Collapsible Excluded Products */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowExcludedProducts(!showExcludedProducts)}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                    >
                      {showExcludedProducts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>Optional: Exclude Specific Products ({formData.excludedProducts.length} Excluded)</span>
                    </button>
                    {showExcludedProducts && (
                      <div className="mt-2 max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                        {availableProducts.map(p => {
                          const isExcluded = formData.excludedProducts.includes(p.id);
                          return (
                            <label key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isExcluded}
                                  onChange={() => toggleItemInArray('excludedProducts', p.id)}
                                  className="rounded text-rose-600 focus:ring-rose-500"
                                />
                                <span className="font-medium text-slate-700">{p.name}</span>
                              </div>
                              <span className="text-[10px] text-rose-600 font-bold">{isExcluded ? 'EXCLUDED' : ''}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. CATEGORY SPECIFIC TARGETING */}
              {formData.discountType === 'CATEGORY_SPECIFIC' && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      Eligible Categories ({formData.eligibleCategories.length} Selected) *
                    </label>
                    <span className="text-[11px] text-slate-500">Applies to items & subcategories</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = availableCategories.filter(c => (c.name || '').toLowerCase().includes(categorySearch.toLowerCase()));
                        const allIds = Array.from(new Set([...formData.eligibleCategories, ...filtered.map(c => c.id)]));
                        setFormData(prev => ({ ...prev, eligibleCategories: allIds }));
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
                    >
                      Select Filtered
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, eligibleCategories: [] }))}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                    {availableCategories
                      .filter(c => (c.name || '').toLowerCase().includes(categorySearch.toLowerCase()))
                      .map(c => {
                        const isChecked = formData.eligibleCategories.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItemInArray('eligibleCategories', c.id)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-medium text-slate-800">{c.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{c.slug || c.id.slice(0, 8)}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 3. BUNDLE SPECIFIC TARGETING */}
              {formData.discountType === 'BUNDLE_SPECIFIC' && (
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-600" />
                      Eligible Bundle Packages ({formData.eligibleBundles.length} Selected)
                    </label>
                    <span className="text-[11px] text-slate-500">Leave empty to allow all bundles</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search bundle packages..."
                        value={bundleSearch}
                        onChange={e => setBundleSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = availableBundles.filter(b => (b.name || b.title || '').toLowerCase().includes(bundleSearch.toLowerCase()));
                        const allIds = Array.from(new Set([...formData.eligibleBundles, ...filtered.map(b => b.id)]));
                        setFormData(prev => ({ ...prev, eligibleBundles: allIds }));
                      }}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
                    >
                      Select Filtered
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, eligibleBundles: [] }))}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                    {availableBundles
                      .filter(b => (b.name || b.title || '').toLowerCase().includes(bundleSearch.toLowerCase()))
                      .map(b => {
                        const isChecked = formData.eligibleBundles.includes(b.id);
                        return (
                          <label key={b.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItemInArray('eligibleBundles', b.id)}
                                className="rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span className="font-medium text-slate-800">{b.name || b.title}</span>
                              {b.products && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                                  {b.products.length} Items
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-purple-700">₹{b.price}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 4. CUSTOMER SEGMENT TARGETING */}
              {formData.discountType === 'CUSTOMER_SEGMENT' && (
                <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      Target Customer Segments & Users ({formData.eligibleCustomerSegments.length} Targets)
                    </label>
                    <span className="text-[11px] text-slate-500">Only matching customers can apply</span>
                  </div>

                  {/* Preset Segment Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 uppercase">Quick Segment Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'VIP Customers', value: 'VIP' },
                        { label: 'Returning Customers', value: 'RETURNING_CUSTOMERS' },
                        { label: 'New Buyers (0 Orders)', value: 'NEW_CUSTOMERS' },
                        { label: 'High Value (₹5k+)', value: 'HIGH_VALUE' },
                        { label: 'Agency Accounts', value: 'AGENCY' }
                      ].map(seg => {
                        const isSelected = formData.eligibleCustomerSegments.includes(seg.value);
                        return (
                          <button
                            key={seg.value}
                            type="button"
                            onClick={() => toggleItemInArray('eligibleCustomerSegments', seg.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{seg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Direct Guest/Customer Email */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase">Target Specific Email:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        placeholder="e.g. vip@client.com or user@domain.com"
                        value={customEmailInput}
                        onChange={e => setCustomEmailInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomEmail(); } }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomEmail()}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
                      >
                        Add Email
                      </button>
                    </div>
                  </div>

                  {/* Active Targets Chips */}
                  {formData.eligibleCustomerSegments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.eligibleCustomerSegments.map(target => (
                        <span key={target} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                          {target}
                          <button
                            type="button"
                            onClick={() => toggleItemInArray('eligibleCustomerSegments', target)}
                            className="hover:text-rose-600 ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Registered Users List */}
                  {availableUsers.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">Registered Customers List:</span>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Filter registered users..."
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                        {availableUsers
                          .filter(u => (u.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(customerSearch.toLowerCase()))
                          .map(u => {
                            const isChecked = formData.eligibleCustomerSegments.includes(u.email) || formData.eligibleCustomerSegments.includes(u.id);
                            return (
                              <label key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleItemInArray('eligibleCustomerSegments', u.email || u.id)}
                                    className="rounded text-sky-600 focus:ring-sky-500"
                                  />
                                  <span className="font-medium text-slate-800">{u.name}</span>
                                  <span className="text-slate-400 font-mono">({u.email})</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">{u.role}</span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. FREE PRODUCT ADD-ON SELECTOR */}
              {formData.discountType === 'FREE_PRODUCT' && (
                <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-teal-600" />
                      Free Promotional Gift Asset *
                    </label>
                    <span className="text-[11px] text-teal-700 font-medium">100% Free Add-On</span>
                  </div>

                  <div>
                    <select
                      value={formData.freeProductId}
                      onChange={e => setFormData({ ...formData, freeProductId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      <option value="">-- Choose complimentary free gift product --</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Value: ₹{p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    When this coupon code is redeemed, the selected digital product is automatically unlocked as a complimentary bonus gift at checkout.
                  </p>
                </div>
              )}

              {/* 6. AFFILIATE / REFERRAL SETTINGS */}
              {formData.discountType === 'AFFILIATE' && (
                <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                      Affiliate Partner & Referral Details
                    </label>
                    <span className="text-[11px] text-slate-500">Track partner performance</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Affiliate Partner ID / Tag *</label>
                      <input
                        type="text"
                        required
                        value={formData.affiliateId}
                        onChange={e => setFormData({ ...formData, affiliateId: e.target.value })}
                        placeholder="e.g. AFF_PARTNER_01"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.commissionRate}
                        onChange={e => setFormData({ ...formData, commissionRate: e.target.value })}
                        placeholder="e.g. 15 for 15%"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Row 3: Minimum Order & Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    value={formData.totalUsageLimit}
                    onChange={e => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Per Customer Limit {formData.discountType === 'FIRST_ORDER' && '(Locked to 1)'}
                  </label>
                  <input
                    type="number"
                    disabled={formData.discountType === 'FIRST_ORDER'}
                    value={formData.perCustomerLimit}
                    onChange={e => setFormData({ ...formData, perCustomerLimit: parseInt(e.target.value, 10) || 1 })}
                    className={`w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 ${formData.discountType === 'FIRST_ORDER' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Duration Quick-Presets */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Coupon Duration Presets
                  </label>
                  <span className="text-[11px] text-slate-500">Quickly apply standard validity windows</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyDurationPreset('WEEK')}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    1 Week Limited
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDurationPreset('MONTH')}
                    className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    1 Month Limited
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDurationPreset('PERMANENT')}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Permanent / No Expiry
                  </button>
                </div>
              </div>

              {/* Row 4: Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startAt}
                    onChange={e => setFormData({ ...formData, startAt: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date (Optional for Permanent)</label>
                  <input
                    type="date"
                    value={formData.endAt}
                    onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
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
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DRAFT">Draft</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
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
                    formData.status === 'ACTIVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : formData.status === 'SCHEDULED'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : formData.status === 'PAUSED'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : formData.status === 'DRAFT'
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingCoupon
                    ? 'Save Changes'
                    : formData.status === 'ACTIVE'
                    ? 'Create Active Coupon'
                    : formData.status === 'SCHEDULED'
                    ? 'Schedule Coupon'
                    : formData.status === 'PAUSED'
                    ? 'Create Paused Coupon'
                    : formData.status === 'DRAFT'
                    ? 'Save as Draft'
                    : 'Create Disabled Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
