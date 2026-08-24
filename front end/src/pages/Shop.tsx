import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Filter, SlidersHorizontal, ChevronRight, Layers, ArrowLeft, ArrowRight, PackageSearch } from 'lucide-react';
import SEO from '../components/SEO';
import { useStore } from '../store/useStore';
import FilterSidebar from '../components/shop/FilterSidebar';
import Skeleton from '../components/ui/Skeleton';

export default function Shop() {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug?: string; subcategorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const storeProducts = useStore(state => state.products);
  const categories = useStore(state => state.categories);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  // Read URL search parameters & path parameters
  const categoryQuery = searchParams.get('category');
  const subcategoryQuery = searchParams.get('subcategory');

  const effectiveCatSlug = categorySlug || (categoryQuery ? categoryQuery.toLowerCase().replace(/\s+/g, '-') : '');
  const isAllProducts = !effectiveCatSlug || effectiveCatSlug === 'all-products' || effectiveCatSlug === 'all';
  const activeCategory = isAllProducts ? 'All' : effectiveCatSlug.replace(/-/g, ' ');

  const activeSubcategory = subcategoryQuery || (subcategorySlug ? subcategorySlug.replace(/-/g, ' ') : '');
  
  const searchQuery = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const ratingFilter = searchParams.get('rating') || '';
  const filterParam = searchParams.get('filter') || '';
  const minPriceFilter = searchParams.get('minPrice');
  const maxPriceFilter = searchParams.get('maxPrice');

  // Match current active category object
  const currentCategoryObj = categories.find((c: any) => 
    c.name.toLowerCase() === activeCategory.toLowerCase() || 
    (c.slug && c.slug.toLowerCase() === effectiveCatSlug.toLowerCase())
  );

  const currentSubcategories = (currentCategoryObj?.children || categories.filter((c: any) => c.parentId === currentCategoryObj?.id)) || [];

  // VIEW CONDITION A: Show Subcategory Grid Drill-down
  // Trigger when a parent category is selected, has child subcategories, and NO subcategory is selected yet.
  const showSubcategoryGrid = activeCategory !== 'All' && currentSubcategories.length > 0 && !activeSubcategory;

  useEffect(() => {
    const filterAndSetProducts = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 200));

      try {
        let localProducts = [...storeProducts];

        // 1. Parent Category Filter
        if (activeCategory !== 'All') {
          localProducts = localProducts.filter(p => {
            const catName = typeof p.category === 'object' ? (p.category as any)?.name : p.category;
            const catSlug = typeof p.category === 'object' ? (p.category as any)?.slug : (typeof p.category === 'string' ? p.category.toLowerCase().replace(/\s+/g, '-') : '');
            
            if (!catName) return false;

            const targetName = activeCategory.toLowerCase().trim();
            const targetSlug = effectiveCatSlug.toLowerCase().trim();
            const targetClean = targetName.replace(/[^a-z0-9]/g, '');

            const pName = catName.toLowerCase().trim();
            const pSlug = (catSlug || '').toLowerCase().trim();
            const pClean = pName.replace(/[^a-z0-9]/g, '');

            return (
              pName === targetName ||
              pSlug === targetName ||
              pSlug === targetSlug ||
              pClean === targetClean ||
              pName.includes(targetName) ||
              targetName.includes(pName)
            );
          });
        }

        // 2. Subcategory Filter
        if (activeSubcategory && activeSubcategory.toLowerCase() !== 'all') {
          const targetSub = activeSubcategory.toLowerCase().trim();
          const targetSubClean = targetSub.replace(/[^a-z0-9]/g, '');

          localProducts = localProducts.filter(p => {
            const pSub = (p.subcategory || '').toLowerCase().trim();
            const pSubClean = pSub.replace(/[^a-z0-9]/g, '');

            const pCatName = typeof p.category === 'object' ? (p.category as any)?.name : p.category;
            const pCatSlug = typeof p.category === 'object' ? (p.category as any)?.slug : '';

            return (
              pSub === targetSub ||
              pSubClean === targetSubClean ||
              pSub.includes(targetSub) ||
              (pCatName && pCatName.toLowerCase().trim() === targetSub) ||
              (pCatSlug && pCatSlug.toLowerCase().trim() === targetSub)
            );
          });
        }

        // 3. Search Query Filter
        if (searchQuery) {
          localProducts = localProducts.filter(p => {
            const title = p.title || (p as any).name || '';
            return title.toLowerCase().includes(searchQuery.toLowerCase());
          });
        }

        // 4. Rating Filter
        if (ratingFilter) {
          localProducts = localProducts.filter(p => p.rating >= Number(ratingFilter));
        }
        
        // 5. Free products filter
        if (filterParam === 'free') {
          localProducts = localProducts.filter(p => p.price === 0);
        }
        
        // 6. Price Range Filter
        if (minPriceFilter) {
          localProducts = localProducts.filter(p => p.price >= Number(minPriceFilter));
        }
        if (maxPriceFilter) {
          localProducts = localProducts.filter(p => p.price <= Number(maxPriceFilter));
        }
        
        // 7. Sorting
        if (sort === 'price_asc') localProducts.sort((a, b) => a.price - b.price);
        if (sort === 'price_desc') localProducts.sort((a, b) => b.price - a.price);
        if (sort === 'rating') localProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (sort === 'new') localProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (sort === 'popular') localProducts.sort((a, b) => (b.sales || b.rating || 0) - (a.sales || a.rating || 0));
        
        setProducts(localProducts);
        setTotalProducts(localProducts.length);
      } finally {
        setIsLoading(false);
      }
    };

    filterAndSetProducts();
  }, [activeCategory, activeSubcategory, searchQuery, sort, ratingFilter, filterParam, minPriceFilter, maxPriceFilter, storeProducts, effectiveCatSlug]);

  const updateParams = (key: string, value: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (!value || value === 'All') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      return params;
    });
  };

  const updateMultipleParams = (updates: Record<string, string>) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'All') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      return params;
    });
  };

  const clearFilters = () => {
    navigate('/categories/all-products');
  };

  const handleSubcategorySelect = (sub: any) => {
    const subSlug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
    if (categorySlug) {
      navigate(`/categories/${categorySlug}/${subSlug}`);
    } else {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.set('category', activeCategory);
        p.set('subcategory', sub.name);
        return p;
      });
    }
  };

  const handleBackToSubcategories = () => {
    if (categorySlug) {
      navigate(`/categories/${categorySlug}`);
    } else {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.delete('subcategory');
        return p;
      });
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50/50">
      <SEO 
        title={activeSubcategory ? `${activeSubcategory} - ${activeCategory}` : `${activeCategory} - Marketplace`} 
        description={`Browse digital products in ${activeCategory}${activeSubcategory ? ` / ${activeSubcategory}` : ''}.`} 
      />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 relative">
        
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Products</h1>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 shadow-sm"
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Sidebar Filters */}
        <FilterSidebar 
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
          categories={categories}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          ratingFilter={ratingFilter}
          updateParams={updateParams}
          updateMultipleParams={updateMultipleParams}
          clearFilters={clearFilters}
        />

        {/* Catalog Main View Area */}
        <main className="flex-1">
          
          {/* Breadcrumbs & Header Bar */}
          <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold mb-3 text-slate-500">
                <Link to="/home" className="hover:text-primary transition-colors">Home</Link>
                <ChevronRight size={14} />
                <Link to="/categories" className="hover:text-primary transition-colors">Categories</Link>
                <ChevronRight size={14} />
                <span className="text-slate-800 capitalize font-bold">
                  {activeCategory === 'All' ? 'All Products' : activeCategory}
                </span>
                {activeSubcategory && (
                  <>
                    <ChevronRight size={14} />
                    <span className="text-primary capitalize font-black">{activeSubcategory}</span>
                  </>
                )}
              </div>
              
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1 capitalize flex items-center gap-3">
                {searchQuery 
                  ? `Results for "${searchQuery}"` 
                  : showSubcategoryGrid 
                    ? `${activeCategory} Subcategories`
                    : activeSubcategory 
                      ? activeSubcategory 
                      : activeCategory === 'All' 
                        ? 'All Digital Products' 
                        : activeCategory
                }
              </h1>
              <p className="text-slate-500 font-medium text-sm">
                {showSubcategoryGrid 
                  ? `Select a subcategory below to explore ${activeCategory} assets.`
                  : `${totalProducts} products available`
                }
              </p>
            </div>
            
            {!showSubcategoryGrid && (
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <select 
                    value={sort}
                    onChange={(e) => updateParams('sort', e.target.value)}
                    className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 cursor-pointer outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="createdAt">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
                  <SlidersHorizontal size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* VIEW CONDITION A: Subcategory Blocks/Cards Grid */}
          {showSubcategoryGrid ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSubcategories.map((sub: any) => (
                  <div 
                    key={sub.id || sub.name}
                    onClick={() => handleSubcategorySelect(sub)}
                    className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-all overflow-hidden">
                        {sub.image ? (
                          <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                        ) : (
                          <Layers size={26} />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{sub.name}</h3>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold shrink-0">
                          {sub.count || sub.productCount || 0}
                        </span>
                      </div>
                      
                      <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-6">
                        {sub.description || `Explore all ${sub.name} digital templates and assets.`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-primary">
                      <span>Explore Subcategory</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW CONDITION B: Product Cards Grid */
            <div>
              {/* Back to all Subcategories Navigation Link */}
              {activeCategory !== 'All' && currentSubcategories.length > 0 && activeSubcategory && (
                <div className="mb-6">
                  <button 
                    onClick={handleBackToSubcategories}
                    className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <ArrowLeft size={14} /> Back to all {activeCategory} subcategories
                  </button>
                </div>
              )}

              {/* Subcategory Filter Pills Bar */}
              {activeCategory !== 'All' && currentSubcategories.length > 0 && (
                <div className="mb-8 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <Layers size={14} /> Switch Subcategory:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleBackToSubcategories}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!activeSubcategory ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      All Subcategories ({currentSubcategories.length})
                    </button>
                    {currentSubcategories.map((sub: any) => {
                      const subSlug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
                      const isSelected = activeSubcategory.toLowerCase() === sub.name.toLowerCase() || 
                                         activeSubcategory.toLowerCase() === subSlug.toLowerCase().replace(/-/g, ' ');

                      return (
                        <button
                          key={sub.id || sub.name}
                          onClick={() => handleSubcategorySelect(sub)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          <span>{sub.name}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {sub.count || sub.productCount || 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-4">
                      <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
                      <Skeleton className="h-6 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-full rounded-lg" />
                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <Skeleton className="h-4 w-16 mb-2 rounded-md" />
                          <Skeleton className="h-6 w-20 rounded-lg" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {products.map((product, idx) => (
                    <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: `${idx * 80}ms`, animationDuration: '400ms' }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-xl h-[400px] rounded-3xl flex flex-col items-center justify-center text-center p-8 border border-slate-200/60 shadow-sm">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-600 rotate-12">
                    <Filter size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No products found</h3>
                  <p className="text-slate-500 mb-8 max-w-md">We couldn't find any products matching your selected subcategory filter.</p>
                  <button 
                    onClick={clearFilters}
                    className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
