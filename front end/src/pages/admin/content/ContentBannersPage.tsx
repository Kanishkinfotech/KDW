import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Image as ImageIcon, Edit3, Trash2, Play, Pause, 
  Eye, MousePointerClick, AlertCircle, Calendar, ExternalLink, Globe, LayoutGrid
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [name, setName] = useState('');
  const [desktopImage, setDesktopImage] = useState('');
  const [altText, setAltText] = useState('');
  const [headline, setHeadline] = useState('');
  const [supportingText, setSupportingText] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState('ACTIVE');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('placement', 'HOMEPAGE_HERO');
      if (statusFilter !== 'ALL') q.set('status', statusFilter);

      const res = await fetch(`/api/admin/content/banners?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setBanners(json.data || json.banners || []);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [statusFilter]);

  const openCreateModal = () => {
    setEditingBanner(null);
    setName('');
    setDesktopImage('');
    setAltText('');
    setHeadline('');
    setSupportingText('');
    setCtaLabel('');
    setCtaUrl('');
    setPriority(1);
    setStatus('ACTIVE');
    setStartAt('');
    setEndAt('');
    setShowModal(true);
  };

  const openEditModal = (b: any) => {
    setEditingBanner(b);
    setName(b.name || '');
    setDesktopImage(b.desktopImage || '');
    setAltText(b.altText || '');
    setHeadline(b.headline || '');
    setSupportingText(b.supportingText || '');
    setCtaLabel(b.ctaLabel || '');
    setCtaUrl(b.ctaUrl || '');
    setPriority(b.priority || 1);
    setStatus(b.status || 'ACTIVE');
    setStartAt(b.startAt ? new Date(b.startAt).toISOString().slice(0, 16) : '');
    setEndAt(b.endAt ? new Date(b.endAt).toISOString().slice(0, 16) : '');
    setShowModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !desktopImage || !altText) {
      return alert('Name, Desktop Image URL, and Alt Text are required.');
    }

    setSaving(true);
    try {
      const url = editingBanner ? `/api/admin/content/banners/${editingBanner.id}` : '/api/admin/content/banners';
      const method = editingBanner ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          placement: 'HOMEPAGE_HERO',
          desktopImage,
          altText,
          headline,
          supportingText,
          ctaLabel,
          ctaUrl,
          priority,
          status,
          startAt: startAt ? new Date(startAt).toISOString() : null,
          endAt: endAt ? new Date(endAt).toISOString() : null
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchBanners();
      } else {
        alert(json.message || 'Failed to save banner');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/content/banners/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this banner?')) return;
    try {
      const res = await fetch(`/api/admin/content/banners/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const getPlacementDisplay = (placement: string) => {
    return { label: 'Homepage Hero', isPage: false, previewUrl: '/' };
  };

  return (
    <ContentLayout
      title="Promotional Banners & Placements"
      subtitle="Control storefront Homepage Hero carousel banners, priorities, active states, and live engagement metrics."
      onRefresh={fetchBanners}
      isLoading={loading}
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      }
    >
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>Placement:</span>
            <span className="px-3 py-1.5 bg-purple-50 text-[#5b21b6] border border-purple-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5">
              Homepage Hero
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PAUSED">Paused</option>
              <option value="DRAFT">Draft</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {banners.length} {banners.length === 1 ? 'banner' : 'banners'} configured
        </div>
      </div>

      {/* Empty State */}
      {!loading && banners.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Banners Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== 'ALL'
              ? 'No banners match your current status filter. Try changing status to All.'
              : 'Create promotional banners to display on the storefront Homepage Hero carousel.'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create First Banner
          </button>
        </div>
      )}

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map(b => {
          const ctr = b.impressionsCount > 0 ? ((b.clicksCount / b.impressionsCount) * 100).toFixed(2) : '0.00';
          const placementInfo = getPlacementDisplay(b.placement || '');

          return (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 group">
                  <img 
                    src={b.desktopImage} 
                    alt={b.altText || b.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      Priority #{b.priority || 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-xs ${
                      placementInfo.isPage ? 'bg-emerald-600/90' : 'bg-blue-600/90'
                    }`}>
                      {placementInfo.label}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <ContentStatusBadge status={b.status} />
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                    {placementInfo.previewUrl && (
                      <a
                        href={placementInfo.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Preview on storefront"
                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {b.headline && <p className="text-xs font-semibold text-slate-700">{b.headline}</p>}
                  {b.supportingText && <p className="text-xs text-slate-500 line-clamp-2">{b.supportingText}</p>}
                  
                  {b.ctaLabel && (
                    <div className="text-xs text-blue-600 font-semibold pt-1 flex items-center gap-1">
                      <span>CTA: {b.ctaLabel}</span>
                      {b.ctaUrl && <span className="text-slate-400">&rarr; {b.ctaUrl}</span>}
                    </div>
                  )}

                  {(b.startAt || b.endAt) && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {b.startAt ? new Date(b.startAt).toLocaleDateString() : 'Immediate'} 
                        {' '}&rarr;{' '} 
                        {b.endAt ? new Date(b.endAt).toLocaleDateString() : 'No expiry'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Impressions</span>
                    <span className="font-bold text-slate-800">{b.impressionsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Clicks</span>
                    <span className="font-bold text-slate-800">{b.clicksCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">CTR</span>
                    <span className="font-bold text-blue-600">{ctr}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Revenue</span>
                    <span className="font-bold text-emerald-700">₹{(b.revenueAttributed || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(b.id, b.status)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-all"
                    title={b.status === 'ACTIVE' ? 'Pause Banner' : 'Activate Banner'}
                  >
                    {b.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                    title="Edit Banner"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingBanner ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Live Storefront Asset
              </span>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Banner Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Spring Fest 30% Off Promotion"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target Placement *</label>
                  <select
                    value="HOMEPAGE_HERO"
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-700 focus:outline-none cursor-not-allowed"
                  >
                    <option value="HOMEPAGE_HERO">Homepage Hero (Default)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Active (Live)</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Desktop Image URL *</label>
                <input
                  type="text"
                  required
                  value={desktopImage}
                  onChange={e => setDesktopImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
                {desktopImage && (
                  <div className="mt-2 h-20 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img 
                      src={desktopImage} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Accessibility Alt Text *</label>
                <input
                  type="text"
                  required
                  value={altText}
                  onChange={e => setAltText(e.target.value)}
                  placeholder="Describe the banner promotion for accessibility..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Headline Text</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. Supercharge Your Blueprints"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Priority Rank</label>
                  <input
                    type="number"
                    min={1}
                    value={priority}
                    onChange={e => setPriority(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Supporting Description</label>
                <textarea
                  rows={2}
                  value={supportingText}
                  onChange={e => setSupportingText(e.target.value)}
                  placeholder="Optional extra promotional context or discount coupon reminder..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CTA Button Label</label>
                  <input
                    type="text"
                    value={ctaLabel}
                    onChange={e => setCtaLabel(e.target.value)}
                    placeholder="e.g. Explore Bundles"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CTA Destination URL</label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={e => setCtaUrl(e.target.value)}
                    placeholder="/bundles"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Schedule Start (Optional)</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={e => setStartAt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Schedule End (Optional)</label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={e => setEndAt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
