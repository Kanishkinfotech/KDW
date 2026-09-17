import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';

export default function CartDrawer() {
  const { cart, isCartOpen, setCartOpen, removeFromCart, updateCartQuantity, clearCart } = useStore();
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Dark translucent backdrop */}
      <div 
        className="fixed inset-0 bg-[#171325]/60 backdrop-blur-xs transition-opacity" 
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#e2e8f0] flex flex-col justify-between animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="p-6 border-b border-[#e2e8f0] flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] text-[#5b21b6] uppercase block">
                YOUR SELECTION
              </span>
              <h2 className="text-2xl font-serif text-[#171325] mt-1">
                Build your toolkit
              </h2>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 rounded-full text-slate-400 hover:text-[#171325] hover:bg-slate-100 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-serif text-[#171325]">No items selected yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-sans">
                  Explore our curated templates, bundles, and digital systems to get started.
                </p>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    navigate('/shop');
                  }}
                  className="mt-5 px-5 py-2.5 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-semibold font-sans transition-all kdw-button-press shadow-xs"
                >
                  Explore products →
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-[#e2e8f0] bg-[#fcfbf9] flex items-center gap-3.5 group hover:border-slate-300 transition-all"
                >
                  {/* Miniature Product Cover Motif */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-[#5b21b6] to-[#34205f] flex items-center justify-center p-1 border border-white/20 shadow-xs">
                    <div className="absolute inset-0 kdw-cover-grid opacity-30 pointer-events-none" />
                    <span className="text-[10px] font-mono text-white/80 font-bold">KDW</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#171325] font-sans truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                      Commercial Licence • Instant Access
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-bold text-[#5b21b6] font-mono">
                        {formatCurrency(Number(item.price) || 0)}
                      </span>
                      
                      <div className="inline-flex items-center rounded-md border border-slate-200 bg-white ml-auto">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-l-md transition-colors"
                          title="Decrease"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-1.5 font-mono font-bold text-[10px] text-slate-800 select-none">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-r-md transition-colors"
                          title="Increase"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 ml-1"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#e2e8f0] bg-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 font-sans">Subtotal</span>
                <span className="text-xl font-bold font-mono text-[#171325]">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans tracking-wide uppercase flex items-center justify-center gap-2 transition-all kdw-button-press shadow-md hover:shadow-lg"
              >
                <span>Continue to checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-sans transition-colors underline underline-offset-2"
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
