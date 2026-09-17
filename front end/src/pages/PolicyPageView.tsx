import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface PolicyPageViewProps {
  slugOverride?: string;
}

export default function PolicyPageView({ slugOverride }: PolicyPageViewProps) {
  const location = useLocation();
  const pathSlug = slugOverride || location.pathname.replace(/^\//, '').replace(/-and-conditions$/, '').replace(/-policy$/, '-policy');
  
  // Normalize slug to match seeded legal document keys
  const getNormalizedSlug = (raw: string) => {
    if (raw.includes('term')) return 'terms-of-service';
    if (raw.includes('privac')) return 'privacy-policy';
    if (raw.includes('refund')) return 'refund-policy';
    if (raw.includes('delivery')) return 'digital-delivery-policy';
    if (raw.includes('copy') || raw.includes('ip')) return 'copyright-policy';
    if (raw.includes('licen')) return 'licence-policy';
    if (raw.includes('cookie')) return 'cookie-policy';
    if (raw.includes('support')) return 'support-policy';
    return raw;
  };

  const activeSlug = getNormalizedSlug(pathSlug);

  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        // 1. First priority: Fetch published legal policy managed by admin in Settings -> Legal Documents
        const legalRes = await axios.get(`/api/settings/legal/${activeSlug}?t=${Date.now()}`);
        if (legalRes.data?.success && legalRes.data.data) {
          setPageData(legalRes.data.data);
          return;
        }

        // 2. Fallback: query content pages endpoint
        const res = await axios.get(`/api/content/pages/${activeSlug}?t=${Date.now()}`);
        if (res.data?.success && res.data.data) {
          setPageData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching policy content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();

    const handleSettingsUpdated = () => {
      fetchPolicy();
    };

    window.addEventListener('kdw:settings-updated', handleSettingsUpdated);
    window.addEventListener('storage', handleSettingsUpdated);

    return () => {
      window.removeEventListener('kdw:settings-updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, [activeSlug]);

  const title = pageData?.title || pageData?.name || (
    activeSlug === 'terms-of-service' ? 'Terms of Service' :
    activeSlug === 'privacy-policy' ? 'Privacy Policy' :
    activeSlug === 'refund-policy' ? 'Refund & Cancellation Policy' :
    activeSlug === 'digital-delivery-policy' ? 'Digital Delivery & Access Policy' :
    activeSlug === 'copyright-policy' ? 'Copyright & Intellectual Property Policy' :
    activeSlug === 'licence-policy' ? 'Commercial Licence Scope' :
    activeSlug === 'cookie-policy' ? 'Cookie Policy' :
    activeSlug === 'support-policy' ? 'Customer Support Policy' : 'Legal Policy'
  );

  const summary = pageData?.summary || 'Standard operational guidelines and terms of service for Kanishk Digital World.';
  const rawContent = pageData?.content || '';
  const contentBlocks = Array.isArray(pageData?.contentJson) ? pageData.contentJson : [];

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-8 sm:py-12">
      <SEO title={`${title} | KDW`} description={summary} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#5b21b6] font-sans transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to storefront</span>
          </Link>
        </div>

        {/* Header with Lavender Eyebrow */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            LEGAL & OPERATIONAL GOVERNANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed max-w-2xl">
            {summary}
          </p>
        </div>

        {/* Central White Body Card */}
        <div className="kdw-card p-6 sm:p-8 space-y-6 font-sans text-xs sm:text-sm text-slate-700 leading-relaxed bg-white rounded-2xl border border-[#e2e8f0] shadow-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#5b21b6]" />
              <p className="text-xs font-mono">Fetching published policy record...</p>
            </div>
          ) : rawContent ? (
            <div className="space-y-4">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 mt-5 mb-2 pb-1.5 border-b border-slate-100 uppercase tracking-wide" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h3 className="text-sm sm:text-base font-sans font-bold text-slate-900 mt-5 mb-1.5 flex items-center gap-1.5" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h4 className="text-xs sm:text-sm font-sans font-semibold text-slate-800 mt-3 mb-1" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed my-2" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside space-y-1 my-2 text-xs sm:text-sm font-sans text-slate-600 pl-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2 text-xs sm:text-sm font-sans text-slate-600 pl-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-slate-900" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-[#5b21b6] font-medium hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="my-5 border-slate-200" {...props} />
                  ),
                }}
              >
                {rawContent}
              </ReactMarkdown>
            </div>
          ) : contentBlocks.length > 0 ? (
            contentBlocks.map((block: any, idx: number) => {
              if (block.type === 'callout') {
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-[#171325]">{block.title}</span>
                    <p>{block.content}</p>
                  </div>
                );
              }
              return (
                <section key={idx} className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-sans font-bold text-[#171325]">
                    {block.title}
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                    {block.content}
                  </p>
                </section>
              );
            })
          ) : (
            <div className="space-y-5">
              <section className="space-y-1.5">
                <h2 className="text-sm sm:text-base font-sans font-bold text-[#171325]">
                  1. Scope of Digital Services
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                  Kanishk Digital World (KDW) provides outcome-focused templates, business agreements, design systems, website kits, and automation blueprints. All assets are digital items delivered through secure cloud storage upon verified transaction confirmation.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-sm sm:text-base font-sans font-bold text-[#171325]">
                  2. Usage Licence & Permitted Deployment
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                  Purchasing a product grants the customer a non-exclusive, perpetual commercial licence to deploy the assets for internal operations and client deliverables. Purchasing does not transfer intellectual property ownership or grant unrestricted public resale rights.
                </p>
              </section>

              <section className="space-y-1.5">
                <h2 className="text-sm sm:text-base font-sans font-bold text-[#171325]">
                  3. Entitlements & Download Security
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                  Direct file delivery tokens generate short-lived signed download links (valid for approximately 10 minutes) for security. Purchases include a five-attempt download safety allowance. Failed downloads do not consume this allowance.
                </p>
              </section>
            </div>
          )}

          <div className="pt-5 border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Version: {pageData?.versionNumber ? `${pageData.versionNumber}.0.0-published` : '1.0.0-active'}</span>
            <span>Effective Date: {pageData?.effectiveDate ? new Date(pageData.effectiveDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
