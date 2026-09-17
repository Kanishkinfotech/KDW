import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  FileText,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import Button from '../../components/Button';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  articlesCount?: number;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  authorName?: string;
  tags?: string | null;
  views: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

interface OverviewData {
  categories: number;
  articles: number;
  faqs: number;
  publishedArticles: number;
  totalViews?: number;
  totalHelpful?: number;
  totalUnhelpful?: number;
}

export default function AdminKnowledgeBase() {
  // Overview Stats
  const [overview, setOverview] = useState<OverviewData>({
    categories: 0,
    articles: 0,
    faqs: 0,
    publishedArticles: 0,
    totalViews: 0,
    totalHelpful: 0,
    totalUnhelpful: 0
  });

  // Data collections
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);

  // Filters & State
  const [loading, setLoading] = useState(true);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('ALL');

  // Edit Modal State
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCategoryId, setArticleCategoryId] = useState('');
  const [articleTags, setArticleTags] = useState('');

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Overview Stats
  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/content/overview', {
        headers: getAuthHeader(),
        withCredentials: true
      });
      if (res.data.success && res.data.data) {
        setOverview(res.data.data);
      }
    } catch (_err) {
      console.error('Failed to load content overview');
    }
  }, []);

  // Fetch Categories for Filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/content/categories', {
        headers: getAuthHeader(),
        withCredentials: true
      });
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load categories');
    }
  }, []);

  // Fetch Articles
  const fetchArticles = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/content/articles', {
        params: {
          categoryId: articleCategoryFilter !== 'ALL' ? articleCategoryFilter : undefined,
          search: articleSearch.trim() || undefined
        },
        headers: getAuthHeader(),
        withCredentials: true
      });
      if (res.data.success) {
        setArticles(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load articles');
    }
  }, [articleCategoryFilter, articleSearch]);

  // Initial Load
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchCategories(), fetchArticles()]);
    setLoading(false);
  }, [fetchOverview, fetchCategories, fetchArticles]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ------------------------------------------
  // ARTICLE ACTIONS
  // ------------------------------------------
  const handleOpenArticleModal = (art: ArticleItem) => {
    setEditingArticle(art);
    setArticleTitle(art.title);
    setArticleContent(art.content);
    setArticleCategoryId(art.categoryId);
    try {
      const parsed = JSON.parse(art.tags || '[]');
      setArticleTags(Array.isArray(parsed) ? parsed.join(', ') : '');
    } catch {
      setArticleTags(art.tags || '');
    }
    setArticleModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim()) {
      toast.error('Article title is required');
      return;
    }
    if (!articleContent.trim()) {
      toast.error('Article content is required');
      return;
    }
    if (!articleCategoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!editingArticle) return;

    try {
      setActionLoading(true);
      const payload = {
        title: articleTitle.trim(),
        content: articleContent.trim(),
        categoryId: articleCategoryId,
        tags: articleTags.trim() || undefined
      };

      const res = await axios.patch(
        `/api/admin/content/articles/${editingArticle.id}`,
        payload,
        { headers: getAuthHeader(), withCredentials: true }
      );
      if (res.data.success) {
        toast.success('Article updated successfully');
        setArticleModalOpen(false);
        fetchArticles();
        fetchOverview();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save article');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;

    try {
      setActionLoading(true);
      const res = await axios.delete(`/api/admin/content/articles/${deleteTarget.id}`, {
        headers: getAuthHeader(),
        withCredentials: true
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Article deleted successfully');
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
        fetchArticles();
        fetchOverview();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete article');
    } finally {
      setActionLoading(false);
    }
  };

  const totalViews = overview.totalViews ?? articles.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalHelpful = overview.totalHelpful ?? articles.reduce((sum, a) => sum + (a.helpfulVotes || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-primary w-7 h-7" />
            Knowledge Base & Documentation
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage customer-facing help articles and technical documentation guides.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadAll}
            isLoading={loading}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real Stat Cards (Cleaned of Categories and FAQs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-600 block uppercase">Articles</span>
            <span className="text-2xl font-bold text-slate-900">{overview.articles || articles.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-600 block uppercase">Published Articles</span>
            <span className="text-2xl font-bold text-emerald-700">{overview.publishedArticles || articles.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-purple-600 block uppercase">Total Views</span>
            <span className="text-2xl font-bold text-slate-900">{totalViews.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-600 block uppercase">Helpful Feedback</span>
            <span className="text-2xl font-bold text-slate-900">{totalHelpful.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Articles Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Clean Header Bar without Categories, FAQs tabs, or New Article button */}
        <div className="flex border-b border-slate-200 px-6 py-4 bg-slate-50/50 justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-900">
              Articles ({articles.length})
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Live Knowledge Base
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles by title or keyword..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Category:</span>
              <select
                value={articleCategoryFilter}
                onChange={(e) => setArticleCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary bg-white w-full sm:w-48"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Articles Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs">Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No articles found matching criteria.</h3>
              <p className="text-xs text-slate-500">Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Article Title & Slug</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Views</th>
                    <th className="px-4 py-3 text-center">Helpful</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-bold text-slate-900">{art.title}</div>
                        <div className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <span>/docs/{art.slug}</span>
                          <a
                            href={`/docs/${art.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center"
                            title="Open public docs page"
                          >
                            <ExternalLink size={11} className="ml-0.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                          {art.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={13} className="text-slate-400" />
                          {art.views}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold">
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <ThumbsUp size={12} /> {art.helpfulVotes}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-500 flex items-center gap-0.5">
                            <ThumbsDown size={12} /> {art.unhelpfulVotes}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenArticleModal(art)}
                            className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ id: art.id, title: art.title });
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* EDIT ARTICLE MODAL */}
      {/* =================================================================== */}
      {articleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Edit Article
              </h3>
              <button
                onClick={() => setArticleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Article Title *</label>
                <input
                  type="text"
                  required
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="e.g. How to Access and Extract Downloadable ZIP Archives"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Category *</label>
                  <select
                    required
                    value={articleCategoryId}
                    onChange={(e) => setArticleCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={articleTags}
                    onChange={(e) => setArticleTags(e.target.value)}
                    placeholder="e.g. download, zip, licenses"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Article Content (Markdown supported) *</label>
                <textarea
                  rows={10}
                  required
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="Write documentation content here. Supports Markdown headings (###), bullet points, and code blocks..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setArticleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* =================================================================== */}
      {deleteConfirmOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-full">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Article</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-900">"{deleteTarget.title}"</span>? This will permanently remove this help article from the documentation center.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteTarget(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
