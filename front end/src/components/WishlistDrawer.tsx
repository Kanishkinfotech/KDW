import { X, Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

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
            className="fixed inset-0 bg-white/40 backdrop-blur-sm z-50"
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
                <Heart size={20} className="text-primary fill-primary" />
                Your Wishlist
                <span className="bg-slate-200 text-slate-700 text-xs py-1 px-2 rounded-full ml-2">
                  {wishlist.length}
                </span>
              </h2>
              <button 
                onClick={() => setWishlistOpen(false)}
                className="p-2 text-slate-600 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Heart size={32} className="text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Wishlist is empty</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-[250px]">
                    Save items you love by clicking the heart icon on any product.
                  </p>
                  <button 
                    onClick={() => { setWishlistOpen(false); navigate('/shop'); }}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {wishlist.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 transition-colors group">
                      <Link to={`/product/${item.id}`} onClick={() => setWishlistOpen(false)} className="shrink-0">
                        <img src={item.coverImage} alt={item.title} className="w-24 h-24 object-cover rounded-xl border border-slate-100" />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link to={`/product/${item.id}`} onClick={() => setWishlistOpen(false)}>
                            <h4 className="font-bold text-slate-900 line-clamp-1 hover:text-primary transition-colors">{item.title}</h4>
                          </Link>
                          <span className="font-bold text-slate-900 block mt-1">${item.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button 
                            onClick={() => {
                              addToCart(item);
                              toggleWishlist(item); // Remove from wishlist when adding to cart
                              setWishlistOpen(false);
                            }}
                            className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart size={14} /> Add to Cart
                          </button>
                          <button 
                            onClick={() => toggleWishlist(item)}
                            className="p-2 border border-slate-200 text-slate-600 hover:text-danger hover:border-danger/30 hover:bg-danger/5 rounded-lg transition-colors"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
