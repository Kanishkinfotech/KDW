import { Link } from 'react-router-dom';
import { ArrowRight, Layout, Bot, Image, Share2, Cpu, Code2, Layers, Sparkles, FolderTree } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function CategoryGrid() {
  const { categories, products } = useStore();

  // Top level categories
  const topCategories = categories.filter((c: any) => !c.parentId);
  const baseCats = topCategories.length > 0 ? topCategories : categories;
  const displayCats = [...baseCats].sort((a: any, b: any) => {
    const aFeatured = (a.featured || a.featuredPlacement === 'HOMEPAGE_CARD') ? 1 : 0;
    const bFeatured = (b.featured || b.featuredPlacement === 'HOMEPAGE_CARD') ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;
    return (b.featuredPriority || 0) - (a.featuredPriority || 0);
  });

  const categoryIcons: Record<string, any> = {
    templates: <Layout className="text-purple-600" size={26} />,
    graphics: <Image className="text-emerald-600" size={26} />,
    'ui-kits': <Layers className="text-blue-600" size={26} />,
    automation: <Cpu className="text-amber-600" size={26} />,
    'social-media-bundles': <Share2 className="text-pink-600" size={26} />,
    'ai-prompt-bundles': <Bot className="text-indigo-600" size={26} />
  };

  const getProductCount = (catName: string, catSlug?: string) => {
    const tName = (catName || '').toLowerCase().trim();
    const tSlug = (catSlug || '').toLowerCase().trim();

    return products.filter((p: any) => {
      const pCat = typeof p.category === 'object' ? p.category?.name : p.category;
      const pSlug = typeof p.category === 'object' ? p.category?.slug : '';
      const pName = (pCat || '').toLowerCase().trim();
      const pCatSlug = (pSlug || '').toLowerCase().trim();

      return pName === tName || pCatSlug === tSlug || pName.includes(tName);
    }).length;
  };

  return (
    <section className="py-16 sm:py-20 bg-white border-t border-b border-slate-200/70">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-primary uppercase mb-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 inline-flex items-center gap-1.5">
              <FolderTree size={13} /> EXPLORE CATALOG
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Browse Popular Categories
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl font-medium">
              Discover curated collections designed for creators, developers, agency owners, and digital entrepreneurs.
            </p>
          </div>
          <Link 
            to="/categories/all-products" 
            className="text-primary hover:text-primary-dark font-bold text-xs sm:text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all shrink-0"
          >
            <span>View All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {displayCats.slice(0, 8).map((cat: any) => {
            const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
            const count = getProductCount(cat.name, cat.slug);
            const icon = categoryIcons[slug] || <Layers className="text-primary" size={26} />;

            return (
              <Link 
                key={cat.id || slug}
                to={`/categories/${slug}`}
                className="bg-slate-50/70 hover:bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      {cat.image || cat.banner ? (
                        <img src={cat.image || cat.banner} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        icon
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {cat.featured && (
                        <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border border-amber-300 shadow-xs flex items-center gap-0.5">
                          ★ Featured
                        </span>
                      )}
                      <span className="bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                        {count} {count === 1 ? 'Asset' : 'Assets'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-primary transition-colors mb-1.5 capitalize">
                    {cat.name}
                  </h3>
                  <p className="text-slate-500 text-xs font-medium line-clamp-2 leading-relaxed">
                    {cat.description || cat.shortDescription || `Explore premium ${cat.name} templates, files, and digital resources.`}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 text-primary font-bold text-xs flex items-center justify-between group-hover:text-primary-dark transition-colors">
                  <span>Explore {cat.name}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
