import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, RefreshCw, Mail, Key, Clock, 
  RotateCcw, XCircle, CheckCircle, ExternalLink, LifeBuoy, MoreVertical, Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../../components/SEO';
import OverrideActionModal, { type OverrideType } from '../../../components/admin/OverrideActionModal';
import { authFetch } from '../../../api/apiClient';

export default function AdminEntitlements() {
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    actionType: OverrideType;
    entityName: string;
    currentValue?: any;
    proposedValue?: any;
    isDestructive?: boolean;
    entitlementId: string;
  } | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchEntitlements = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '15',
        search: search.trim(),
        status,
        productId: selectedProduct
      });
      const res = await authFetch(`/api/admin/downloads/entitlements?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEntitlements(json.data || []);
        setProducts(json.products || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch entitlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntitlements();
  }, [page, status, selectedProduct]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEntitlements();
  };

  // Quick Action Handlers
  const handleResendEmail = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/downloads/entitlements/${id}/resend-email`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: json.message || 'Access email resent.', type: 'success' });
      } else {
        setActionMessage({ text: json.message || 'Failed to resend email.', type: 'error' });
      }
    } catch (e: any) {
      setActionMessage({ text: e.message || 'Network error', type: 'error' });
    }
    setActiveDropdown(null);
  };

  const handleGenerateToken = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/downloads/entitlements/${id}/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: 30 })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: `New token generated: ${json.token.slice(0, 12)}... (valid for 30m)`, type: 'success' });
      }
    } catch (e: any) {
      setActionMessage({ text: 'Error generating token', type: 'error' });
    }
    setActiveDropdown(null);
  };

  const openOverrideModal = (
    ent: any,
    actionType: OverrideType,
    title: string,
    isDestructive = false,
    currentVal?: any,
    proposedVal?: any
  ) => {
    setModalConfig({
      title,
      actionType,
      entityName: `${ent.customerEmail} (${ent.product?.name || 'Product'})`,
      currentValue: currentVal,
      proposedValue: proposedVal,
      isDestructive,
      entitlementId: ent.id
    });
    setModalOpen(true);
    setActiveDropdown(null);
  };

  const handleModalConfirm = async ({ reason, extraData }: { reason: string; extraData?: any }) => {
    if (!modalConfig) return;
    const { actionType, entitlementId } = modalConfig;

    let endpoint = '';
    let body: any = { reason };

    if (actionType === 'EXTEND_ACCESS') {
      endpoint = `/api/admin/downloads/entitlements/${entitlementId}/extend-expiry`;
      body.newExpiryDate = extraData;
    } else if (actionType === 'RESET_DOWNLOAD_COUNT') {
      endpoint = `/api/admin/downloads/entitlements/${entitlementId}/reset-count`;
    } else if (actionType === 'REVOKE_ACCESS') {
      endpoint = `/api/admin/downloads/entitlements/${entitlementId}/revoke`;
    } else if (actionType === 'RESTORE_ACCESS') {
      endpoint = `/api/admin/downloads/entitlements/${entitlementId}/restore`;
    } else if (actionType === 'ASSIGN_NEW_VERSION') {
      endpoint = `/api/admin/downloads/entitlements/${entitlementId}/assign-version`;
      body.versionNumber = extraData;
    }

    const res = await authFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.success) {
      setActionMessage({ text: data.message || 'Action executed successfully.', type: 'success' });
      fetchEntitlements();
    } else {
      throw new Error(data.message || 'Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Digital Entitlements | KDW Admin" description="Manage customer download access, tokens, and quotas" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Digital Entitlements</h1>
          <p className="text-sm text-slate-500 mt-1">Direct authority over product versions, download counts, token issuance, and access expiration.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntitlements}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 font-normal">Dismiss</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer email, order #, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <Filter size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-600">Status:</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PARTIALLY_DOWNLOADED">Partially Downloaded</option>
              <option value="DOWNLOADED">Downloaded</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">Product:</span>
            <select
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-slate-800 font-bold focus:outline-none max-w-[160px] truncate"
            >
              <option value="ALL">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Entitlements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[420px]">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            Loading entitlements...
          </div>
        ) : entitlements.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <ShieldCheck size={44} className="opacity-20 mb-2" />
            <p>No entitlements matching your filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Customer / Order</th>
                  <th className="px-5 py-3.5">Product & Version</th>
                  <th className="px-5 py-3.5">Download Quota</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Access Expiry</th>
                  <th className="px-5 py-3.5">Last Downloaded</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {entitlements.map((ent) => {
                  const quotaPercent = ent.downloadLimit > 0 ? Math.min(100, Math.round((ent.downloadCount / ent.downloadLimit) * 100)) : 0;
                  const isRevoked = ent.status === 'REVOKED';
                  const isExpired = ent.status === 'EXPIRED' || (ent.accessExpiresAt && new Date() > new Date(ent.accessExpiresAt));

                  return (
                    <tr key={ent.id} className="hover:bg-slate-50 transition-colors">
                      {/* Customer & Order */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{ent.customerEmail}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>Order: <strong>{ent.order?.orderNumber || 'N/A'}</strong></span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            ent.order?.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ent.order?.paymentStatus || 'PAID'}
                          </span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-800">{ent.product?.name || ent.bundle?.title || 'Digital Product'}</div>
                        <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          v{ent.productVersion || '1.0.0'}
                        </span>
                      </td>

                      {/* Quota */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ent.downloadCount}</span>
                          <span className="text-slate-400">/ {ent.downloadLimit || 5}</span>
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${quotaPercent >= 100 ? 'bg-amber-500' : 'bg-blue-600'}`}
                              style={{ width: `${quotaPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                          isRevoked ? 'bg-rose-100 text-rose-800' : (isExpired ? 'bg-slate-200 text-slate-800' : 'bg-emerald-100 text-emerald-800')
                        }`}>
                          {isRevoked ? <XCircle size={12} /> : (isExpired ? <Clock size={12} /> : <CheckCircle size={12} />)}
                          {ent.status}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-3.5 text-slate-600">
                        {ent.accessExpiresAt ? new Date(ent.accessExpiresAt).toLocaleDateString() : 'Lifetime'}
                      </td>

                      {/* Last Download */}
                      <td className="px-5 py-3.5 text-slate-500">
                        {ent.lastDownloadedAt ? new Date(ent.lastDownloadedAt).toLocaleDateString() : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResendEmail(ent.id)}
                            title="Resend Secure Delivery Email"
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Mail size={14} />
                          </button>
                          <button
                            onClick={() => handleGenerateToken(ent.id)}
                            title="Generate 15-min Token"
                            className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Key size={14} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === ent.id ? null : ent.id)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeDropdown === ent.id && (
                              <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-left text-xs font-semibold animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => openOverrideModal(ent, 'EXTEND_ACCESS', 'Extend Access Expiry')}
                                  className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Clock size={13} className="text-blue-500" /> Extend Expiry Date
                                </button>
                                <button
                                  onClick={() => openOverrideModal(ent, 'RESET_DOWNLOAD_COUNT', 'Reset Download Quota', false, ent.downloadCount, 0)}
                                  className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <RotateCcw size={13} className="text-emerald-500" /> Reset Download Count
                                </button>
                                <button
                                  onClick={() => openOverrideModal(ent, 'ASSIGN_NEW_VERSION', 'Assign Product Version', false, ent.productVersion, '2.0.0')}
                                  className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit3 size={13} className="text-indigo-500" /> Assign Newer Version
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                {ent.status === 'REVOKED' ? (
                                  <button
                                    onClick={() => openOverrideModal(ent, 'RESTORE_ACCESS', 'Restore Download Access')}
                                    className="w-full px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                  >
                                    <CheckCircle size={13} /> Restore Access
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openOverrideModal(ent, 'REVOKE_ACCESS', 'Revoke Entitlement Access', true)}
                                    className="w-full px-3.5 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <XCircle size={13} /> Revoke Access
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {entitlements.length} of {totalCount} entitlements</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-bold text-slate-800">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Override Action Modal */}
      {modalConfig && (
        <OverrideActionModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setModalConfig(null); }}
          onConfirm={handleModalConfirm}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          entityName={modalConfig.entityName}
          currentValue={modalConfig.currentValue}
          proposedValue={modalConfig.proposedValue}
          isDestructive={modalConfig.isDestructive}
        />
      )}
    </div>
  );
}
