import { useState } from 'react';
import { Sparkles, Calendar, Clock, Star, ArrowUpRight, Check, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface FeaturedCategoriesManagerProps {
  categories: any[];
  onRefresh: () => void;
}

export default function FeaturedCategoriesManager({ categories, onRefresh }: FeaturedCategoriesManagerProps) {
  const featured = categories.filter(c => c.featured);
  const nonFeatured = categories.filter(c => !c.featured);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [placement, setPlacement] = useState('HOMEPAGE_CARD');
  const [priority, setPriority] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddFeatured = async () => {
    if (!selectedCatId) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.put(`/api/categories/${selectedCatId}`, {
        featured: true,
        featuredPlacement: placement,
        featuredPriority: Number(priority)
      }, { headers });

      toast.success('Category marked as featured');
      setSelectedCatId('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to feature category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFeatured = async (catId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.put(`/api/categories/${catId}`, {
        featured: false,
        featuredPlacement: null,
        featuredPriority: 0
      }, { headers });

      toast.success('Featured status removed');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Featured Placement Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={18} />
          <h3 className="text-sm font-black text-slate-900">Promote / Feature Category</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Category</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">-- Choose Category --</option>
              {nonFeatured.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Placement Area</label>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="HOMEPAGE_CARD">Homepage Category Card</option>
              <option value="MAIN_NAV">Main Nav Spotlight</option>
              <option value="HERO_BANNER">Hero Banner Spotlight</option>
              <option value="CAMPAIGN_LANDING">Campaign Landing Feature</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Priority (1–100)</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddFeatured}
              disabled={isSubmitting || !selectedCatId}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
            >
              <Plus size={14} /> Add Featured Placement
            </button>
          </div>
        </div>
      </div>

      {/* Featured Placements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featured.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No featured categories configured. Add a category above to highlight it on storefront landing pages.
          </div>
        ) : (
          featured.map(cat => (
            <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {cat.image || cat.banner ? (
                    <img src={cat.image || cat.banner} alt={cat.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                      {cat.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{cat.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">/{cat.slug}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFeatured(cat.id)}
                  title="Remove from featured"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Placement:</span>
                  <span className="font-bold text-slate-800 uppercase">{cat.featuredPlacement || 'HOMEPAGE_CARD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Priority:</span>
                  <span className="font-bold text-amber-700">#{cat.featuredPriority || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
