import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, RefreshCw, ShoppingCart, Download, Star, ShieldCheck } from 'lucide-react';
import SEO from '../../../components/SEO';
import { formatCurrency } from '../../../utils/currency';

export default function AdminCustomerReport() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('spend_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: search.trim(),
        sortBy
      });
      const res = await fetch(`/api/admin/reports/customers?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, sortBy]);

  return (
    <div className="space-y-6">
      <SEO title="Customer Lifecycle & Value Report | KDW Admin" description="Customer LTV, order frequency, download activity, and engagement metrics" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Lifecycle & Value Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-functional customer profiles connecting Lifetime Value, fulfilled digital orders, and downloads.</p>
        </div>
        <button onClick={fetchCustomers} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchCustomers(); }} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
          <Filter size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-600">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
          >
            <option value="spend_desc">Highest Lifetime Spend (LTV)</option>
            <option value="orders_desc">Most Orders Placed</option>
            <option value="downloads_desc">Most Digital Downloads</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Calculating customer intelligence...
          </div>
        ) : customers.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Users size={40} className="opacity-20 mb-2" />
            <p>No customers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Lifetime Spend</th>
                  <th className="px-5 py-3.5">Paid Orders</th>
                  <th className="px-5 py-3.5">Active Entitlements</th>
                  <th className="px-5 py-3.5">Downloads Streamed</th>
                  <th className="px-5 py-3.5">Reviews</th>
                  <th className="px-5 py-3.5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{c.name || 'Unnamed Customer'}</div>
                      <div className="text-[11px] text-slate-400">{c.email} • {c.mobile}</div>
                    </td>
                    <td className="px-5 py-3.5 font-black text-emerald-700 text-sm">{formatCurrency(c.totalSpend)}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{c.totalOrders}</td>
                    <td className="px-5 py-3.5 font-bold text-blue-600">{c.activeEntitlements}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{c.totalDownloads}</td>
                    <td className="px-5 py-3.5 text-slate-600">{c.reviewsCount}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500">{new Date(c.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {customers.length} of {totalCount} registered customers</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <span className="font-bold text-slate-800">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
