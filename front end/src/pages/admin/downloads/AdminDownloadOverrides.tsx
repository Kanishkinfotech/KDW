import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Search, RefreshCw, Edit3, Check, X,
  Clock, Download, HardDrive, AlertCircle, CheckCircle2, Settings
} from 'lucide-react';
import SEO from '../../../components/SEO';
import { authFetch } from '../../../api/apiClient';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  downloadLimit?: number;
  accessDurationDays?: number;
}

interface DigitalFile {
  id: string;
  fileName: string;
  parentFolderId: string;
  sizeBytes: string;
  accessStatus: string;
  isCurrent: boolean;
  productId: string;
  product?: ProductItem | null;
}

export default function AdminDownloadOverrides() {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<DigitalFile[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState('');

  // Edit Limit Modal State
  const [editingFile, setEditingFile] = useState<DigitalFile | null>(null);
  const [editLimit, setEditLimit] = useState<number>(5);
  const [editDurationDays, setEditDurationDays] = useState<number>(365);
  const [editStatus, setEditStatus] = useState<string>('CONNECTED');
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch files & products for limits management
      const resFiles = await authFetch('/api/admin/downloads/files?limit=100');
      const jsonFiles = await resFiles.json();
      if (jsonFiles.success) {
        setFiles(jsonFiles.data || []);
        setProducts(jsonFiles.products || []);
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Failed to load permissions data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (file: DigitalFile) => {
    setEditingFile(file);
    setEditLimit(file.product?.downloadLimit || 5);
    setEditDurationDays(file.product?.accessDurationDays || 365);
    setEditStatus(file.accessStatus || 'CONNECTED');
  };

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const res = await authFetch(`/api/admin/downloads/files/${editingFile.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadLimit: editLimit,
          accessStatus: editStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ text: `Updated limits for "${editingFile.fileName}" to ${editLimit} downloads.`, type: 'success' });
        setEditingFile(null);
        fetchData();
      } else {
        setActionMessage({ text: json.message || 'Update failed.', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Error updating permissions.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredFiles = files.filter(f => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      f.fileName.toLowerCase().includes(term) ||
      (f.product?.name || '').toLowerCase().includes(term) ||
      (f.parentFolderId || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <SEO title="Permissions & Limits | KDW Admin" description="Configure digital asset download limits and expiration rules" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Permissions & Download Limits</h1>
          <p className="text-sm text-slate-500 mt-1">Set maximum download quotas, access durations, and file availability policies.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          title="Refresh Limits"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Action Notification */}
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

      {/* Standard Policy Rules Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Download size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Standard Download Quota</span>
            <span className="text-lg font-black text-slate-900">5 Downloads / User</span>
            <span className="text-[11px] text-slate-400 block">Customizable per product below</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Token Link Expiration</span>
            <span className="text-lg font-black text-slate-900">60 Minutes</span>
            <span className="text-[11px] text-slate-400 block">Temporary secure link lifetime</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Customer Entitlement Window</span>
            <span className="text-lg font-black text-slate-900">365 Days</span>
            <span className="text-[11px] text-slate-400 block">From date of verified purchase</span>
          </div>
        </div>
      </div>

      {/* File & Product Limits Section */}
      <div className="space-y-4">
        {/* Section Header & Search bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-slate-700" />
            <h2 className="text-base font-black text-slate-900">File & Product Limits</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredFiles.length} Assets
            </span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by asset name, product, or folder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
            />
          </div>
        </div>

        {/* Files Limits Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-primary" />
              Loading file limits...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <HardDrive size={36} className="mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No assets found</h4>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Digital Asset / File</th>
                    <th className="py-3 px-4">Folder Category</th>
                    <th className="py-3 px-4">Linked Product</th>
                    <th className="py-3 px-4">Allowed Download Quota</th>
                    <th className="py-3 px-4">Access Duration</th>
                    <th className="py-3 px-4">Delivery Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{file.fileName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {file.id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium">
                          {file.parentFolderId || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {file.product?.name || 'Standard Digital Asset'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          <ShieldCheck size={12} className="text-blue-600 shrink-0" />
                          Max {file.product?.downloadLimit || 5} / buyer
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Download limit per buyer</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-medium">
                          {file.product?.accessDurationDays || 365} days
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {file.accessStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(file)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          Edit Limit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Limit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setEditingFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Configure Download Limits</h3>
                <p className="text-xs text-slate-500">Update customer download quota and access duration.</p>
              </div>
            </div>

            <form onSubmit={handleSaveLimit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block">{editingFile.fileName}</span>
                <span className="text-slate-500 text-[11px] block">{editingFile.product?.name || 'Digital Asset'}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Downloads Per Purchaser</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editLimit}
                    onChange={(e) => setEditLimit(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                  />
                  <span className="text-xs text-slate-500 shrink-0">downloads</span>
                </div>
                <div className="flex gap-2 mt-1.5">
                  {[1, 3, 5, 10, 20].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setEditLimit(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        editLimit === preset ? 'bg-primary text-white border-primary' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Access Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={editDurationDays}
                  onChange={(e) => setEditDurationDays(parseInt(e.target.value, 10) || 365)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Availability Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                >
                  <option value="CONNECTED">CONNECTED (Active & Available)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Temporarily Paused)</option>
                  <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
