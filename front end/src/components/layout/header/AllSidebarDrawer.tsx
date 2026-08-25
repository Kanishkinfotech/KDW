import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, User, ChevronRight, ChevronDown, Sparkles, Flame, 
  Package, Layers, HelpCircle, FileText, Heart, ShoppingBag, 
  ArrowRight, ShieldCheck, LogOut, Layout, Image, Code2, Bot, 
  SlidersHorizontal, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store/useStore';
import { useAuth } from '../../../context/AuthContext';

interface AllSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AllSidebarDrawer({ isOpen, onClose }: AllSidebarDrawerProps) {
  const { categories, products } = useStore();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Top level categories
  const topCategories = categories.filter((c: any) => !c.parentId);
  const displayCategories = topCategories.length > 0 ? topCategories : categories;

  // Toggle subcategory expansion
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const getCategoryCount = (catName: string, catSlug?: string) => {
    const targetName = (catName || '').toLowerCase().trim();
    const targetSlug = (catSlug || '').toLowerCase().trim();

    return products.filter(p => {
      const pCat = typeof p.category === 'object' ? (p.category as any)?.name : p.category;
      const pSlug = typeof p.category === 'object' ? (p.category as any)?.slug : '';
      const pName = (pCat || '').toLowerCase().trim();
      const pCatSlug = (pSlug || '').toLowerCase().trim();

      return pName === targetName || pCatSlug === targetSlug || pName.includes(targetName);
    }).length;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
            aria-label="Close sidebar overlay"
          />

          {/* Slide-out Sidebar Drawer from Left */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-[360px] max-w-[85vw] h-full bg-white shadow-2xl z-10 flex flex-col overflow-hidden text-slate-900 border-r border-slate-200"
          >
            {/* 1. Header Profile Banner (Amazon/KDW Style Dark Navy) */}
            <div className="bg-[#0B1120] text-white p-4 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
              <Link 
                to={isAuthenticated ? "/account" : "/login"} 
                onClick={onClose}
                className="flex items-center gap-3 group select-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isAuthenticated ? 'Your Account' : 'Welcome to KDW'}
                  </span>
                  <span className="text-sm font-black text-white group-hover:text-primary-light transition-colors truncate block">
                    {user?.name ? `Hello, ${user.name}` : 'Hello, Sign in'}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. Scrollable Sidebar Navigation Sections */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              
              {/* SECTION: Trending & Collections */}
              <div className="p-4 px-5 space-y-1">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
                  Trending & Deals
                </h4>
                <DrawerLink 
                  to="/best-sellers" 
                  icon={<Flame size={16} className="text-amber-500" />} 
                  label="Best Sellers & Hot Deals" 
                  badge="HOT"
                  badgeColor="bg-amber-100 text-amber-800"
                  onClick={onClose} 
                />
                <DrawerLink 
                  to="/new-arrivals" 
                  icon={<Sparkles size={16} className="text-purple-500" />} 
                  label="New Arrivals" 
                  badge="NEW"
                  badgeColor="bg-purple-100 text-purple-800"
                  onClick={onClose} 
                />
                <DrawerLink 
                  to="/bundles" 
                  icon={<Package size={16} className="text-indigo-500" />} 
                  label="Bundles & Value Packs" 
                  badge="SAVE"
                  badgeColor="bg-indigo-100 text-indigo-800"
                  onClick={onClose} 
                />
              </div>

              {/* SECTION: Digital Categories Hierarchy */}
              <div className="p-4 px-5 space-y-1">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Digital Content & Categories
                  </h4>
                  <Link 
                    to="/categories/all-products" 
                    onClick={onClose}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    View All
                  </Link>
                </div>

                {/* All Products */}
                <DrawerLink 
                  to="/categories/all-products" 
                  icon={<Layers size={16} className="text-primary" />} 
                  label="All Digital Products" 
                  count={products.length}
                  onClick={onClose} 
                />

                {/* Dynamic Parent Categories */}
                {displayCategories.map(cat => {
                  const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                  const subcategories = cat.children || categories.filter((c: any) => c.parentId === cat.id);
                  const isExpanded = !!expandedCategories[cat.id || slug];
                  const count = getCategoryCount(cat.name, cat.slug);

                  return (
                    <div key={cat.id || slug} className="space-y-0.5">
                      <div className="flex items-center justify-between rounded-xl hover:bg-slate-100 transition-colors pr-1">
                        <Link
                          to={`/categories/${slug}`}
                          onClick={onClose}
                          className="flex-1 flex items-center justify-between p-2.5 px-3 text-xs font-bold text-slate-800 hover:text-primary transition-colors truncate"
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono ml-2">
                            {count}
                          </span>
                        </Link>

                        {subcategories && subcategories.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.id || slug)}
                            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
                            aria-label={`Toggle ${cat.name}`}
                          >
                            <ChevronDown 
                              size={14} 
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`} 
                            />
                          </button>
                        )}
                      </div>

                      {/* Subcategories list */}
                      {isExpanded && subcategories && subcategories.length > 0 && (
                        <div className="pl-4 ml-3 border-l-2 border-slate-100 space-y-0.5 py-1">
                          {subcategories.map((sub: any) => {
                            const subSlug = sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <Link
                                key={sub.id || subSlug}
                                to={`/categories/${slug}/${subSlug}`}
                                onClick={onClose}
                                className="block p-2 px-3 text-xs font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors truncate"
                              >
                                {sub.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SECTION: Help & Settings */}
              <div className="p-4 px-5 space-y-1">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
                  Help & Settings
                </h4>
                <DrawerLink 
                  to={isAuthenticated ? "/account" : "/login"} 
                  icon={<User size={16} className="text-slate-500" />} 
                  label="Your Account" 
                  onClick={onClose} 
                />
                <DrawerLink 
                  to="/account/orders" 
                  icon={<FileText size={16} className="text-slate-500" />} 
                  label="Orders & Invoices" 
                  onClick={onClose} 
                />
                <DrawerLink 
                  to="/wishlist" 
                  icon={<Heart size={16} className="text-rose-500" />} 
                  label="Your Wishlist" 
                  onClick={onClose} 
                />
                <DrawerLink 
                  to="/support" 
                  icon={<HelpCircle size={16} className="text-slate-500" />} 
                  label="Customer Service / Support" 
                  onClick={onClose} 
                />

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer mt-2"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>

            </div>

            {/* 3. Bottom Footer Note */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 font-bold">
              Kanishk Digital World • Digital Store & Assets
            </div>
          </motion.div>

          {/* Quick Outside Close Button for easy clicking */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClose}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-xl ml-3 mt-4 self-start border border-slate-700 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}

function DrawerLink({ 
  to, 
  icon, 
  label, 
  badge, 
  badgeColor, 
  count, 
  onClick 
}: { 
  to: string; 
  icon?: any; 
  label: string; 
  badge?: string; 
  badgeColor?: string; 
  count?: number; 
  onClick: () => void; 
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between p-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 hover:text-primary hover:bg-slate-100 transition-colors group"
    >
      <div className="flex items-center gap-3 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {badge && (
          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${badgeColor || 'bg-slate-100 text-slate-600'}`}>
            {badge}
          </span>
        )}
        {count !== undefined && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono">
            {count}
          </span>
        )}
        <ChevronRight size={14} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
