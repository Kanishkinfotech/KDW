import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, Send, Clock, Globe, ArrowLeft, CheckCircle2, 
  AlertCircle, DollarSign, Image as ImageIcon, Star, ExternalLink,
  Package, Tag, User, Sparkles, Trash2
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { BlockEditor, type ContentBlock } from '../../../components/admin/content/BlockEditor';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';
import { toast } from 'react-hot-toast';

export default function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorName, setAuthorName] = useState('KDW Editorial Team');
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(6);
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [isFeatured, setIsFeatured] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resCats, resProds] = await Promise.all([
        fetch('/api/admin/content/blogs/categories', { credentials: 'include' }),
        fetch('/api/products?limit=50')
      ]);
      const jsonCats = resCats.ok ? await resCats.json().catch(() => ({})) : {};
      const jsonProds = resProds.ok ? await resProds.json().catch(() => ({})) : {};

      if (jsonCats.success) setCategories(jsonCats.categories || []);
      if (jsonProds.success && Array.isArray(jsonProds.data)) setAvailableProducts(jsonProds.data);

      if (isEditing && id) {
        const res = await fetch(`/api/admin/content/blogs/${id}`, { credentials: 'include' });
        const json = res.ok ? await res.json().catch(() => ({})) : {};
        if (json.success && json.post) {
          const b = json.post;
          setTitle(b.title || '');
          setSlug(b.slug || '');
          setExcerpt(b.excerpt || '');
          setCategoryId(b.categoryId || '');
          setAuthorName(b.authorName || 'KDW Editorial Team');
          setReadingTimeMinutes(b.readingTimeMinutes || 6);
          setCoverImage(b.coverImage || '');
          setStatus(b.status || 'DRAFT');
          setIsFeatured(Boolean(b.isFeatured));
          setTagsInput(Array.isArray(b.tags) ? b.tags.join(', ') : '');
          setSelectedProductIds(Array.isArray(b.relatedProductIds) ? b.relatedProductIds : []);
          setBlocks(Array.isArray(b.contentJson) ? b.contentJson : []);
          setSeoTitle(b.seoTitle || '');
          setSeoDescription(b.seoDescription || '');
          setCanonicalUrl(b.canonicalUrl || '');
        }
      } else {
        setBlocks([
          { id: 'b1', type: 'heading', level: 2, text: '01. Executive Summary & Context', title: '01. Context' },
          { id: 'b2', type: 'paragraph', text: 'Provide clear, practical context and why this guide directly accelerates builder workflows.', content: 'Provide clear, practical context and why this guide directly accelerates builder workflows.' },
          { id: 'b3', type: 'checklist', title: 'Key Takeaways', items: ['Modular architectural principle 1', 'Implementation checkpoint 2', 'Verification & delivery guideline 3'], features: ['Modular architectural principle 1', 'Implementation checkpoint 2', 'Verification & delivery guideline 3'] },
          { id: 'b4', type: 'quote', text: 'Simplicity and deterministic clarity are the highest forms of craftsmanship.', content: 'Simplicity and deterministic clarity are the highest forms of craftsmanship.', subtitle: 'KDW Philosophy' }
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load article editor data');
    } finally {
      setLoading(false);
    }
  };

  const parseTags = () => {
    return tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  };

  const getCleanSlug = () => {
    return (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error('Article title is required.');
      return;
    }
    setSaving(true);
    try {
      const selectedCategoryObj = categories.find(c => c.id === categoryId);
      const cleanSlug = getCleanSlug();
      const payload = {
        title: title.trim(),
        slug: cleanSlug,
        excerpt: excerpt.trim(),
        categoryId: categoryId || null,
        categoryName: selectedCategoryObj?.name || null,
        authorName: authorName.trim() || 'KDW Editorial Team',
        readingTimeMinutes: Number(readingTimeMinutes) || 5,
        coverImage: coverImage.trim(),
        isFeatured,
        status: 'DRAFT',
        tags: parseTags(),
        relatedProductIds: selectedProductIds,
        contentJson: blocks,
        seoTitle: seoTitle.trim() || title.trim(),
        seoDescription: seoDescription.trim() || excerpt.trim(),
        canonicalUrl: canonicalUrl.trim() || `/blog/${cleanSlug}`
      };

      const url = isEditing ? `/api/admin/content/blogs/${id}` : '/api/admin/content/blogs';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isEditing ? 'Article draft updated successfully.' : 'Article draft created successfully.');
        navigate('/admin/content/blogs');
      } else {
        toast.error(json.message || 'Failed to save article.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving article draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!title.trim()) {
      toast.error('Article title is required.');
      return;
    }
    setSaving(true);
    try {
      const selectedCategoryObj = categories.find(c => c.id === categoryId);
      const cleanSlug = getCleanSlug();
      const payload = {
        title: title.trim(),
        slug: cleanSlug,
        excerpt: excerpt.trim(),
        categoryId: categoryId || null,
        categoryName: selectedCategoryObj?.name || null,
        authorName: authorName.trim() || 'KDW Editorial Team',
        readingTimeMinutes: Number(readingTimeMinutes) || 5,
        coverImage: coverImage.trim(),
        isFeatured,
        status: 'PUBLISHED',
        tags: parseTags(),
        relatedProductIds: selectedProductIds,
        contentJson: blocks,
        seoTitle: seoTitle.trim() || title.trim(),
        seoDescription: seoDescription.trim() || excerpt.trim(),
        canonicalUrl: canonicalUrl.trim() || `/blog/${cleanSlug}`
      };

      if (!isEditing) {
        // Direct Publish for New Article
        const res = await fetch('/api/admin/content/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Article published live to the KDW Journal!');
          navigate('/admin/content/blogs');
        } else {
          toast.error(json.message || 'Failed to publish article.');
        }
      } else {
        // Save updates and publish existing article
        const resUpdate = await fetch(`/api/admin/content/blogs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        const jsonUpdate = await resUpdate.json();

        if (jsonUpdate.success) {
          await fetch(`/api/admin/content/blogs/${id}/publish`, {
            method: 'POST',
            credentials: 'include'
          });
          setStatus('PUBLISHED');
          toast.success('Article published live to the KDW Journal!');
          navigate('/admin/content/blogs');
        } else {
          toast.error(jsonUpdate.message || 'Failed to publish article.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error publishing article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !isEditing) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${title || 'this article'}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/content/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Article deleted successfully.');
        navigate('/admin/content/blogs');
      } else {
        toast.error(json.message || 'Failed to delete article.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting article.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ContentLayout
      title={isEditing ? `Edit: ${title || 'Article'}` : 'Write New Article'}
      subtitle="Publish guides, automation blueprints, and product launch announcements."
      backUrl="/admin/content/blogs"
      backLabel="Back to Articles"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {slug && (
            <Link
              to={`/blog/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Preview Live
            </Link>
          )}

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Delete Article"
            >
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || deleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={saving || deleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Publish Live
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main 2-Column Editor Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (!isEditing) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                }}
                placeholder="e.g. 5 Self-Hosted n8n Workflows That Scale"
                className="w-full text-base font-bold px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                    /blog/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="KDW Editorial Team"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reading Time (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={readingTimeMinutes}
                  onChange={e => setReadingTimeMinutes(parseInt(e.target.value, 10) || 5)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Article Excerpt
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Compelling 2-sentence summary for card previews..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cover Image URL (Landscape 16:9 Recommended)
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
              />
              {coverImage && (
                <div className="mt-2 relative aspect-[16/9] max-h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="AI, Automation, Workflows, Engineering"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Structured Block Content */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Article Content Blocks</h3>
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>
        </div>

        {/* Right Sidebar Details */}
        <div className="space-y-6">
          
          {/* Status & Feature Badge */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</span>
              <ContentStatusBadge status={status} />
            </div>

            <label className="flex items-center gap-2 pt-2 border-t border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">Pin as Featured Hero Article</span>
            </label>
          </div>

          {/* Linked Products for Attribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#5b21b6]" /> Linked KDW Products
            </span>
            <p className="text-[11px] text-slate-500">
              Select products to showcase at the bottom of the publication.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-2 pt-1">
              {availableProducts.map(p => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50 border-[#5b21b6]/40 text-[#5b21b6] font-bold' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedProductIds(prev => [...prev, p.id]);
                        } else {
                          setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded-sm text-[#5b21b6]"
                    />
                    <span className="truncate flex-1">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SEO Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" /> Article SEO
            </span>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={title}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  placeholder="Summary snippet for search engines..."
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </ContentLayout>
  );
}
