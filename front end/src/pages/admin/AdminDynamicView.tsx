import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Download, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { adminTableConfig } from '../../data/adminTableConfig';
import { formatCurrency } from '../../utils/currency';

export default function AdminDynamicView() {
  const { section } = useParams<{ section: string }>();
  const config = section ? adminTableConfig[section] : null;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRealSectionData = async () => {
      if (!section) return;
      try {
        setLoading(true);
        setError(null);

        // Map dynamic sections to authentic backend database APIs
        let endpoint = '';
        if (section === 'invoices' || section === 'orders') endpoint = '/api/admin/orders';
        else if (section === 'payments') endpoint = '/api/admin/payments';
        else if (section === 'guests') endpoint = '/api/admin/customers?type=GUEST';
        else if (section === 'inventory') endpoint = '/api/admin/inventory';
        else if (section === 'notifications') endpoint = '/api/admin/notifications';
        else if (section === 'drive') endpoint = '/api/admin/downloads/files';
        else if (section === 'coupons') endpoint = '/api/admin/coupons';
        else if (section === 'bundles') endpoint = '/api/bundles';
        else if (section === 'reviews') endpoint = '/api/admin/reviews';
        else endpoint = `/api/admin/${section}`;

        const res = await axios.get(endpoint);
        if (res.data?.success) {
          const items = res.data.data || res.data.items || res.data.orders || res.data.payments || res.data.reviews || res.data.customers || [];
          setData(Array.isArray(items) ? items : []);
        } else {
          setData(config?.data || []);
        }
      } catch (err: any) {
        console.warn(`Dynamic view API fallback for ${section}:`, err.message);
        setData(config?.data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchRealSectionData();
  }, [section, config]);

  if (!config) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm mt-8 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#171325]">Section Not Found</h2>
        <p className="text-slate-500 text-sm">The administration section "{section}" is not registered.</p>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5b21b6] text-white text-xs font-bold rounded-lg hover:bg-[#6d28d9] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const filteredData = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getBadgeColor = (status: string) => {
    const s = String(status).toLowerCase();
    if (s.includes('active') || s.includes('paid') || s.includes('success') || s.includes('synced') || s.includes('published') || s.includes('healthy') || s.includes('resolved')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (s.includes('pending') || s.includes('draft') || s.includes('overdue') || s.includes('open')) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (s.includes('failed') || s.includes('expired') || s.includes('revoked') || s.includes('suspended')) return 'bg-rose-50 text-rose-700 border border-rose-200';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  const formatCell = (row: any, col: any) => {
    const val = row[col.key] !== undefined ? row[col.key] : (row.status || row.name || '-');
    if (col.type === 'currency') return formatCurrency(Number(val) || 0);
    if (col.type === 'date') return val ? new Date(val).toLocaleDateString() : '-';
    if (col.type === 'badge') {
      return (
        <span className={`px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full ${getBadgeColor(val)}`}>
          {String(val)}
        </span>
      );
    }
    return String(val);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block mb-1">
            OPERATIONS VIEW
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">{config.title}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{config.description}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6]"
          />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Showing {filteredData.length} records
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5b21b6]" />
            <p className="text-xs font-mono">Loading data from persistent store...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  {config.columns.map(col => (
                    <th key={col.key} className="px-6 py-3.5 font-mono text-[11px] uppercase tracking-wider">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                      No matching records in the database.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {config.columns.map((col, colIdx) => (
                        <td key={col.key} className={`px-6 py-4 ${colIdx === 0 ? 'font-bold text-[#171325]' : 'text-slate-600'}`}>
                          {formatCell(row, col)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
