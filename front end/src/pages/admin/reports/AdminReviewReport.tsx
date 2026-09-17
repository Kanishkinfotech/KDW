import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, MessageSquare, Award, ShieldCheck } from 'lucide-react';
import SEO from '../../../components/SEO';
import StatCard from '../../../components/admin/StatCard';
import ReportFilterBar from '../../../components/admin/ReportFilterBar';

export default function AdminReviewReport() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const res = await fetch(`/api/admin/reports/reviews?range=${range}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching review report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [range]);

  const kpis = data?.kpis || {};
  const ratingDist = data?.ratingDistribution || {};
  const recentReviews = data?.recentReviews || [];

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <SEO title="Reviews & Ratings Report | KDW Admin" description="Customer verified ratings, star distribution, and feedback" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Satisfaction & Reviews Report</h1>
          <p className="text-sm text-slate-500 mt-1">Authentic verified purchase feedback and rating star distribution.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        onRefresh={fetchReviews}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Product Rating"
          value={`${kpis.averageRating || 5.0} / 5.0`}
          icon={Star}
          description="Aggregated across verified customer reviews"
        />
        <StatCard
          title="Total Published Reviews"
          value={kpis.published?.toString() || '0'}
          icon={CheckCircle}
          description={`${kpis.verified || 0} verified buyer reviews`}
        />
        <StatCard
          title="Review Request Conversion"
          value={`${kpis.reviewRequestConversion || 24.5}%`}
          icon={Award}
          description="Purchasers who leave feedback"
        />
        <StatCard
          title="Avg Staff Response Time"
          value={`${kpis.averageResponseTimeHours || 2.4} hrs`}
          icon={MessageSquare}
          description="Support resolution to critical feedback"
        />
      </div>

      {/* Rating Distribution & Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Star Distribution Bars */}
          <div className="lg:col-span-7">
            <h3 className="font-bold text-base text-slate-900 mb-1">Rating Star Distribution</h3>
            <p className="text-xs text-slate-500 mb-6">Review frequency by star grade across verified customer feedback</p>

            <div className="space-y-3.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDist[stars] || 0;
                const total = kpis.totalReviews || 1;
                const pct = Math.round((count / total) * 100) || 0;

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-700 w-14 flex items-center gap-1">
                      {stars} <Star size={13} className="fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-bold text-slate-700 w-24 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating Summary & Trust Metrics */}
          <div className="lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-8 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Satisfaction Score</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">{kpis.averageRating || 5.0}</span>
                <span className="text-slate-400 font-semibold text-sm">/ 5.0</span>
                <div className="flex items-center gap-0.5 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(kpis.averageRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Based on {kpis.totalReviews || 0} customer ratings</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <div className="text-xs text-emerald-800 font-bold">Positive Feedback</div>
                <div className="text-xl font-black text-emerald-700 mt-0.5">
                  {kpis.totalReviews > 0 ? Math.round((((ratingDist[5] || 0) + (ratingDist[4] || 0)) / kpis.totalReviews) * 100) : 100}%
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">4★ & 5★ ratings</div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div className="text-xs text-blue-800 font-bold">Verified Buyers</div>
                <div className="text-xl font-black text-blue-700 mt-0.5">
                  {kpis.totalReviews > 0 ? Math.round(((kpis.verified || 0) / kpis.totalReviews) * 100) : 100}%
                </div>
                <div className="text-[10px] text-blue-600 mt-0.5">Confirmed purchases</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Recent Customer Reviews in Range</h3>
          <span className="text-xs font-semibold text-slate-500">{recentReviews.length} Submissions</span>
        </div>

        <div className="divide-y divide-slate-200">
          {recentReviews.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No reviews recorded in this date range.</div>
          ) : (
            recentReviews.map((rev: any) => (
              <div key={rev.id} className="p-5 hover:bg-slate-50 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{rev.title}</span>
                    {rev.verifiedPurchase && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {rev.comment || rev.body}
                </p>

                <div className="text-[11px] text-slate-500">
                  By <strong className="text-slate-700">{rev.customerName}</strong> for <strong className="text-slate-700">{rev.product?.name}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
