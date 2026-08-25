import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, Search, ChevronRight, ChevronDown, Heart, ShoppingCart, 
  Sparkles, Flame, HelpCircle, Package, Layers, User, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store/useStore';
import { useAuth } from '../../../context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { cart, wishlist, categories } = useStore();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onClose();
    navigate(`/categories/all-products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const topCategories = categories.filter((c: any) => !c.parentId);
  const displayCategories = topCategories.length > 0 ? topCategories : categories;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-[88%] max-w-sm bg-slate-900 text-white shadow-2xl z-50 flex flex-col md:hidden border-l border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0B1120]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary-dark to-purple-800 flex items-center justify-center font-black text-white text-sm shadow-md">
                  K
                </div>
                <div>
                  <span className="font-black text-white text-xs block">Kanishk Digital World</span>
                  <span className="text-[10px] text-slate-400 font-bold">Storefront Navigation</span>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
              
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, templates..." 
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </form>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 text-xs font-bold">
                <MobileLink to="/" label="Home" onClick={onClose} />
                
                {/* Collapsible Categories Tree */}
                <div className="rounded-xl bg-slate-800/50 border border-slate-800 overflow-hidden my-1">
                  <button
                    type="button"
                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                    className="w-full p-3 flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={15} className="text-primary-light" />
                      <span>Categories</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCategoriesOpen ? 'rotate-180 text-primary-light' : ''}`} />
                  </button>

                  {isCategoriesOpen && (
                    <div className="p-3 pt-0 space-y-1 border-t border-slate-800/80 bg-slate-900/60">
                      <Link 
                        to="/categories/all-products" 
                        onClick={onClose} 
                        className="block p-2 rounded-lg text-primary-light hover:bg-slate-800 font-bold transition-colors"
                      >
                        ⚡ Shop All Products
                      </Link>
                      
                      {displayCategories.map((cat: any) => {
                        const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                        return (
                          <Link 
                            key={cat.id || slug}
                            to={`/categories/${slug}`}
                            onClick={onClose}
                            className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                          >
                            <span>{cat.name}</span>
                            {cat.count > 0 && (
                              <span className="text-[10px] text-slate-500 font-mono">({cat.count})</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <MobileLink to="/bundles" label="Bundles" onClick={onClose} />
                <MobileLink to="/categories/templates" label="Templates" onClick={onClose} />
                <MobileLink to="/categories/graphics" label="Graphics" onClick={onClose} />
                <MobileLink to="/categories/ui-kits" label="UI Kits" onClick={onClose} />
                <MobileLink to="/categories/plugins" label="Plugins" onClick={onClose} />
                <MobileLink to="/categories/resources" label="Resources" onClick={onClose} />

                {/* New Arrivals with badge */}
                <Link
                  to="/new-arrivals"
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span>New Arrivals</span>
                  </div>
                  <span className="px-1.5 py-0.2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black uppercase rounded shadow-xs">
                    NEW
                  </span>
                </Link>

                {/* Deals with badge */}
                <Link
                  to="/best-sellers"
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-amber-400" />
                    <span>Deals</span>
                  </div>
                  <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase rounded shadow-xs">
                    HOT
                  </span>
                </Link>

                <div className="h-px bg-slate-800 my-2"></div>

                <MobileLink to="/support" label="Support & Help Desk" onClick={onClose} />
                <MobileLink to="/account/orders" label="Track Order" onClick={onClose} />
              </nav>

            </div>

            {/* Bottom Actions (User / Cart / Wishlist) */}
            <div className="p-4 border-t border-slate-800 bg-[#0B1120] space-y-3">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to="/account"
                      onClick={onClose}
                      className="flex-1 py-2 text-center text-xs font-bold bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      aria-label="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link 
                    to="/login" 
                    onClick={onClose} 
                    className="flex-1 py-2 text-center text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={onClose} 
                    className="flex-1 py-2 text-center text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <Link 
                  to="/wishlist" 
                  onClick={onClose} 
                  className="flex items-center gap-1.5 text-slate-300 hover:text-rose-400 transition-colors"
                >
                  <Heart size={14} className={wishlist.length > 0 ? "text-rose-500 fill-rose-500" : ""} />
                  <span>Wishlist ({wishlist.length})</span>
                </Link>
                <Link 
                  to="/cart" 
                  onClick={onClose} 
                  className="flex items-center gap-1.5 text-primary-light hover:text-white transition-colors font-bold"
                >
                  <ShoppingCart size={14} />
                  <span>Cart ({cart.length})</span>
                </Link>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
    >
      <span>{label}</span>
      <ChevronRight size={14} className="text-slate-500" />
    </Link>
  );
}

