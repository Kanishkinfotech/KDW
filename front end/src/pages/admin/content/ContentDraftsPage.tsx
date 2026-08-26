import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileEdit, Search, Edit3, Send, Trash2, ArrowRight } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentDraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (typeFilter !== 'ALL') q.set('contentType', typeFilter);
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/content/drafts?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setDrafts(json.drafts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [typeFilter, searchTerm]);

  return (
    <ContentLayout
      title="Unified Drafts Workspace"
      subtitle="View and resume all unpublished pages, articles, FAQs, and marketing banners in draft or rejected status."
      onRefresh={fetchDrafts}
      isLoading={loading}
    >
      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search drafts by title or author..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="PAGE">Pages</option>
            <option value="BLOG">Blogs</option>
            <option value="FAQ">FAQs</option>
            <option value="BANNER">Banners</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {drafts.length} drafts in progress
        </div>
      </div>

      {/* Drafts List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Title & Context</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Author</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Last Updated</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No drafts currently in workspace.
                </td>
              </tr>
            ) : (
              drafts.map(d => (
                <tr key={`${d.type}-${d.id}`} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div>{d.title}</div>
                    {d.rejectionReason && (
                      <div className="text-[11px] text-rose-600 mt-0.5">
                        Feedback: {d.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {d.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{d.author}</td>
                  <td className="py-3.5 px-4">
                    <ContentStatusBadge status={d.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        if (d.type === 'PAGE') navigate(`/admin/content/pages/${d.id}/edit`);
                        else if (d.type === 'BLOG') navigate(`/admin/content/blogs/${d.id}/edit`);
                        else if (d.type === 'FAQ') navigate(`/admin/content/faqs`);
                        else navigate(`/admin/content/banners`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                    >
                      Resume <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ContentLayout>
  );
}
