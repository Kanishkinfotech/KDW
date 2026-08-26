import React, { useState, useEffect } from 'react';
import { Package, Search, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Star } from 'lucide-react';
import SEO from '../../../components/SEO';
import ReportFilterBar from '../../../components/admin/ReportFilterBar';
import { formatCurrency } from '../../../utils/currency';

export default function AdminProductAnalysis() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/product-analysis?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [range]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SEO title="Product Analysis & Diagnostics | KDW Admin" description="Full conversion funnel, refund rates, and automated diagnosis" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Commercial & Delivery Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">Conversion funnels, download success ratios, and automated diagnostic recommendations.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        dateRange={range}
        onDateRangeChange={setRange}
        onRefresh={fetchAnalysis}
      />

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{filteredProducts.length} products analyzed</span>
      </div>

      {/* Products Grid with Diagnostics */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          Running diagnostic models...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((p) => {
            const isOpportunity = p.diagnosisType === 'OPPORTUNITY';
            const isWarning = p.diagnosisType === 'WARNING';
            const isCritical = p.diagnosisType === 'CRITICAL';

            const diagBadge = isCritical ? 'bg-rose-50 text-rose-800 border-rose-200' :
              (isWarning ? 'bg-amber-50 text-amber-800 border-amber-200' :
              (isOpportunity ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'));

            return (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                      <span className="text-xs text-slate-400">{p.category} • Price: <strong>{formatCurrency(p.price)}</strong></span>
                    </div>
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>

                  {/* Funnel Metrics */}
                  <div className="grid grid-cols-4 gap-2 text-center mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Page Views</span>
                      <span className="font-bold text-slate-800">{p.views}</span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Paid Orders</span>
                      <span className="font-bold text-slate-800">{p.paidOrders}</span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Conversion</span>
                      <span className="font-bold text-emerald-600">{p.conversionRate}%</span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Refund Rate</span>
                      <span className={`font-bold ${p.refundRate > 5 ? 'text-rose-600' : 'text-slate-700'}`}>{p.refundRate}%</span>
                    </div>
                  </div>

                  {/* Fulfillment Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-3 px-1">
                    <span>Downloads: <strong>{p.successfulDownloads}</strong> successes / <strong>{p.failedDownloads}</strong> fails</span>
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {p.averageRating} ({p.reviewCount} reviews)
                    </span>
                  </div>
                </div>

                {/* Automated Diagnosis Box */}
                <div className={`p-3.5 rounded-xl border text-xs font-medium ${diagBadge}`}>
                  <div className="flex items-start gap-2">
                    <span className="font-black text-[11px] uppercase tracking-wider block shrink-0">Diagnosis:</span>
                    <span>{p.diagnosis}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
