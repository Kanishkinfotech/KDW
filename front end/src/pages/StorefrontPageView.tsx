import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Clock, FileText, ArrowLeft } from 'lucide-react';

export default function StorefrontPageView() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [pageBanner, setPageBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const [res, bannerRes] = await Promise.allSettled([
          fetch(`/api/content/pages/${slug}`),
          fetch(`/api/content/banners/page/${slug}`)
        ]);

        if (res.status === 'fulfilled') {
          const json = await res.value.json();
          if (json.success) setPage(json.page);
        }

        if (bannerRes.status === 'fulfilled') {
          const bJson = await bannerRes.value.json();
          if (bJson.success && Array.isArray(bJson.banners) && bJson.banners.length > 0) {
            setPageBanner(bJson.banners[0]);
          } else {
            setPageBanner(null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <FileText className="w-12 h-12 text-slate-300 mb-3" />
        <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          The requested page is either not published or does not exist.
        </p>
        <Link to="/" className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
          Return Home
        </Link>
      </div>
    );
  }

  const blocks: any[] = Array.isArray(page.contentJson) ? page.contentJson : [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <h1 className="text-3xl font-black text-slate-900">{page.title}</h1>
            {page.summary && <p className="text-sm text-slate-600">{page.summary}</p>}

            {page.isPolicyPage && (
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1 text-purple-700 font-semibold">
                  <Shield className="w-3.5 h-3.5" /> Official Policy
                </span>
                {page.effectiveDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Effective: {new Date(page.effectiveDate).toLocaleDateString()}
                  </span>
                )}
                {page.policyOwner && <span>Owner: {page.policyOwner}</span>}
              </div>
            )}
          </div>

          {/* Promotional Page Banner */}
          {pageBanner && (
            <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-slate-900 text-white group">
              {pageBanner.desktopImage && (
                <div className="absolute inset-0">
                  <img
                    src={pageBanner.desktopImage}
                    alt={pageBanner.altText || pageBanner.name}
                    className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-900/40" />
                </div>
              )}
              <div className="relative p-6 sm:p-7 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Featured Promotion
                  </span>
                  <h3 className="text-lg font-black text-white">{pageBanner.headline || pageBanner.name}</h3>
                  {pageBanner.supportingText && (
                    <p className="text-xs text-slate-300 line-clamp-2">{pageBanner.supportingText}</p>
                  )}
                </div>
                {pageBanner.ctaLabel && pageBanner.ctaUrl && (
                  <a
                    href={pageBanner.ctaUrl}
                    onClick={() => {
                      fetch(`/api/content/banners/${pageBanner.id}/click`, { method: 'POST' }).catch(() => {});
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 inline-flex items-center gap-1.5"
                  >
                    {pageBanner.ctaLabel} &rarr;
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Render Structured Blocks */}
          <div className="space-y-8">
            {blocks.map((b, i) => (
              <div key={i} className="space-y-3">
                {b.type === 'hero' && (
                  <div className="p-8 bg-blue-50 rounded-2xl text-center space-y-2">
                    <h2 className="text-xl font-black text-blue-950">{b.title}</h2>
                    {b.subtitle && <p className="text-xs text-blue-800">{b.subtitle}</p>}
                  </div>
                )}

                {b.type === 'text' && (
                  <div className="space-y-2">
                    {b.title && <h3 className="text-lg font-bold text-slate-900">{b.title}</h3>}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{b.content}</p>
                  </div>
                )}

                {b.type === 'featureList' && (
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                    {b.title && <h3 className="text-sm font-bold text-slate-900">{b.title}</h3>}
                    <ul className="space-y-2">
                      {(b.features || []).map((f: string, fIdx: number) => (
                        <li key={fIdx} className="text-xs text-slate-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {b.type === 'cta' && (
                  <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-center space-y-3">
                    <h3 className="text-lg font-bold">{b.title || 'Get Started with KDW'}</h3>
                    <Link
                      to={b.ctaUrl || '/products'}
                      className="inline-block px-5 py-2.5 bg-white text-blue-600 text-xs font-bold rounded-xl shadow-md hover:bg-slate-50 transition-all"
                    >
                      {b.ctaLabel || 'Explore Store'}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
