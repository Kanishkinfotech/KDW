import React, { useState, useEffect } from 'react';
import { Archive, Search, RefreshCw, Clock, RotateCcw } from 'lucide-react';
import SEO from '../../../components/SEO';
import OverrideActionModal from '../../../components/admin/OverrideActionModal';

export default function AdminExpiredAccess() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEnt, setSelectedEnt] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchExpired = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20', search: search.trim() });
      const res = await fetch(`/api/admin/downloads/expired-access?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
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
    fetchExpired();
  }, [page]);

  const handleExtendConfirm = async ({ reason, extraData }: { reason: string; extraData?: any }) => {
    if (!selectedEnt) return;
    const res = await fetch(`/api/admin/downloads/entitlements/${selectedEnt.id}/extend-expiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newExpiryDate: extraData, reason })
    });
    const data = await res.json();
    if (data.success) {
      setActionMessage('Access period extended successfully.');
      fetchExpired();
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Expired Access Management | KDW Admin" description="Review expired entitlements and process extensions" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expired Access Management</h1>
          <p className="text-sm text-slate-500 mt-1">Review entitlements where access validity has lapsed and grant grace-period extensions.</p>
        </div>
        <button onClick={fetchExpired} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-500 hover:text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchExpired(); }} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer email or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading expired records...
          </div>
        ) : items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Archive size={40} className="opacity-20 mb-2" />
            <p>No expired entitlements found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5">Expired On</th>
                  <th className="px-5 py-3.5">Total Downloads</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{ent.customerEmail}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{ent.product?.name || 'Digital Product'}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono">{ent.order?.orderNumber || 'N/A'}</td>
                    <td className="px-5 py-3.5 text-rose-600 font-bold">
                      {ent.accessExpiresAt ? new Date(ent.accessExpiresAt).toLocaleDateString() : 'Expired'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-bold">{ent.downloadCount} / {ent.downloadLimit}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => { setSelectedEnt(ent); setModalOpen(true); }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Clock size={12} /> Extend Expiry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total {totalCount} expired entitlements</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <span className="font-bold text-slate-800">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {modalOpen && selectedEnt && (
        <OverrideActionModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedEnt(null); }}
          onConfirm={handleExtendConfirm}
          title="Extend Access Period"
          actionType="EXTEND_ACCESS"
          entityName={`${selectedEnt.customerEmail} (${selectedEnt.product?.name || 'Product'})`}
          currentValue={selectedEnt.accessExpiresAt ? new Date(selectedEnt.accessExpiresAt).toLocaleDateString() : 'Expired'}
        />
      )}
    </div>
  );
}
