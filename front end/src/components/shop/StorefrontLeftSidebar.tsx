import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Filter, X, Star, ChevronDown, ChevronRight, User, 
  Sparkles, Flame, Package, Layers, RotateCcw, Check, 
  Tag, Shield, DollarSign, Download, ArrowRight, Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DualRangeSlider from '../ui/DualRangeSlider';
import { formatCurrency } from '../../utils/currency';

interface StorefrontLeftSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  categories: any[];
  allProducts: any[];
  activeCategory: string;
  activeSubcategory: string;
  selectedProductType: string;
  selectedTag: string;
  selectedLicence: string;
  ratingFilter: string;
  availabilityFilter: string;
  minPrice: number;
  maxPrice: number;
  sliderMin: number;
  sliderMax: number;
  onUpdateParams: (key: string, value: string) => void;
  onUpdateMultipleParams: (updates: Record<string, string>) => void;
  onClearFilters: () => void;
}

export default function StorefrontLeftSidebar({
  isMobileOpen,
  setIsMobileOpen,
  categories,
  allProducts,
  activeCategory,
  activeSubcategory,
  selectedProductType,
  selectedTag,
  selectedLicence,
  ratingFilter,
  availabilityFilter,
  minPrice,
  maxPrice,
  sliderMin,
  sliderMax,
  onUpdateParams,
  onUpdateMultipleParams,
  onClearFilters
}: StorefrontLeftSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible category accordions
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    templates: true,
    graphics: true,
    'ui-kits': true,
    youtube: true
  });

  const toggleCategoryExpand = (catSlug: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catSlug]: !prev[catSlug]
    }));
  };

  // Top-level parent categories
  const parentCategories = categories.filter((c: any) => !c.parentId);

  // Dynamic tags extracted from real product data
  const dynamicTags = Array.from(
    new Set(
      allProducts
        .flatMap(p => {
          if (Array.isArray(p.tags)) return p.tags;
          if (typeof p.tags === 'string') {
            try {
              const parsed = JSON.parse(p.tags);
              if (Array.isArray(parsed)) return parsed;
            } catch {
              return p.tags.split(',').map((t: string) => t.trim());
            }
          }
          return [];
        })
        .filter(Boolean)
    )
  ).slice(0, 10);

  // Dynamic count calculation helper
  const getCategoryCount = (categoryName: string, categorySlug?: string) => {
    const targetName = (categoryName || '').toLowerCase().trim();
    const targetSlug = (categorySlug || '').toLowerCase().trim();

    return allProducts.filter(p => {
      const pCat = typeof p.category === 'object' ? (p.category as any)?.name : p.category;
      const pSlug = typeof p.category === 'object' ? (p.category as any)?.slug : '';
      const pName = (pCat || '').toLowerCase().trim();
      const pCatSlug = (pSlug || '').toLowerCase().trim();

      return pName === targetName || pCatSlug === targetSlug || pName.includes(targetName);
    }).length;
  };

  const getSubcategoryCount = (subName: string, subSlug?: string) => {
    const targetSub = (subName || '').toLowerCase().trim();
    const targetSlug = (subSlug || '').toLowerCase().trim();

    return allProducts.filter(p => {
      const pSub = (p.subcategory || '').toLowerCase().trim();
      const pCat = typeof p.category === 'object' ? (p.category as any)?.name : p.category;
      const pCatSlug = typeof p.category === 'object' ? (p.category as any)?.slug : '';

      return (
        pSub === targetSub ||
        pSub === targetSlug ||
        (pCat && pCat.toLowerCase().trim() === targetSub) ||
        (pCatSlug && pCatSlug.toLowerCase().trim() === targetSlug)
      );
    }).length;
  };

  const hasActiveFilters = Boolean(
    (activeCategory && activeCategory !== 'All') ||
    activeSubcategory ||
    selectedProductType ||
    selectedTag ||
    selectedLicence ||
    ratingFilter ||
    availabilityFilter ||
    minPrice > sliderMin ||
    maxPrice < sliderMax
  );

  const pricePresets = [
    { label: 'All Prices', min: sliderMin, max: sliderMax },
    { label: 'Under ₹500', min: sliderMin, max: 500 },
    { label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
    { label: '₹2,500 & Above', min: 2500, max: sliderMax }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          ${isMobileOpen 
            ? 'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-white shadow-2xl overflow-y-auto block p-5 transition-transform transform translate-x-0' 
            : 'hidden lg:block w-72 xl:w-80 shrink-0'
          }
        `}
      >
        <div className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1 custom-scrollbar">
          
          {/* ================================================================= */}
          {/* 1. CUSTOMER PROFILE & QUICK ACTIONS                                */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {user ? 'Welcome Back' : 'Welcome to KDW'}
                </span>
                <span className="text-sm font-black text-slate-900 truncate block">
                  {user?.name ? `Hello, ${user.name}` : 'Hello, Guest'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <Link 
                  to="/dashboard"
                  className="px-2.5 py-1 bg-slate-100 hover:bg-primary hover:text-white rounded-lg text-xs font-bold text-slate-700 transition-all"
                >
                  Account
                </Link>
              ) : (
                <Link 
                  to="/login"
                  className="px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  Sign In
                </Link>
              )}

              {isMobileOpen && (
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="lg:hidden p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. PRICE RANGE SLIDE BAR (Prominent Draggable Dual Range Slider)   */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={14} className="text-primary" />
                Price Range Slide Bar
              </h3>
              {(minPrice > sliderMin || maxPrice < sliderMax) && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMultipleParams({ minPrice: '', maxPrice: '' });
                  }}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Reset Price
                </button>
              )}
            </div>

            {/* Interactive Dual Slider */}
            <div>
              <DualRangeSlider 
                min={sliderMin} 
                max={sliderMax} 
                value={[minPrice, maxPrice]} 
                onChange={() => {}} 
                onChangeEnd={(val) => {
                  onUpdateMultipleParams({
                    minPrice: val[0] > sliderMin ? val[0].toString() : '',
                    maxPrice: val[1] < sliderMax ? val[1].toString() : ''
                  });
                }} 
              />
            </div>

            {/* Quick Price Preset Chips */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Price Filters:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pricePresets.map(preset => {
                  const isPresetActive = minPrice === preset.min && maxPrice === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        onUpdateMultipleParams({
                          minPrice: preset.min > sliderMin ? preset.min.toString() : '',
                          maxPrice: preset.max < sliderMax ? preset.max.toString() : ''
                        });
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        isPresetActive 
                          ? 'bg-primary text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. CATEGORY NAVIGATION TREE (Dynamic Expand/Collapse with Counts) */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-primary" />
                Categories
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {allProducts.length} Total
              </span>
            </div>

            <div className="space-y-1">
              {/* All Products Link */}
              <button
                type="button"
                onClick={() => {
                  navigate(`/categories/all-products${location.search}`);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  (!activeCategory || activeCategory === 'All' || activeCategory === 'all-products')
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>All Products</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  (!activeCategory || activeCategory === 'All' || activeCategory === 'all-products')
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {allProducts.length}
                </span>
              </button>

              {/* Dynamic Categories & Subcategories */}
              {parentCategories.map(cat => {
                const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                const isParentActive = activeCategory.toLowerCase() === cat.name.toLowerCase() || 
                                       activeCategory.toLowerCase() === catSlug.toLowerCase().replace(/-/g, ' ');
                const subcategories = cat.children || categories.filter((c: any) => c.parentId === cat.id);
                const isExpanded = expandedCategories[catSlug] ?? isParentActive;
                const catCount = getCategoryCount(cat.name, cat.slug);

                return (
                  <div key={cat.id || cat.name} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/categories/${catSlug}${location.search}`);
                          setIsMobileOpen(false);
                        }}
                        className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                          isParentActive && !activeSubcategory
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ml-1 shrink-0 ${
                          isParentActive && !activeSubcategory
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {catCount}
                        </span>
                      </button>

                      {subcategories && subcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleCategoryExpand(catSlug)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          aria-label={`Toggle ${cat.name} subcategories`}
                        >
                          <ChevronDown 
                            size={14} 
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`} 
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories List */}
                    {isExpanded && subcategories && subcategories.length > 0 && (
                      <div className="pl-3 ml-3 border-l-2 border-slate-100 space-y-1 py-1">
                        {subcategories.map((sub: any) => {
                          const subSlug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
                          const isSubActive = activeSubcategory.toLowerCase() === sub.name.toLowerCase() || 
                                              activeSubcategory.toLowerCase() === subSlug.toLowerCase().replace(/-/g, ' ');
                          const subCount = getSubcategoryCount(sub.name, sub.slug);

                          return (
                            <button
                              key={sub.id || sub.name}
                              type="button"
                              onClick={() => {
                                navigate(`/categories/${catSlug}/${subSlug}${location.search}`);
                                setIsMobileOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                                isSubActive
                                  ? 'bg-primary/10 text-primary font-bold'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                                isSubActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {subCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* 4. REFINED FILTERS (Types, Availability, Ratings, Licences)        */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-5">
            
            {/* Filter Header & Reset Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <Filter size={14} className="text-primary" />
                Filter Options
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  <RotateCcw size={11} /> Reset All
                </button>
              )}
            </div>

            {/* Availability Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Availability
              </h4>
              <div className="space-y-1">
                {[
                  { label: 'All Items', value: '' },
                  { label: '₹0 Free Digital Assets', value: 'free' },
                  { label: 'Discounted / On Sale', value: 'sale' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateParams('filter', opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                      availabilityFilter === opt.value
                        ? 'bg-primary text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {availabilityFilter === opt.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Type Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Product Type
              </h4>
              <div className="space-y-1">
                {[
                  { label: 'All Types', value: '' },
                  { label: 'Downloadable File', value: 'DOWNLOADABLE_FILE' },
                  { label: 'Canva / Web Template', value: 'TEMPLATE' },
                  { label: 'UI Kit / Figma', value: 'UI_KIT' },
                  { label: 'Graphic Assets', value: 'GRAPHIC' },
                  { label: 'Plugin & Code', value: 'PLUGIN' }
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => onUpdateParams('type', type.value)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                      selectedProductType === type.value
                        ? 'bg-primary text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{type.label}</span>
                    {selectedProductType === type.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Tags */}
            {dynamicTags.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag size={12} className="text-slate-400" /> Popular Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {dynamicTags.map((tag: any) => {
                    const tagStr = String(tag);
                    const isSelected = selectedTag.toLowerCase() === tagStr.toLowerCase();

                    return (
                      <button
                        key={tagStr}
                        type="button"
                        onClick={() => onUpdateParams('tag', isSelected ? '' : tagStr)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        #{tagStr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Licence Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield size={12} className="text-slate-400" /> Licence Type
              </h4>
              <div className="space-y-1">
                {[
                  { label: 'All Licences', value: '' },
                  { label: 'Commercial Licence', value: 'COMMERCIAL' },
                  { label: 'Personal Licence', value: 'PERSONAL' },
                  { label: 'Extended Commercial', value: 'EXTENDED' }
                ].map(lic => (
                  <button
                    key={lic.value}
                    type="button"
                    onClick={() => onUpdateParams('licence', lic.value)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                      selectedLicence === lic.value
                        ? 'bg-primary text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{lic.label}</span>
                    {selectedLicence === lic.value && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Rating Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star size={12} className="text-amber-400 fill-amber-400" /> Customer Rating
              </h4>
              <div className="space-y-1">
                {[4, 3, 2, 1].map(stars => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => onUpdateParams('rating', ratingFilter === String(stars) ? '' : String(stars))}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                      ratingFilter === String(stars)
                        ? 'bg-primary text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            className={i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                          />
                        ))}
                      </div>
                      <span className="ml-1.5">& Up</span>
                    </div>
                    {ratingFilter === String(stars) && <Check size={13} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} /> Clear All Filters
                </button>
              </div>
            )}

          </div>

          {/* ================================================================= */}
          {/* 5. EXPLORE COLLECTIONS QUICK LINKS                                */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 pb-2 border-b border-slate-100">
              Collections
            </h3>
            <div className="space-y-1 text-xs font-bold">
              <Link 
                to="/bundles"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-primary transition-all"
              >
                <span className="flex items-center gap-2">
                  <Package size={14} className="text-purple-600" /> Bundles & Value Packs
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">SAVE</span>
              </Link>
              <Link 
                to="/new-arrivals"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-primary transition-all"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-500" /> New Arrivals
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-black">NEW</span>
              </Link>
              <Link 
                to="/best-sellers"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-amber-600 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Flame size={14} className="text-amber-500" /> Hot Deals & Offers
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-black">HOT</span>
              </Link>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
