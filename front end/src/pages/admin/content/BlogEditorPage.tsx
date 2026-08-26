import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, Send, Clock, Globe, ArrowLeft, CheckCircle2, 
  AlertCircle, DollarSign, Image as ImageIcon, Star
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { BlockEditor, type ContentBlock } from '../../../components/admin/content/BlockEditor';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [isFeatured, setIsFeatured] = useState(false);
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
      const resCats = await fetch('/api/admin/content/blogs/categories', { credentials: 'include' });
      const jsonCats = await resCats.json();
      if (jsonCats.success) setCategories(jsonCats.categories || []);

      if (isEditing) {
        const res = await fetch(`/api/admin/content/blogs/${id}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success && json.post) {
          const b = json.post;
          setTitle(b.title || '');
          setSlug(b.slug || '');
          setExcerpt(b.excerpt || '');
          setCategoryId(b.categoryId || '');
          setCoverImage(b.coverImage || '');
          setStatus(b.status || 'DRAFT');
          setIsFeatured(Boolean(b.isFeatured));
          setBlocks(Array.isArray(b.contentJson) ? b.contentJson : []);
          setSeoTitle(b.seoTitle || '');
          setSeoDescription(b.seoDescription || '');
          setCanonicalUrl(b.canonicalUrl || '');
        }
      } else {
        setBlocks([
          { id: 'b1', type: 'text', title: 'Introduction', content: 'Introduce the core problem and why this guide matters...' },
          { id: 'b2', type: 'productCard', title: 'Featured KDW Tool Suite', price: '$29.99', ctaLabel: 'Get Instant Access' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title) return alert('Article title is required.');
    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        excerpt,
        categoryId: categoryId || null,
        coverImage,
        contentJson: blocks,
        seoTitle,
        seoDescription,
        canonicalUrl
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
        if (!isEditing && json.post?.id) {
          navigate(`/admin/content/blogs/${json.post.id}/edit`);
        }
        alert('Article saved successfully.');
      } else {
        alert(json.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!isEditing) return alert('Save draft first.');
    if (!coverImage) return alert('Cover image is required before publishing.');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/blogs/${id}/publish`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setStatus('PUBLISHED');
        alert('Article published live to storefront!');
      } else {
        alert(json.message || 'Failed to publish');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentLayout
      title={isEditing ? `Edit: ${title || 'Article'}` : 'Write New Article'}
      subtitle="Publish guides, automation blueprints, and product launch announcements."
      backUrl="/admin/content/blogs"
      backLabel="Back to Articles"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Publish Live
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                Cover Image URL
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
              />
              {coverImage && (
                <div className="mt-2 relative h-40 rounded-xl overflow-hidden border border-slate-200">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Article Content Blocks</h3>
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</span>
              <ContentStatusBadge status={status} />
            </div>
          </div>

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
