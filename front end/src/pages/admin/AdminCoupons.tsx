import { useState, useEffect, useMemo } from 'react';
import {
  Tag, Plus, Search, Filter, RefreshCw, Download, CheckCircle, Clock,
  AlertTriangle, Slash, ShieldAlert, FileText, ChevronRight, Eye, Edit,
  TrendingUp, Users, DollarSign, Calendar, Lock, X
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
      const [prodRes, catRes, bunRes] = await Promise.all([
        axios.get('/api/products').catch(() => ({ data: { products: [] } })),
        axios.get('/api/categories').catch(() => ({ data: { categories: [] } })),
        axios.get('/api/bundles').catch(() => ({ data: { bundles: [] } }))
      ]);
      setAvailableProducts(prodRes.data?.products || prodRes.data || []);
      setAvailableCategories(catRes.data?.categories || catRes.data || []);
      setAvailableBundles(bunRes.data?.bundles || bunRes.data || []);
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

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
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
      startAt: '',
      endAt: '',
      totalUsageLimit: '',
      perCustomerLimit: 1,
      stackingPolicy: 'EXCLUSIVE',
      internalNote: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    let ep = [], exp = [], ec = [], ecs = [], eb = [];
    try {
      if (coupon.eligibleProducts) ep = JSON.parse(coupon.eligibleProducts);
      if (coupon.excludedProducts) exp = JSON.parse(coupon.excludedProducts);
      if (coupon.eligibleCategories) ec = JSON.parse(coupon.eligibleCategories);
      if (coupon.eligibleCustomerSegments) ecs = JSON.parse(coupon.eligibleCustomerSegments);
      if (coupon.eligibleBundles) eb = JSON.parse(coupon.eligibleBundles);
    } catch {
      if (coupon.eligibleProducts) ep = coupon.eligibleProducts.split(',');
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
      eligibleProducts: ep,
      excludedProducts: exp,
      eligibleCategories: ec,
      eligibleCustomerSegments: ecs,
      eligibleBundles: eb,
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
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
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
                        <div className="font-mono font-bold text-indigo-600 text-base">{coupon.code}</div>
                        <div className="text-xs text-slate-500 font-medium">{coupon.internalName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` :
                           coupon.discountType === 'FIXED' ? `₹${coupon.discountValue} FLAT` :
                           coupon.discountType === 'FIRST_ORDER' ? `${coupon.discountValue}% 1st Order` :
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
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {coupon.startAt ? new Date(coupon.startAt).toLocaleDateString() : 'Immediate'}
                        {' → '}
                        {coupon.endAt ? new Date(coupon.endAt).toLocaleDateString() : 'No expiry'}
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
                    onChange={e => setFormData({ ...formData, discountType: e.target.value })}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Per Customer Limit</label>
                  <input
                    type="number"
                    value={formData.perCustomerLimit}
                    onChange={e => setFormData({ ...formData, perCustomerLimit: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
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
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DRAFT">Draft</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Stacking Policy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stacking Policy</label>
                <select
                  value={formData.stackingPolicy}
                  onChange={e => setFormData({ ...formData, stackingPolicy: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EXCLUSIVE">Exclusive (No other coupons or promotions)</option>
                  <option value="COMBINABLE_WITH_OFFERS">Combinable with Storefront Offers</option>
                  <option value="HIGHEST_DISCOUNT">Highest Discount Wins</option>
                  <option value="BUNDLE_ONLY">Bundle Promotions Only</option>
                </select>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  {editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
