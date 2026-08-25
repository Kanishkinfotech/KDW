import { useState, useEffect } from 'react';
import {
  Star, MessageSquare, Check, X, Search, Filter, ShieldAlert, Reply, AlertTriangle,
  RefreshCw, Download, CheckCircle, Clock, Slash, ThumbsUp, FileText,
  TrendingUp, Package, ShieldCheck, Eye, Edit
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  // Navigation Sub-Views
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'REPORTED' | 'VERIFIED' | 'VERSION_ANALYTICS' | 'REPORTS'
  >('ALL');

  const [reviews, setReviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalReviews: 0,
    pendingModeration: 0,
    publishedReviews: 0,
    rejectedReviews: 0,
    reportedReviews: 0,
    verifiedPurchases: 0,
    averageRating: 5.0
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');

  // Selected Review Drawer / Reply State
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [reportResolution, setReportResolution] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('adminAuth')}`
  });

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/reviews/admin', {
        headers: getHeaders(),
        params: {
          status: activeTab === 'PENDING' ? 'PENDING' :
                  activeTab === 'PUBLISHED' ? 'PUBLISHED' :
                  activeTab === 'REJECTED' ? 'REJECTED' :
                  activeTab === 'REPORTED' ? 'REPORTED' : 'ALL',
          verifiedOnly: activeTab === 'VERIFIED' ? 'true' : 'false',
          rating: ratingFilter,
          search: searchTerm
        }
      });
      if (res.data.success) {
        setReviews(res.data.reviews || []);
        if (res.data.kpis) setKpis(res.data.kpis);
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
      if (res.data.success) setReports(res.data.reports || []);
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REPORTS') {
      fetchReportsData();
    } else {
      fetchReviewsData();
    }
  }, [activeTab, ratingFilter, searchTerm]);

  const handleModeration = async (reviewId: string, status: string) => {
    try {
      const res = await axios.post(`/api/admin/reviews/admin/${reviewId}/moderation`, {
        status,
        moderationReason
      }, { headers: getHeaders() });

      if (res.data.success) {
        toast.success(`Review marked as ${status}`);
        setModerationReason('');
        setSelectedReview(null);
        fetchReviewsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating review moderation');
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
        toast.success('Official reply published');
        setReplyMessage('');
        fetchReviewsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error sending reply');
    }
  };

  const handleResolveReport = async (reportId: string, dismissReview: boolean) => {
    try {
      const res = await axios.post(`/api/admin/reviews/admin/reports/${reportId}/resolve`, {
        resolution: reportResolution || 'Action taken by moderator',
        dismissReview
      }, { headers: getHeaders() });

      if (res.data.success) {
        toast.success('Report resolved');
        setReportResolution('');
        fetchReportsData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error resolving report');
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Reviews & Ratings</h1>
              <p className="text-sm text-slate-500">Moderation queue, verified purchase validation, version tracking, and staff responses.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'REPORTS') fetchReportsData();
              else fetchReviewsData();
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Rating</span>
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.averageRating} ★</div>
          <div className="text-xs text-slate-400 mt-1">Across all products</div>
        </div>

        <div
          onClick={() => setActiveTab('ALL')}
          className="p-4 rounded-xl border bg-white border-slate-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalReviews}</div>
          <div className="text-xs text-slate-400 mt-1">Customer submissions</div>
        </div>

        <div
          onClick={() => setActiveTab('PENDING')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'PENDING' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending Queue</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{kpis.pendingModeration}</div>
          <div className="text-xs text-amber-700 mt-1">Awaiting review</div>
        </div>

        <div
          onClick={() => setActiveTab('PUBLISHED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'PUBLISHED' ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Published</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.publishedReviews}</div>
          <div className="text-xs text-emerald-700 mt-1">Live on storefront</div>
        </div>

        <div
          onClick={() => setActiveTab('VERIFIED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'VERIFIED' ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Verified Buyers</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">{kpis.verifiedPurchases}</div>
          <div className="text-xs text-indigo-700 mt-1">Order + licence verified</div>
        </div>

        <div
          onClick={() => setActiveTab('REPORTED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'REPORTED' ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Flagged / Spam</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{kpis.reportedReviews}</div>
          <div className="text-xs text-rose-700 mt-1">Requires inspection</div>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'REJECTED' ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rejected</span>
            <Slash className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-2">{kpis.rejectedReviews}</div>
          <div className="text-xs text-slate-400 mt-1">Declined reviews</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Reviews', icon: Star },
          { id: 'PENDING', label: 'Pending Moderation', icon: Clock },
          { id: 'PUBLISHED', label: 'Published Reviews', icon: CheckCircle },
          { id: 'VERIFIED', label: 'Verified Purchases', icon: ShieldCheck },
          { id: 'REPORTED', label: 'Reported / Flagged', icon: AlertTriangle },
          { id: 'REJECTED', label: 'Rejected', icon: Slash },
          { id: 'REPORTS', label: 'Report Disputes', icon: ShieldAlert },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Reviews Table */}
      {activeTab === 'REPORTS' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
            <h3 className="font-bold text-rose-900 text-sm">Review Dispute & Report Ledger</h3>
            <span className="text-xs text-rose-700 font-semibold">{reports.length} Open Reports</span>
          </div>

          <div className="divide-y divide-slate-200">
            {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No community reports submitted.</div>
            ) : (
              reports.map((rep: any) => (
                <div key={rep.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-xs">
                        {rep.reason}
                      </span>
                      <span className="text-xs text-slate-500">Reported by {rep.reporterEmail || 'Customer'}</span>
                    </div>
                    <div className="text-sm text-slate-800 font-medium">{rep.details || 'Inappropriate content flagged'}</div>
                    <div className="text-xs text-slate-500">Product: <strong>{rep.review?.product?.name}</strong></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveReport(rep.id, false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                    >
                      Dismiss Report (Keep Review)
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Resolve & Hide Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200">
            {reviews.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No reviews found matching current filter.</div>
            ) : (
              reviews.map((rev: any) => (
                <div key={rev.id} className="p-6 hover:bg-slate-50/80 transition space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
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
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                      {rev.riskScore && rev.riskScore !== 'NORMAL' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-xs uppercase">
                          {rev.riskScore}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        rev.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                        rev.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        rev.status === 'HIDDEN' ? 'bg-purple-100 text-purple-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">{rev.body}</p>

                  {/* Customer & Product Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>Product: <strong className="text-slate-800">{rev.product?.name}</strong> (v{rev.productVersion || '1.0.0'})</div>
                    <div>By: <strong className="text-slate-800">{rev.customerName}</strong> ({rev.customerEmail || 'Guest'})</div>
                    <div>Date: {new Date(rev.createdAt).toLocaleDateString('en-IN')}</div>
                    {rev.order && (
                      <div>Order: <strong className="text-indigo-600">#{rev.order.orderNumber}</strong></div>
                    )}
                  </div>

                  {/* Staff Replies */}
                  {rev.replies && rev.replies.length > 0 && (
                    <div className="p-3 bg-slate-100 rounded-xl space-y-1.5 border border-slate-200">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Reply className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Official KDW Staff Reply:</span>
                      </div>
                      {rev.replies.map((rep: any) => (
                        <p key={rep.id} className="text-xs text-slate-700 italic">"{rep.body}"</p>
                      ))}
                    </div>
                  )}

                  {/* Moderation Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      {rev.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handleModeration(rev.id, 'PUBLISHED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          Approve & Publish
                        </button>
                      )}
                      {rev.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleModeration(rev.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          Reject
                        </button>
                      )}
                      {rev.status !== 'HIDDEN' && (
                        <button
                          onClick={() => handleModeration(rev.id, 'HIDDEN')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition"
                        >
                          Hide Review
                        </button>
                      )}
                    </div>

                    {/* Quick Staff Reply */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Write official staff reply..."
                        value={selectedReview?.id === rev.id ? replyMessage : ''}
                        onChange={e => {
                          setSelectedReview(rev);
                          setReplyMessage(e.target.value);
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs flex-1 sm:w-64 focus:ring-2 focus:ring-slate-900"
                      />
                      <button
                        onClick={() => handleSendStaffReply(rev.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
