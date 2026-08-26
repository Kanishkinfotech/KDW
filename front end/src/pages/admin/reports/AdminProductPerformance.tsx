import React, { useState, useEffect } from 'react';
import { Activity, Search, Star, HardDrive, CheckCircle2, ShieldCheck } from 'lucide-react';
import SEO from '../../../components/SEO';
import { formatCurrency } from '../../../utils/currency';

export default function AdminProductPerformance() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/product-performance?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <div className="space-y-6">
      <SEO title="Product Health & Performance | KDW Admin" description="Multi-dimensional health evaluation across delivery, satisfaction, and revenue" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Performance & Health Index</h1>
          <p className="text-sm text-slate-500 mt-1">Holistic health scores across Commercial, Delivery, Satisfaction, Support, and Licence validity.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); fetchPerformance(); }} className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800">
            Search
          </button>
        </form>
        <span className="text-xs text-slate-500 font-semibold">{records.length} catalog items evaluated</span>
      </div>

      {/* Health Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Evaluating multi-dimensional health metrics...
          </div>
        ) : records.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Activity size={40} className="opacity-20 mb-2" />
            <p>No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Product & Category</th>
                  <th className="px-5 py-3.5">Overall Health</th>
                  <th className="px-5 py-3.5">Commercial</th>
                  <th className="px-5 py-3.5">Delivery & Drive</th>
                  <th className="px-5 py-3.5">Satisfaction</th>
                  <th className="px-5 py-3.5">Orders / Downloads</th>
                  <th className="px-5 py-3.5 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((p) => {
                  const dims = p.healthDimensions || {};
                  const score = dims.overallHealthScore || 90;
                  const scoreBadge = score >= 85 ? 'bg-emerald-100 text-emerald-800' :
                    (score >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.category} • {formatCurrency(p.price)}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-black text-xs ${scoreBadge}`}>
                          {score} / 100
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{dims.commercialHealth || 85}%</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{dims.deliveryHealth || 95}%</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{dims.customerSatisfaction || 92}%</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <span className="font-bold text-slate-900">{p.orders}</span> orders • <span className="font-bold text-blue-600">{p.downloads}</span> downloads
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-amber-600">
                        <span className="inline-flex items-center gap-1">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {p.rating} ({p.reviewsCount})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
