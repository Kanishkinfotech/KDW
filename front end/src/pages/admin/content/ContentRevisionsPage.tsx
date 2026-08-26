import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Search, Eye, CheckCircle2 } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';

export default function ContentRevisionsPage() {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedRevision, setSelectedRevision] = useState<any>(null);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (typeFilter !== 'ALL') q.set('contentType', typeFilter);

      const res = await fetch(`/api/admin/content/revisions?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setRevisions(json.revisions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, [typeFilter]);

  const handleRollback = async (id: string, versionNumber: number) => {
    if (!window.confirm(`Restore content back to historical revision v${versionNumber}?`)) return;
    try {
      const res = await fetch(`/api/admin/content/revisions/${id}/restore`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchRevisions();
      } else {
        alert(json.message || 'Rollback failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="Revision Center & Historical Rollback"
      subtitle="Complete audit snapshots of every edit, author attribution, and one-click rollback functionality."
      onRefresh={fetchRevisions}
      isLoading={loading}
    >
      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
        >
          <option value="ALL">All Content Types</option>
          <option value="PAGE">Pages</option>
          <option value="BLOG">Blogs</option>
          <option value="FAQ">FAQs</option>
        </select>

        <div className="text-xs font-semibold text-slate-500">
          {revisions.length} historical snapshots retained
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Version</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Author / Changed By</th>
              <th className="py-3.5 px-4">Change Summary</th>
              <th className="py-3.5 px-4">Status Snapshot</th>
              <th className="py-3.5 px-4">Snapshot Created</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {revisions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  No revision records recorded.
                </td>
              </tr>
            ) : (
              revisions.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">v{r.versionNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.contentType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{r.changedByName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{r.changeSummary || 'Content updated'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {r.statusSnapshot || 'SNAPSHOT'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedRevision(r)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </button>
                    <button
                      onClick={() => handleRollback(r.id, r.versionNumber)}
                      className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Rollback
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Snapshot Modal */}
      {selectedRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Revision Snapshot</span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedRevision.contentType} - Version {selectedRevision.versionNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRevision(null)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono overflow-x-auto max-h-96">
              <pre className="text-slate-800">
                {JSON.stringify(selectedRevision.contentSnapshot, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
