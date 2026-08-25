import { useState, useEffect } from 'react';
import { 
  TrendingUp, Eye, MousePointerClick, ShoppingBag, 
  IndianRupee, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw 
} from 'lucide-react';
import axios from 'axios';

export default function CategoryAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await axios.get('/api/categories/analytics/overview', { headers });
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalViews = analytics.reduce((s, a) => s + (a.views || 0), 0);
  const totalClicks = analytics.reduce((s, a) => s + (a.clicks || 0), 0);
  const totalSales = analytics.reduce((s, a) => s + (a.unitsSold || 0), 0);
  const totalRevenue = analytics.reduce((s, a) => s + (a.revenue || 0), 0);

  const avgConversion = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
            <Eye size={18} className="text-primary" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalViews.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">Storefront category sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Product Clicks</span>
            <MousePointerClick size={18} className="text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalClicks.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">From category landing pages</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Orders Generated</span>
            <ShoppingBag size={18} className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalSales}</span>
          <span className="text-[10px] text-emerald-600 font-bold block">{avgConversion}% Avg Conversion Rate</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Category Revenue</span>
            <IndianRupee size={18} className="text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">₹{totalRevenue.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">Direct catalog attribution</span>
        </div>
      </div>

      {/* Performance & Health Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Category Health & Performance Diagnostics</h3>
            <p className="text-xs text-slate-500">Live conversion funnel and health alerts per department.</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                <th className="p-3.5 pl-5">Category Name</th>
                <th className="p-3.5 text-center">Active Products</th>
                <th className="p-3.5 text-center">Views</th>
                <th className="p-3.5 text-center">Units Sold</th>
                <th className="p-3.5 text-center">Conversion</th>
                <th className="p-3.5 text-right">Revenue</th>
                <th className="p-3.5 pl-4 pr-5">Health Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading category analytics...</td>
                </tr>
              ) : analytics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No category performance records found.</td>
                </tr>
              ) : (
                analytics.map(cat => {
                  const hasIssues = cat.healthWarnings && cat.healthWarnings.length > 0;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50">
                      <td className="p-3.5 pl-5">
                        <span className="font-bold text-slate-900 block">{cat.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">/{cat.slug}</span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold">
                        {cat.activeProductCount} / {cat.productCount}
                      </td>

                      <td className="p-3.5 text-center font-mono text-slate-600">
                        {cat.views.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-emerald-700">
                        {cat.unitsSold}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold">
                        {cat.conversionRate}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        ₹{cat.revenue.toLocaleString()}
                      </td>

                      <td className="p-3.5 pl-4 pr-5">
                        {hasIssues ? (
                          <div className="space-y-1">
                            {cat.healthWarnings.map((w: string, i: number) => (
                              <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 mr-1">
                                <AlertTriangle size={10} /> {w}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                            <CheckCircle2 size={10} /> Healthy & Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
