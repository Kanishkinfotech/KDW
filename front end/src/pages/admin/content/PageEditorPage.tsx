import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, Send, Clock, Globe, Shield, History, ArrowLeft, 
  CheckCircle2, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';
import { BlockEditor, type ContentBlock } from '../../../components/admin/content/BlockEditor';
import { ContentStatusBadge } from '../../../components/admin/content/ContentStatusBadge';

export default function PageEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Page Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [template, setTemplate] = useState('STANDARD');
  const [status, setStatus] = useState('DRAFT');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');

  // Policy Fields
  const [isPolicyPage, setIsPolicyPage] = useState(false);
  const [policyOwner, setPolicyOwner] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [noindex, setNoindex] = useState(false);
  const [includeInSitemap, setIncludeInSitemap] = useState(true);

  // Revisions
  const [revisions, setRevisions] = useState<any[]>([]);

  useEffect(() => {
    if (isEditing) {
      fetchPageData();
    } else {
      // Default sample blocks for new page
      setBlocks([
        { id: 'b1', type: 'hero', title: 'Page Title', subtitle: 'A brief description of what this page covers.' },
        { id: 'b2', type: 'text', title: 'Section Overview', content: 'Detailed paragraph content goes here.' }
      ]);
    }
  }, [id]);

  const fetchPageData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content/pages/${id}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.page) {
        const p = json.page;
        setTitle(p.title || '');
        setSlug(p.slug || '');
        setSummary(p.summary || '');
        setTemplate(p.template || 'STANDARD');
        setStatus(p.status || 'DRAFT');
        setBlocks(Array.isArray(p.contentJson) ? p.contentJson : []);
        setFeaturedImage(p.featuredImage || '');
        setIsPolicyPage(Boolean(p.isPolicyPage));
        setPolicyOwner(p.policyOwner || '');
        setEffectiveDate(p.effectiveDate ? p.effectiveDate.split('T')[0] : '');
        setReviewDate(p.reviewDate ? p.reviewDate.split('T')[0] : '');
        setSeoTitle(p.seoTitle || '');
        setSeoDescription(p.seoDescription || '');
        setCanonicalUrl(p.canonicalUrl || '');
        setOgTitle(p.ogTitle || '');
        setOgDescription(p.ogDescription || '');
        setOgImage(p.ogImage || '');
        setNoindex(Boolean(p.noindex));
        setIncludeInSitemap(Boolean(p.includeInSitemap));

        // Fetch revisions
        const revRes = await fetch(`/api/admin/content/pages/${id}/revisions`, { credentials: 'include' });
        const revJson = await revRes.json();
        if (revJson.success) setRevisions(revJson.revisions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title) return alert('Page title is required.');
    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        summary,
        template,
        contentJson: blocks,
        featuredImage,
        isPolicyPage,
        policyOwner,
        effectiveDate: effectiveDate || null,
        reviewDate: reviewDate || null,
        seoTitle,
        seoDescription,
        canonicalUrl,
        ogTitle,
        ogDescription,
        ogImage,
        noindex,
        includeInSitemap
      };

      const url = isEditing ? `/api/admin/content/pages/${id}` : '/api/admin/content/pages';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        if (!isEditing && json.page?.id) {
          navigate(`/admin/content/pages/${json.page.id}/edit`);
        } else {
          fetchPageData();
        }
        alert('Page saved successfully.');
      } else {
        alert(json.message || 'Failed to save page');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isEditing) {
      alert('Please save the draft first before submitting for review.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/pages/${id}/submit-review`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setStatus('PENDING_REVIEW');
        alert('Submitted for review successfully.');
      } else {
        alert(json.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!isEditing) {
      alert('Please save the page first before publishing.');
      return;
    }
    if (isPolicyPage && (!policyOwner || !effectiveDate)) {
      alert('Policy pages require a designated Policy Owner and Effective Date.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/pages/${id}/publish`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setStatus('PUBLISHED');
        alert('Page published live to storefront!');
      } else {
        alert(json.message || 'Publishing failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!scheduledDate) return alert('Select publication date and time.');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/pages/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scheduledAt: scheduledDate })
      });
      const json = await res.json();
      if (json.success) {
        setStatus('SCHEDULED');
        setShowScheduleModal(false);
        alert(json.message || 'Page scheduled.');
      } else {
        alert(json.message || 'Scheduling failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentLayout
      title={isEditing ? `Edit: ${title || 'Untitled Page'}` : 'Create New Storefront Page'}
      subtitle="Configure layout templates, visual structured blocks, policy compliance, and SEO metadata."
      backUrl="/admin/content/pages"
      backLabel="Back to Pages"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>

          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Submit Review
          </button>

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" /> Schedule
          </button>

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Publish Live
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Page Content & Block Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Page Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (!isEditing) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                  }
                }}
                placeholder="e.g. Terms & Conditions"
                className="w-full text-base font-bold px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Page URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                    /pages/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                {isEditing && status === 'PUBLISHED' && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Changing slug on published page automatically generates 301 redirect.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Page Layout Template
                </label>
                <select
                  value={template}
                  onChange={e => {
                    setTemplate(e.target.value);
                    if (e.target.value === 'POLICY') setIsPolicyPage(true);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="STANDARD">Standard Information Page</option>
                  <option value="POLICY">Legal & Policy Page</option>
                  <option value="LANDING">Marketing Landing Page</option>
                  <option value="CONTACT">Contact & Support Page</option>
                  <option value="COMPARISON">Product Comparison Page</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Short Summary
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Brief summary of the page context..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Structured Block Editor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Structured Page Blocks</h3>
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>
        </div>

        {/* Right 1 Column: Compliance, SEO, Status, and Revisions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current State</span>
              <ContentStatusBadge status={status} isPolicy={isPolicyPage} />
            </div>
            <div className="text-xs text-slate-500">
              {status === 'PUBLISHED' && 'Live on public storefront.'}
              {status === 'DRAFT' && 'Editable draft. Not visible publicly.'}
              {status === 'PENDING_REVIEW' && 'Submitted for editorial review.'}
              {status === 'SCHEDULED' && 'Queued for automatic publication.'}
            </div>
          </div>

          {/* Policy Compliance Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-600" /> Policy Compliance
              </span>
              <input
                type="checkbox"
                checked={isPolicyPage}
                onChange={e => setIsPolicyPage(e.target.checked)}
                className="rounded text-purple-600"
              />
            </div>

            {isPolicyPage && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Content Owner</label>
                  <input
                    type="text"
                    value={policyOwner}
                    onChange={e => setPolicyOwner(e.target.value)}
                    placeholder="e.g. Legal & Compliance Officer"
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Next Review Date</label>
                  <input
                    type="date"
                    value={reviewDate}
                    onChange={e => setReviewDate(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEO & Meta Tags Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" /> Search Engine Optimization
            </span>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={title || 'Page title for Google search'}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  placeholder="Summary snippet for search engines..."
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="noindex"
                  checked={noindex}
                  onChange={e => setNoindex(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="noindex" className="text-xs text-slate-700">
                  Block search indexing (noindex)
                </label>
              </div>
            </div>
          </div>

          {/* Revisions Card */}
          {isEditing && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-600" /> Revision History ({revisions.length})
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {revisions.map(r => (
                  <div key={r.id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-800">v{r.versionNumber}</span>
                      <span className="text-slate-400 block text-[10px]">{new Date(r.createdAt).toLocaleDateString()} by {r.changedByName}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{r.statusSnapshot}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Schedule Page Publication</h3>
            <p className="text-xs text-slate-500">
              The page will automatically publish to the live storefront when the scheduled timestamp arrives.
            </p>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleSubmit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
