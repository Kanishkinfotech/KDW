import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Eye, Edit3, Trash2, CheckCircle2, 
  Clock, Archive, RefreshCw, Send, History, ExternalLink, AlertCircle
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentPagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pages, setPages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const statusFilter = searchParams.get('status') || 'ALL';
  const templateFilter = searchParams.get('template') || 'ALL';
  const searchTerm = searchParams.get('search') || '';

  const fetchPages = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (templateFilter !== 'ALL') q.set('template', templateFilter);
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/content/pages?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setPages(json.data || []);
        setTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [statusFilter, templateFilter, searchTerm]);

  const handlePublish = async (id: string) => {
    if (!window.confirm('Are you sure you want to publish this page live to the storefront?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/content/pages/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        fetchPages();
      } else {
        alert(json.message || 'Failed to publish page');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this page from navigation?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/content/pages/${id}/archive`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) fetchPages();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this draft page?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/content/pages/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        fetchPages();
      } else {
        alert(json.message || 'Failed to delete page');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <ContentLayout
      title="Storefront Pages"
      subtitle="Manage information pages, legal policies, landing pages, and compliance documents."
      onRefresh={fetchPages}
      isLoading={loading}
      actions={
        <Link
          to="/admin/content/pages/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Page
        </Link>
      }
    >
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={searchTerm}
              onChange={e => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('search', e.target.value);
                else p.delete('search');
                setSearchParams(p);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => {
              const p = new URLSearchParams(searchParams);
              p.set('status', e.target.value);
              setSearchParams(p);
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={templateFilter}
            onChange={e => {
              const p = new URLSearchParams(searchParams);
              p.set('template', e.target.value);
              setSearchParams(p);
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Templates</option>
            <option value="STANDARD">Standard</option>
            <option value="POLICY">Policy</option>
            <option value="LANDING">Landing</option>
            <option value="CONTACT">Contact</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing {pages.length} of {total} pages
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Page Title & Slug</th>
                <th className="py-3.5 px-4">Template</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4">Revision</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No pages match current filters.
                  </td>
                </tr>
              ) : (
                pages.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{p.title}</div>
                      <div className="text-[11px] font-normal text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>/{p.slug}</span>
                        {p.status === 'PUBLISHED' && (
                          <a
                            href={`/pages/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.template}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ContentStatusBadge status={p.status} isPolicy={p.isPolicyPage} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.authorName || 'Editor'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">v{p.revisionNumber || 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.viewsCount || 0}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/content/pages/${p.id}/edit`)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Page"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {p.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublish(p.id)}
                          disabled={actionLoading === p.id}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Publish Live"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}

                      {p.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleArchive(p.id)}
                          disabled={actionLoading === p.id}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Archive Page"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      {p.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={actionLoading === p.id}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ContentLayout>
  );
}
