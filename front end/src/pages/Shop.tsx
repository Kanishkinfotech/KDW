import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { 
  Filter, SlidersHorizontal, ChevronRight, Layers, ArrowLeft, 
  ArrowRight, PackageSearch, LayoutGrid, List, Sparkles, 
  RotateCcw, ShoppingBag, FolderCheck, CreditCard
} from 'lucide-react';
import SEO from '../components/SEO';
import { useStore } from '../store/useStore';
import StorefrontLeftSidebar from '../components/shop/StorefrontLeftSidebar';
import StorefrontRightPanel from '../components/shop/StorefrontRightPanel';
import Skeleton from '../components/ui/Skeleton';

export default function Shop() {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug?: string; subcategorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'subscriptions' | 'digital'>('all');
  const navigate = useNavigate();

  const storeProducts = useStore(state => state.products);
  const categories = useStore(state => state.categories);

  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read URL search parameters & path parameters
  const categoryQuery = searchParams.get('category');
  const subcategoryQuery = searchParams.get('subcategory');

  const effectiveCatSlug = categorySlug || (categoryQuery ? categoryQuery.toLowerCase().replace(/\s+/g, '-') : '');
  const isAllProducts = !effectiveCatSlug || effectiveCatSlug === 'all-products' || effectiveCatSlug === 'all';
  const activeCategory = isAllProducts ? 'All' : effectiveCatSlug.replace(/-/g, ' ');

  const activeSubcategory = subcategoryQuery || (subcategorySlug ? subcategorySlug.replace(/-/g, ' ') : '');
  
  const searchQuery = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const ratingFilter = searchParams.get('rating') || '';
  const filterParam = searchParams.get('filter') || '';
  const typeFilter = searchParams.get('type') || '';
  const tagFilter = searchParams.get('tag') || '';
  const licenceFilter = searchParams.get('licence') || '';
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');

  const sliderMin = 0;
  const sliderMax = 4999;
  const currentMin = minPriceParam ? Number(minPriceParam) : sliderMin;
  const currentMax = maxPriceParam ? Number(maxPriceParam) : sliderMax;

  // Match current active category object
  const currentCategoryObj = categories.find((c: any) => 
    c.name?.toLowerCase() === activeCategory.toLowerCase() || 
    (c.slug && c.slug.toLowerCase() === effectiveCatSlug.toLowerCase())
  );

  const currentSubcategories = (currentCategoryObj?.children || categories.filter((c: any) => c.parentId === currentCategoryObj?.id)) || [];

  // Filter products when dependencies change
  useEffect(() => {
    const filterAndSet = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 150));

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
          const q = searchQuery.toLowerCase().trim();
          localProducts = localProducts.filter(p => {
            const title = (p.title || (p as any).name || '').toLowerCase();
            const desc = (p.description || (p as any).shortDescription || '').toLowerCase();
            const tags = String(p.tags || '').toLowerCase();
            return title.includes(q) || desc.includes(q) || tags.includes(q);
          });
        }

        // 4. Product Type Filter
        if (typeFilter) {
          localProducts = localProducts.filter(p => {
            const pType = (p.productType || (p as any).type || '').toUpperCase();
            return pType === typeFilter.toUpperCase();
          });
        }

        // 5. Tag Filter
        if (tagFilter) {
          const targetTag = tagFilter.toLowerCase();
          localProducts = localProducts.filter(p => {
            if (Array.isArray(p.tags)) {
              return p.tags.some((t: any) => String(t).toLowerCase() === targetTag);
            }
            if (typeof p.tags === 'string') {
              return p.tags.toLowerCase().includes(targetTag);
            }
            return false;
          });
        }

        // 6. Licence Filter
        if (licenceFilter) {
          localProducts = localProducts.filter(p => {
            const pLicence = (p.licenceType || '').toUpperCase();
            return pLicence.includes(licenceFilter.toUpperCase());
          });
        }

        // 7. Rating Filter
        if (ratingFilter) {
          const minRate = Number(ratingFilter);
          localProducts = localProducts.filter(p => {
            const rate = p.rating || 5;
            return rate >= minRate;
          });
        }
        
        // 8. Availability Filter (free vs sale)
        if (filterParam === 'free') {
          localProducts = localProducts.filter(p => p.price === 0);
        } else if (filterParam === 'sale') {
          localProducts = localProducts.filter(p => (p.discountPrice && p.discountPrice < p.price) || p.compareAtPrice > p.price);
        }
        
        // 9. Price Range Filter
        if (minPriceParam) {
          localProducts = localProducts.filter(p => p.price >= Number(minPriceParam));
        }
        if (maxPriceParam) {
          localProducts = localProducts.filter(p => p.price <= Number(maxPriceParam));
        }

        // 10. Context Tabs Filter
        if (activeTab === 'digital') {
          localProducts = localProducts.filter(p => p.productType !== 'BUNDLE');
        }
        
        // 11. Sorting
        if (sort === 'price_asc') localProducts.sort((a, b) => a.price - b.price);
        else if (sort === 'price_desc') localProducts.sort((a, b) => b.price - a.price);
        else if (sort === 'rating') localProducts.sort((a, b) => (b.rating || 5) - (a.rating || 5));
        else if (sort === 'popular') localProducts.sort((a, b) => (b.sales || b.totalUnitsSold || 0) - (a.sales || a.totalUnitsSold || 0));
        else localProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        setFilteredProducts(localProducts);
        setVisibleCount(12); // Reset pagination on filter change
      } finally {
        setIsLoading(false);
      }
    };

    filterAndSet();
  }, [
    activeCategory, activeSubcategory, searchQuery, sort, ratingFilter, 
    filterParam, typeFilter, tagFilter, licenceFilter, minPriceParam, 
    maxPriceParam, storeProducts, effectiveCatSlug, activeTab
  ]);

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

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 12, filteredProducts.length));
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 2xl:px-12 bg-slate-50/50">
      <SEO 
        title={activeSubcategory ? `${activeSubcategory} - ${activeCategory} | KDW` : `${activeCategory} Digital Assets | KDW Store`} 
        description={`Explore premium digital products, templates, and assets in ${activeCategory}${activeSubcategory ? ` / ${activeSubcategory}` : ''}.`} 
      />
      
      <div className="w-full flex flex-col lg:flex-row gap-6 xl:gap-8 items-start relative">
        
        {/* ================================================================= */}
        {/* 1. LEFT SIDEBAR: Navigation & Unified Filters (No center filters)  */}
        {/* ================================================================= */}
        <StorefrontLeftSidebar
          isMobileOpen={isMobileFilterOpen}
          setIsMobileOpen={setIsMobileFilterOpen}
          categories={categories}
          allProducts={storeProducts}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          selectedProductType={typeFilter}
          selectedTag={tagFilter}
          selectedLicence={licenceFilter}
          ratingFilter={ratingFilter}
          availabilityFilter={filterParam}
          minPrice={currentMin}
          maxPrice={currentMax}
          sliderMin={sliderMin}
          sliderMax={sliderMax}
          onUpdateParams={updateParams}
          onUpdateMultipleParams={updateMultipleParams}
          onClearFilters={clearFilters}
        />

        {/* ================================================================= */}
        {/* 2. CENTER PRODUCT AREA (Apple-Style Staggered Grid & Metadata)    */}
        {/* ================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          
          {/* Breadcrumbs Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={13} className="text-slate-400" />
            <Link to="/categories/all-products" className="hover:text-primary transition-colors">Categories</Link>
            {activeCategory && activeCategory !== 'All' && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <Link to={`/categories/${effectiveCatSlug}`} className="text-slate-700 font-bold hover:text-primary transition-colors capitalize">
                  {activeCategory}
                </Link>
              </>
            )}
            {activeSubcategory && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="text-primary font-black capitalize">{activeSubcategory}</span>
              </>
            )}
          </nav>

          {/* Page Header (Title + Contextual Description) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight capitalize flex items-center gap-2.5">
                  {searchQuery 
                    ? `Results for "${searchQuery}"` 
                    : activeSubcategory 
                      ? activeSubcategory 
                      : activeCategory === 'All' 
                        ? 'All Digital Products & Assets' 
                        : `${activeCategory} Collection`
                  }
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                  {activeCategory === 'All'
                    ? 'Explore premium digital templates, graphics, UI kits, and creator blueprints with instant cloud delivery.'
                    : `Browse curated ${activeCategory} assets built for creators, businesses, and digital entrepreneurs.`
                  }
                </p>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-sm shadow-primary/20 shrink-0 cursor-pointer"
              >
                <Filter size={15} />
                <span>Filters & Categories</span>
              </button>
            </div>

            {/* Context Tabs (All, Orders, Subscriptions, Digital Content) */}
            <div className="flex items-center gap-2 pt-5 mt-5 border-t border-slate-100 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Assets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('digital')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'digital'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Digital Downloads
              </button>
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <FolderCheck size={13} className="text-primary" />
                <span>My Orders & Library</span>
              </Link>
              <Link
                to="/bundles"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} className="text-purple-600" />
                <span>Bundle Packs</span>
              </Link>
            </div>
          </div>

          {/* Results Toolbar: Count + Sort + View Mode (No center filter panel) */}
          <div className="flex items-center justify-between gap-4 px-1 flex-wrap">
            <div className="text-xs font-bold text-slate-600">
              Showing <span className="text-slate-900 font-black">{displayedProducts.length}</span> of <span className="text-slate-900 font-black">{filteredProducts.length}</span> assets
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Select */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => updateParams('sort', e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
                <SlidersHorizontal size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle (Grid vs List) */}
              <div className="flex items-center bg-white border border-slate-200/90 rounded-xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  aria-label="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  aria-label="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid / List with Apple-Style Progressive Reveal Animation */}
          {isLoading ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6" : "space-y-4"}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/70 space-y-3">
                  <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6" : "space-y-4"}>
              {displayedProducts.map((product, idx) => {
                // Progressive stagger calculation for Apple-style reveal
                const staggerDelay = `${(idx % 12) * 75}ms`;

                return (
                  <div 
                    key={product.id} 
                    className="apple-product-reveal h-full"
                    style={{ animationDelay: staggerDelay }}
                  >
                    <ProductCard product={product} viewMode={viewMode} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
                <PackageSearch size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900">No assets match your search</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                Try adjusting your category, price range, or filter criteria to discover more products.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Load More Pagination Button */}
          {!isLoading && hasMore && (
            <div className="text-center pt-6 pb-4">
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-8 py-3.5 bg-white hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200/90 rounded-2xl text-xs font-black transition-all shadow-xs hover:shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <span>Load More ({filteredProducts.length - displayedProducts.length} remaining)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

        </main>

        {/* ================================================================= */}
        {/* 3. RIGHT SHOPPING PANEL: Cart Subtotal, Delivery, Recently Viewed */}
        {/* ================================================================= */}
        <StorefrontRightPanel 
          currentCategory={activeCategory} 
          allProducts={storeProducts} 
        />

      </div>
    </div>
  );
}
