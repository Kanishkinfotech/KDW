import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Layers, Plus, Search, Edit2, Trash2, ShieldAlert, 
  Filter, Download, RefreshCw, Eye, Copy, Archive, CheckCircle2, 
  AlertTriangle, Clock, HardDrive, IndianRupee, ArrowUpDown, ExternalLink,
  ChevronLeft, ChevronRight, X, Sparkles, LineChart, Package, ShieldCheck,
  Tag, Calendar, AlertCircle, FileText, Send, Lock, RotateCcw, Star
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import axios from 'axios';
import apiClient from '../../api/apiClient';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/csvExport';

export default function AdminBundles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get('tab') || 'all';
  const currentStatusParam = searchParams.get('status') || 'ALL';

  const [bundles, setBundles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalBundles, setTotalBundles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(currentStatusParam);
  const [licenceFilter, setLicenceFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [featuredFilter, setFeaturedFilter] = useState('ALL');
  const [highRefundFilter, setHighRefundFilter] = useState('ALL');
  const [categories, setCategories] = useState<any[]>([]);

  // Selected Detail Modal / Support Action Modal / Archive Confirmation Modals
  const [selectedBundle, setSelectedBundle] = useState<any | null>(null);
  const [supportModalBundle, setSupportModalBundle] = useState<any | null>(null);
  const [supportAction, setSupportAction] = useState('RESET_DOWNLOAD_LIMIT');
  const [supportReason, setSupportReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Archive & Restore Confirmation State
  const [confirmArchiveBundle, setConfirmArchiveBundle] = useState<any | null>(null);
  const [confirmRestoreBundle, setConfirmRestoreBundle] = useState<any | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (currentStatusParam !== 'ALL') {
      setStatusFilter(currentStatusParam.toUpperCase());
    }
  }, [currentStatusParam]);

  useEffect(() => {
    if (currentTab === 'analytics') {
      fetchAnalytics();
    } else {
      fetchBundles();
    }
  }, [currentTab, statusFilter, licenceFilter, categoryFilter, featuredFilter, highRefundFilter, currentPage]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (e) {}
  };

  const fetchBundles = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/bundles', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter,
          licenceType: licenceFilter !== 'ALL' ? licenceFilter : undefined,
          categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          featured: featuredFilter === 'FEATURED' ? 'true' : undefined,
          highRefundRate: highRefundFilter === 'HIGH_REFUND' ? 'true' : undefined,
          page: currentPage,
          limit: 15
        }
      });

      if (res.data?.success) {
        setBundles(res.data.data);
        setTotalBundles(res.data.pagination?.total || res.data.data.length);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load bundles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/bundles/analytics/overview');
      if (res.data?.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (e) {}
    finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await apiClient.post(`/bundles/${id}/duplicate`, {});
      if (res.data?.success) {
        toast.success('Bundle duplicated as draft');
        fetchBundles();
      }
    } catch (error) {
      toast.error('Failed to duplicate bundle');
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean, title: string) => {
    try {
      const nextVal = !currentFeatured;
      await apiClient.put(`/bundles/${id}`, {
        featured: nextVal
      });
      toast.success(nextVal ? `★ "${title}" marked as Featured Bundle!` : `"${title}" removed from Featured.`);
      fetchBundles();
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleArchive = async (bundle: any) => {
    setIsActionPending(true);
    try {
      const res = await apiClient.post(`/bundles/${bundle.id}/archive`, {});
      toast.success(res.data?.message || `Bundle "${bundle.title}" archived successfully`);
      setConfirmArchiveBundle(null);
      fetchBundles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to archive bundle');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRestore = async (bundle: any) => {
    setIsActionPending(true);
    try {
      const res = await apiClient.post(`/bundles/${bundle.id}/restore`, {});
      toast.success(res.data?.message || `Bundle "${bundle.title}" restored to Active`);
      setConfirmRestoreBundle(null);
      fetchBundles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore bundle');
    } finally {
      setIsActionPending(false);
    }
  };

  const executeSupportAction = async () => {
    if (!supportModalBundle) return;
    setIsProcessingAction(true);
    try {
      const res = await apiClient.post('/bundles/support/override', {
        bundleId: supportModalBundle.id,
        actionType: supportAction,
        reason: supportReason
      });

      if (res.data?.success) {
        toast.success('Support override action applied');
        setSupportModalBundle(null);
        fetchBundles();
      }
    } catch (e) {
      toast.error('Failed to apply support override');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExportCSV = () => {
    const data = bundles.map(b => ({
      ID: b.id,
      Code: b.bundleCode || 'N/A',
      Title: b.title,
      Slug: b.slug,
      Price: b.price,
      CombinedValue: b.combinedValue || b.originalPrice,
      Discount: b.discount,
      DiscountPercent: `${b.discountPercent}%`,
      ProductsIncluded: b.componentCount || b.itemsIncluded,
      Licence: b.licenceType,
      Status: b.status,
      Sales: b.sales,
      Revenue: b.revenue,
      RefundRate: `${b.refundRate || 0}%`,
      CurrentVersion: b.currentVersion
    }));
    exportToCSV(data, 'kdw_bundles_export');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setLicenceFilter('ALL');
    setCategoryFilter('ALL');
    setFeaturedFilter('ALL');
    setHighRefundFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-20 text-xs">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-700 text-white flex items-center justify-center font-black shadow-md shadow-primary/25">
              <Layers size={16} />
            </div>
            <h1 className="text-xl font-black text-slate-900">Bundle Management System</h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Manage multi-product digital bundles, version releases, component snapshots, licensing, and analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-bold cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <Link 
            to="/admin/bundles/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shadow-md shadow-primary/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Bundle</span>
          </Link>
        </div>
      </div>

      {/* Main Sub-Navigation Tabs (Clause 2) */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 font-bold text-xs">
        {[
          { id: 'all', label: 'All Bundles', icon: Layers },
          { id: 'versions', label: 'Bundle Versions', icon: RefreshCw },
          { id: 'analytics', label: 'Bundle Analytics', icon: LineChart },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSearchParams({ tab: tab.id });
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALL BUNDLES TABLE VIEW */}
      {currentTab === 'all' && (
        <div className="space-y-4">
          {/* Quick Status Filter Tabs & Multi-Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            {/* Quick Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">View:</span>
              {[
                { id: 'ALL', label: 'All Bundles' },
                { id: 'ACTIVE', label: 'Live / Active' },
                { id: 'ARCHIVED', label: 'Archived' },
                { id: 'DRAFT', label: 'Drafts' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => { setStatusFilter(st.id); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                    statusFilter === st.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchBundles()}
                  placeholder="Search bundles by name, slug, code, or SKU..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchBundles}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                >
                  Search
                </button>
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 font-semibold">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter size={12} /> Filters:
              </span>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Published / Active</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              {/* Licence */}
              <select
                value={licenceFilter}
                onChange={(e) => setLicenceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Licence Types</option>
                <option value="PERSONAL">Personal</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="AGENCY">Agency</option>
              </select>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Featured */}
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Features</option>
                <option value="FEATURED">Homepage Featured Only</option>
              </select>


            </div>
          </div>

          {/* 16-Column All Bundles Table (Clause 3) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <th className="p-3 pl-4 font-extrabold">Bundle Name & Code</th>
                    <th className="p-3 font-extrabold text-center">Products</th>
                    <th className="p-3 font-extrabold text-center">Price / Value</th>
                    <th className="p-3 font-extrabold text-center">Discount</th>
                    <th className="p-3 font-extrabold text-center">Licence</th>
                    <th className="p-3 font-extrabold text-center">Version</th>
                    <th className="p-3 font-extrabold text-center">Sales & Revenue</th>
                    <th className="p-3 font-extrabold text-center">Delivery Health</th>
                    <th className="p-3 font-extrabold text-center">Status</th>
                    <th className="p-3 pr-4 text-right font-extrabold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        <RefreshCw className="animate-spin inline mr-2 text-primary" size={16} />
                        Loading catalog bundles...
                      </td>
                    </tr>
                  ) : bundles.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        No bundles found matching the filter query.
                      </td>
                    </tr>
                  ) : (
                    bundles.map(b => {
                      const isArchived = b.status === 'ARCHIVED';

                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          {/* Name & Code */}
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                {b.coverImage ? (
                                  <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                    {b.title?.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                                  {b.title}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] text-slate-400">{b.bundleCode || b.id.slice(0, 8)}</span>
                                  {b.featured && (
                                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">
                                      Featured
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Products Count */}
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-primary font-black font-mono rounded-lg border border-purple-200">
                              <Package size={11} /> {b.componentCount || b.itemsIncluded || 0}
                            </span>
                          </td>

                          {/* Price & Combined Value */}
                          <td className="p-3 text-center">
                            <span className="font-black text-slate-900 font-mono block">₹{b.price}</span>
                            <span className="text-[10px] text-slate-400 line-through font-mono">₹{b.combinedValue || b.originalPrice}</span>
                          </td>

                          {/* Discount */}
                          <td className="p-3 text-center">
                            <span className="text-emerald-700 font-black font-mono block">₹{b.discount}</span>
                            <span className="text-[9px] text-emerald-600 font-bold">({b.discountPercent}% OFF)</span>
                          </td>

                          {/* Licence */}
                          <td className="p-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                              {b.licenceType || 'PERSONAL'}
                            </span>
                          </td>

                          {/* Version */}
                          <td className="p-3 text-center font-mono font-bold text-slate-600">
                            v{b.currentVersion || '1.0.0'}
                          </td>

                          {/* Sales & Revenue */}
                          <td className="p-3 text-center">
                            <span className="font-bold text-slate-900 block font-mono">{b.sales || 0} Orders</span>
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">₹{b.revenue || 0}</span>
                          </td>

                          {/* Delivery Health */}
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              b.isDriveFullyConfigured 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <HardDrive size={10} /> {b.isDriveFullyConfigured ? 'Verified' : `${b.missingLinks} Missing`}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              b.status === 'ACTIVE' || b.status === 'PUBLISHED' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : b.status === 'DRAFT' 
                                ? 'bg-slate-100 text-slate-700' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3 pr-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`/bundles/${b.slug || b.id}`}
                                target="_blank"
                                rel="noreferrer"
                                title="View Bundle on Storefront"
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer inline-flex items-center"
                              >
                                <Eye size={14} />
                              </a>

                              {/* 1-Click Toggle Featured */}
                              <button
                                onClick={() => handleToggleFeatured(b.id, Boolean(b.featured), b.title)}
                                title={b.featured ? "Remove from Featured" : "Mark as Featured Bundle"}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  b.featured 
                                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50' 
                                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50/50'
                                }`}
                              >
                                <Star size={14} className={b.featured ? 'fill-amber-400' : ''} />
                              </button>

                              <Link
                                to={`/admin/bundles/edit/${b.id}`}
                                title="Edit Bundle Wizard"
                                className="p-1.5 text-slate-500 hover:text-primary hover:bg-purple-50 rounded-lg cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </Link>

                              <button
                                onClick={() => handleDuplicate(b.id)}
                                title="Duplicate as Draft"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                              >
                                <Copy size={14} />
                              </button>

                              {isArchived ? (
                                <button
                                  onClick={() => setConfirmRestoreBundle(b)}
                                  title="Restore Bundle to Active"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                >
                                  <RotateCcw size={12} />
                                  <span>Restore</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmArchiveBundle(b)}
                                  title="Archive this Bundle"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Archive size={12} />
                                  <span>Archive</span>
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

            {/* Pagination Footer */}
            <div className="p-3 px-5 border-t border-slate-100 flex items-center justify-between text-slate-500 font-medium">
              <span>Showing {bundles.length} of {totalBundles} bundles</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 3: BUNDLE VERSIONS MANAGER */}
      {currentTab === 'versions' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <RefreshCw size={16} className="text-primary" />
              <span>Bundle Release Versions & Customer Updates</span>
            </h2>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {bundles.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{b.title}</span>
                    <span className="text-slate-500 text-[11px]">Current Version: <strong className="text-primary font-mono">v{b.currentVersion || '1.0.0'}</strong> • Policy: {b.updatePolicy}</span>
                  </div>
                  <Link
                    to={`/admin/bundles/edit/${b.id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                  >
                    Release New Version &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* TAB 5: BUNDLE ANALYTICS DASHBOARD (Clauses 46 & 47) */}
      {currentTab === 'analytics' && analyticsData && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-slate-500 font-bold">Bundle Revenue</span>
              <span className="text-xl font-black text-slate-900 font-mono block">₹{analyticsData.summary?.bundleRevenue || 0}</span>
              <span className="text-[10px] text-emerald-700 font-bold">{analyticsData.summary?.bundleRevenueShare}% of total store sales</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-slate-500 font-bold">Bundle Orders</span>
              <span className="text-xl font-black text-primary font-mono block">{analyticsData.summary?.bundleOrdersCount || 0}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Average Order Value: ₹{analyticsData.summary?.averageOrderValue}</span>
            </div>
          </div>

          {/* Top Components Performance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-black text-slate-900 text-sm">Top Included Component Products</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {analyticsData.topComponents?.map((comp: any, idx: number) => (
                <div key={comp.productId} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <span className="font-bold text-slate-800">{comp.name}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-50 text-primary font-bold font-mono rounded-lg border border-purple-200">
                    Included in {comp.bundleCount} Bundles
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* Support Override Modal (Clause 45) */}
      {supportModalBundle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900 text-xs">
            <div className="p-4 px-6 bg-[#0B1120] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-amber-400" size={16} />
                <h3 className="text-sm font-black text-white">Support Staff Override: {supportModalBundle.title}</h3>
              </div>
              <button onClick={() => setSupportModalBundle(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Override Action</label>
                <select
                  value={supportAction}
                  onChange={(e) => setSupportAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-slate-50"
                >
                  <option value="RESET_DOWNLOAD_LIMIT">Reset Customer Download Limit</option>
                  <option value="EXTEND_ACCESS">Extend Access Expiration (+1 Year)</option>
                  <option value="REVOKE_ACCESS">Revoke Customer Access / Entitlement</option>
                  <option value="RESEND_DELIVERY_EMAIL">Trigger Fulfilment Email Resend</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Audit Reason / Ticket Number *</label>
                <input 
                  type="text" 
                  value={supportReason} 
                  onChange={(e) => setSupportReason(e.target.value)}
                  placeholder="e.g. Ticket #KDW-8492 - Customer requested link reset"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 font-bold">
              <button
                onClick={() => setSupportModalBundle(null)}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={executeSupportAction}
                disabled={isProcessingAction || !supportReason}
                className="px-5 py-2 rounded-xl text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
              >
                {isProcessingAction ? 'Applying...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {confirmArchiveBundle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                  <Archive size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-950">Archive Bundle</h3>
                  <p className="text-[11px] text-rose-600 font-medium">Remove bundle from storefront catalog</p>
                </div>
              </div>
              <button 
                onClick={() => !isActionPending && setConfirmArchiveBundle(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{confirmArchiveBundle.title}</span>
                  <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                    {confirmArchiveBundle.bundleCode || confirmArchiveBundle.id.slice(0, 8)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                  <span>Price: <strong className="text-slate-900 font-mono">₹{confirmArchiveBundle.price}</strong></span>
                  <span>Items: <strong className="text-slate-900 font-mono">{confirmArchiveBundle.itemsIncluded || confirmArchiveBundle.componentCount || 0} products</strong></span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px]">
                  <p className="font-bold">What happens when you archive this bundle?</p>
                  <ul className="list-disc pl-3.5 space-y-0.5 text-amber-800">
                    <li>This bundle will be immediately hidden from public storefront catalog and search.</li>
                    <li>New customers will not be able to purchase or add it to cart.</li>
                    <li>Existing customers who previously purchased will continue to have permanent entitlement access and downloads.</li>
                    <li>You can restore this bundle back to Active at any time.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 font-bold">
              <button
                type="button"
                onClick={() => setConfirmArchiveBundle(null)}
                disabled={isActionPending}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleArchive(confirmArchiveBundle)}
                disabled={isActionPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
              >
                {isActionPending ? <RefreshCw className="animate-spin" size={14} /> : <Archive size={14} />}
                <span>Archive Bundle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESTORE MODAL */}
      {confirmRestoreBundle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-900 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Restore Bundle to Active</h3>
                  <p className="text-[11px] text-emerald-700 font-medium">Publish bundle back to storefront</p>
                </div>
              </div>
              <button 
                onClick={() => !isActionPending && setConfirmRestoreBundle(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{confirmRestoreBundle.title}</span>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    {confirmRestoreBundle.bundleCode || confirmRestoreBundle.id.slice(0, 8)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                  <span>Price: <strong className="text-slate-900 font-mono">₹{confirmRestoreBundle.price}</strong></span>
                  <span>Items: <strong className="text-slate-900 font-mono">{confirmRestoreBundle.itemsIncluded || confirmRestoreBundle.componentCount || 0} products</strong></span>
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                Restoring this bundle will immediately change its status to <strong className="text-emerald-700 font-bold">ACTIVE</strong>. It will become visible on the public bundle catalog and accessible for checkout.
              </p>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 font-bold">
              <button
                type="button"
                onClick={() => setConfirmRestoreBundle(null)}
                disabled={isActionPending}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRestore(confirmRestoreBundle)}
                disabled={isActionPending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                {isActionPending ? <RefreshCw className="animate-spin" size={14} /> : <RotateCcw size={14} />}
                <span>Restore to Active</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
