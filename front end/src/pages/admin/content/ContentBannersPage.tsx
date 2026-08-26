import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Image as ImageIcon, Edit3, Trash2, Play, Pause, 
  Eye, MousePointerClick, DollarSign, AlertCircle, Calendar
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placementFilter, setPlacementFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [name, setName] = useState('');
  const [placement, setPlacement] = useState('HOMEPAGE_HERO');
  const [desktopImage, setDesktopImage] = useState('');
  const [altText, setAltText] = useState('');
  const [headline, setHeadline] = useState('');
  const [supportingText, setSupportingText] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (placementFilter !== 'ALL') q.set('placement', placementFilter);
      if (statusFilter !== 'ALL') q.set('status', statusFilter);

      const res = await fetch(`/api/admin/content/banners?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setBanners(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [placementFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingBanner(null);
    setName('');
    setPlacement('HOMEPAGE_HERO');
    setDesktopImage('');
    setAltText('');
    setHeadline('');
    setSupportingText('');
    setCtaLabel('');
    setCtaUrl('');
    setPriority(1);
    setShowModal(true);
  };

  const openEditModal = (b: any) => {
    setEditingBanner(b);
    setName(b.name);
    setPlacement(b.placement);
    setDesktopImage(b.desktopImage);
    setAltText(b.altText || '');
    setHeadline(b.headline || '');
    setSupportingText(b.supportingText || '');
    setCtaLabel(b.ctaLabel || '');
    setCtaUrl(b.ctaUrl || '');
    setPriority(b.priority || 1);
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
          placement,
          desktopImage,
          altText,
          headline,
          supportingText,
          ctaLabel,
          ctaUrl,
          priority
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
    if (!window.confirm('Delete this banner promotional asset?')) return;
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

  return (
    <ContentLayout
      title="Promotional Banners & Placements"
      subtitle="Control hero carousels, announcement strips, checkout offers, and measured conversion CTRs."
      onRefresh={fetchBanners}
      isLoading={loading}
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      }
    >
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={placementFilter}
            onChange={e => setPlacementFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Placements (9 Slots)</option>
            <option value="HOMEPAGE_HERO">Homepage Hero</option>
            <option value="HOMEPAGE_PROMO_STRIP">Homepage Promo Strip</option>
            <option value="CATEGORY_HEADER">Category Header</option>
            <option value="PRODUCT_PAGE">Product Page</option>
            <option value="CHECKOUT_OFFER">Checkout Offer</option>
            <option value="DASHBOARD_NOTICE">Dashboard Notice</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PAUSED">Paused</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {banners.length} banners configured
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map(b => {
          const ctr = b.impressionsCount > 0 ? ((b.clicksCount / b.impressionsCount) * 100).toFixed(2) : '0.00';
          return (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img src={b.desktopImage} alt={b.altText} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      Priority #{b.priority || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-xs">
                      {b.placement.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <ContentStatusBadge status={b.status} />
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                  {b.headline && <p className="text-xs font-semibold text-slate-700">{b.headline}</p>}
                  {b.supportingText && <p className="text-xs text-slate-500 line-clamp-2">{b.supportingText}</p>}
                  {b.ctaLabel && (
                    <div className="text-xs text-blue-600 font-semibold pt-1">
                      CTA: {b.ctaLabel} &rarr; {b.ctaUrl}
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
                    <span className="font-bold text-emerald-700">${(b.revenueAttributed || 0).toFixed(2)}</span>
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
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editingBanner ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}
            </h3>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Banner Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Spring Fest 30% Off Hero"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Placement Slot</label>
                  <select
                    value={placement}
                    onChange={e => setPlacement(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="HOMEPAGE_HERO">Homepage Hero</option>
                    <option value="HOMEPAGE_PROMO_STRIP">Homepage Promo Strip</option>
                    <option value="CATEGORY_HEADER">Category Header</option>
                    <option value="PRODUCT_PAGE">Product Page</option>
                    <option value="CHECKOUT_OFFER">Checkout Offer</option>
                    <option value="DASHBOARD_NOTICE">Dashboard Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Priority Rank (1 = Top)</label>
                  <input
                    type="number"
                    min={1}
                    value={priority}
                    onChange={e => setPriority(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Desktop Image URL *</label>
                <input
                  type="text"
                  required
                  value={desktopImage}
                  onChange={e => setDesktopImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Accessibility Alt Text *</label>
                <input
                  type="text"
                  required
                  value={altText}
                  onChange={e => setAltText(e.target.value)}
                  placeholder="Describe the promotion for screen readers..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Headline Text</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. Supercharge Your Blueprints"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CTA Button Label</label>
                  <input
                    type="text"
                    value={ctaLabel}
                    onChange={e => setCtaLabel(e.target.value)}
                    placeholder="e.g. Shop Now"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CTA Destination URL</label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={e => setCtaUrl(e.target.value)}
                    placeholder="/bundles"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
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
