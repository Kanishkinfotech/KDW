import { useState } from 'react';
import { Image as ImageIcon, Upload, Eye, Check, RefreshCw } from 'lucide-react';
import { uploadImage } from '../../../utils/uploadImage';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CategoryBannersManagerProps {
  categories: any[];
  onRefresh: () => void;
}

export default function CategoryBannersManager({ categories, onRefresh }: CategoryBannersManagerProps) {
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const currentCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  const [bannerUrl, setBannerUrl] = useState(currentCategory?.banner || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(currentCategory?.image || '');
  const [overlayOpacity, setOverlayOpacity] = useState(40);
  const [textColor, setTextColor] = useState('WHITE');

  const handleCategorySelect = (id: string) => {
    setSelectedCatId(id);
    const cat = categories.find(c => c.id === id);
    if (cat) {
      setBannerUrl(cat.banner || '');
      setThumbnailUrl(cat.image || '');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'banner' | 'image') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const url = await uploadImage(file, 'categories', setUploadProgress);
        if (url) {
          if (field === 'banner') setBannerUrl(url);
          else setThumbnailUrl(url);
          toast.success(`${field === 'banner' ? 'Hero banner' : 'Thumbnail'} uploaded`);
        }
      } catch (err: any) {
        toast.error(err.message || 'Upload failed');
      }
    }
  };

  const handleSave = async () => {
    if (!currentCategory) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminAuth');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await axios.put(`/api/categories/${currentCategory.id}`, {
        banner: bannerUrl,
        image: thumbnailUrl,
        bannerConfig: {
          overlayOpacity,
          textColor
        }
      }, { headers });

      toast.success('Category banner & media updated successfully');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to save banner');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Category Banners & Media Customizer</h3>
          <p className="text-xs text-slate-500">Configure visual hero banners, cards, and overlay contrast for landing pages.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCatId}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
            {isSaving ? 'Saving...' : 'Save Media'}
          </button>
        </div>
      </div>

      {/* Live Storefront Hero Preview */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative min-h-[220px] flex items-center justify-center p-8 text-center">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Hero Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div 
          className="absolute inset-0 bg-slate-950" 
          style={{ opacity: overlayOpacity / 100 }}
        />

        <div className="relative z-10 max-w-xl space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
            Digital Asset Collection
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {currentCategory?.name || 'Category Name'}
          </h2>
          <p className="text-xs text-slate-200 max-w-md mx-auto line-clamp-2">
            {currentCategory?.description || currentCategory?.shortDescription || 'Explore high quality curated digital assets, source files and design kits.'}
          </p>
        </div>
      </div>

      {/* Media Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Banner Upload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="font-bold text-xs text-slate-900 block">Desktop/Hero Banner</span>
          <input
            type="text"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="Image URL or upload file"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e, 'banner')}
            className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
        </div>

        {/* Thumbnail Upload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="font-bold text-xs text-slate-900 block">Category Thumbnail / Card Icon</span>
          <input
            type="text"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Thumbnail URL or upload file"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e, 'image')}
            className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
