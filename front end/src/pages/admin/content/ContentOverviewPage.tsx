import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, BookOpen, HelpCircle, Image as ImageIcon, MessageSquare, 
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ShieldCheck, 
  Search, RefreshCw, ExternalLink
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';

export default function ContentOverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [resKpis, resAlerts] = await Promise.all([
        fetch('/api/admin/content/overview', { credentials: 'include' }),
        fetch('/api/admin/content/health-alerts', { credentials: 'include' })
      ]);
      const kpisJson = await resKpis.json();
      const alertsJson = await resAlerts.json();

      if (kpisJson.success) setData(kpisJson.kpis);
      if (alertsJson.success) setAlerts(alertsJson.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const k = data || {};

  return (
    <ContentLayout
      title="Content & Media Intelligence"
      subtitle="Universal editorial operations, content health alerts, and publication lifecycles."
      onRefresh={fetchOverview}
      isLoading={loading}
    >
      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Published Pages */}
        <div 
          onClick={() => navigate('/admin/content/pages?status=PUBLISHED')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-all" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Pages</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{k.publishedPages ?? 0}</h3>
            <p className="text-xs text-slate-400 mt-1">{k.draftPages ?? 0} drafts in progress</p>
          </div>
        </div>

        {/* Published Blogs */}
        <div 
          onClick={() => navigate('/admin/content/blogs?status=PUBLISHED')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Articles</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{k.publishedBlogs ?? 0}</h3>
            <p className="text-xs text-slate-400 mt-1">{k.draftBlogs ?? 0} in review queue</p>
          </div>
        </div>

        {/* Active Banners */}
        <div 
          onClick={() => navigate('/admin/content/banners?status=ACTIVE')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <ImageIcon className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-all" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Banners</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{k.activeBanners ?? 0}</h3>
            <p className="text-xs text-slate-400 mt-1">{k.scheduledBanners ?? 0} scheduled campaigns</p>
          </div>
        </div>

        {/* Customer Feedback */}
        <div 
          onClick={() => navigate('/admin/content/feedback?status=OPEN')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-all" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Feedback</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{k.pendingFeedback ?? 0}</h3>
            <p className="text-xs text-slate-400 mt-1">{k.reportedFeedback ?? 0} reported reviews</p>
          </div>
        </div>
      </div>

      {/* 2. Secondary Health KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/admin/content/seo')}
          className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all"
        >
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{k.seoIssues ?? 0}</div>
            <div className="text-xs text-slate-500">SEO Meta Issues</div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/content/faqs?isOutdated=true')}
          className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all"
        >
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{k.outdatedFaqs ?? 0}</div>
            <div className="text-xs text-slate-500">Outdated FAQs</div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/content/media?unusedOnly=true')}
          className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all"
        >
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{k.unusedMedia ?? 0}</div>
            <div className="text-xs text-slate-500">Unused Media Files</div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/content/revisions')}
          className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all"
        >
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{k.contentUpdatesThisMonth ?? 0}</div>
            <div className="text-xs text-slate-500">Updates This Month</div>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Content Health Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">Content Health & Quality Alerts</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">{alerts.length} active notifications</span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-slate-700">All content items pass quality audits</p>
            <p className="text-xs text-slate-400 mt-0.5">No broken redirects, expired banners, or missing metadata detected.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map(a => (
              <div key={a.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${
                    a.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    a.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                  </div>
                </div>

                <Link
                  to={a.link}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                >
                  Inspect <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick Workflow Hubs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/admin/content/approval-queue" 
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-navy-900 text-white shadow-md hover:shadow-lg transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Editorial Queue</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="text-lg font-bold">Review & Approval Queue</h3>
          <p className="text-xs text-indigo-200/80">Manage submitted page and blog revisions awaiting publication sign-off.</p>
        </Link>

        <Link 
          to="/admin/content/scheduled" 
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md hover:shadow-lg transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Automation</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="text-lg font-bold">Scheduled Content Publisher</h3>
          <p className="text-xs text-slate-300/80">Timezone-aware auto-publishing daemon for marketing campaigns and timed releases.</p>
        </Link>

        <Link 
          to="/admin/content/analytics" 
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-md hover:shadow-lg transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Intelligence</span>
            <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <h3 className="text-lg font-bold">Unified Content Analytics</h3>
          <p className="text-xs text-blue-200/80">Attribution modelling, scroll depth, product clicks, and revenue impact.</p>
        </Link>
      </div>
    </ContentLayout>
  );
}
