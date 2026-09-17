import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Heart, User, Menu, X, ArrowRight, 
  LogOut, Package, Download, PhoneCall, ChevronDown, Clock, 
  TrendingUp, Tag, Loader2, LayoutDashboard, FileText, Key, 
  Settings, RotateCcw, MessageSquare
} from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { productsApi, type CategoryItem } from '../../../api';
import { formatCurrency } from '../../../utils/currency';
import axios from 'axios';
import AnnouncementBar from './AnnouncementBar';

export default function Header() {
  const { settings } = useSettings();
  const { cart, wishlist, setCartOpen, setWishlistOpen, products: storeProducts } = useStore();
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: any[]; suggestions: { categories: string[]; brands: string[] } } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Unified Categories State
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load Categories for search & suggestions
  useEffect(() => {
    productsApi.getCategories()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data.filter((c: any) => !c.parentId));
        }
      })
      .catch(() => {});
  }, []);

  // Load Recent Searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kdw_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Auto-focus input when search expands
  useEffect(() => {
    if (isSearchExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchExpanded]);

  // Close search & user menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchExpanded(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchExpanded(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Live real-time search debouncing
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchTimer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/products/search?q=${encodeURIComponent(q)}`);
        if (res.data?.success && res.data.data) {
          setSearchResults(res.data.data);
        } else {
          throw new Error('Fallback to local store');
        }
      } catch (err) {
        // Fallback to local store products
        const lowerQ = q.toLowerCase();
        const localMatched = storeProducts.filter((p: any) =>
          (p.title || p.name || '').toLowerCase().includes(lowerQ) ||
          (p.description || '').toLowerCase().includes(lowerQ) ||
          (p.shortDescription || '').toLowerCase().includes(lowerQ) ||
          (typeof p.category === 'object' ? p.category?.name : p.category || '').toLowerCase().includes(lowerQ)
        );
        const cats = Array.from(
          new Set(localMatched.map((p: any) => (typeof p.category === 'object' ? p.category?.name : p.category)).filter(Boolean))
        ) as string[];

        setSearchResults({
          products: localMatched.slice(0, 6),
          suggestions: { categories: cats.slice(0, 4), brands: ['KDW'] }
        });
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(fetchTimer);
  }, [searchQuery, storeProducts]);

  const handleExecuteSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    // Persist recent search
    const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('kdw_recent_searches', JSON.stringify(updated));
    } catch (e) {}

    setIsSearchExpanded(false);
    navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(searchQuery);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Bundles', href: '/bundles' },
    { label: 'Free resources', href: '/freebies' },
  ];

  return (
    <div className="sticky top-0 left-0 right-0 z-40">
      <AnnouncementBar />
      <header className="relative bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] h-[68px] flex items-center transition-all">
        <div className="max-w-[1400px] w-full mx-auto px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-4">
          
          {/* Left: K Mark + Two-Line Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 select-none -ml-0.5 sm:ml-0">
            {/* Rounded Lavender-to-Purple Square Mark (36px) */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ddd6fe] via-[#7c3aed] to-[#5b21b6] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <span className="font-serif font-bold text-white text-lg leading-none">K</span>
            </div>

            {/* Desktop Two-Line Wordmark */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[13px] font-bold font-sans tracking-tight text-[#171325] leading-none">
                {settings?.store_name || 'Kanishk Digital World'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 leading-tight mt-0.5 tracking-wider uppercase">
                Digital Systems
              </span>
            </div>
          </Link>

          {/* Center: Desktop Text Navigation (Directly navigates to full pages) */}
          <nav className={`hidden ${isSearchExpanded ? 'lg:flex' : 'md:flex'} items-center gap-5 lg:gap-7 transition-opacity`}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href || 
                (link.href === '/categories' && (location.pathname.startsWith('/categories') || location.pathname.startsWith('/category'))) ||
                (link.href === '/support' && location.pathname.startsWith('/support'));

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-[12.5px] font-medium font-sans transition-colors ${
                    isActive 
                      ? 'text-[#5b21b6] font-bold' 
                      : 'text-slate-600 hover:text-[#5b21b6]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Expanding Search, Wishlist, Cart, Account, Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Expanding Search Bar Component */}
            <div ref={searchContainerRef} className="relative flex items-center">
              {!isSearchExpanded ? (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="w-9 h-9 rounded-full bg-slate-50 hover:bg-[#ede9fe] border border-[#e2e8f0] text-slate-600 hover:text-[#5b21b6] flex items-center justify-center transition-all kdw-button-press"
                  aria-label="Open search"
                  title="Search products (Click to expand)"
                >
                  <Search className="w-4 h-4" />
                </button>
              ) : (
                <div className="relative flex items-center animate-in fade-in duration-200">
                  <form 
                    onSubmit={handleSearchSubmit}
                    className="flex items-center bg-[#fcfbf9] border border-[#cbd5e1] focus-within:border-[#5b21b6] focus-within:ring-3 focus-within:ring-[#ede9fe] rounded-full px-3 py-1.5 w-60 sm:w-72 md:w-80 lg:w-96 transition-all shadow-md"
                  >
                    <Search className="w-4 h-4 text-[#5b21b6] shrink-0 mr-2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search templates, bundles, kits..."
                      className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-[#171325] placeholder-slate-400 font-sans font-medium"
                    />
                    {isLoading && (
                      <Loader2 className="w-3.5 h-3.5 text-[#5b21b6] animate-spin shrink-0 mx-1" />
                    )}
                    {searchQuery && !isLoading && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors shrink-0"
                        title="Clear query"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSearchExpanded(false)}
                      className="p-1 ml-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors shrink-0"
                      title="Close search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Dropdown Results & Suggestions Popover */}
                  <div className="absolute right-0 top-full mt-2.5 w-[330px] sm:w-[420px] md:w-[480px] bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    {!searchQuery.trim() ? (
                      /* Initial State: Recent & Popular Suggestions */
                      <div className="p-5 space-y-4">
                        {recentSearches.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" /> Recent Searches
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {recentSearches.map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  onClick={() => handleExecuteSearch(term)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-[#ede9fe] hover:text-[#5b21b6] text-slate-700 text-xs font-medium rounded-full transition-colors cursor-pointer"
                                >
                                  <span>{term}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3 text-[#5b21b6]" /> Popular Categories & Assets
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { name: 'Agency Starter Kits', query: 'Agency' },
                              { name: 'Business Proposal Packs', query: 'Proposal' },
                              { name: 'Website Kits', query: 'Website' },
                              { name: 'Automation Workflows', query: 'Automation' }
                            ].map((item) => (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => handleExecuteSearch(item.query)}
                                className="flex items-center justify-between p-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-[#ede9fe] text-slate-700 hover:text-[#5b21b6] text-xs font-medium transition-all text-left group cursor-pointer"
                              >
                                <span className="truncate">{item.name}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#5b21b6] group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Live Results State */
                      <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                        {/* Matching Categories */}
                        {searchResults?.suggestions?.categories && searchResults.suggestions.categories.length > 0 && (
                          <div className="p-3.5 bg-slate-50 border-b border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Matching Categories
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {searchResults.suggestions.categories.map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setIsSearchExpanded(false);
                                    navigate(`/shop?category=${encodeURIComponent(cat)}`);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-[#5b21b6] hover:text-[#5b21b6] text-slate-700 text-xs font-medium rounded-full transition-colors cursor-pointer"
                                >
                                  <Tag className="w-3 h-3 text-[#5b21b6]" /> {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Product Results */}
                        {searchResults?.products && searchResults.products.length > 0 ? (
                          <div className="p-2 space-y-1">
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Products ({searchResults.products.length})
                            </div>
                            {searchResults.products.map((product) => {
                              const idOrSlug = product.slug || product.id || product._id;
                              const price = product.discountPrice !== null && product.discountPrice !== undefined ? product.discountPrice : product.price;
                              const categoryTitle = typeof product.category === 'object' ? product.category?.name : product.category;
                              return (
                                <button
                                  key={product.id || product._id}
                                  type="button"
                                  onClick={() => {
                                    setIsSearchExpanded(false);
                                    navigate(`/products/${idOrSlug}`);
                                  }}
                                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-2xl transition-all text-left group cursor-pointer"
                                >
                                  {product.coverImage || product.thumbnail ? (
                                    <img
                                      src={product.coverImage || product.thumbnail}
                                      alt={product.name || product.title}
                                      className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ddd6fe] to-[#5b21b6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      KDW
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 group-hover:text-[#5b21b6] transition-colors truncate text-xs sm:text-sm">
                                      {product.name || product.title}
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                      <span className="font-bold font-mono text-[#171325]">{formatCurrency(price)}</span>
                                      {product.discountPrice && (
                                        <span className="text-slate-400 line-through text-[10px] font-mono">{formatCurrency(product.price)}</span>
                                      )}
                                      {categoryTitle && (
                                        <>
                                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                          <span className="truncate text-slate-500 font-sans">{categoryTitle}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#5b21b6] group-hover:translate-x-0.5 transition-all shrink-0 mr-1" />
                                </button>
                              );
                            })}
                          </div>
                        ) : !isLoading && searchQuery.trim() ? (
                          <div className="p-8 text-center text-slate-500 space-y-2">
                            <Search className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="font-bold text-slate-800 text-sm">No products found for "{searchQuery}"</p>
                            <p className="text-xs text-slate-500">Try searching for templates, kits, or view all catalog items.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsSearchExpanded(false);
                                navigate('/shop');
                              }}
                              className="mt-2 px-5 py-2 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold transition-all shadow-xs"
                            >
                              Browse Full Catalog →
                            </button>
                          </div>
                        ) : null}

                        {/* View All Search Results Banner */}
                        {searchResults?.products && searchResults.products.length > 0 && (
                          <div className="p-3.5 bg-slate-50 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleExecuteSearch(searchQuery)}
                              className="w-full py-2.5 bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-2xl transition-colors text-center flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>View all search results for "{searchQuery}"</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Support Symbol Control */}
            <Link
              to="/support"
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all kdw-button-press shrink-0 ${
                location.pathname.startsWith('/support')
                  ? 'bg-[#ede9fe] border-[#ddd6fe] text-[#5b21b6] font-bold shadow-2xs'
                  : 'bg-slate-50 hover:bg-[#ede9fe] border-[#e2e8f0] text-slate-600 hover:text-[#5b21b6]'
              }`}
              aria-label="Customer Support"
              title="Support Center & Help Desk"
            >
              <PhoneCall className="w-4 h-4" />
            </Link>

            {/* Wishlist Control with Badge */}
            <Link
              to="/wishlist"
              className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-all kdw-button-press ${
                location.pathname === '/wishlist'
                  ? 'bg-rose-50 border-rose-300 text-rose-600 font-bold shadow-2xs'
                  : 'bg-slate-50 hover:bg-rose-50 border-[#e2e8f0] text-slate-600 hover:text-rose-600'
              }`}
              aria-label={`Wishlist with ${wishlist.length} items`}
              title="Saved items"
            >
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping-Bag Control with Badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 rounded-full bg-slate-50 hover:bg-[#ede9fe] border border-[#e2e8f0] text-slate-600 hover:text-[#5b21b6] flex items-center justify-center transition-colors kdw-button-press"
              aria-label={`Cart with ${cart.length} items`}
              title="Open cart drawer"
            >
              <ShoppingBag className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#5b21b6] text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Account Profile / Dropdown */}
            {isAuthenticated ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e2e8f0] hover:border-[#5b21b6] bg-white text-[#171325] text-xs font-medium font-sans transition-all kdw-button-press shadow-2xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#5b21b6]" />
                  <span className="max-w-[100px] truncate">{user?.name || 'Account'}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180 text-[#5b21b6]' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#e2e8f0] shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
                      <p className="text-xs font-bold text-[#171325] truncate">{user?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                      {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-md bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe]">
                          Administrator
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>Overview</span>
                      </Link>

                      <Link
                        to="/account/coupons"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span>My Coupons</span>
                      </Link>

                      <Link
                        to="/account/library"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>My Library</span>
                      </Link>

                      <Link
                        to="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Orders & Invoices</span>
                      </Link>

                      <Link
                        to="/account/downloads"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <Download className="w-4 h-4 text-slate-400" />
                        <span>Downloads</span>
                      </Link>

                      <Link
                        to="/account/licenses"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <Key className="w-4 h-4 text-slate-400" />
                        <span>Licenses</span>
                      </Link>

                      <Link
                        to="/account/refunds"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        <span>Refunds</span>
                      </Link>

                      <Link
                        to="/support"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>Contact Support</span>
                      </Link>

                      <Link
                        to="/account/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#5b21b6] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Profile Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#e2e8f0] hover:border-blue-500 bg-white text-[#171325] hover:text-blue-600 text-xs font-medium font-sans transition-all kdw-button-press shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign in</span>
              </Link>
            )}

            {/* Mobile Circular Menu Control */}
            <button
              onClick={() => setIsMobileNavOpen(prev => !prev)}
              className="md:hidden w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-[#e2e8f0] text-slate-700 flex items-center justify-center transition-colors kdw-button-press"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Stacked Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="md:hidden absolute top-[68px] left-0 right-0 bg-white border-b border-[#e2e8f0] shadow-xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href || (link.href === '/categories' && (location.pathname.startsWith('/categories') || location.pathname.startsWith('/category')));
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`block py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-[#ede9fe] text-[#5b21b6] font-bold' 
                        : 'text-[#171325] hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#e2e8f0] flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="w-full py-2.5 rounded-full bg-[#5b21b6] text-white text-center text-xs font-bold font-sans uppercase tracking-wider"
                  >
                    My Account ({user?.name || 'Customer'})
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2 rounded-full border border-rose-200 text-rose-600 text-center text-xs font-bold font-sans uppercase tracking-wider hover:bg-rose-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-center text-xs font-bold font-sans uppercase tracking-wider transition-colors"
                >
                  Sign In to Account
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
