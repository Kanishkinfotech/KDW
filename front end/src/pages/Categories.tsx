import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { LayoutGrid, Target, PackageSearch, ArrowRight, ExternalLink, ChevronRight, Layers } from 'lucide-react';
import SearchBar from '../components/layout/header/SearchBar';

export default function Categories() {
  const { categories, products } = useStore();
  
  // Filter top-level categories (no parentId)
  const topLevelCategories = categories.filter((c: any) => !c.parentId);

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50">
      
      {/* SECTION 1: HERO / INTRODUCTION */}
      <section className="bg-slate-900 pt-24 pb-32 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-30 text-center">
          <span className="inline-block py-1.5 px-4 bg-primary/20 text-primary-light border border-primary/30 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
            KDW Catalog Hierarchy
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Categories & Subcategories
          </h1>
          <p className="text-xl text-slate-300 font-medium mb-10 max-w-2xl mx-auto">
            Browse through organized digital asset collections, templates, and subcategory workflows.
          </p>
          
          <div className="max-w-xl mx-auto relative mt-8 z-50">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* SHOP ALL CTA */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 mb-16">
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PackageSearch size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shop All Digital Assets</h2>
              <p className="text-slate-500 font-medium mt-1">Explore all products across all categories & subcategories.</p>
            </div>
          </div>
          <Link 
            to="/categories/all-products"
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 w-full md:w-auto justify-center shrink-0"
          >
            Explore Catalog <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-20">
        
        {/* SHOP BY GOAL */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
              <Target size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shop by Goal</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Start a Business', desc: 'Agency & Business kits', icon: '🚀', slug: 'business-templates', color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { title: 'Grow Social Media', desc: 'Instagram & Social resources', icon: '📱', slug: 'social-media-bundles', color: 'bg-purple-50 text-purple-600 border-purple-100' },
              { title: 'Automate Work', desc: 'AI Prompts & Automation', icon: '⚡', slug: 'automation', color: 'bg-amber-50 text-amber-600 border-amber-100' },
              { title: 'Build a Website', desc: 'Website Kits & UI', icon: '🌐', slug: 'website-kits', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            ].map((goal, idx) => (
              <Link 
                key={idx} 
                to={`/categories/${goal.slug}`}
                className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 border ${goal.color}`}>
                  {goal.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{goal.title}</h3>
                <p className="text-slate-500 text-sm font-medium">{goal.desc}</p>
                <div className="mt-6 flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                  Explore <ArrowRight size={16} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* MAIN CATEGORIES & SUBCATEGORIES HIERARCHY */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Main Categories & Subcategories</h2>
              <p className="text-slate-500 text-sm mt-1">Select a category or specific subcategory to view items.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(topLevelCategories.length > 0 ? topLevelCategories : categories).map(category => {
              const catSlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
              const subcategories = category.children || categories.filter((c: any) => c.parentId === category.id);

              return (
                <div 
                  key={category.id} 
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Category Image Header */}
                    <Link to={`/categories/${catSlug}`} className="block relative h-48 bg-slate-900 overflow-hidden group">
                      <img 
                        src={category.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80'} 
                        alt={category.name} 
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
                            {category.count || category.productCount || 0} Products
                          </span>
                          <h3 className="text-2xl font-black text-white mt-1 leading-tight">{category.name}</h3>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/30 group-hover:bg-primary group-hover:border-primary transition-all">
                          <ExternalLink size={16} />
                        </div>
                      </div>
                    </Link>

                    {/* Subcategories Pills Section */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Layers size={14} /> Subcategories
                      </div>

                      {subcategories && subcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {subcategories.map((sub: any) => {
                            const subSlug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <Link 
                                key={sub.id}
                                to={`/categories/${catSlug}/${subSlug}`}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-primary hover:text-white text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 group/sub border border-slate-200/60"
                              >
                                <span>{sub.name}</span>
                                <span className="text-[10px] font-black opacity-75 bg-slate-200 group-hover/sub:bg-white/20 px-1.5 py-0.5 rounded-md">
                                  {sub.count || sub.productCount || 0}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium py-1">Direct single category catalog.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 mt-4">
                    <Link 
                      to={`/categories/${catSlug}`}
                      className="text-primary font-bold text-xs flex items-center justify-between hover:gap-2 transition-all pt-4"
                    >
                      <span>Explore {category.name} Catalog</span>
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
