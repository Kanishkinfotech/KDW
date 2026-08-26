import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, BookOpen, Star, Trash2, Edit3, 
  Eye, Send, Archive, RefreshCw, DollarSign, Clock, ExternalLink
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentBlogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const statusFilter = searchParams.get('status') || 'ALL';
  const categoryFilter = searchParams.get('category') || 'ALL';
  const featuredFilter = searchParams.get('featured') || 'ALL';
  const searchTerm = searchParams.get('search') || '';

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (categoryFilter !== 'ALL') q.set('categoryId', categoryFilter);
      if (featuredFilter !== 'ALL') q.set('isFeatured', featuredFilter);
      if (searchTerm) q.set('search', searchTerm);

      const [resPosts, resCats] = await Promise.all([
        fetch(`/api/admin/content/blogs?${q.toString()}`, { credentials: 'include' }),
        fetch('/api/admin/content/blogs/categories', { credentials: 'include' })
      ]);

      const jsonPosts = await resPosts.json();
      const jsonCats = await resCats.json();

      if (jsonPosts.success) {
        setPosts(jsonPosts.data || []);
        setTotal(jsonPosts.pagination?.total || 0);
      }
      if (jsonCats.success) {
        setCategories(jsonCats.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter, categoryFilter, featuredFilter, searchTerm]);

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/content/blogs/${id}/featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isFeatured: !current, featuredOrder: 1 })
      });
      const json = await res.json();
      if (json.success) fetchBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="Articles & Blog Posts"
      subtitle="Publish tutorials, automation guides, design resources, and track product conversion attribution."
      onRefresh={fetchBlogs}
      isLoading={loading}
      actions={
        <Link
          to="/admin/content/blogs/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Blog Post
        </Link>
      }
    >
      {/* Filters & Categories Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
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
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => {
              const p = new URLSearchParams(searchParams);
              p.set('category', e.target.value);
              setSearchParams(p);
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={featuredFilter}
            onChange={e => {
              const p = new URLSearchParams(searchParams);
              p.set('featured', e.target.value);
              setSearchParams(p);
            }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">Featured Status</option>
            <option value="true">Featured Only</option>
            <option value="false">Standard Only</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {total} articles found
        </div>
      </div>

      {/* Blogs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Article</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Read Time</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Attributed Sales</th>
                <th className="py-3.5 px-4">Revenue</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No articles found matching criteria.
                  </td>
                </tr>
              ) : (
                posts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {p.coverImage && (
                          <img src={p.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            {p.isFeatured && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                            <span className="line-clamp-1">{p.title}</span>
                          </div>
                          <div className="text-[11px] font-normal text-slate-400">by {p.authorName || 'Editorial'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {p.category?.name || p.categoryName || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ContentStatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{p.readingTimeMinutes || 3} min</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.viewsCount || 0}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">{p.purchasesCount || 0} orders</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">${(p.revenueAttributed || 0).toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(p.id, p.isFeatured)}
                        className={`p-1.5 rounded-lg transition-all ${
                          p.isFeatured ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500'
                        }`}
                        title={p.isFeatured ? 'Unfeature' : 'Feature on Homepage'}
                      >
                        <Star className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/admin/content/blogs/${p.id}/edit`)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Article"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
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
