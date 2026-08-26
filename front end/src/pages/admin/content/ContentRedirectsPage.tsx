import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowRightLeft, Trash2, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentRedirectsPage() {
  const [redirects, setRedirects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<any>(null);
  const [oldPath, setOldPath] = useState('');
  const [newPath, setNewPath] = useState('');
  const [redirectType, setRedirectType] = useState('301');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRedirects = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/content/redirects?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setRedirects(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, [searchTerm]);

  const openCreateModal = () => {
    setEditingRedirect(null);
    setOldPath('');
    setNewPath('');
    setRedirectType('301');
    setReason('');
    setShowModal(true);
  };

  const handleSaveRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPath || !newPath) return alert('Both Old Path and New Path are required.');
    setSaving(true);
    try {
      const url = editingRedirect ? `/api/admin/content/redirects/${editingRedirect.id}` : '/api/admin/content/redirects';
      const method = editingRedirect ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPath, newPath, redirectType, reason })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchRedirects();
      } else {
        alert(json.message || 'Failed to save redirect');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this 301/302 redirect mapping?')) return;
    try {
      const res = await fetch(`/api/admin/content/redirects/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) fetchRedirects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="URL Redirects & 301 Routing Rules"
      subtitle="Manage SEO legacy redirects, slug migrations, loop prevention, and hit traffic tracking."
      onRefresh={fetchRedirects}
      isLoading={loading}
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Redirect
        </button>
      }
    >
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search paths or reason..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          {redirects.length} active redirects
        </div>
      </div>

      {/* Redirects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Original Path</th>
              <th className="py-3.5 px-4">Redirect Destination</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Hits</th>
              <th className="py-3.5 px-4">Reason</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {redirects.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No redirect rules found.
                </td>
              </tr>
            ) : (
              redirects.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-700">{r.oldPath}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{r.newPath}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.redirectType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.hitsCount || 0}</td>
                  <td className="py-3.5 px-4 text-slate-500">{r.reason || 'Slug migration'}</td>
                  <td className="py-3.5 px-4">
                    <ContentStatusBadge status={r.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add 301/302 Redirect Rule</h3>

            <form onSubmit={handleSaveRedirect} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Old URL Path *</label>
                <input
                  type="text"
                  required
                  value={oldPath}
                  onChange={e => setOldPath(e.target.value)}
                  placeholder="/legal/privacy"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">New URL Path *</label>
                <input
                  type="text"
                  required
                  value={newPath}
                  onChange={e => setNewPath(e.target.value)}
                  placeholder="/pages/privacy-policy"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Redirect Type</label>
                  <select
                    value={redirectType}
                    onChange={e => setRedirectType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="301">301 Permanent</option>
                    <option value="302">302 Temporary</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Page restructure"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Redirect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
