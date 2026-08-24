import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Tag, Box, Loader2 } from 'lucide-react';
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
  const [results, setResults] = useState<{ products: any[], suggestions: { brands: string[], categories: string[] } } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const storeProducts = useStore(state => state.products);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
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
  }, [wrapperRef]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (res.data.success && res.data.data.products.length > 0) {
          setResults(res.data.data);
        } else {
          throw new Error('Fallback to local');
        }
      } catch (err) {
        console.log("Search API failed, using local data");
        const lowerQuery = query.toLowerCase();
        const localResults = storeProducts.filter(p => 
          p.title?.toLowerCase().includes(lowerQuery) || 
          p.description?.toLowerCase().includes(lowerQuery) ||
          (typeof p.category === 'object' ? (p.category as any).name : p.category)?.toLowerCase().includes(lowerQuery)
        );
        const cats = Array.from(new Set(localResults.map(p => typeof p.category === 'object' ? (p.category as any).name : p.category).filter(Boolean)));
        
        setResults({
          products: localResults.slice(0, 5),
          suggestions: { categories: cats.slice(0, 3) as string[], brands: [] }
        });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    // Save to recent
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    setIsOpen(false);
    onOpenChange?.(false);
    navigate(`/shop?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div ref={wrapperRef} className={`relative z-50 transition-all duration-500 ease-in-out ${
      isHero ? 'w-full max-w-xl mx-auto' : `hidden md:flex items-center justify-end w-full ${isOpen ? 'max-w-3xl flex-1' : 'max-w-md'}`
    }`}>
      <div 
        className={`flex items-center backdrop-blur-md border transition-all duration-400 ease-out relative z-50 ${
          isHero 
            ? `w-full bg-white ${isOpen ? 'border-slate-300 rounded-t-2xl shadow-xl' : 'border-slate-300 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'} py-3 px-5`
            : `bg-slate-100/60 rounded-full px-4 py-2.5 ${isOpen ? 'w-full border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white' : 'w-[180px] border-transparent hover:bg-slate-200/60 hover:w-[220px]'}`
        }`}
      >
        <Search size={isHero ? 20 : 18} className={`${isOpen ? 'text-slate-900' : isHero ? 'text-slate-400' : 'text-slate-500'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); onOpenChange?.(true); }}
          onFocus={() => { setIsOpen(true); onOpenChange?.(true); }}
          onKeyDown={handleKeyDown}
          placeholder={isHero ? "Search categories or products..." : "Search products, brands..."}
          className={`bg-transparent border-none outline-none w-full ml-3 font-medium ${
            isHero ? `text-lg py-1 text-slate-900 placeholder-slate-400` : 'text-sm text-slate-900 placeholder-slate-500'
          }`}
        />
        {isLoading && (
          <Loader2 size={16} className="text-slate-600 animate-spin absolute right-10" />
        )}
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults(null); document.querySelector('input')?.focus(); }}
            className="absolute right-4 text-slate-600 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1 rounded-full transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: isHero ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isHero ? 0 : 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 w-full bg-white shadow-xl border border-slate-200 overflow-hidden z-40 ${
              isHero ? 'top-full rounded-b-2xl border-t-0' : 'top-full mt-2 rounded-2xl'
            }`}
          >
            {/* No Query (Empty State) */}
            {!isLoading && !query && (
              <div className="p-2">
                {recentSearches.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Searches</div>
                    {recentSearches.map(term => (
                      <button key={term} onClick={() => handleSearch(term)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors text-left">
                        <Clock size={16} className="text-slate-600" />
                        {term}
                      </button>
                    ))}
                  </div>
                )}
                
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Popular Now</div>
                  <button onClick={() => handleSearch('Framer')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors text-left">
                    <TrendingUp size={16} className="text-primary" /> Framer Templates
                  </button>
                  <button onClick={() => handleSearch('Dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors text-left">
                    <TrendingUp size={16} className="text-primary" /> Admin Dashboards
                  </button>
                </div>
              </div>
            )}

            {/* Results State */}
            {!isLoading && query && results && (
              <div className="max-h-[60vh] overflow-y-auto">
                {results.products.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Search size={32} className="mx-auto mb-3 text-slate-700" />
                    <p>No results found for "{query}"</p>
                    <p className="text-sm mt-1">Try checking for typos or using broader terms.</p>
                  </div>
                )}

                {results.suggestions.categories.length > 0 && (
                  <div className="p-2 border-b border-slate-100">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</div>
                    <div className="flex flex-wrap gap-2 px-3">
                      {results.suggestions.categories.map(cat => (
                        <button key={cat} onClick={() => { setIsOpen(false); onOpenChange?.(false); navigate(`/shop?category=${cat}`); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-full transition-colors">
                          <Tag size={12} /> {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.products.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</div>
                    {results.products.map(product => (
                      <button 
                        key={product._id || product.id} 
                        onClick={() => { setIsOpen(false); onOpenChange?.(false); navigate(`/product/${product._id || product.id}`); }}
                        className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors text-left group"
                      >
                        {product.coverImage ? (
                          <img src={product.coverImage} alt={product.title || product.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <Box size={20} />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 text-sm">{product.title || product.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-medium text-slate-700">{formatCurrency(product.price)}</span>
                            {product.category && <><span className="w-1 h-1 bg-slate-300 rounded-full" /> <span>{typeof product.category === 'object' ? (product.category as any).name : product.category}</span></>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {results.products.length > 0 && (
                  <div className="p-2 border-t border-slate-100">
                    <button onClick={() => handleSearch(query)} className="w-full py-3 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors text-center flex items-center justify-center gap-2">
                      <Search size={16} /> View all results for "{query}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {isOpen && (
        <div className="fixed inset-0 z-30" onClick={() => { setIsOpen(false); onOpenChange?.(false); }}></div>
      )}
    </div>
  );
}
