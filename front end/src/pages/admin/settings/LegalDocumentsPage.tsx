import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, CheckCircle2, AlertCircle, History, Send, Eye, Edit3 } from 'lucide-react';
import { SettingsLayout } from '../../../components/admin/settings/SettingsLayout';

export default function LegalDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('terms-of-service');
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formChangeLog, setFormChangeLog] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/admin/legal-documents', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load legal documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentDetail = async (slug: string) => {
    setLoadingDoc(true);
    try {
      const res = await fetch(`/api/admin/settings/admin/legal-documents/${slug}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setActiveDoc(json.data);
        const latestVersion = json.data.versions?.[0];
        setFormTitle(latestVersion?.title || json.data.name);
        setFormContent(latestVersion?.content || '');
        setFormSummary(latestVersion?.summary || '');
        setFormChangeLog('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load document version');
    } finally {
      setLoadingDoc(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      fetchDocumentDetail(selectedSlug);
    }
  }, [selectedSlug]);

  const handleSaveDraft = async () => {
    if (!formTitle || !formContent) {
      toast.error('Document title and markdown content are required.');
      return;
    }
    setSavingDraft(true);
    try {
      const res = await fetch(`/api/admin/settings/admin/legal-documents/${selectedSlug}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          summary: formSummary,
          changeLog: formChangeLog || 'Updated draft'
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchDocuments();
        fetchDocumentDetail(selectedSlug);
      } else {
        toast.error(json.message || 'Failed to save draft');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error saving draft version');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm(`Are you sure you want to publish this new revision of '${activeDoc?.name}' live to all customers?`)) {
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/settings/admin/legal-documents/${selectedSlug}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          versionNumber: activeDoc?.currentVersion || 1,
          title: formTitle,
          content: formContent,
          summary: formSummary,
          changeLog: formChangeLog || 'Updated and published live'
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        // Dispatch settings update event so storefront policies update immediately
        window.dispatchEvent(new CustomEvent('kdw:settings-updated'));
        try {
          localStorage.setItem('kdw_settings_updated', Date.now().toString());
        } catch (e) {}
        fetchDocuments();
        fetchDocumentDetail(selectedSlug);
      } else {
        toast.error(json.message || 'Failed to publish legal document');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error publishing document');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SettingsLayout
      title="Legal Documents & Policy Lifecycle"
      subtitle="Draft, review, approve, and publish immutable versioned policy documents (Terms, Refund, Delivery, Licence, Privacy)."
      onRefresh={() => {
        fetchDocuments();
        if (selectedSlug) fetchDocumentDetail(selectedSlug);
      }}
      isLoading={loading || loadingDoc}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Policies List (4 cols) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
            Core Policy Documents ({documents.length})
          </span>
          <div className="space-y-1">
            {documents.map(doc => {
              const isSelected = doc.slug === selectedSlug;
              const isPublished = doc.status === 'PUBLISHED';

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedSlug(doc.slug)}
                  className={`w-full text-left p-3 rounded-2xl transition-all border ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-950 shadow-xs'
                      : 'hover:bg-slate-50 border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{doc.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                        isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      v{doc.publishedVersion || doc.currentVersion}.0
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">{doc.slug}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Document Editor Workspace (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">{activeDoc?.name || 'Document Editor'}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                  Status: {activeDoc?.status || 'DRAFT'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Slug: /legal/{activeDoc?.slug}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
              >
                {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {previewMode ? 'Edit Markdown' : 'Preview'}
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {savingDraft ? 'Saving Draft...' : 'Save Draft'}
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {publishing ? 'Publishing...' : 'Publish Live'}
              </button>
            </div>
          </div>

          {/* Editor / Preview Content */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Document Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Revision Change Summary</label>
              <input
                type="text"
                value={formChangeLog}
                onChange={e => setFormChangeLog(e.target.value)}
                placeholder="e.g. Added clause 3.2 on Razorpay refund timelines"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Policy Content (Markdown / HTML)</label>
              {previewMode ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[350px] prose prose-slate max-w-none text-xs whitespace-pre-wrap font-sans">
                  {formContent}
                </div>
              ) : (
                <textarea
                  rows={14}
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500/20"
                />
              )}
            </div>
          </div>

          {/* Version History List */}
          {activeDoc?.versions && activeDoc.versions.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Version History ({activeDoc.versions.length} revisions)</span>
              </div>
              <div className="space-y-1.5">
                {activeDoc.versions.map((ver: any) => (
                  <div
                    key={ver.id}
                    className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-slate-800">v{ver.versionNumber}.0.0</span>
                      <span className="text-slate-500 ml-2 font-normal">{ver.title}</span>
                      {ver.changeLog && <span className="text-slate-400 ml-2 italic">({ver.changeLog})</span>}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                          ver.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ver.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsLayout>
  );
}
