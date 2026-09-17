import React, { useState, useEffect } from 'react';
import {
  Tag, Search, Filter, RefreshCw, XCircle, RotateCcw, Clock,
  ShieldCheck, Key, Plus, Copy, Check, ExternalLink, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import SEO from '../../../components/SEO';
import { authFetch } from '../../../api/apiClient';

export default function AdminDownloadTokens() {
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Mint Token Modal
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [minting, setMinting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<{ url: string; token: string; expiresAt: string } | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: search.trim(),
        status
      });
      const res = await authFetch(`/api/admin/downloads/tokens?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTokens(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Failed to load tokens.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilesForMint = async () => {
    try {
      const res = await authFetch('/api/admin/downloads/files?limit=100');
      const json = await res.json();
      if (json.success && json.data) {
        setFiles(json.data);
        if (json.data.length > 0 && !selectedFileId) {
          setSelectedFileId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [page, status]);

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this download token immediately?')) return;
    try {
      const res = await authFetch(`/api/admin/downloads/tokens/${id}/revoke`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: 'Token successfully revoked.', type: 'success' });
        fetchTokens();
      }
    } catch (e) {
      console.error(e);
      setActionMessage({ text: 'Failed to revoke token.', type: 'error' });
    }
  };

  const handleReplace = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/downloads/tokens/${id}/replace`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: `New replacement token generated: ${json.token.slice(0, 12)}... (valid 15m)`, type: 'success' });
        fetchTokens();
      }
    } catch (e) {
      console.error(e);
      setActionMessage({ text: 'Failed to replace token.', type: 'error' });
    }
  };

  const handleOpenMint = () => {
    setGeneratedLink(null);
    setMintModalOpen(true);
    fetchFilesForMint();
  };

  const handleMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileId) return;
    setMinting(true);
    try {
      const res = await authFetch(`/api/admin/downloads/files/${selectedFileId}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: parseInt(durationMinutes, 10) })
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedLink({
          url: `${window.location.origin}${json.downloadUrl}`,
          token: json.token,
          expiresAt: json.expiresAt
        });
        fetchTokens();
      } else {
        alert(json.message || 'Failed to mint token.');
      }
    } catch (err) {
      console.error(err);
      alert('Error minting token.');
    } finally {
      setMinting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const activeCount = tokens.filter(t => t.status === 'ACTIVE').length;
  const expiredCount = tokens.filter(t => t.status === 'EXPIRED' || t.status === 'USED').length;

  return (
    <div className="space-y-6">
      <SEO title="Security Tokens | KDW Admin" description="Monitor and mint secure SHA-256 expiring download tokens" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Tokens Vault</h1>
          <p className="text-sm text-slate-500 mt-1">Inspection and generation of cryptographic SHA-256 ephemeral delivery tokens.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTokens}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Tokens"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenMint}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Plus size={15} />
            Mint Secure Token
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Token Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">Total Tokens Minted</span>
          <span className="text-xl font-black text-slate-900">{totalCount || tokens.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">Active (Streaming Enabled)</span>
          <span className="text-xl font-black text-emerald-600">{activeCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">Used / Expired</span>
          <span className="text-xl font-black text-slate-500">{expiredCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block font-medium">Encryption Standard</span>
          <span className="text-base font-black text-indigo-600">32-Byte SHA-256</span>
        </div>
      </div>

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
            <RefreshCw size={28} className="animate-spin mr-2 text-primary" />
            Loading token vault...
          </div>
        ) : tokens.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <Key size={40} className="opacity-20 mb-2" />
            <p>No tokens found matching filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Target Product / Asset</th>
                  <th className="px-5 py-3.5">Customer Email</th>
                  <th className="px-5 py-3.5">Token Hash</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Expires At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tokens.map((tok) => {
                  const isExpired = new Date() > new Date(tok.expiresAt) || tok.status === 'EXPIRED';
                  const isRevoked = tok.status === 'REVOKED';
                  const effectiveStatus = isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : tok.status;
                  const tokenKey = tok.secureToken || tok.tokenHash;
                  const downloadUrl = `${window.location.origin}/api/purchases/download/${tok.secureToken || tok.id}`;

                  return (
                    <tr key={tok.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {tok.entitlement?.product?.name || 'Digital Asset Deliverable'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {tok.entitlement?.customerEmail || 'Verified Purchaser'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {tok.tokenHash.slice(0, 16)}...
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          effectiveStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          effectiveStatus === 'USED' ? 'bg-blue-100 text-blue-800' :
                          effectiveStatus === 'EXPIRED' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        {new Date(tok.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(tok.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {effectiveStatus === 'ACTIVE' && tok.secureToken && (
                            <button
                              onClick={() => handleCopy(downloadUrl, tok.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                              title="Copy Download URL"
                            >
                              {copiedTokenId === tok.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              {copiedTokenId === tok.id ? 'Copied' : 'Copy URL'}
                            </button>
                          )}
                          {effectiveStatus === 'ACTIVE' && (
                            <button
                              onClick={() => handleRevoke(tok.id)}
                              className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-bold rounded-lg text-[11px]"
                              title="Revoke Token"
                            >
                              Revoke
                            </button>
                          )}
                          <button
                            onClick={() => handleReplace(tok.id)}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded-lg"
                            title="Generate Replacement"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mint Token Modal */}
      {mintModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setMintModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Mint Security Token</h3>
                <p className="text-xs text-slate-500">Create time-bounded signed download link.</p>
              </div>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleMintSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Digital Asset</label>
                  <select
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {files.map(f => (
                      <option key={f.id} value={f.id}>{f.fileName} ({f.product?.name || f.parentFolderId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Token Validity Window</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="15">15 Minutes (One-time delivery)</option>
                    <option value="60">1 Hour (Standard delivery)</option>
                    <option value="1440">24 Hours (Full day)</option>
                    <option value="10080">7 Days (VIP Access)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMintModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={minting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {minting ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                    Mint Token
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Token generated! Valid until {new Date(generatedLink.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Signed Download URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink.url}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 select-all"
                    />
                    <button
                      onClick={() => handleCopy(generatedLink.url, 'modal')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${
                        copiedTokenId === 'modal' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {copiedTokenId === 'modal' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedTokenId === 'modal' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setGeneratedLink(null)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Mint Another
                  </button>
                  <a
                    href={generatedLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    Test Stream
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
