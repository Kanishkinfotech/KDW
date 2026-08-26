import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { SupportLayout } from '../../../components/admin/support/SupportLayout';

export default function CannedResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCanned = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (categoryFilter !== 'ALL') q.set('category', categoryFilter);
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/support/canned-responses?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setResponses(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanned();
  }, [categoryFilter, searchTerm]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('GENERAL');
    setBody('Hello {{customer.first_name}},\n\nThank you for reaching out regarding Ticket #{{ticket.number}}.\n\nBest regards,\nKDW Support Team');
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setBody(item.body);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !body) return alert('Name and body are required.');

    setSaving(true);
    try {
      const url = editingItem
        ? `/api/admin/support/canned-responses/${editingItem.id}`
        : '/api/admin/support/canned-responses';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, category, body })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchCanned();
      } else {
        alert(json.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this canned response template?')) return;
    try {
      const res = await fetch(`/api/admin/support/canned-responses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) fetchCanned();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SupportLayout
      title="Canned Response Templates"
      subtitle="Pre-approved responses with dynamic variables for faster customer issue resolution."
      onRefresh={fetchCanned}
      isLoading={loading}
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Template
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {responses.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">v{item.version || 1}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-line leading-relaxed">
                {item.body}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>{(item.variablesJson || []).length} variables</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingItem ? 'Edit Canned Response' : 'Create Canned Response'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Download Link Refresh Notice"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="GENERAL">General</option>
                  <option value="DOWNLOAD">Download & Access</option>
                  <option value="LICENCE">Licence & Activation</option>
                  <option value="REFUND">Refund & Billing</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="DATA_REQUEST">Data & Privacy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Template Message Body *</label>
                <textarea
                  rows={6}
                  required
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported variables: <code>{'{{customer.first_name}}'}</code>, <code>{'{{ticket.number}}'}</code>, <code>{'{{order.number}}'}</code>, <code>{'{{download.link}}'}</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SupportLayout>
  );
}
