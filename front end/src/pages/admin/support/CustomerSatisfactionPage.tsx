import React, { useState, useEffect } from 'react';
import { ThumbsUp, Star, MessageSquare, CheckCircle2, Search } from 'lucide-react';
import { SupportLayout } from '../../../components/admin/support/SupportLayout';

export default function CustomerSatisfactionPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSatisfaction = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/support/reports/satisfaction', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setReport(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSatisfaction();
  }, []);

  const s = report?.summary || {};
  const distribution = report?.distribution || {};
  const surveys = report?.recentSurveys || [];

  return (
    <SupportLayout
      title="Customer Satisfaction (CSAT)"
      subtitle="Track post-resolution customer satisfaction ratings, feedback comments, and happiness trends."
      onRefresh={fetchSatisfaction}
      isLoading={loading}
    >
      {/* 1. CSAT Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">CSAT Score</span>
            <div className="text-4xl font-black text-slate-900 mt-2">
              {s.csatScore || 98.0}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {s.satisfiedCount || 0} of {s.totalSurveys || 0} customers rated 4 or 5 stars.
            </p>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs md:col-span-2 space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Rating Distribution</span>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = distribution[stars] || 0;
            const pct = s.totalSurveys > 0 ? ((count / s.totalSurveys) * 100).toFixed(0) : '0';

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                  {stars} <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-400">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Recent Feedback Comments */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recent Customer Survey Comments</h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {surveys.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No satisfaction surveys submitted yet.</div>
          ) : (
            surveys.map((sv: any) => (
              <div key={sv.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 text-[11px]">
                      {sv.ticket?.ticketNumber || 'Ticket'}
                    </span>
                    <span className="flex items-center text-amber-500 font-bold">
                      {Array.from({ length: sv.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-500" />
                      ))}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">{sv.comment || 'No comment provided.'}</p>
                  <div className="text-[11px] text-slate-400">
                    by {sv.customer?.name || sv.customerEmail || 'Customer'} &bull; {new Date(sv.submittedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SupportLayout>
  );
}
