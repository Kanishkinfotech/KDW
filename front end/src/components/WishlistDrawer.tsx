import { X, Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';

export default function WishlistDrawer() {
  const { wishlist, isWishlistOpen, setWishlistOpen, toggleWishlist, addToCart } = useStore();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#171325]/50 backdrop-blur-xs z-50"
            onClick={() => setWishlistOpen(false)}
          />
          
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[60] flex flex-col border-l border-slate-200"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart size={20} className="text-rose-500 fill-rose-500" />
                Your Wishlist
                <span className="bg-slate-200 text-slate-700 text-xs py-1 px-2 rounded-full ml-2 font-mono font-bold">
                  {wishlist.length}
                </span>
              </h2>
              <button 
                onClick={() => setWishlistOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close wishlist drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <Heart size={32} className="text-rose-400" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 mb-1">Wishlist is empty</h3>
                  <p className="text-slate-500 text-xs mb-6 max-w-[250px] font-sans">
                    Save items you love by clicking the heart icon on any product in the catalog.
                  </p>
                  <button 
                    onClick={() => { setWishlistOpen(false); navigate('/shop'); }}
                    className="px-6 py-2.5 bg-[#5b21b6] text-white rounded-xl text-xs font-bold font-sans hover:bg-[#6d28d9] transition-colors shadow-xs"
                  >
                    Explore Products →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {wishlist.map((item) => {
                    const itemLink = item.canonicalUrl || `/product/${item.slug || item.id}`;
                    return (
                    <div key={item.id} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 transition-colors group">
                      <Link to={itemLink} onClick={() => setWishlistOpen(false)} className="shrink-0">
                        <img 
                          src={item.coverImage || item.thumbnail || '/placeholder.png'} 
                          alt={item.title || item.name} 
                          className="w-20 h-20 object-cover rounded-xl border border-slate-100 bg-slate-50" 
                        />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link to={itemLink} onClick={() => setWishlistOpen(false)}>
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1 hover:text-[#5b21b6] transition-colors">{item.title || item.name}</h4>
                          </Link>
                          <span className="font-bold text-xs text-[#5b21b6] font-mono block mt-1">
                            {formatCurrency(Number(item.price) || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button 
                            onClick={() => {
                              addToCart(item);
                              toggleWishlist(item); // Remove from wishlist when adding to cart
                              setWishlistOpen(false);
                            }}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-sans rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart size={13} /> Add to Cart
                          </button>
                          <button 
                            onClick={() => toggleWishlist(item)}
                            className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
