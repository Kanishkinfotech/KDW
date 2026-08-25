import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Tag, Box, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store/useStore';

interface SearchBarProps {
  onOpenChange?: (isOpen: boolean) => void;
  variant?: 'header' | 'hero';
}

export default function SearchBar({ onOpenChange, variant = 'header' }: SearchBarProps = {}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{ products: any[]; suggestions: { brands: string[]; categories: string[] } } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const storeProducts = useStore(state => state.products);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('kdw_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    } else {
      setRecentSearches(['Agency Starter', 'Proposal Templates', 'Business Dashboard', 'Framer']);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef, onOpenChange]);

  useEffect(() => {
    const fetchResults = async () => {
      const q = query.trim();
      if (!q) {
        setResults(null);
        return;
      }
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/products/search?q=${encodeURIComponent(q)}`);
        if (res.data.success && res.data.data) {
          setResults(res.data.data);
        } else {
          throw new Error('Fallback');
        }
      } catch (err) {
        // Safe fallback to storeProducts
        const lowerQuery = q.toLowerCase();
        const localResults = storeProducts.filter(p => 
          p.title?.toLowerCase().includes(lowerQuery) || 
          p.name?.toLowerCase().includes(lowerQuery) ||
          p.description?.toLowerCase().includes(lowerQuery) ||
          (typeof p.category === 'object' ? (p.category as any)?.name : p.category)?.toLowerCase().includes(lowerQuery)
        );
        const cats = Array.from(new Set(localResults.map(p => typeof p.category === 'object' ? (p.category as any)?.name : p.category).filter(Boolean)));
        
        setResults({
          products: localResults.slice(0, 6),
          suggestions: { categories: cats.slice(0, 4) as string[], brands: ['KDW'] }
        });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 200);
    return () => clearTimeout(debounceTimer);
  }, [query, storeProducts]);

  const handleSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    
    // Save to recent searches
    const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('kdw_recent_searches', JSON.stringify(updated));
    } catch (e) {}
    
    setIsOpen(false);
    onOpenChange?.(false);
    navigate(`/categories/all-products?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl z-40">
      {/* Search Input Container */}
      <div 
        className={`flex items-center transition-all duration-200 relative ${
          isHero
            ? 'bg-white rounded-2xl border border-slate-300 shadow-lg p-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary'
            : 'bg-slate-800/90 hover:bg-slate-800 focus-within:bg-slate-800 rounded-xl border border-slate-700/80 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25 p-1'
        }`}
      >
        <div className="pl-3 pr-2 flex items-center justify-center text-slate-400">
          <Search size={16} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onOpenChange?.(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            onOpenChange?.(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for products, templates, assets..."
          className={`w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium ${
            isHero ? 'text-slate-900 placeholder-slate-400 py-2' : 'text-white placeholder-slate-400 py-1.5'
          }`}
        />

        {isLoading && (
          <Loader2 size={16} className="text-primary-light animate-spin shrink-0 mr-2" />
        )}

        {query && !isLoading && (
          <button 
            type="button"
            onClick={() => {
              setQuery('');
              setResults(null);
              inputRef.current?.focus();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700/60 mr-1 transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}

        {/* Purple Search Button */}
        <button
          type="button"
          onClick={() => handleSearch(query)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Search size={13} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Auto-suggest Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 w-full top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-900"
          >
            {/* Empty State / Suggestions */}
            {!isLoading && !query && (
              <div className="p-4 space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Clock size={12} /> Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map(term => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleSearch(term)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-primary" /> Popular Categories & Assets
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Agency Starter Kits', query: 'Agency' },
                      { name: 'Business Proposal Packs', query: 'Proposal' },
                      { name: 'SaaS Website Kits', query: 'Website' },
                      { name: 'AI Prompts Library', query: 'AI Prompt' }
                    ].map(item => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleSearch(item.query)}
                        className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-50 hover:bg-primary/5 text-slate-700 hover:text-primary text-xs font-bold transition-all text-left group cursor-pointer"
                      >
                        <span>{item.name}</span>
                        <ArrowRight size={12} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results State */}
            {!isLoading && query && results && (
              <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                {results.products.length === 0 && (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <Search size={28} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-800 text-sm">No products found for "{query}"</p>
                    <p className="text-xs text-slate-500">Try searching for templates, agency kits, or browse categories.</p>
                  </div>
                )}

                {/* Categories matched */}
                {results.suggestions.categories.length > 0 && (
                  <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Matching Categories
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {results.suggestions.categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenChange?.(false);
                            navigate(`/categories/${cat.toLowerCase().replace(/\s+/g, '-')}`);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <Tag size={11} className="text-primary" /> {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product results */}
                {results.products.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Matching Products ({results.products.length})
                    </div>
                    {results.products.map(product => {
                      const idOrSlug = product.slug || product.id || product._id;
                      const price = product.discountPrice !== null && product.discountPrice !== undefined ? product.discountPrice : product.price;
                      return (
                        <button 
                          key={product.id || product._id} 
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenChange?.(false);
                            navigate(`/products/${idOrSlug}`);
                          }}
                          className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all text-left group cursor-pointer"
                        >
                          {product.coverImage || product.thumbnail ? (
                            <img 
                              src={product.coverImage || product.thumbnail} 
                              alt={product.name || product.title} 
                              className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                              <Box size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate text-xs sm:text-sm">
                              {product.name || product.title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-bold text-slate-900">{formatCurrency(price)}</span>
                              {product.discountPrice && (
                                <span className="text-slate-400 line-through text-[10px]">{formatCurrency(product.price)}</span>
                              )}
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="truncate text-slate-500 font-medium">{product.category}</span>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mr-2" />
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* View all results button */}
                {results.products.length > 0 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => handleSearch(query)} 
                      className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-black rounded-xl transition-colors text-center flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Search size={13} /> View all search results for "{query}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

