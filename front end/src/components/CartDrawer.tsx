import { X, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, isCartOpen, setCartOpen, removeFromCart, clearCart } = useStore();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/40 backdrop-blur-sm z-50"
            onClick={() => setCartOpen(false)}
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
                <ShoppingCart size={20} className="text-primary" />
                Your Cart
                <span className="bg-slate-200 text-slate-700 text-xs py-1 px-2 rounded-full ml-2">
                  {cart.length}
                </span>
              </h2>
              <button 
                onClick={() => setCartOpen(false)}
                className="p-2 text-slate-600 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={32} className="text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Your cart is empty</h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-[250px]">
                    Looks like you haven't added any products to your cart yet.
                  </p>
                  <button 
                    onClick={() => { setCartOpen(false); navigate('/shop'); }}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 transition-colors group">
                      <img src={item.coverImage} alt={item.title} className="w-20 h-20 object-cover rounded-xl border border-slate-100" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                          <p className="text-sm text-slate-500 line-clamp-1">{typeof item.category === 'object' ? (item.category as any).name : item.category}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-slate-900">${item.price.toFixed(2)}</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            aria-label="Remove item"
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

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-600 font-medium">Subtotal</span>
                  <span className="text-xl font-black text-slate-900">${total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">Taxes and secure payment calculated at checkout.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={clearCart}
                    className="px-4 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={handleCheckout}
                    className="flex-1 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                  >
                    View Cart & Pay <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
