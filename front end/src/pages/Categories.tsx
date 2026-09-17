import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Sparkles, FolderArchive, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import axios from 'axios';

const FALLBACK_CATEGORIES = [
  {
    seq: '01',
    slug: 'Agency Starter Kits',
    title: 'Agency Starter Kits',
    description: 'Turnkey client proposals, onboarding agreements, pitch decks, and delivery roadmaps designed for digital marketing and creative agencies.',
    gradient: 'from-[#4c1d95] via-[#5b21b6] to-[#1e1b4b]',
    itemCount: '12 Toolkits'
  },
  {
    seq: '02',
    slug: 'Business Templates',
    title: 'Business Templates',
    description: 'Operating documents, financial projection spreadsheets, legal agreement baselines, and commercial governance foundations.',
    gradient: 'from-[#b45309] via-[#d97706] to-[#451a03]',
    itemCount: '24 Systems'
  },
  {
    seq: '03',
    slug: 'Social Media Bundles',
    title: 'Social Media Bundles',
    description: 'Content calendar engines, design systems, carousels, caption frameworks, and audience acquisition assets.',
    gradient: 'from-[#be185d] via-[#e11d48] to-[#4c0519]',
    itemCount: '18 Packs'
  },
  {
    seq: '04',
    slug: 'Website Kits',
    title: 'Website Kits',
    description: 'Launch-ready page structures, responsive component libraries, conversion flows, and pre-launch QA matrices.',
    gradient: 'from-[#0369a1] via-[#0284c7] to-[#082f49]',
    itemCount: '16 Kits'
  },
  {
    seq: '05',
    slug: 'Automation Workflows',
    title: 'Automation Workflows',
    description: 'Event-driven webhook listeners, multi-channel notification dispatchers, lead sync scripts, and CRM triggers.',
    gradient: 'from-[#047857] via-[#059669] to-[#022c22]',
    itemCount: '14 Blueprints'
  }
];

const GRADIENTS = [
  'from-[#4c1d95] via-[#5b21b6] to-[#1e1b4b]',
  'from-[#b45309] via-[#d97706] to-[#451a03]',
  'from-[#be185d] via-[#e11d48] to-[#4c0519]',
  'from-[#0369a1] via-[#0284c7] to-[#082f49]',
  'from-[#047857] via-[#059669] to-[#022c22]',
  'from-[#3730a3] via-[#4338ca] to-[#1e1b4b]',
  'from-[#9f1239] via-[#be123c] to-[#4c0519]'
];

export default function Categories() {
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.allSettled([
          axios.get('/api/categories'),
          axios.get('/api/products?limit=1')
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value.data?.total) {
          setTotalProducts(prodRes.value.data.total);
        }

        if (catRes.status === 'fulfilled' && catRes.value.data?.success && Array.isArray(catRes.value.data.data) && catRes.value.data.data.length > 0) {
          // Filter primary categories
          const primaryOnly = catRes.value.data.data.filter((c: any) => !c.parentId);
          const mapped = primaryOnly.map((c: any, index: number) => {
            const count = c._count?.products !== undefined ? c._count.products : (c.count !== undefined ? c.count : (c.products?.length || (c.children?.length ? `${c.children.length} Subcategories` : '')));
            return {
              id: c.id,
              seq: (index + 1).toString().padStart(2, '0'),
              slug: c.slug || c.name,
              title: c.name,
              description: c.description || c.shortDescription || `Curated digital templates and assets for ${c.name}.`,
              gradient: GRADIENTS[index % GRADIENTS.length],
              itemCount: typeof count === 'number' ? `${count} Items` : (count || 'Curated Pack'),
              image: c.image || c.banner,
              children: c.children || [],
              featured: Boolean(c.featured)
            };
          });
          mapped.sort((a: any, b: any) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
          if (mapped.length > 0) setCategories(mapped);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-12 lg:py-16">
      <SEO 
        title="Explore Categories | KDW Digital Toolkit" 
        description="Browse structured categories of templates, bundles, website kits, and automation systems."
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#5b21b6] font-bold">Categories Hub</span>
        </nav>

        {/* Page Header & All Products CTA Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
              FOCUSED ARCHITECTURE
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#171325] leading-tight">
              Categorized for intentional work.
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
              Browse our core catalog domains to discover dedicated kits, modular templates, and automation workflows.
            </p>
          </div>

          {/* Unified All Products Quick Button */}
          <Link
            to="/categories/all-products"
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] hover:from-[#4c1d95] hover:to-[#6d28d9] text-white text-xs font-bold font-sans shadow-md shadow-[#5b21b6]/20 transition-all shrink-0 group self-start lg:self-auto"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>Browse All Catalog Products {totalProducts > 0 ? `(${totalProducts})` : ''}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 2–3 Column Grid of Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.seq}
              className="group kdw-card overflow-hidden flex flex-col justify-between min-h-[360px] hover:border-[#5b21b6]/40 transition-all duration-300 bg-white"
            >
              {/* Upper Visual Pane with Gradient Tone */}
              <Link 
                to={`/categories/${encodeURIComponent(cat.slug)}`}
                className={`h-48 w-full bg-gradient-to-br ${cat.gradient} p-5 flex flex-col justify-between relative overflow-hidden select-none block`}
              >
                {cat.image ? (
                  <>
                    <img 
                      src={cat.image} 
                      alt={cat.title} 
                      className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-1" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 kdw-cover-grid opacity-25 pointer-events-none z-1" />
                    <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-white/20 pointer-events-none z-1" />
                  </>
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-white bg-black/40 px-2.5 py-1 rounded-md border border-white/15">
                      {cat.seq}
                    </span>
                    {cat.featured && (
                      <span className="text-[10px] font-mono font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded shadow-xs flex items-center gap-1 border border-amber-300">
                        ★ FEATURED
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-white/80">
                    {cat.itemCount}
                  </span>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-white/90">
                  <Layers className="w-5 h-5" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    KDW Collection
                  </span>
                </div>
              </Link>

              {/* Lower Half: Category Title, Subcategories & Link */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <Link to={`/categories/${encodeURIComponent(cat.slug)}`}>
                    <h3 className="text-xl font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug">
                      {cat.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-sans line-clamp-2">
                    {cat.description}
                  </p>

                  {/* Subcategories Chips */}
                  {cat.children && cat.children.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cat.children.slice(0, 4).map((sub: any) => (
                        <Link
                          key={sub.id || sub.slug || sub.name}
                          to={`/categories/${encodeURIComponent(cat.slug)}/${encodeURIComponent(sub.slug || sub.name)}`}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#ede9fe] text-slate-600 hover:text-[#5b21b6] transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                      {cat.children.length > 4 && (
                        <Link
                          to={`/categories/${encodeURIComponent(cat.slug)}`}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg text-slate-400 hover:text-[#5b21b6]"
                        >
                          +{cat.children.length - 4} more
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-semibold text-[#5b21b6] font-sans">
                  <Link 
                    to={`/categories/${encodeURIComponent(cat.slug)}`}
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>
                      {cat.children && cat.children.length > 0
                        ? `Browse ${cat.children.length} subcategor${cat.children.length > 1 ? 'ies' : 'y'}`
                        : 'Explore products'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
