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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [scopeType, setScopeType] = useState('GLOBAL');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (scopeFilter !== 'ALL') q.set('scope', scopeFilter);
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (searchTerm) q.set('search', searchTerm);

      const res = await fetch(`/api/admin/content/faqs?${q.toString()}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setFaqs(json.data || json.faqs || []);
      }
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [scopeFilter, statusFilter, searchTerm]);

  const openCreateModal = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setCategoryName('General');
    setScopeType('GLOBAL');
    setDisplayOrder(faqs.length + 1);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (faq: any) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategoryName(faq.categoryName || 'General');
    setScopeType(faq.scopeType || 'GLOBAL');
    setDisplayOrder(faq.displayOrder || 1);
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setFormError('Question and answer are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editingFaq ? `/api/admin/content/faqs/${editingFaq.id}` : '/api/admin/content/faqs';
      const method = editingFaq ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          categoryName: categoryName.trim() || 'General',
          scopeType,
          displayOrder: parseInt(String(displayOrder), 10) || 1
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchFaqs();
      } else {
        setFormError(json.message || 'Failed to save FAQ');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Network error occurred while saving FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkOutdated = async (id: string) => {
    const reason = prompt('Reason for marking this FAQ as outdated:');
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) alert('Please provide a reason with at least 5 characters.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/content/faqs/${id}/mark-outdated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reason.trim() })
      });
      const json = await res.json();
      if (json.success) fetchFaqs();
      else alert(json.message || 'Failed to mark outdated');
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
      else alert(json.message || 'Failed to delete FAQ');
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
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      }
    >
      {/* Search & Scope Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
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
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800"
          >
            <option value="ALL">All Scopes</option>
            <option value="GLOBAL">Global FAQ</option>
            <option value="PRODUCT">Product Scope</option>
            <option value="CATEGORY">Category Scope</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="OUTDATED">Outdated</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {faqs.length} {faqs.length === 1 ? 'FAQ' : 'FAQs'} configured
        </div>
      </div>

      {/* Empty State */}
      {!loading && faqs.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No FAQs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || scopeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No questions match your current search or filters. Try adjusting your search query.'
              : 'Provide clear answers to common customer inquiries regarding digital downloads, commercial licenses, and payment methods.'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all mt-2"
          >
            <Plus className="w-4 h-4" /> Add First FAQ
          </button>
        </div>
      )}

      {/* FAQs List Grid */}
      <div className="space-y-3">
        {faqs.map(f => (
          <div
            key={f.id}
            className={`bg-white p-5 rounded-2xl border transition-all hover:border-slate-300 ${
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
                  {f.categoryName && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#5b21b6] border border-purple-100">
                      {f.categoryName}
                    </span>
                  )}
                  <ContentStatusBadge status={f.status} />
                  {f.isOutdated && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Outdated: {f.outdatedReason}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 pt-1">{f.question}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{f.answer}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {f.viewsCount || 0} views
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <ThumbsUp className="w-3.5 h-3.5" /> {f.helpfulCount || 0}
                  </span>
                  <span className="flex items-center gap-1 text-rose-500 font-semibold">
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
                  title="Edit FAQ"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Delete FAQ"
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
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
            </h3>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  QUESTION <span className="text-rose-500">*</span>
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
                  ANSWER <span className="text-rose-500">*</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">CATEGORY</label>
                  <input
                    type="text"
                    list="faq-categories"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    placeholder="e.g. Delivery & Access"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                  <datalist id="faq-categories">
                    <option value="Delivery & Access" />
                    <option value="Payments & Checkout" />
                    <option value="Licensing & Rights" />
                    <option value="Bundles & Savings" />
                    <option value="Account & Orders" />
                    <option value="Updates & Lifetime Access" />
                    <option value="Support & Help" />
                    <option value="General" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">SCOPE</label>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">DISPLAY ORDER</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={e => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
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
