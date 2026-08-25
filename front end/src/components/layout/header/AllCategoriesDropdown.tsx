import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, ChevronRight, Layers, LayoutGrid, ArrowRight,
  Sparkles, PackageSearch, Tag, FolderTree, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store/useStore';

interface AllCategoriesDropdownProps {
  variant?: 'primary' | 'secondary';
}

export default function AllCategoriesDropdown({ variant = 'primary' }: AllCategoriesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { categories } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Top level categories (no parentId or parent is null)
  const topCategories = categories.filter((c: any) => !c.parentId);
  const displayCategories = topCategories.length > 0 ? topCategories : categories;

  // Set default active category on open
  useEffect(() => {
    if (isOpen && !activeCategorySlug && displayCategories.length > 0) {
      setActiveCategorySlug(displayCategories[0].slug || displayCategories[0].name.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [isOpen, displayCategories, activeCategorySlug]);

  const currentCategory = displayCategories.find((c: any) => 
    (c.slug || c.name.toLowerCase().replace(/\s+/g, '-')) === activeCategorySlug
  ) || displayCategories[0];

  const subcategories = currentCategory?.children || categories.filter((c: any) => c.parentId === currentCategory?.id) || [];

  const isPrimary = variant === 'primary';

  return (
    <div className="relative" ref={dropdownRef}>
      {isPrimary ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
            isOpen
              ? 'bg-slate-800 text-white border-primary/50 shadow-sm ring-2 ring-primary/20'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 shadow-xs'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <LayoutGrid size={14} className="text-primary-light" />
          <span>All Categories</span>
          <ChevronDown 
            size={13} 
            className={`transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180 text-primary-light' : ''}`} 
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
            isOpen
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-sm leading-none">☰</span>
          <span>Categories</span>
          <ChevronDown 
            size={12} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'text-slate-400'}`} 
          />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-[720px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-900"
          >
            {/* Top Bar / Browse All */}
            <div className="bg-slate-900 text-white p-3.5 px-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderTree size={16} className="text-primary-light" />
                <span className="text-xs font-black uppercase tracking-wider">Browse Product Catalog</span>
              </div>
              <Link
                to="/categories/all-products"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-primary-light hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View All Products</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 2-Column Split: Parent Categories on Left, Subcategories on Right */}
            <div className="grid grid-cols-12 min-h-[340px]">
              
              {/* Left Column (5 cols): Category List */}
              <div className="col-span-5 bg-slate-50 p-3 border-r border-slate-100 max-h-[380px] overflow-y-auto custom-scrollbar space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5 block">
                  Categories ({displayCategories.length})
                </span>

                {displayCategories.map((cat: any) => {
                  const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                  const isSelected = activeCategorySlug === slug;
                  return (
                    <button
                      key={cat.id || slug}
                      type="button"
                      onMouseEnter={() => setActiveCategorySlug(slug)}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/categories/${slug}`);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <Layers size={14} className={isSelected ? 'text-white' : 'text-primary'} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cat.count !== undefined && cat.count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {cat.count}
                          </span>
                        )}
                        <ChevronRight size={13} className={isSelected ? 'text-white' : 'text-slate-400'} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column (7 cols): Subcategories & Drill-down */}
              <div className="col-span-7 p-5 flex flex-col justify-between max-h-[380px] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {currentCategory ? (
                    <>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{currentCategory.name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {currentCategory.description || 'Explore premium digital assets and toolkits.'}
                          </p>
                        </div>
                        <Link
                          to={`/categories/${currentCategory.slug || currentCategory.name.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => setIsOpen(false)}
                          className="text-xs font-bold text-primary hover:text-primary-dark shrink-0 flex items-center gap-1"
                        >
                          <span>Explore</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>

                      {subcategories.length > 0 ? (
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
                            Subcategories ({subcategories.length})
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {subcategories.map((sub: any) => {
                              const subSlug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
                              const parentSlug = currentCategory.slug || currentCategory.name.toLowerCase().replace(/\s+/g, '-');
                              return (
                                <Link
                                  key={sub.id || subSlug}
                                  to={`/categories/${parentSlug}/${subSlug}`}
                                  onClick={() => setIsOpen(false)}
                                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-primary/5 hover:border-primary/30 border border-slate-100 transition-all group"
                                >
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors flex items-center justify-between">
                                    <span className="truncate">{sub.name}</span>
                                    {sub.count > 0 && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        ({sub.count})
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                          <PackageSearch size={24} className="mx-auto text-slate-400" />
                          <p className="text-xs text-slate-600 font-medium">
                            Direct category collection. Browse all products under {currentCategory.name}.
                          </p>
                          <Link
                            to={`/categories/${currentCategory.slug || currentCategory.name.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
                          >
                            Browse {currentCategory.name} Products <ArrowRight size={12} />
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Select a category to view subcategories
                    </div>
                  )}
                </div>

                {/* Bottom Quick Links */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Link
                      to="/bundles"
                      onClick={() => setIsOpen(false)}
                      className="font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Box size={13} /> Bundles
                    </Link>
                    <Link
                      to="/new-arrivals"
                      onClick={() => setIsOpen(false)}
                      className="font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={13} className="text-amber-500" /> New Arrivals
                    </Link>
                  </div>
                  <Link
                    to="/categories"
                    onClick={() => setIsOpen(false)}
                    className="font-bold text-primary hover:underline"
                  >
                    All Categories Hub →
                  </Link>
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
