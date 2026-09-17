import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Star, MessageSquare, Check, X, Search, Filter, ShieldAlert, Reply, AlertTriangle,
  RefreshCw, CheckCircle, Clock, Slash, ShieldCheck, Eye, EyeOff, Trash2, RotateCcw,
  ChevronRight, ThumbsUp, Package
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export type ReviewTab = 'PRODUCT_REVIEWS' | 'RATINGS' | 'PENDING' | 'REPORTED';

export default function AdminReviews() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path or search parameters
  const getActiveTab = (): ReviewTab => {
    if (location.pathname.endsWith('/ratings') || searchParams.get('tab') === 'RATINGS') {
      return 'RATINGS';
    }
    if (location.pathname.endsWith('/pending') || searchParams.get('tab') === 'PENDING' || searchParams.get('status') === 'PENDING') {
      return 'PENDING';
    }
    if (location.pathname.endsWith('/reported') || searchParams.get('tab') === 'REPORTED' || searchParams.get('status') === 'REPORTED') {
      return 'REPORTED';
    }
    return 'PRODUCT_REVIEWS';
  };

  const activeTab = getActiveTab();

  const [reviews, setReviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalReviews: 0,
    pendingModeration: 0,
    publishedReviews: 0,
    rejectedReviews: 0,
    reportedReviews: 0,
    verifiedPurchases: 0,
    averageRating: 5.0,
    totalPublishedCount: 0,
    histogram: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recommendationRate: 100,
    verifiedRate: 100,
    topProducts: []
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN'>('PUBLISHED');

  // Selected Review Drawer / Reply State
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Reject Modal State
  const [rejectModalReview, setRejectModalReview] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Violates review content guidelines');
  const [customRejectReason, setCustomRejectReason] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('adminAuth')}`
  });

  const changeTab = (tab: ReviewTab) => {
    if (tab === 'PRODUCT_REVIEWS') navigate('/admin/reviews');
    else if (tab === 'RATINGS') navigate('/admin/reviews/ratings');
    else if (tab === 'PENDING') navigate('/admin/reviews/pending');
    else if (tab === 'REPORTED') navigate('/admin/reviews/reported');
  };

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      let statusParam = 'PUBLISHED';
      if (activeTab === 'PENDING') statusParam = 'PENDING';
      else if (activeTab === 'REPORTED') statusParam = 'REPORTED';
      else if (activeTab === 'PRODUCT_REVIEWS') statusParam = productStatusFilter;
      else if (activeTab === 'RATINGS') statusParam = 'PUBLISHED';

      const res = await axios.get('/api/admin/reviews/admin', {
        headers: getHeaders(),
        params: {
          status: statusParam,
          verifiedOnly: verifiedOnly ? 'true' : 'false',
          rating: ratingFilter,
          search: searchTerm
        }
      });
      if (res.data.success) {
        setReviews(res.data.reviews || []);
        if (res.data.kpis) {
          setKpis((prev: any) => ({ ...prev, ...res.data.kpis }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/reviews/admin/reports', { headers: getHeaders() });
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REPORTED') {
      fetchReportsData();
      fetchReviewsData();
    } else {
      fetchReviewsData();
    }
  }, [activeTab, ratingFilter, searchTerm, verifiedOnly, productStatusFilter]);

  const handleModeration = async (reviewId: string, status: string, reason?: string) => {
    try {
      const res = await axios.post(`/api/admin/reviews/admin/${reviewId}/moderation`, {
        status,
        moderationReason: reason || undefined
      }, { headers: getHeaders() });

      if (res.data.success) {
        const statusLabel = status === 'PUBLISHED' ? 'Approved & Published to Storefront' : status;
        toast.success(`Review successfully marked as ${statusLabel}`);
        setRejectModalReview(null);
        setCustomRejectReason('');
        setSelectedReview(null);
        fetchReviewsData();
        if (activeTab === 'REPORTED') fetchReportsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating review moderation');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const res = await axios.delete(`/api/admin/reviews/admin/${reviewId}`, { headers: getHeaders() });
      if (res.data.success) {
        toast.success('Review permanently deleted');
        fetchReviewsData();
        if (activeTab === 'REPORTED') fetchReportsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting review');
    }
  };

  const handleSendStaffReply = async (reviewId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }
    try {
      const res = await axios.post(`/api/admin/reviews/admin/${reviewId}/reply`, {
        body: replyMessage.trim()
      }, { headers: getHeaders() });

      if (res.data.success) {
        toast.success('Official staff reply published to storefront');
        setReplyMessage('');
        setSelectedReview(null);
        fetchReviewsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error sending reply');
    }
  };

  const handleResolveReport = async (reportId: string, dismissReview: boolean) => {
    try {
      const res = await axios.post(`/api/admin/reviews/admin/reports/${reportId}/resolve`, {
        resolution: dismissReview ? 'Violation confirmed, review hidden from storefront' : 'Report inspected, review cleared as compliant',
        dismissReview
      }, { headers: getHeaders() });

      if (res.data.success) {
        toast.success(dismissReview ? 'Report resolved and review hidden from storefront' : 'Report dismissed, review kept live');
        fetchReportsData();
        fetchReviewsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error resolving report');
    }
  };

  // 4 Primary Sub-Navigation Tabs matching Image 2
  const NAV_TABS = [
    {
      id: 'PRODUCT_REVIEWS' as ReviewTab,
      label: 'Product Reviews',
      icon: MessageSquare,
      count: kpis.publishedReviews || 0,
      description: 'Active storefront reviews'
    },
    {
      id: 'RATINGS' as ReviewTab,
      label: 'Ratings',
      icon: Star,
      badge: `${kpis.averageRating || 5.0} ★`,
      description: 'Rating distribution & breakdown'
    },
    {
      id: 'PENDING' as ReviewTab,
      label: 'Pending Reviews',
      icon: Clock,
      count: kpis.pendingModeration ?? kpis.pendingReviews ?? 0,
      description: 'Awaiting admin approval'
    },
    {
      id: 'REPORTED' as ReviewTab,
      label: 'Reported Reviews',
      icon: AlertTriangle,
      count: (kpis.reportedReviews || 0) + (reports.length || 0),
      description: 'Flagged disputes & spam'
    }
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Management</h1>
              <p className="text-sm text-slate-500">
                Moderation queue, star ratings analytics, verified buyer badges, and instant storefront sync.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'REPORTED') fetchReportsData();
              fetchReviewsData();
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards (Strictly matching the 4 Options in Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Product Reviews Card */}
        <div
          onClick={() => changeTab('PRODUCT_REVIEWS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PRODUCT_REVIEWS'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Reviews</span>
            <div className="p-2 bg-blue-100/70 text-blue-700 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpis.publishedReviews || 0}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Live on storefront</span>
          </div>
        </div>

        {/* 2. Ratings Card */}
        <div
          onClick={() => changeTab('RATINGS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'RATINGS'
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ratings</span>
            <div className="p-2 bg-amber-100/80 text-amber-700 rounded-xl">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpis.averageRating || 5.0} ★</div>
          <div className="text-xs text-slate-500 mt-1">
            Across {kpis.totalPublishedCount || kpis.publishedReviews || 0} customer ratings
          </div>
        </div>

        {/* 3. Pending Reviews Card */}
        <div
          onClick={() => changeTab('PENDING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {kpis.pendingModeration ?? kpis.pendingReviews ?? 0}
          </div>
          <div className="text-xs text-amber-700 font-semibold mt-1">
            {(kpis.pendingModeration ?? kpis.pendingReviews ?? 0) > 0 ? 'Awaiting admin approval' : 'Moderation queue clean'}
          </div>
        </div>

        {/* 4. Reported Reviews Card */}
        <div
          onClick={() => changeTab('REPORTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'REPORTED'
              ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported Reviews</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {(kpis.reportedReviews || 0) + (reports.length || 0)}
          </div>
          <div className="text-xs text-rose-700 font-semibold mt-1">
            {(kpis.reportedReviews || 0) + (reports.length || 0) > 0 ? 'Requires moderation inspection' : 'No disputes or spam'}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar (Exact 4 options from Image 2) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {NAV_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. PRODUCT REVIEWS TAB (Live storefront reviews)                          */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCT_REVIEWS' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search product, customer, title..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Status Segment Filter (Published / Hidden / All) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setProductStatusFilter('PUBLISHED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    productStatusFilter === 'PUBLISHED'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Published ({kpis.publishedReviews || 0})
                </button>
                <button
                  onClick={() => setProductStatusFilter('HIDDEN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    productStatusFilter === 'HIDDEN'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hidden
                </button>
                <button
                  onClick={() => setProductStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    productStatusFilter === 'ALL'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Active
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={e => setVerifiedOnly(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Verified Buyers Only</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Rating:</span>
                <select
                  value={ratingFilter}
                  onChange={e => setRatingFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">All Star Ratings</option>
                  <option value="5">5 Stars (★★★★★)</option>
                  <option value="4">4 Stars (★★★★☆)</option>
                  <option value="3">3 Stars (★★★☆☆)</option>
                  <option value="2">2 Stars (★★☆☆☆)</option>
                  <option value="1">1 Star (★☆☆☆☆)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700">
                  {productStatusFilter === 'HIDDEN'
                    ? 'No hidden reviews found'
                    : 'No published product reviews found'}
                </p>
                <p className="text-xs text-slate-400">
                  {productStatusFilter === 'HIDDEN'
                    ? 'Reviews hidden by administrator from the public storefront will appear here.'
                    : 'Reviews approved by admin or submitted by customers will appear here.'}
                </p>
              </div>
            ) : (
              reviews.map((rev: any) => (
                <div key={rev.id} className="p-6 hover:bg-slate-50/70 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{rev.title}</h4>

                      {rev.verifiedPurchase && (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-xs flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Buyer</span>
                        </span>
                      )}

                      {rev.status === 'HIDDEN' ? (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[11px] flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-slate-500" />
                          <span>Hidden from Storefront</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Live on Storefront</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {rev.status === 'HIDDEN' ? (
                        <button
                          onClick={() => handleModeration(rev.id, 'PUBLISHED', 'Restored to storefront by admin')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                          title="Publish back to public storefront"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publish to Storefront</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleModeration(rev.id, 'HIDDEN', 'Hidden from storefront by admin')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                          title="Take down from public storefront"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide Review</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed">{rev.comment || rev.body}</p>

                  {/* Pros & Cons */}
                  {(rev.pros || rev.cons) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {rev.pros && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100 flex items-start gap-1.5">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider">Pros:</span>
                          <span>{rev.pros}</span>
                        </div>
                      )}
                      {rev.cons && (
                        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-100 flex items-start gap-1.5">
                          <span className="font-bold text-amber-800 uppercase tracking-wider">Cons:</span>
                          <span>{rev.cons}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer & Product Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      <span>Product:</span>
                      <strong className="text-slate-800">{rev.product?.name || 'Digital Asset'}</strong>
                    </div>
                    <div>By: <strong className="text-slate-800">{rev.customerName}</strong> ({rev.customerEmail || 'Customer'})</div>
                    <div>Submitted: {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    {rev.order && (
                      <div>Order: <strong className="text-indigo-600">#{rev.order.orderNumber}</strong></div>
                    )}
                  </div>

                  {/* Official Staff Reply */}
                  {rev.replies && rev.replies.length > 0 && (
                    <div className="p-3 bg-blue-50/80 rounded-xl space-y-1 border border-blue-200">
                      <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Reply className="w-3.5 h-3.5 text-blue-700" />
                        <span>Official KDW Staff Reply (Live on Storefront):</span>
                      </div>
                      {rev.replies.map((rep: any) => (
                        <p key={rep.id} className="text-xs text-slate-800 italic">"{rep.body}"</p>
                      ))}
                    </div>
                  )}

                  {/* Quick Reply Form */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Write official reply (visible to storefront customers)..."
                      value={selectedReview?.id === rev.id ? replyMessage : ''}
                      onChange={e => {
                        setSelectedReview(rev);
                        setReplyMessage(e.target.value);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendStaffReply(rev.id);
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs flex-1 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                    />
                    <button
                      onClick={() => handleSendStaffReply(rev.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Post Reply</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RATINGS TAB (Rating distribution, breakdown, and product scores)        */}
      {/* ========================================================================= */}
      {activeTab === 'RATINGS' && (
        <div className="space-y-6">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Average Star Rating</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div className="my-3">
                <div className="text-4xl font-black text-slate-900">{kpis.averageRating || 5.0}</div>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(kpis.averageRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">Based on {kpis.totalPublishedCount || kpis.publishedReviews || 0} published customer reviews</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Recommendation Rate</span>
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="my-3">
                <div className="text-4xl font-black text-emerald-600">{kpis.recommendationRate || 100}%</div>
              </div>
              <p className="text-xs text-slate-500">Percentage of 4-star and 5-star positive customer ratings</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Verified Buyers</span>
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="my-3">
                <div className="text-4xl font-black text-blue-600">{kpis.verifiedPurchases || 0}</div>
              </div>
              <p className="text-xs text-slate-500">Authentic reviews confirmed via digital orders & licences</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Storefront Sync</span>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="my-3">
                <div className="text-2xl font-black text-emerald-700">100% Synced</div>
              </div>
              <p className="text-xs text-slate-500">All published ratings reflect on storefront product pages in real-time</p>
            </div>
          </div>

          {/* Interactive Star Distribution & Filter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Rating Distribution (5★ to 1★)</h3>
                <p className="text-xs text-slate-500">Click any star tier to filter the review list below.</p>
              </div>

              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = kpis.histogram ? kpis.histogram[stars] || 0 : 0;
                  const total = kpis.totalPublishedCount || kpis.publishedReviews || 1;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isFiltered = ratingFilter === String(stars);

                  return (
                    <div
                      key={stars}
                      onClick={() => setRatingFilter(ratingFilter === String(stars) ? 'ALL' : String(stars))}
                      className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-3 ${
                        isFiltered
                          ? 'bg-amber-100/90 border border-amber-300 font-bold'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1 w-16 text-xs font-semibold text-slate-700 shrink-0">
                        <span>{stars}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      </div>

                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="w-16 text-right text-xs font-mono text-slate-500">
                        {count} ({percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>

              {ratingFilter !== 'ALL' && (
                <button
                  onClick={() => setRatingFilter('ALL')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Clear {ratingFilter}★ Filter
                </button>
              )}
            </div>

            {/* Top Products Leaderboard */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Highest Rated Products</h3>
                <p className="text-xs text-slate-500">Top digital assets ranked by customer satisfaction.</p>
              </div>

              <div className="divide-y divide-slate-100">
                {kpis.topProducts && kpis.topProducts.length > 0 ? (
                  kpis.topProducts.map((prod: any) => (
                    <div key={prod.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {prod.coverImage ? (
                          <img
                            src={prod.coverImage}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-[11px] text-slate-500">{prod.totalReviews} review(s) published</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="text-xs font-black text-slate-900">{prod.averageRating} ★</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Product rating rankings will appear as customers submit product reviews.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Reviews Ledger for Selected Rating */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {ratingFilter === 'ALL' ? 'All Published Customer Ratings & Reviews' : `${ratingFilter}★ Customer Reviews`}
                </h3>
                <p className="text-xs text-slate-400">
                  {ratingFilter === 'ALL'
                    ? 'Showing all published customer reviews across every star grade'
                    : `Showing reviews filtered by ${ratingFilter} star rating`}
                </p>
              </div>

              {ratingFilter !== 'ALL' && (
                <button
                  onClick={() => setRatingFilter('ALL')}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Show All Stars
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {reviews.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No published reviews found for this rating tier.
                </div>
              ) : (
                reviews.map((rev: any) => (
                  <div key={rev.id} className="p-5 hover:bg-slate-50/70 transition space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{rev.title}</h4>
                        {rev.verifiedPurchase && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-[10px] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{rev.comment || rev.body}</p>

                    <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-3">
                      <span>Product: <strong className="text-slate-800">{rev.product?.name || 'Digital Asset'}</strong></span>
                      <span>By: <strong className="text-slate-800">{rev.customerName}</strong></span>
                      {rev.order && <span>Order: <strong className="text-indigo-600">#{rev.order.orderNumber}</strong></span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PENDING REVIEWS TAB (Moderation Queue with 1-click Approval)           */}
      {/* ========================================================================= */}
      {activeTab === 'PENDING' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-amber-900 text-sm">Awaiting Moderation Queue</h3>
                <p className="text-xs text-amber-700">
                  Reviews must be approved before appearing on the public storefront.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200/70 text-amber-900 font-bold rounded-full text-xs">
              {reviews.length} Pending
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {reviews.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-800 text-base">All caught up!</p>
                <p className="text-xs text-slate-500">
                  There are currently no customer reviews awaiting moderation.
                </p>
              </div>
            ) : (
              reviews.map((rev: any) => (
                <div key={rev.id} className="p-6 hover:bg-slate-50/70 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{rev.title}</h4>

                      {rev.riskScore && rev.riskScore !== 'NORMAL' ? (
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-xs uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{rev.riskScore}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Content Clean</span>
                        </span>
                      )}
                    </div>

                    {/* Quick 1-Click Moderation Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleModeration(rev.id, 'PUBLISHED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Publish to Storefront</span>
                      </button>

                      <button
                        onClick={() => setRejectModalReview(rev)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed font-normal">{rev.comment || rev.body}</p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>Product: <strong className="text-slate-800">{rev.product?.name || 'Digital Asset'}</strong></div>
                    <div>By: <strong className="text-slate-800">{rev.customerName}</strong> ({rev.customerEmail || 'Customer'})</div>
                    <div>Submitted: {new Date(rev.createdAt).toLocaleDateString('en-IN')}</div>
                    {rev.verifiedPurchase && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REPORTED REVIEWS TAB (Customer disputes & spam reports ledger)          */}
      {/* ========================================================================= */}
      {activeTab === 'REPORTED' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Reported Reviews & Flagged Disputes</h3>
                <p className="text-xs text-rose-700">
                  Reviews flagged by visitors on the storefront or detected by automated spam checks.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-200/70 text-rose-900 font-bold rounded-full text-xs">
              {reports.length + (reviews.length || 0)} Total
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {reports.length === 0 && reviews.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-800 text-base">No reported reviews found</p>
                <p className="text-xs text-slate-500">All customer reviews are clean, verified, and complaint-free.</p>
              </div>
            ) : (
              <>
                {/* 1. Formal Report Dispute Tickets */}
                {reports.map((rep: any) => (
                  <div key={rep.id} className="p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-xs uppercase">
                          {rep.reason || 'Flagged Review'}
                        </span>
                        <span className="text-xs text-slate-500">
                          Reported by: <strong>{rep.reporterEmail || 'Storefront Visitor'}</strong> • {new Date(rep.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="text-sm text-slate-800 font-medium">"{rep.details || 'Flagged for moderation review'}"</div>
                      {rep.review && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          Flagged Content: <strong>"{rep.review.title}"</strong> on <em>{rep.review.product?.name}</em>
                          <p className="text-slate-500 mt-1 italic">"{rep.review.comment}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveReport(rep.id, false)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Dismiss (Keep Live)
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, true)}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Resolve & Hide from Storefront
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Direct Spam Flagged Reviews */}
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="p-6 hover:bg-slate-50/70 transition space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-xs uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{rev.riskScore || 'SPAM_FLAGGED'}</span>
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{rev.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleModeration(rev.id, 'PUBLISHED', 'Cleared after inspection')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Clear</span>
                        </button>
                        <button
                          onClick={() => handleModeration(rev.id, 'HIDDEN', 'Confirmed violation by admin')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hide from Storefront</span>
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-xl transition cursor-pointer"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">{rev.comment || rev.body}</p>

                    <div className="text-xs text-slate-500">
                      Product: <strong>{rev.product?.name || 'Digital Asset'}</strong> • By: {rev.customerName} ({rev.customerEmail || 'Customer'})
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalReview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Reject Customer Review</h3>
              </div>
              <button
                onClick={() => setRejectModalReview(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please specify the reason for rejecting review "<strong>{rejectModalReview.title}</strong>". This note will be recorded for audit logs.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Preset Reason</label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Violates review content guidelines">Violates review content guidelines</option>
                <option value="Contains external promotional links or spam">Contains external promotional links or spam</option>
                <option value="Inappropriate, abusive or defamatory language">Inappropriate, abusive or defamatory language</option>
                <option value="Competitor attack or non-verified purchase claim">Competitor attack or non-verified purchase claim</option>
                <option value="Custom">Other (Custom Reason)</option>
              </select>
            </div>

            {rejectReason === 'Custom' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Custom Explanation</label>
                <textarea
                  rows={3}
                  value={customRejectReason}
                  onChange={e => setCustomRejectReason(e.target.value)}
                  placeholder="Enter specific violation details..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalReview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalReason = rejectReason === 'Custom' ? customRejectReason : rejectReason;
                  handleModeration(rejectModalReview.id, 'REJECTED', finalReason);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
