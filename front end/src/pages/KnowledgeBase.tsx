import React, { useEffect, useState } from 'react';
import { Book, FileText, ChevronRight, Folder, Home, ArrowLeft, LifeBuoy, Sparkles, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import SmartSearch from '../components/support/SmartSearch';
import SEO from '../components/SEO';
import axios from 'axios';

export default function KnowledgeBase() {
  const { slug } = useParams<{ slug?: string }>();
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      axios.get('/api/support/categories'),
      axios.get('/api/support/articles' + (slug ? '?category=' + encodeURIComponent(slug) : ''))
    ])
      .then(([catRes, artRes]) => {
        if (isMounted) {
          if (catRes.data?.success) setCategories(catRes.data.data || []);
          if (artRes.data?.success) setArticles(artRes.data.data || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slug]);

  const selectedCategory = slug ? categories.find(c => c.slug === slug || c.id === slug) : null;

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171325] font-sans pb-24">
      <SEO 
        title={selectedCategory ? selectedCategory.name + ' | Knowledge Base | KDW' : 'Knowledge Base & Guides | KDW'} 
        description={selectedCategory?.description || 'Find answers to all your questions about digital downloads, licensing, payments, and product setup.'} 
      />

      {/* Header */}
      <section className="pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0] bg-white relative overflow-hidden">
        <div className="max-w-[1040px] mx-auto space-y-6">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/support" className="hover:text-[#5b21b6] transition-colors">Support Center</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">Knowledge Base</span>
            {selectedCategory && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-[#5b21b6] font-bold">{selectedCategory.name}</span>
              </>
            )}
          </nav>

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/70 text-[#5b21b6] text-[10px] font-bold tracking-[0.2em] uppercase">
              <Book className="w-3.5 h-3.5 text-[#7c3aed]" />
              <span>DOCUMENTATION & GUIDES</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171325] tracking-tight">
              {selectedCategory ? selectedCategory.name : 'Knowledge Base'}
            </h1>

            <p className="text-sm text-slate-600 font-sans">
              {selectedCategory?.description || 'Authoritative guides, software compatibility specs, and step-by-step product walkthroughs.'}
            </p>
          </div>

          <div className="max-w-2xl mx-auto pt-2">
            <SmartSearch />
          </div>
        </div>
      </section>

      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        
        {/* Category Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            to="/support/articles"
            className={'px-4 py-1.5 rounded-full text-xs font-sans font-bold whitespace-nowrap transition-all ' + (
              !slug
                ? 'bg-[#5b21b6] text-white shadow-xs'
                : 'bg-white border border-[#e2e8f0] text-slate-600 hover:bg-slate-50'
            )}
          >
            All Categories
          </Link>
          {categories.map((c) => {
            const isSelected = slug === c.slug;
            return (
              <Link
                key={c.id}
                to={'/support/category/' + c.slug}
                className={'px-4 py-1.5 rounded-full text-xs font-sans font-bold whitespace-nowrap transition-all ' + (
                  isSelected
                    ? 'bg-[#5b21b6] text-white shadow-xs'
                    : 'bg-white border border-[#e2e8f0] text-slate-600 hover:bg-slate-50'
                )}
              >
                {c.name} {c.articlesCount ? '(' + c.articlesCount + ')' : ''}
              </Link>
            );
          })}
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[#171325]">
              {selectedCategory ? selectedCategory.name + ' Articles' : 'All Knowledge Base Articles'}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {articles.length} {articles.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5b21b6] mx-auto mb-2"></div>
              <span>Loading articles...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#e2e8f0] space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No articles found in this category</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Check back soon or contact support if you need assistance with this topic.
              </p>
              <Link
                to="/support/articles"
                className="inline-block mt-2 px-4 py-2 text-xs font-bold text-[#5b21b6] bg-[#ede9fe] rounded-xl"
              >
                &larr; View all articles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((art) => (
                <Link
                  key={art.id}
                  to={'/support/articles/' + art.slug}
                  className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#5b21b6]/40 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    {art.category?.name && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5b21b6] bg-[#ede9fe] px-2 py-0.5 rounded-md inline-block">
                        {art.category.name}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans line-clamp-2 leading-relaxed">
                      {art.content?.substring(0, 140)}...
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                    <span>Updated {new Date(art.updatedAt || art.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-[#5b21b6] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Read Guide &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contact Strip */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-serif font-bold text-[#171325]">
              Couldn't find the answer you were looking for?
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Our support team can assist with specific code questions, licensing queries, or order issues.
            </p>
          </div>

          <Link
            to="/support/contact"
            className="px-5 py-2.5 bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl transition-all shrink-0"
          >
            Contact Support &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
