import { Link } from 'react-router-dom';
import { X, Search, ChevronRight, Heart, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store/useStore';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { cart, wishlist } = useStore();
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
            className="fixed inset-0 bg-white/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl z-50 flex flex-col lg:hidden border-l border-slate-200"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <span className="font-bold text-slate-900">Menu</span>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8">
              
              {/* Mobile Search */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                />
              </div>

              {/* Links */}
              <nav className="flex flex-col gap-2">
                <MobileLink to="/home" label="Home" onClick={onClose} />
                
                {/* Categories Mega-menu equivalent */}
                <div className="py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 block">Categories</span>
                  
                  <div className="flex flex-col gap-3">
                    <Link to="/categories" onClick={onClose} className="text-sm font-bold text-primary flex items-center gap-1 mb-2">
                      Categories Hub <ChevronRight size={14}/>
                    </Link>
                    
                    <div className="h-px bg-slate-200 my-1"></div>
                    
                    <Link to="/categories/all-products" onClick={onClose} className="text-sm font-bold text-slate-900 hover:text-primary">
                      Shop All Products
                    </Link>
                    
                    <div className="h-px bg-slate-200 my-1"></div>
                    
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Shop by Goal</span>
                    <Link to="/categories/business-templates" onClick={onClose} className="text-sm font-medium text-slate-700 hover:text-primary">Start a Business</Link>
                    <Link to="/categories/social-media-bundles" onClick={onClose} className="text-sm font-medium text-slate-700 hover:text-primary">Grow Social Media</Link>
                    <Link to="/categories/automation" onClick={onClose} className="text-sm font-medium text-slate-700 hover:text-primary">Automate Work</Link>
                    <Link to="/categories/website-kits" onClick={onClose} className="text-sm font-medium text-slate-700 hover:text-primary">Build a Website</Link>

                    <div className="h-px bg-slate-200 my-1"></div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Browse Categories</span>
                    <Link to="/categories/instagram-bundles" onClick={onClose} className="text-sm font-medium text-slate-700 hover:text-primary">Instagram Bundles</Link>
                    <Link to="/categories/agency-kits" onClick={onClose} className="text-sm font-medium text-slate-700 hover:text-primary">Agency Kits</Link>
                    <Link to="/categories/ai-prompt-bundles" onClick={onClose} className="text-sm font-medium text-slate-700 hover:text-primary">AI Prompt Bundles</Link>
                  </div>
                </div>

                <MobileLink to="/bundles" label="Bundles" onClick={onClose} />
                <MobileLink to="/categories/all-products?sort=new" label="New Arrivals" onClick={onClose} />
                <MobileLink to="/support" label="Support" onClick={onClose} />
              </nav>

            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link 
                  to="/wishlist"
                  onClick={onClose}
                  className="text-slate-500 hover:text-primary transition-colors flex flex-col items-center gap-1 relative"
                >
                  <Heart size={20} />
                  <span className="text-[10px] font-semibold uppercase">Wishlist</span>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
                <Link 
                  to="/cart"
                  onClick={onClose}
                  className="text-slate-500 hover:text-primary transition-colors flex flex-col items-center gap-1 relative"
                >
                  <ShoppingCart size={20} />
                  <span className="text-[10px] font-semibold uppercase">Cart</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                      {cart.length}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileLink({ to, label, onClick }: { to: string, label: string, onClick: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 active:bg-slate-100 text-slate-900 font-semibold transition-colors"
    >
      {label}
      <ChevronRight size={18} className="text-slate-600" />
    </Link>
  );
}
