import React, { useState, useEffect } from 'react';
import { GitBranch, Search, Filter, RefreshCw, ShieldCheck, User } from 'lucide-react';
import SEO from '../../../components/SEO';

export default function AdminDownloadOverrides() {
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [overrideType, setOverrideType] = useState('ALL');
  const [adminEmail, setAdminEmail] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        overrideType,
        adminEmail: adminEmail.trim()
      });
      const res = await fetch(`/api/admin/downloads/overrides?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOverrides(json.data || []);
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
    fetchOverrides();
  }, [page, overrideType]);

  return (
    <div className="space-y-6">
      <SEO title="Download Overrides Audit Log | KDW Admin" description="Complete immutable audit trail of all manual administrative overrides" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Administrative Overrides & Policy Audit</h1>
          <p className="text-sm text-slate-500 mt-1">Immutable ledger of quota resets, access expirations, token generations, and revocations with rationale.</p>
        </div>
        <button onClick={fetchOverrides} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchOverrides(); }} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by administrator email..."
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
          <Filter size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-600">Override Type:</span>
          <select
            value={overrideType}
            onChange={(e) => { setOverrideType(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
          >
            <option value="ALL">All Overrides</option>
            <option value="EXTEND_ACCESS">Extend Access</option>
            <option value="RESET_DOWNLOAD_COUNT">Reset Download Count</option>
            <option value="REVOKE_ACCESS">Revoke Access</option>
            <option value="RESTORE_ACCESS">Restore Access</option>
            <option value="ASSIGN_NEW_VERSION">Assign New Version</option>
            <option value="GENERATE_TOKEN">Generate Token</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading audit ledger...
          </div>
        ) : overrides.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <GitBranch size={40} className="opacity-20 mb-2" />
            <p>No override events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Administrator</th>
                  <th className="px-5 py-3.5">Override Action</th>
                  <th className="px-5 py-3.5">Customer / Target</th>
                  <th className="px-5 py-3.5">Mandatory Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {overrides.map((ov) => (
                  <tr key={ov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">
                      <div>{new Date(ov.createdAt).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(ov.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        {ov.adminEmail}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {ov.overrideType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{ov.entitlement?.customer?.email || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400">{ov.entitlement?.product?.name || 'Digital Product'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-sm">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 italic text-[11px]">
                        "{ov.reason}"
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {overrides.length} of {totalCount} overrides</span>
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
