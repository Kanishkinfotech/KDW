import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, MessageSquare, Award, RefreshCw } from 'lucide-react';
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
      const res = await fetch(`/api/admin/reports/reviews?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [range]);

  const kpis = data?.kpis || {};
  const ratingDist = data?.ratingDistribution || {};
  const topics = data?.topicAnalysis || [];
  const recentReviews = data?.recentReviews || [];

  return (
    <div className="space-y-6">
      <SEO title="Reviews & Ratings Report | KDW Admin" description="Customer sentiment, verified ratings, and topic analysis" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Satisfaction & Reviews Report</h1>
          <p className="text-sm text-slate-500 mt-1">Authentic verified purchase feedback, rating distribution, and sentiment topics.</p>
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

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-1">Rating Star Distribution</h3>
          <p className="text-xs text-slate-500 mb-6">Review frequency by star grade</p>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDist[stars] || 0;
              const total = kpis.totalReviews || 1;
              const pct = Math.round((count / total) * 100) || 0;

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-700 w-12 flex items-center gap-1">
                    {stars} <Star size={12} className="fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-bold text-slate-700 w-16 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Sentiment Classification */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-1">Topic Sentiment Analysis</h3>
          <p className="text-xs text-slate-500 mb-6">Key satisfaction drivers in customer reviews</p>

          <div className="space-y-4">
            {topics.map((t: any, i: number) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-xs text-slate-900">{t.topic}</span>
                  <span className="font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {t.positivePercent}% Positive
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${t.positivePercent}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{t.totalMentions} review mentions</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
