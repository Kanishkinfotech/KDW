import React, { useState, useEffect } from 'react';
import { 
  Upload, Search, Folder, Trash2, Edit3, Image as ImageIcon, 
  FileText, Video, AlertTriangle, ShieldCheck, Copy, Check
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';

export default function ContentMediaLibraryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderFilter, setFolderFilter] = useState('ALL');
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [folder, setFolder] = useState('general');
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (folderFilter !== 'ALL') q.set('folder', folderFilter);
      if (unusedOnly) q.set('unusedOnly', 'true');
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/content/media?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setMedia(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [folderFilter, unusedOnly, searchTerm]);

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !url) return alert('Name and URL required.');
    setUploading(true);
    try {
      const res = await fetch('/api/admin/content/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fileName, url, altText: altText || fileName, folder })
      });
      const json = await res.json();
      if (json.success) {
        setShowUploadModal(false);
        setFileName('');
        setUrl('');
        setAltText('');
        fetchMedia();
      } else {
        alert(json.message || 'Failed to save media');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/content/media/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        fetchMedia();
      } else {
        alert(json.message || 'Cannot delete media');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (u: string, id: string) => {
    navigator.clipboard.writeText(u);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ContentLayout
      title="Centralized Media Library"
      subtitle="Organize digital brand assets, enforce accessibility alt-text, and prevent accidental deletion of in-use images."
      onRefresh={fetchMedia}
      isLoading={loading}
      actions={
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Upload className="w-4 h-4" /> Add Asset
        </button>
      }
    >
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search file name or alt text..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={folderFilter}
            onChange={e => setFolderFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Folders</option>
            <option value="general">General Assets</option>
            <option value="blogs">Blog Covers & Media</option>
            <option value="banners">Promotional Banners</option>
            <option value="products">Product Previews</option>
          </select>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <input
              type="checkbox"
              id="unused"
              checked={unusedOnly}
              onChange={e => setUnusedOnly(e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="unused" className="text-slate-700 font-semibold cursor-pointer">
              Show Unused Only
            </label>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {media.length} media assets
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between group">
            <div className="relative h-32 bg-slate-100 overflow-hidden">
              <img src={m.url} alt={m.altText} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
              {m.isUsed ? (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600/90 text-white backdrop-blur-xs">
                  IN USE
                </span>
              ) : (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/75 text-slate-200 backdrop-blur-xs">
                  UNUSED
                </span>
              )}
            </div>

            <div className="p-3 space-y-1">
              <div className="font-bold text-slate-800 text-xs truncate" title={m.fileName}>
                {m.fileName}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {m.dimensions || '1920x1080'} &bull; {m.folder}
              </div>
              {!m.altText && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <AlertTriangle className="w-3 h-3" /> Missing Alt
                </span>
              )}
            </div>

            <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
              <button
                onClick={() => copyToClipboard(m.url, m.id)}
                className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                title="Copy Image URL"
              >
                {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === m.id ? 'Copied' : 'Copy'}
              </button>

              <button
                onClick={() => handleDeleteMedia(m.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Delete Media Asset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload / Register Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Register Digital Media Asset</h3>

            <form onSubmit={handleCreateMedia} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">File Name *</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  placeholder="e.g. spring_promo_banner.jpg"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Media URL *</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Accessibility Alt Text</label>
                <input
                  type="text"
                  value={altText}
                  onChange={e => setAltText(e.target.value)}
                  placeholder="Descriptive image context for SEO..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Folder Category</label>
                <select
                  value={folder}
                  onChange={e => setFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="general">General</option>
                  <option value="blogs">Blogs</option>
                  <option value="banners">Banners</option>
                  <option value="products">Products</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {uploading ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
