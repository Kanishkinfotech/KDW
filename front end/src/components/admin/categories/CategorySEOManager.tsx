import { useState } from 'react';
import { Globe, Search, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CategorySEOManagerProps {
  categories: any[];
  onRefresh: () => void;
}

export default function CategorySEOManager({ categories, onRefresh }: CategorySEOManagerProps) {
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  const currentCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  const [seoTitle, setSeoTitle] = useState(currentCategory?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(currentCategory?.seoDescription || '');
  const [seoKeywords, setSeoKeywords] = useState(currentCategory?.seoKeywords || '');
  const [canonicalUrl, setCanonicalUrl] = useState(currentCategory?.canonicalUrl || '');
  const [noindex, setNoindex] = useState(!!currentCategory?.noindex);
  const [includeInSitemap, setIncludeInSitemap] = useState(currentCategory?.includeInSitemap !== false);

  const handleCategorySelect = (id: string) => {
    setSelectedCatId(id);
    const cat = categories.find(c => c.id === id);
    if (cat) {
      setSeoTitle(cat.seoTitle || `${cat.name} | KDW Digital Store`);
      setSeoDescription(cat.seoDescription || cat.shortDescription || '');
      setSeoKeywords(cat.seoKeywords || '');
      setCanonicalUrl(cat.canonicalUrl || `/categories/${cat.slug}`);
      setNoindex(!!cat.noindex);
      setIncludeInSitemap(cat.includeInSitemap !== false);
    }
  };

  const handleSave = async () => {
    if (!currentCategory) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.put(`/api/categories/${currentCategory.id}`, {
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        noindex,
        includeInSitemap
      }, { headers });

      toast.success('Category SEO updated');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update SEO');
    } finally {
      setIsSaving(false);
    }
  };

  const titleLength = seoTitle.length;
  const descLength = seoDescription.length;

  return (
    <div className="space-y-6">
      {/* Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Category SEO & Meta Health</h3>
          <p className="text-xs text-slate-500">Audit meta tags, search engine previews, and canonical indexability.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCatId}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors cursor-pointer shadow-md shadow-primary/20"
          >
            {isSaving ? 'Saving...' : 'Save SEO'}
          </button>
        </div>
      </div>

      {/* Google Search Result Simulation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Search size={14} /> Google Search SERP Snippet Preview
        </div>
        <div className="p-4 bg-slate-50 rounded-xl space-y-1 font-sans">
          <div className="text-xs text-slate-600 flex items-center gap-1 font-mono">
            <span>https://kanishkdigitalworld.com</span>
            <span className="text-slate-400">&gt; categories &gt; {currentCategory?.slug || 'category'}</span>
          </div>
          <h4 className="text-base text-blue-700 hover:underline font-medium cursor-pointer">
            {seoTitle || `${currentCategory?.name} | KDW Digital Store`}
          </h4>
          <p className="text-xs text-slate-600 line-clamp-2">
            {seoDescription || 'Browse and download high quality digital assets, design kits, and templates from Kanishk Digital World.'}
          </p>
        </div>
      </div>

      {/* Inputs & Character Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800">SEO Meta Title</label>
              <span className={`font-mono text-[10px] ${titleLength > 60 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {titleLength} / 60 chars
              </span>
            </div>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800">SEO Meta Description</label>
              <span className={`font-mono text-[10px] ${descLength > 160 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                {descLength} / 160 chars
              </span>
            </div>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Canonical URL</label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              className="w-full p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Target Keywords</label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="e.g. templates, social media, canva kits"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeInSitemap}
                onChange={(e) => setIncludeInSitemap(e.target.checked)}
                className="rounded text-primary focus:ring-primary/20"
              />
              <span>Include in XML Sitemap (`/sitemap.xml`)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={noindex}
                onChange={(e) => setNoindex(e.target.checked)}
                className="rounded text-primary focus:ring-primary/20"
              />
              <span>Noindex (Exclude from Google Indexing)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
