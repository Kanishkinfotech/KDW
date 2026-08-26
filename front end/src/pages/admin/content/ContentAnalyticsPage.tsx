import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Eye, MousePointerClick, DollarSign, 
  ThumbsUp, Star, ArrowUpRight, TrendingUp, BookOpen, Image as ImageIcon
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';

export default function ContentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/analytics', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setAnalytics(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const s = analytics?.summary || {};

  return (
    <ContentLayout
      title="Unified Content & Conversion Analytics"
      subtitle="Track user engagement, CTA click-through rates, reading depth, and direct product revenue attribution."
      onRefresh={fetchAnalytics}
      isLoading={loading}
    >
      {/* 1. Global KPI Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Content Views</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {((s.totalPageViews || 0) + (s.totalBlogViews || 0)).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {s.totalBlogViews || 0} article reads &bull; {s.totalPageViews || 0} page views
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banner Impressions & Clicks</span>
            <MousePointerClick className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {(s.totalBannerClicks || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">clicks</span>
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            Avg CTR: {s.averageBannerCtr || 0}% across {s.totalBannerImpressions || 0} impressions
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attributed Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            ${((s.totalBlogAttributedRevenue || 0) + (s.totalBannerAttributedRevenue || 0)).toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ${(s.totalBlogAttributedRevenue || 0).toFixed(2)} blogs &bull; ${(s.totalBannerAttributedRevenue || 0).toFixed(2)} banners
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FAQ Helpfulness Rate</span>
            <ThumbsUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {s.faqHelpfulRatePercent || 0}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Customer CSAT score: {s.averageCustomerRating || 5.0} / 5.0
          </p>
        </div>
      </div>

      {/* 2. Top Performing Articles & Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" /> Top Performing Articles (Conversion Attribution)
          </h3>

          <div className="space-y-3">
            {(analytics?.topBlogs || []).map((b: any, idx: number) => (
              <div key={b.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{b.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {b.viewsCount || 0} reads &bull; {b.purchasesCount || 0} orders generated
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700">${(b.revenueAttributed || 0).toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">Attributed</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Banners */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" /> Top Performing Promotional Banners
          </h3>

          <div className="space-y-3">
            {(analytics?.topBanners || []).map((ban: any, idx: number) => (
              <div key={ban.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{ban.name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {ban.placement} &bull; {ban.clicksCount || 0} clicks
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700">${(ban.revenueAttributed || 0).toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">{ban.conversionsCount || 0} sales</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
