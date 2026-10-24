import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, ArrowRight, X, 
  Sparkles, Layers, ChevronDown, BookOpen, HelpCircle, ArrowLeft, Tag, RefreshCw
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { productsApi, type ProductItem, type CategoryItem } from '../api';

interface ShopProps {
  forcedType?: string;
  forcedNew?: boolean;
  forcedFree?: boolean;
  customHeadline?: string;
  customDescription?: string;
}

const DEFAULT_CATEGORY_PILLS = [
  'All',
  'Agency Starter Kits',
  'Business Templates',
  'Social Media Bundles',
  'Website Kits',
  'Automation Workflows'
];

const SORT_OPTIONS = [
  { value: 'featured', label: '★ Featured First' },
  { value: 'newest', label: 'Newest Releases' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name (A to Z)' },
  { value: 'name-desc', label: 'Name (Z to A)' },
  { value: 'most-sales', label: 'Best Sellers' },
  { value: 'most-downloads', label: 'Most Downloaded' }
];

export default function Shop({
  forcedType,
  forcedNew,
  forcedFree,
  customHeadline,
  customDescription
}: ShopProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug?: string; subcategorySlug?: string }>();
  const navigate = useNavigate();

  // URL state extractions
  const activeCategoryParam = categorySlug && categorySlug !== 'all-products' 
    ? categorySlug 
    : (searchParams.get('category') || 'All');
  const activeSubcategoryParam = subcategorySlug || searchParams.get('subcategory') || 'All';
  const activeSearchParam = searchParams.get('search') || searchParams.get('q') || '';
  const activeSortParam = searchParams.get('sort') || searchParams.get('sortBy') || 'newest';
  const rawMinPrice = searchParams.get('minPrice') || '';
  const rawMaxPrice = searchParams.get('maxPrice') || '';
  const activeMinPriceParam = rawMinPrice && !isNaN(Number(rawMinPrice)) && Number(rawMinPrice) >= 0 ? rawMinPrice : '';
  const activeMaxPriceParam = rawMaxPrice && !isNaN(Number(rawMaxPrice)) && Number(rawMaxPrice) >= 0 ? rawMaxPrice : '';
  const activePageParam = parseInt(searchParams.get('page') || '1', 10);

  // Component state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [categoryPills, setCategoryPills] = useState<string[]>(DEFAULT_CATEGORY_PILLS);
  const [currentCategoryData, setCurrentCategoryData] = useState<CategoryItem | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(activeSearchParam);
  const [priceMinInput, setPriceMinInput] = useState<string>(activeMinPriceParam);
  const [priceMaxInput, setPriceMaxInput] = useState<string>(activeMaxPriceParam);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Request counter to avoid stale race conditions
  const latestRequestId = useRef(0);

  // Keep search input in sync if URL changes (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(activeSearchParam);
    setPriceMinInput(activeMinPriceParam);
    setPriceMaxInput(activeMaxPriceParam);
  }, [activeSearchParam, activeMinPriceParam, activeMaxPriceParam]);

  // Load Categories list once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await productsApi.getCategories();
        if (res.success && Array.isArray(res.data)) {
          setCategoriesList(res.data);
          const primaryNames = res.data
            .filter((c: any) => !c.parentId)
            .map((c: any) => c.name);
          if (primaryNames.length > 0) {
            setCategoryPills(['All', ...primaryNames]);
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Match or fetch detailed Category data when activeCategoryParam changes
  useEffect(() => {
    const target = activeCategoryParam.toLowerCase().trim();
    if (target === 'all') {
      setCurrentCategoryData(null);
      return;
    }

    const matched = categoriesList.find((c) => 
      c.slug?.toLowerCase() === target || 
      c.id?.toLowerCase() === target || 
      c.name?.toLowerCase() === target
    );

    if (matched) {
      productsApi.getCategoryByIdOrSlug(matched.slug || matched.id)
        .then((res) => {
          if (res.success && res.data) {
            setCurrentCategoryData(res.data);
          } else {
            setCurrentCategoryData(matched);
          }
        })
        .catch(() => setCurrentCategoryData(matched));
    } else {
      productsApi.getCategoryByIdOrSlug(activeCategoryParam)
        .then((res) => {
          if (res.success && res.data) {
            setCurrentCategoryData(res.data);
          } else {
            setCurrentCategoryData(null);
          }
        })
        .catch(() => setCurrentCategoryData(null));
    }
  }, [activeCategoryParam, categoriesList]);

  // Catalog Fetching function with race condition guard
  const fetchCatalog = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    setError(null);

    try {
      if (forcedType === 'bundle') {
        const bundlesRes = await productsApi.getBundles({ status: 'ACTIVE' });

        if (requestId !== latestRequestId.current) return;

        let bundlesList: any[] = [];
        if (bundlesRes && bundlesRes.data) {
          const raw = Array.isArray(bundlesRes.data) ? bundlesRes.data : (bundlesRes.data as any).bundles || [];
          const activeBundles = raw.filter((b: any) => {
            const st = (b.status || 'ACTIVE').toUpperCase();
            return st === 'ACTIVE' || st === 'PUBLISHED';
          });
          bundlesList = activeBundles.map((b: any) => ({
            ...b,
            name: b.title || b.name,
            type: 'bundle',
            fileCount: b.itemsIncluded || (b.bundleItems?.length || 0) || 1
          }));
        }

        setProducts(bundlesList);
      } else {
        const queryParams: any = {
          sort: activeSortParam,
          limit: 100
        };

        if (activeCategoryParam !== 'All') {
          queryParams.category = activeCategoryParam;
        }
        if (activeSubcategoryParam !== 'All') {
          queryParams.subcategory = activeSubcategoryParam;
        }
        if (activeSearchParam) {
          queryParams.search = activeSearchParam;
        }
        if (activeMinPriceParam && !isNaN(Number(activeMinPriceParam))) {
          queryParams.minPrice = Number(activeMinPriceParam);
        }
        if (activeMaxPriceParam && !isNaN(Number(activeMaxPriceParam))) {
          queryParams.maxPrice = Number(activeMaxPriceParam);
        }

        const res = await productsApi.getProducts(queryParams);

        if (requestId !== latestRequestId.current) return;

        if (res.success && Array.isArray(res.data)) {
          setProducts(res.data);
        } else {
          setProducts([]);
        }
      }
    } catch (err: any) {
      if (requestId !== latestRequestId.current) return;
      console.error('Error fetching catalog:', err);
      setError('Unable to load catalog records from the server.');
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }, [
    activeCategoryParam,
    activeSubcategoryParam,
    activeSearchParam,
    activeSortParam,
    activeMinPriceParam,
    activeMaxPriceParam,
    forcedType
  ]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Debounced Search Input Handler (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== activeSearchParam) {
        const params = new URLSearchParams(searchParams);
        if (trimmed) {
          params.set('search', trimmed);
        } else {
          params.delete('search');
          params.delete('q');
        }
        params.delete('page');
        setSearchParams(params);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, activeSearchParam, searchParams, setSearchParams]);

  // Filter Actions
  const handleCategorySelect = (catName: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('subcategory');
    params.delete('page');
    if (catName === 'All') {
      params.delete('category');
      setSearchParams(params);
      if (categorySlug) navigate('/shop');
    } else {
      const found = categoriesList.find((c) => 
        c.name.toLowerCase() === catName.toLowerCase() || 
        c.slug?.toLowerCase() === catName.toLowerCase()
      );
      if (found && found.slug) {
        navigate(`/categories/${found.slug}`);
      } else {
        params.set('category', catName);
        setSearchParams(params);
      }
    }
  };

  const handleSubcategorySelect = (subName: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    if (subName === 'All') {
      params.delete('subcategory');
      setSearchParams(params);
      if (categorySlug) {
        navigate(`/categories/${categorySlug}`);
      }
    } else {
      const subItem = currentCategoryData?.children?.find(
        (c: any) => c.name?.toLowerCase() === subName.toLowerCase() || c.slug?.toLowerCase() === subName.toLowerCase()
      );
      const subSlug = subItem?.slug || subName;
      if (categorySlug) {
        navigate(`/categories/${categorySlug}/${encodeURIComponent(subSlug)}`);
      } else {
        params.set('subcategory', subName);
        setSearchParams(params);
      }
    }
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.delete('page');
    setSearchParams(params);
  };

  const handleApplyPriceFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams);
    const minVal = parseFloat(priceMinInput);
    const maxVal = parseFloat(priceMaxInput);

    if (!isNaN(minVal) && minVal >= 0) {
      params.set('minPrice', String(minVal));
    } else {
      params.delete('minPrice');
    }

    if (!isNaN(maxVal) && maxVal >= 0) {
      params.set('maxPrice', String(maxVal));
    } else {
      params.delete('maxPrice');
    }

    params.delete('page');
    setSearchParams(params);
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setPriceMinInput('');
    setPriceMaxInput('');
    if (categorySlug) {
      navigate('/shop');
    } else {
      setSearchParams(new URLSearchParams());
    }
  };

  // Filtered and sorted product list
  const displayProducts = useMemo(() => {
    return products.filter((p) => {
      if (forcedType === 'bundle') {
        if (p.type !== 'bundle') return false;
      } else if (forcedType && p.type !== forcedType && !p.title?.toLowerCase().includes(forcedType)) {
        return false;
      }
      if (forcedNew && !p.isNew && p.badge !== 'NEW') {
        return false;
      }
      if (forcedFree) {
        const isFree = Number(p.price) === 0 || 
          (p.discountPrice !== null && p.discountPrice !== undefined && Number(p.discountPrice) === 0) || 
          p.type === 'free' ||
          (typeof p.slug === 'string' && p.slug.startsWith('freebie')) ||
          (typeof p.categorySlug === 'string' && p.categorySlug.includes('free'));
        if (!isFree) return false;
      }
      return true;
    });
  }, [products, forcedType, forcedNew, forcedFree]);

  const hasActiveFilters = Boolean(
    (activeCategoryParam && activeCategoryParam !== 'All') ||
    (activeSubcategoryParam && activeSubcategoryParam !== 'All') ||
    activeSearchParam ||
    activeMinPriceParam ||
    activeMaxPriceParam
  );

  // Active subcategory if any
  const activeSubcategory = useMemo(() => {
    if (!activeSubcategoryParam || activeSubcategoryParam === 'All' || !currentCategoryData?.children) return null;
    const targetSub = activeSubcategoryParam.toLowerCase().trim();
    return currentCategoryData.children.find((c: any) => 
      c.name?.toLowerCase().trim() === targetSub ||
      c.slug?.toLowerCase().trim() === targetSub ||
      c.id?.toLowerCase().trim() === targetSub
    );
  }, [activeSubcategoryParam, currentCategoryData]);

  const activeDisplayCategory = activeSubcategory || currentCategoryData;

  // SEO & Display Info
  const headline = customHeadline || (activeDisplayCategory ? activeDisplayCategory.name : 'A useful toolkit starts with the right problem.');
  const description = customDescription || 
    (activeDisplayCategory 
      ? (activeDisplayCategory.description || activeDisplayCategory.shortDescription || currentCategoryData?.description || currentCategoryData?.shortDescription || `Explore curated digital templates and assets for ${activeDisplayCategory.name}.`) 
      : 'Explore modular templates, turnkey digital assets, and production-grade systems built for independent builders.');

  const categoryImage = activeDisplayCategory?.image || activeDisplayCategory?.banner || currentCategoryData?.image || currentCategoryData?.banner || null;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] selection:bg-[#ede9fe] selection:text-[#5b21b6] font-sans pb-24">
      <SEO 
        title={activeDisplayCategory?.seoTitle || currentCategoryData?.seoTitle || `${headline} | KDW Digital Assets`}
        description={activeDisplayCategory?.seoDescription || currentCategoryData?.seoDescription || description}
      />

      {/* Hero Header Section */}
      <section className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0]/60 bg-gradient-to-b from-white to-[#fcfbf9]">
        <div className="max-w-[1360px] mx-auto">
          {/* Breadcrumb Navigation Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 flex-wrap font-medium">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/categories" className="hover:text-[#5b21b6] transition-colors">Categories</Link>
            {activeCategoryParam !== 'All' && (
              <>
                <span className="text-slate-300">/</span>
                {activeSubcategoryParam !== 'All' ? (
                  <Link 
                    to={`/categories/${currentCategoryData?.slug || activeCategoryParam}`} 
                    className="hover:text-[#5b21b6] transition-colors font-medium"
                  >
                    {currentCategoryData?.name || activeCategoryParam}
                  </Link>
                ) : (
                  <span className="text-[#5b21b6] font-bold">{currentCategoryData?.name || activeCategoryParam}</span>
                )}
              </>
            )}
            {activeSubcategoryParam !== 'All' && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-[#5b21b6] font-bold">{activeSubcategoryParam}</span>
              </>
            )}
            {activeCategoryParam === 'All' && activeSubcategoryParam === 'All' && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-[#5b21b6] font-bold">All Products Catalog</span>
              </>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mt-2">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold font-sans tracking-[0.2em] text-[#5b21b6] uppercase block">
                  {activeCategoryParam !== 'All' ? (activeDisplayCategory?.name || activeCategoryParam) : 'CATALOG & TOOLKITS'}
                </span>
                {(activeDisplayCategory?.featured || currentCategoryData?.featured) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-amber-950 border border-amber-300 shadow-xs flex items-center gap-1">
                    ★ Featured Category
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#171325] tracking-tight leading-tight">
                {headline}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                {description}
              </p>
            </div>

            {/* Category Image / Hero Banner Display */}
            {categoryImage && (
              <div className="w-full lg:w-96 h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-md relative group shrink-0 bg-slate-100">
                <img 
                  src={categoryImage} 
                  alt={headline} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white pointer-events-none">
                  <span className="text-xs font-bold font-sans drop-shadow-sm truncate max-w-[220px]">
                    {headline}
                  </span>
                  <div className="flex items-center gap-1">
                    {(activeDisplayCategory?.featured || currentCategoryData?.featured) && (
                      <span className="text-[9px] font-mono font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">
                        ★ FEATURED
                      </span>
                    )}
                    <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs border border-white/20">
                      KDW Collection
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Quick Pills */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoryPills.map((pill) => {
              const isSelected = activeCategoryParam.toLowerCase() === pill.toLowerCase();
              return (
                <button
                  key={pill}
                  onClick={() => handleCategorySelect(pill)}
                  className={`px-4 py-2 rounded-full text-xs font-medium font-sans whitespace-nowrap transition-all kdw-button-press ${
                    isSelected
                      ? 'bg-[#5b21b6] text-white shadow-xs font-bold'
                      : 'bg-white border border-[#e2e8f0] text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>

          {/* Subcategories Filter Row (If Active Category has Subcategories) */}
          {currentCategoryData?.children && currentCategoryData.children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Subcategories:</span>
              <button
                onClick={() => handleSubcategorySelect('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSubcategoryParam === 'All'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All {currentCategoryData.name}
              </button>
              {currentCategoryData.children.map((sub: any) => {
                const isSubActive = activeSubcategoryParam.toLowerCase() === sub.name.toLowerCase() || activeSubcategoryParam.toLowerCase() === (sub.slug?.toLowerCase() || '');
                const subCount = sub.count !== undefined ? sub.count : (sub.productCount !== undefined ? sub.productCount : 0);

                return (
                  <button
                    key={sub.id || sub.slug || sub.name}
                    onClick={() => handleSubcategorySelect(sub.name)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                      isSubActive
                        ? 'bg-[#5b21b6] text-white shadow-2xs font-bold'
                        : 'bg-slate-100 hover:bg-[#ede9fe] text-slate-700 hover:text-[#5b21b6]'
                    }`}
                  >
                    {sub.featured && <span className="text-amber-500 font-bold">★</span>}
                    <span>{sub.name} {subCount > 0 ? `(${subCount})` : ''}</span>
                  </button>
                );
              })}
            </div>
          )}


        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* SCENARIO 1: Category HAS subcategories and user hasn't picked one yet -> Show Subcategories Grid */}
        {currentCategoryData?.children && currentCategoryData.children.length > 0 && activeSubcategoryParam === 'All' ? (
          <div className="space-y-6 mb-12">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e2e8f0] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold font-sans tracking-[0.2em] text-[#5b21b6] uppercase block mb-1">
                    SUBCATEGORIES IN {currentCategoryData.name}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                    Select a subcategory to browse products
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Choose one of the {currentCategoryData.children.length} specialized subcategories below to explore available kits and digital assets.
                  </p>
                </div>
                <button
                  onClick={() => handleSubcategorySelect('all-products-view')}
                  className="self-start sm:self-auto text-xs font-semibold text-[#5b21b6] hover:underline flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#ede9fe]/60 hover:bg-[#ede9fe] transition-colors shrink-0"
                >
                  <span>Or view all {currentCategoryData.name} products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subcategories Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {currentCategoryData.children.map((sub: any) => {
                  const subCount = sub.count !== undefined ? sub.count : (sub.productCount !== undefined ? sub.productCount : (sub._count?.products || 0));
                  const subImage = sub.image || sub.banner || (products.find((p: any) => p.subcategoryId === sub.id || p.subcategory?.toLowerCase() === sub.name?.toLowerCase())?.thumbnail) || null;

                  return (
                    <button
                      key={sub.id || sub.slug || sub.name}
                      onClick={() => handleSubcategorySelect(sub.slug || sub.name)}
                      className="rounded-2xl bg-[#fafafa] hover:bg-white border border-slate-200/90 hover:border-[#5b21b6] hover:shadow-lg transition-all duration-300 text-left group flex flex-col justify-between overflow-hidden cursor-pointer"
                    >
                      {/* Subcategory Image Header */}
                      <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden shrink-0">
                        {subImage ? (
                          <img
                            src={subImage}
                            alt={sub.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/fallback/image-unavailable.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#ede9fe]/80 to-[#ddd6fe]/50 text-[#5b21b6]">
                            <Layers className="w-10 h-10 opacity-50 mb-1" />
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider opacity-70">
                              KDW Subcategory
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                        {/* Floating Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5b21b6] bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-md shadow-xs border border-purple-100">
                            Subcategory
                          </span>
                          {sub.featured && (
                            <span className="text-[10px] font-mono font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs border border-amber-300">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3 w-full">
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-serif font-bold text-slate-900 group-hover:text-[#5b21b6] transition-colors leading-snug">
                            {sub.name}
                          </h3>
                          {sub.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
                              {sub.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-[#5b21b6]">
                          <span className="text-slate-500 font-mono text-[11px]">
                            {subCount > 0 ? `${subCount} Products` : 'Explore pack'}
                          </span>
                          <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>View products</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* SCENARIO 2: A subcategory is selected OR the category has no subcategories OR viewing All Categories -> Show Products */
          <>
            {/* Active Subcategory Context Banner if a subcategory is selected */}
            {activeSubcategory && (
              <div className="mb-6 flex items-center justify-between p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-400 font-medium">Filtering by Subcategory:</span>
                  <span className="text-xs font-bold font-mono bg-[#ede9fe] text-[#5b21b6] px-3 py-1 rounded-lg">
                    {activeSubcategory.name}
                  </span>
                </div>
                <button
                  onClick={() => handleSubcategorySelect('All')}
                  className="text-xs font-semibold text-slate-600 hover:text-[#5b21b6] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to {currentCategoryData?.name} subcategories</span>
                </button>
              </div>
            )}

            {/* Controls Bar: Search, Filters, Sort */}
            <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search templates, kits, automations..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#5b21b6] transition-all"
                />
                {searchInput && (
                  <button 
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Price & Sort Controls */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                
                {/* Price Filter Trigger / Inputs */}
                <form onSubmit={handleApplyPriceFilter} className="hidden lg:flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Price:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={priceMinInput}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setPriceMinInput('');
                      } else {
                        const num = parseFloat(val);
                        if (!isNaN(num) && num >= 0) {
                          setPriceMinInput(val);
                        }
                      }
                    }}
                    className="w-18 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#5b21b6]"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={priceMaxInput}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setPriceMaxInput('');
                      } else {
                        const num = parseFloat(val);
                        if (!isNaN(num) && num >= 0) {
                          setPriceMaxInput(val);
                        }
                      }
                    }}
                    className="w-18 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-[#5b21b6]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#ede9fe] text-slate-700 hover:text-[#5b21b6] text-xs font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {/* Sort Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort by:</span>
                  <select
                    value={activeSortParam}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#5b21b6] cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear All Filters button if active */}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs text-[#5b21b6] hover:underline font-semibold whitespace-nowrap pl-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-3 border-[#5b21b6] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs text-slate-500 font-mono">Loading digital systems from catalog...</p>
              </div>
            )}

            {/* Error State with Retry Button */}
            {!loading && error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
                <h3 className="text-base font-bold text-rose-800 mb-1">Catalog Connection Issue</h3>
                <p className="text-xs text-rose-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchCatalog()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry loading products</span>
                </button>
              </div>
            )}

            {/* Empty Catalog State */}
            {!loading && !error && displayProducts.length === 0 && (
              <div className="bg-white border border-[#e2e8f0] rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#171325]">No products found</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {hasActiveFilters 
                      ? 'We couldn\'t find any digital assets matching your current search and filter combination.'
                      : 'No items are currently listed in this category.'}
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    className="px-5 py-2.5 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans transition-all shadow-xs"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && displayProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayProducts.map((prod) => (
                  <ProductCard key={prod.id || prod.slug} product={prod} />
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
