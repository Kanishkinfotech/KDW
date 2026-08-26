import React, { useState, useEffect } from 'react';
import { Plus, Menu, Edit3, Trash2, Link as LinkIcon, MoveUp, MoveDown } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';

export default function ContentNavigationPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('HEADER_PRIMARY');
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/navigation', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setMenus(json.menus || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const openCreateModal = () => {
    setEditingMenu(null);
    setName('');
    setSlug('');
    setLocation('HEADER_PRIMARY');
    setItems([
      { label: 'Products', url: '/products' },
      { label: 'Bundles', url: '/bundles' },
      { label: 'Blog', url: '/blog' }
    ]);
    setShowModal(true);
  };

  const openEditModal = (m: any) => {
    setEditingMenu(m);
    setName(m.name);
    setSlug(m.slug);
    setLocation(m.location);
    setItems(Array.isArray(m.itemsJson) ? m.itemsJson : []);
    setShowModal(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return alert('Name and slug required.');
    setSaving(true);
    try {
      const url = editingMenu ? `/api/admin/content/navigation/${editingMenu.id}` : '/api/admin/content/navigation';
      const method = editingMenu ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, slug, location, itemsJson: items })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchMenus();
      } else {
        alert(json.message || 'Failed to save menu');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete navigation menu?')) return;
    try {
      const res = await fetch(`/api/admin/content/navigation/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) fetchMenus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="Navigation & Storefront Menus"
      subtitle="Configure main header navigation, footer legal links, and mobile slide-out drawer links."
      onRefresh={fetchMenus}
      isLoading={loading}
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Menu
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menus.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {m.location}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{m.name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(m)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {(m.itemsJson || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{item.url}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Menu Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editingMenu ? 'Edit Menu Structure' : 'Create Navigation Menu'}
            </h3>

            <form onSubmit={handleSaveMenu} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Menu Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!editingMenu) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Placement Location</label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="HEADER_PRIMARY">Main Header Primary</option>
                  <option value="HEADER_SECONDARY">Top Header Bar</option>
                  <option value="FOOTER_COL_1">Footer Column 1 (Legal/Policies)</option>
                  <option value="FOOTER_COL_2">Footer Column 2 (Products/Bundles)</option>
                  <option value="MOBILE_DRAWER">Mobile Side Drawer</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase">Menu Link Items</label>
                  <button
                    type="button"
                    onClick={() => setItems([...items, { label: 'New Link', url: '/' }])}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + Add Link
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={item.label}
                      onChange={e => {
                        const next = [...items];
                        next[idx].label = e.target.value;
                        setItems(next);
                      }}
                      className="w-1/2 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      value={item.url}
                      onChange={e => {
                        const next = [...items];
                        next[idx].url = e.target.value;
                        setItems(next);
                      }}
                      className="w-1/2 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
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
                  {saving ? 'Saving...' : 'Save Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
