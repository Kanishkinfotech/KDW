import React, { useState, useEffect } from 'react';
import { Search, Globe, CheckCircle2, AlertTriangle, ShieldCheck, Code } from 'lucide-react';
import { ContentLayout } from '../../../components/admin/content/ContentLayout';

export default function ContentSeoPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Schema Validator State
  const [schemaType, setSchemaType] = useState('Article');
  const [schemaInput, setSchemaInput] = useState('{\n  "headline": "Mastering n8n Workflows",\n  "author": "Sarah Jenkins",\n  "datePublished": "2026-01-15"\n}');
  const [validationResult, setValidationResult] = useState<any>(null);

  const fetchSeoReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/seo/audit', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setReport(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoReport();
  }, []);

  const handleValidateSchema = async () => {
    try {
      const parsed = JSON.parse(schemaInput);
      const res = await fetch('/api/admin/content/seo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ schemaType, data: parsed })
      });
      const json = await res.json();
      setValidationResult(json);
    } catch (e: any) {
      setValidationResult({ valid: false, errors: [`JSON Parse Error: ${e.message}`] });
    }
  };

  const s = report?.summary || {};

  return (
    <ContentLayout
      title="SEO Settings & Structured Data"
      subtitle="Audit organic search metadata, validate schema.org markup, and prevent search index anomalies."
      onRefresh={fetchSeoReport}
      isLoading={loading}
    >
      {/* SEO KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pages Audited</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{s.totalPagesAudited || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Articles Audited</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{s.totalArticlesAudited || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Banners Audited</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{s.totalActiveBannersAudited || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issues Identified</span>
          <div className={`text-2xl font-bold mt-1 ${s.totalIssuesFound > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {s.totalIssuesFound || 0}
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Detected SEO Quality Deficiencies
        </h3>

        {(report?.issues || []).length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">100% SEO Compliance Across All Content</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {(report?.issues || []).map((iss: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{iss.item}</span>
                  <span className="text-slate-500">{iss.issue}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  iss.severity === 'HIGH' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {iss.severity} Priority
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schema.org Structured Data Validator */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-600" /> Schema.org Structured Data Validator
        </h3>
        <p className="text-xs text-slate-500">
          Verify JSON-LD schema payloads for Article, Product, and FAQPage rich snippets before deployment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Schema Type</label>
              <select
                value={schemaType}
                onChange={e => setSchemaType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="Article">Article (Blog Post)</option>
                <option value="FAQPage">FAQPage (Support FAQs)</option>
                <option value="Product">Product (Digital Asset / Bundle)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">JSON-LD Data</label>
              <textarea
                rows={6}
                value={schemaInput}
                onChange={e => setSchemaInput(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleValidateSchema}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Validate Schema Markup
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Validation Result</label>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[220px] text-xs font-mono">
              {validationResult ? (
                <div>
                  <div className={`font-bold mb-2 ${validationResult.valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {validationResult.valid ? '✓ VALID SCHEMA.ORG PAYLOAD' : '✗ SCHEMA VALIDATION FAILED'}
                  </div>
                  {validationResult.errors?.length > 0 && (
                    <ul className="text-rose-600 list-disc pl-4 space-y-1 mb-2">
                      {validationResult.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                  {validationResult.structuredDataJsonLd && (
                    <pre className="text-slate-700 overflow-x-auto whitespace-pre-wrap">
                      {validationResult.structuredDataJsonLd}
                    </pre>
                  )}
                </div>
              ) : (
                <span className="text-slate-400">Click validate to inspect schema payload.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
