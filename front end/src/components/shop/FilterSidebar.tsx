import { Filter, X, Star, Check, ChevronRight, Layers } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import DualRangeSlider from '../ui/DualRangeSlider';
import { useStore } from '../../store/useStore';

interface FilterSidebarProps {
  isFilterOpen: boolean;
  setIsFilterOpen: (isOpen: boolean) => void;
  categories: any[];
  activeCategory: string;
  activeSubcategory: string;
  ratingFilter: string;
  updateParams: (key: string, value: string) => void;
  updateMultipleParams: (updates: Record<string, string>) => void;
  clearFilters: () => void;
}

export default function FilterSidebar({
  isFilterOpen,
  setIsFilterOpen,
  categories,
  activeCategory,
  activeSubcategory,
  ratingFilter,
  updateParams,
  updateMultipleParams,
  clearFilters
}: FilterSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const sliderMax = 3499;
  const sliderMin = 0;

  const searchParams = new URLSearchParams(window.location.search);
  const minParam = searchParams.get('minPrice');
  const maxParam = searchParams.get('maxPrice');
  const currentMin = minParam ? Number(minParam) : sliderMin;
  const currentMax = maxParam ? Number(maxParam) : sliderMax;

  // Filter top-level parent categories
  const parentCategories = categories.filter((c: any) => !c.parentId);

  return (
    <aside className={`${isFilterOpen ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm' : 'hidden md:block'} w-full md:w-64 flex-shrink-0 transition-all`}>
      <div className={`${isFilterOpen ? 'w-full max-w-sm max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4 bg-white' : 'sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300'} bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm`}>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg tracking-tight">
            <Filter size={18} className="text-primary" />
            Filters
          </div>
          {isFilterOpen && (
            <button onClick={() => setIsFilterOpen(false)} className="text-slate-600 hover:text-slate-900 p-1 bg-slate-100 rounded-full transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Category & Subcategory Filter */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">Categories</h3>
          <div className="space-y-1.5">
            <button 
              onClick={() => { 
                navigate(`/categories/all-products${location.search}`);
                setIsFilterOpen(false); 
              }}
              className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${(activeCategory === 'All' || activeCategory === 'all-products' || !activeCategory) ? 'bg-white text-slate-900 font-bold shadow-md border border-slate-200/60' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
            >
              All Products
            </button>

            {(parentCategories.length > 0 ? parentCategories : categories).map(cat => {
              const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
              const isParentActive = activeCategory.toLowerCase() === cat.name.toLowerCase() || 
                                     activeCategory.toLowerCase() === catSlug.toLowerCase().replace(/-/g, ' ');
              const subcategories = cat.children || categories.filter((c: any) => c.parentId === cat.id);

              return (
                <div key={cat.id || cat.name} className="space-y-1">
                  <button 
                    onClick={() => { 
                      navigate(`/categories/${catSlug}${location.search}`);
                      setIsFilterOpen(false); 
                    }}
                    className={`flex items-center justify-between w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${isParentActive ? 'bg-white text-slate-900 font-bold shadow-md border border-slate-200/60' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
                  >
                    <span>{cat.name}</span>
                    {subcategories && subcategories.length > 0 && (
                      <ChevronRight size={14} className={`transition-transform duration-200 ${isParentActive ? 'rotate-90 text-primary' : 'text-slate-400'}`} />
                    )}
                  </button>

                  {/* Subcategories nested under active or expandable category */}
                  {isParentActive && subcategories && subcategories.length > 0 && (
                    <div className="pl-4 space-y-1 pt-1 pb-2 border-l-2 border-primary/20 ml-3">
                      {subcategories.map((sub: any) => {
                        const subSlug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
                        const isSubActive = activeSubcategory.toLowerCase() === sub.name.toLowerCase() || 
                                            activeSubcategory.toLowerCase() === subSlug.toLowerCase().replace(/-/g, ' ');

                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              navigate(`/categories/${catSlug}/${subSlug}${location.search}`);
                              setIsFilterOpen(false);
                            }}
                            className={`flex items-center justify-between w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${isSubActive ? 'bg-primary text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'}`}
                          >
                            <span>{sub.name}</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isSubActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {sub.count || sub.productCount || 0}
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

        {/* Price Range Filter */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">Price Range</h3>
          <DualRangeSlider 
            min={sliderMin} 
            max={sliderMax} 
            value={[currentMin, currentMax]} 
            onChange={() => {}} 
            onChangeEnd={(val) => {
              updateMultipleParams({
                minPrice: val[0] > sliderMin ? val[0].toString() : '',
                maxPrice: val[1] < sliderMax ? val[1].toString() : ''
              });
            }} 
          />
        </div>

        {/* Rating Filter */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">Minimum Rating</h3>
          <div className="space-y-2.5">
            {[4, 3, 2, 1].map(r => (
              <label key={r} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${ratingFilter === r.toString() ? 'bg-slate-900 border-slate-900 text-white shadow-sm scale-110' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                  {ratingFilter === r.toString() && <Check size={14} strokeWidth={3} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  name={`rating-${r}`} 
                  checked={ratingFilter === r.toString()}
                  onChange={() => {
                    if (ratingFilter === r.toString()) {
                      updateParams('rating', '');
                    } else {
                      updateParams('rating', r.toString());
                    }
                  }}
                  className="sr-only"
                />
                <div className="flex items-center text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < r ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                  ))}
                  <span className="ml-2 font-medium">& up</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button onClick={clearFilters} className="mt-8 w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}
