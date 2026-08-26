import React, { useState, useEffect } from 'react';
import { Tag, Search, Filter, RefreshCw, XCircle, RotateCcw, Clock, ShieldCheck, Key } from 'lucide-react';
import SEO from '../../../components/SEO';

export default function AdminDownloadTokens() {
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: search.trim(),
        status
      });
      const res = await fetch(`/api/admin/downloads/tokens?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTokens(json.data || []);
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
    fetchTokens();
  }, [page, status]);

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this download token immediately?')) return;
    try {
      const res = await fetch(`/api/admin/downloads/tokens/${id}/revoke`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage('Token successfully revoked.');
        fetchTokens();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplace = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/downloads/tokens/${id}/replace`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Replacement token generated: ${json.token.slice(0, 10)}... (valid 15m)`);
        fetchTokens();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Download Tokens | KDW Admin" description="Monitor and revoke secure time-bounded download tokens" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Tokens Management</h1>
          <p className="text-sm text-slate-500 mt-1">Inspection of SHA-256 hashed ephemeral download tokens and active streaming grants.</p>
        </div>
        <button
          onClick={fetchTokens}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-blue-500 hover:text-blue-700">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchTokens(); }} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer email, product, or token hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors">
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
          <Filter size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-600">Status:</span>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-transparent border-none text-slate-800 font-bold focus:outline-none"
          >
            <option value="ALL">All Tokens</option>
            <option value="ACTIVE">Active (Valid)</option>
            <option value="USED">Used / Streamed</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading token vault...
          </div>
        ) : tokens.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Key size={40} className="opacity-20 mb-2" />
            <p>No tokens found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Token Hash / ID</th>
                  <th className="px-5 py-3.5">Customer / Product</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Issued At</th>
                  <th className="px-5 py-3.5">Expires At</th>
                  <th className="px-5 py-3.5">Last Used</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tokens.map((tok) => {
                  const isExpired = new Date() > new Date(tok.expiresAt) || tok.status === 'EXPIRED';
                  return (
                    <tr key={tok.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {tok.tokenHash ? tok.tokenHash.slice(0, 14) + '...' : tok.id.slice(0, 12)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{tok.entitlement?.customerEmail || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{tok.entitlement?.product?.name || 'Digital File'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          tok.status === 'ACTIVE' && !isExpired ? 'bg-emerald-100 text-emerald-800' :
                          (tok.status === 'REVOKED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700')
                        }`}>
                          {tok.status === 'ACTIVE' && isExpired ? 'EXPIRED' : tok.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{new Date(tok.createdAt).toLocaleTimeString()} {new Date(tok.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-slate-600">{new Date(tok.expiresAt).toLocaleTimeString()} {new Date(tok.expiresAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-slate-500">{tok.lastUsedAt ? new Date(tok.lastUsedAt).toLocaleTimeString() : 'Not Yet'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReplace(tok.id)}
                            title="Generate Replacement Token"
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors"
                          >
                            Replace
                          </button>
                          {tok.status !== 'REVOKED' && (
                            <button
                              onClick={() => handleRevoke(tok.id)}
                              title="Revoke Token"
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total {totalCount} tokens issued</span>
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
