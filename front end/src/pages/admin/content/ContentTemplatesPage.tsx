import React, { useState, useEffect } from 'react';
import { Plus, LayoutTemplate, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('PAGE');
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/templates', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setTemplates(json.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return alert('Name and slug required.');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          slug,
          description,
          contentType,
          layoutJson: [
            { type: 'hero', title: name, subtitle: description },
            { type: 'text', title: 'Main Section', content: 'Sample template text' }
          ]
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setName('');
        setSlug('');
        setDescription('');
        fetchTemplates();
      } else {
        alert(json.message || 'Failed to create template');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      const res = await fetch(`/api/admin/content/templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        fetchTemplates();
      } else {
        alert(json.message || 'Cannot delete template');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="Content & Layout Templates"
      subtitle="Standardize structured page layouts, policy frameworks, and marketing blueprints."
      onRefresh={fetchTemplates}
      isLoading={loading}
      actions={
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {t.contentType}
                </span>
                {t.isDefault && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    DEFAULT
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">/{t.slug}</span>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Layout Template</h3>

            <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="e.g. Campaign Landing Page"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Content Type</label>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="PAGE">Page</option>
                  <option value="POLICY">Policy</option>
                  <option value="LANDING">Landing</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Purpose of this layout..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
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
                  {saving ? 'Creating...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
