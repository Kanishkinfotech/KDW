import { useState, useEffect } from 'react';
import {
  Flame, Plus, Search, Filter, RefreshCw, Download, CheckCircle, Clock,
  AlertTriangle, Slash, ShieldAlert, FileText, ChevronRight, Eye, Edit,
  TrendingUp, Package, Sparkles, AlertCircle, DollarSign, X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminOffers() {
  // Sub-Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'ACTIVE' | 'SCHEDULED' | 'FLASH_SALES' | 'BUNDLE_OFFERS' | 'FIRST_ORDER' | 'CUSTOMER_SPECIFIC' | 'PERFORMANCE'
  >('ALL');

  const [offers, setOffers] = useState<any[]>([]);
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
    bundleId: '',
    priority: 1,
    stackingPolicy: 'EXCLUSIVE',
    marginProtectionThreshold: '',
    bannerText: '',
    badgeText: 'HOT DEAL',
    displayPlacement: 'STOREFRONT_BANNER',
    startAt: '',
    endAt: '',
    status: 'ACTIVE'
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('adminAuth')}`
  });

  const fetchOffersData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/offers/admin', {
        headers: getHeaders(),
        params: {
          status: activeTab === 'ACTIVE' || activeTab === 'SCHEDULED' ? activeTab : 'ALL',
          offerType: activeTab === 'FLASH_SALES' ? 'FLASH_SALE' :
                     activeTab === 'BUNDLE_OFFERS' ? 'BUNDLE_OFFER' :
                     activeTab === 'FIRST_ORDER' ? 'FIRST_ORDER_OFFER' :
                     activeTab === 'CUSTOMER_SPECIFIC' ? 'CUSTOMER_SPECIFIC_OFFER' : typeFilter,
          search: searchTerm
        }
      });
      if (res.data.success) {
        setOffers(res.data.offers || []);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err: any) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersData();
  }, [activeTab, typeFilter, searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingOffer(null);
    setConflicts([]);
    setFormData({
      name: '',
      internalTitle: '',
      description: '',
      offerType: 'PRODUCT_DISCOUNT',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      maxDiscountAmount: '',
      minOrderValue: 0,
      productIds: [],
      categoryIds: [],
      bundleId: '',
      priority: 1,
      stackingPolicy: 'EXCLUSIVE',
      marginProtectionThreshold: '',
      bannerText: '',
      badgeText: 'HOT DEAL',
      displayPlacement: 'STOREFRONT_BANNER',
      startAt: '',
      endAt: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: any) => {
    setEditingOffer(offer);
    setConflicts([]);
    let pIds = [], cIds = [];
    try {
      if (offer.productIds) pIds = JSON.parse(offer.productIds);
      if (offer.categoryIds) cIds = JSON.parse(offer.categoryIds);
    } catch {
      if (offer.productIds) pIds = offer.productIds.split(',');
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
      bundleId: offer.bundleId || '',
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
    setIsModalOpen(true);
  };

  const checkConflicts = async () => {
    try {
      const res = await axios.post('/api/admin/offers/conflicts', {
        productIds: formData.productIds,
        startAt: formData.startAt ? new Date(formData.startAt) : null,
        endAt: formData.endAt ? new Date(formData.endAt) : null,
        currentOfferId: editingOffer?.id
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

  const exportOffersCSV = () => {
    const rows = offers.map(o => ({
      Name: o.name,
      Type: o.offerType,
      Discount: `${o.discountValue}${o.discountType === 'PERCENTAGE' ? '%' : '₹'}`,
      Priority: o.priority,
      Views: o.viewCount,
      Clicks: o.clickCount,
      Orders: o.orderCount,
      Revenue: o.revenueGenerated,
      Status: o.status,
      Start: o.startAt ? new Date(o.startAt).toLocaleDateString() : 'Immediate',
      End: o.endAt ? new Date(o.endAt).toLocaleDateString() : 'No expiry'
    }));

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kdw_offers_export_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Offers & Promotions</h1>
              <p className="text-sm text-slate-500">Manage flash sales, bundle deals, priority ladders, and real-time conflict rules.</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'ALL' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Offers</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalOffers}</div>
          <div className="text-xs text-slate-400 mt-1">All registered promos</div>
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
          <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.activeOffers}</div>
          <div className="text-xs text-emerald-700 mt-1">Live on storefront</div>
        </div>

        <div
          onClick={() => setActiveTab('FLASH_SALES')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'FLASH_SALES' ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Flash Sales</span>
            <Sparkles className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{kpis.flashSales}</div>
          <div className="text-xs text-rose-700 mt-1">Time-sensitive deals</div>
        </div>

        <div
          onClick={() => setActiveTab('BUNDLE_OFFERS')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'BUNDLE_OFFERS' ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Bundle Deals</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">{kpis.bundleOffers}</div>
          <div className="text-xs text-indigo-700 mt-1">Combo packs</div>
        </div>

        <div
          onClick={() => setActiveTab('PERFORMANCE')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'PERFORMANCE' ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Views / Clicks</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{kpis.totalViews} / {kpis.totalClicks}</div>
          <div className="text-xs text-blue-700 mt-1">Impression engagement</div>
        </div>

        <div
          onClick={() => setActiveTab('PERFORMANCE')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'PERFORMANCE' ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Orders</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{kpis.totalOrders}</div>
          <div className="text-xs text-purple-700 mt-1">Attributed conversions</div>
        </div>

        <div
          onClick={() => setActiveTab('PERFORMANCE')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'PERFORMANCE' ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Offer Revenue</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600 mt-2">₹{kpis.totalRevenue.toLocaleString('en-IN')}</div>
          <div className="text-xs text-teal-700 mt-1">Total revenue boosted</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Offers', icon: Flame },
          { id: 'ACTIVE', label: 'Active Offers', icon: CheckCircle },
          { id: 'SCHEDULED', label: 'Scheduled', icon: Clock },
          { id: 'FLASH_SALES', label: 'Flash Sales', icon: Sparkles },
          { id: 'BUNDLE_OFFERS', label: 'Bundle Deals', icon: Package },
          { id: 'FIRST_ORDER', label: 'First-Order Offers', icon: TrendingUp },
          { id: 'CUSTOMER_SPECIFIC', label: 'Customer Specific', icon: FileText },
          { id: 'PERFORMANCE', label: 'Offer Analytics', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
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
      {activeTab !== 'PERFORMANCE' && (
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
              <option value="FLASH_SALE">Flash Sale (Countdown)</option>
              <option value="BUNDLE_OFFER">Bundle Combination Offer</option>
              <option value="FIRST_ORDER_OFFER">First-Order Welcome Offer</option>
              <option value="CUSTOMER_SPECIFIC_OFFER">Customer Specific Offer</option>
              <option value="UPGRADE_OFFER">Product Upgrade Offer</option>
              <option value="CART_THRESHOLD_OFFER">Cart Threshold Offer</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content: Performance vs Offers List */}
      {activeTab === 'PERFORMANCE' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Offer Conversion Analytics</h3>
            <div className="space-y-4">
              {offers.slice(0, 6).map(o => {
                const ctr = o.viewCount > 0 ? ((o.clickCount / o.viewCount) * 100).toFixed(1) : '0';
                return (
                  <div key={o.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900">{o.name}</div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        {o.offerType}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 text-xs text-slate-600 gap-2 pt-1">
                      <div>Views: <strong>{o.viewCount}</strong></div>
                      <div>Clicks: <strong>{o.clickCount}</strong> ({ctr}% CTR)</div>
                      <div>Orders: <strong>{o.orderCount}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Deterministic Priority Resolution</h3>
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-sm text-amber-950 space-y-3">
              <div className="font-bold flex items-center gap-2 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>Price Precedence Order</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-amber-900 space-y-1.5 leading-relaxed font-medium">
                <li><strong>Priority 1: Product Direct Sales</strong> (Highest Specificity)</li>
                <li><strong>Priority 2: Bundle Combo Packages</strong></li>
                <li><strong>Priority 3: User Coupons & Promo Codes</strong></li>
                <li><strong>Priority 4: Cart-Level Threshold Discounts</strong></li>
              </ol>
              <p className="text-xs text-amber-800 pt-2 border-t border-amber-200/80">
                Overlapping products are automatically flagged by the margin protection engine to safeguard profit margins.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Offer Name & Badge</th>
                  <th className="px-5 py-3.5">Type & Discount</th>
                  <th className="px-5 py-3.5">Priority & Stacking</th>
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
                      No offers registered under current filter.
                    </td>
                  </tr>
                ) : (
                  offers.map((offer: any) => (
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
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} FLAT`}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{offer.offerType}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">Priority: {offer.priority}</div>
                        <div className="text-xs text-slate-400">{offer.stackingPolicy}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-700">
                          <strong>{offer.viewCount}</strong> views · <strong>{offer.clickCount}</strong> clicks
                        </div>
                        <div className="text-xs font-semibold text-emerald-600">
                          ₹{offer.revenueGenerated.toLocaleString('en-IN')} ({offer.orderCount} orders)
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {offer.startAt ? new Date(offer.startAt).toLocaleDateString() : 'Immediate'}
                        {' → '}
                        {offer.endAt ? new Date(offer.endAt).toLocaleDateString() : 'No expiry'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          offer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          offer.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          offer.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(offer)}
                          className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition"
                          title="Edit Offer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {offer.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(offer.id, 'PAUSED')}
                            className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition"
                            title="Pause Offer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(offer.id, 'ACTIVE')}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded transition"
                            title="Activate Offer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(offer.id, 'DISABLED')}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition"
                          title="Disable Offer"
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
                      <li key={i}>{c.message} (Existing Offer: <strong>{c.existingOfferName}</strong>)</li>
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
                    <option value="UPGRADE_OFFER">Product Upgrade Offer</option>
                    <option value="CART_THRESHOLD_OFFER">Cart Threshold Offer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
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
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 3: Priority & Stacking */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority Ladder</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1">1 - Product Direct (Highest)</option>
                    <option value="2">2 - Bundle Offers</option>
                    <option value="3">3 - Coupon Precedence</option>
                    <option value="4">4 - Cart Thresholds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stacking Policy</label>
                  <select
                    value={formData.stackingPolicy}
                    onChange={e => setFormData({ ...formData, stackingPolicy: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="EXCLUSIVE">Exclusive (No other discounts)</option>
                    <option value="COMBINABLE_WITH_COUPONS">Combinable with Coupons</option>
                    <option value="HIGHEST_DISCOUNT">Highest Discount Takes Precedence</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
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
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endAt}
                    onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DRAFT">Draft</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  {editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
