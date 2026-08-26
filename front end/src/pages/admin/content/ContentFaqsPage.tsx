import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, HelpCircle, Edit3, Trash2, AlertTriangle, 
  ThumbsUp, ThumbsDown, Eye, CheckCircle2, ArrowUpDown
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function ContentFaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [scopeType, setScopeType] = useState('GLOBAL');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (scopeFilter !== 'ALL') q.set('scope', scopeFilter);
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/content/faqs?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setFaqs(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [scopeFilter, searchTerm]);

  const openCreateModal = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setScopeType('GLOBAL');
    setDisplayOrder(faqs.length + 1);
    setShowModal(true);
  };

  const openEditModal = (faq: any) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setScopeType(faq.scopeType);
    setDisplayOrder(faq.displayOrder || 0);
    setShowModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) return alert('Question and answer required.');
    setSaving(true);
    try {
      const url = editingFaq ? `/api/admin/content/faqs/${editingFaq.id}` : '/api/admin/content/faqs';
      const method = editingFaq ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question, answer, scopeType, displayOrder })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchFaqs();
      } else {
        alert(json.message || 'Failed to save FAQ');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkOutdated = async (id: string) => {
    const reason = prompt('Reason for marking this FAQ as outdated:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/admin/content/faqs/${id}/mark-outdated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (json.success) fetchFaqs();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this FAQ entry?')) return;
    try {
      const res = await fetch(`/api/admin/content/faqs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ContentLayout
      title="Frequently Asked Questions (FAQs)"
      subtitle="Manage global customer support answers, product-specific licensing terms, and duplicate question screening."
      onRefresh={fetchFaqs}
      isLoading={loading}
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      }
    >
      {/* Search & Scope Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
          >
            <option value="ALL">All Scopes</option>
            <option value="GLOBAL">Global FAQ</option>
            <option value="PRODUCT">Product Scope</option>
            <option value="CATEGORY">Category Scope</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {faqs.length} FAQs configured
        </div>
      </div>

      {/* FAQs List Grid */}
      <div className="space-y-3">
        {faqs.map(f => (
          <div
            key={f.id}
            className={`bg-white p-5 rounded-2xl border transition-all ${
              f.isOutdated ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    Order #{f.displayOrder || 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {f.scopeType}
                  </span>
                  <ContentStatusBadge status={f.status} />
                  {f.isOutdated && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Outdated: {f.outdatedReason}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 pt-1">{f.question}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.answer}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {f.viewsCount || 0} views
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <ThumbsUp className="w-3.5 h-3.5" /> {f.helpfulCount || 0}
                  </span>
                  <span className="flex items-center gap-1 text-rose-500">
                    <ThumbsDown className="w-3.5 h-3.5" /> {f.unhelpfulCount || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!f.isOutdated && (
                  <button
                    onClick={() => handleMarkOutdated(f.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all"
                  >
                    Mark Outdated
                  </button>
                )}
                <button
                  onClick={() => openEditModal(f)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingFaq ? 'Edit FAQ Item' : 'Create New FAQ'}
            </h3>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. How do I access Google Drive files?"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Answer <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Comprehensive response..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Scope</label>
                  <select
                    value={scopeType}
                    onChange={e => setScopeType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="PRODUCT">Product Specific</option>
                    <option value="CATEGORY">Category Specific</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
