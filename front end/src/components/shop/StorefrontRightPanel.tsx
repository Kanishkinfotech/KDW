import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, ArrowRight, Trash2, Zap, ShieldCheck, 
  Sparkles, History, Package, CheckCircle2, ChevronRight,
  ExternalLink, Eye, X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/currency';
import SafeImage from '../ui/SafeImage';
import { getRecentlyViewed, type RecentlyViewedProduct } from '../../utils/recentlyViewed';

interface StorefrontRightPanelProps {
  currentCategory?: string;
  allProducts: any[];
}

export default function StorefrontRightPanel({ currentCategory, allProducts }: StorefrontRightPanelProps) {
  const { cart, removeFromCart } = useStore();
  const navigate = useNavigate();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // Calculate live subtotal
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);

  // Filter smart recommendations excluding items in cart
  const cartIds = new Set(cart.map(c => c.id));
  const relatedAssets = allProducts
    .filter(p => !cartIds.has(p.id))
    .slice(0, 3);

  return (
    <aside className="w-full xl:w-72 2xl:w-80 shrink-0 space-y-6">
      <div className="space-y-6 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto custom-scrollbar">
        
        {/* ================================================================= */}
        {/* 1. CART SUBTOTAL & INSTANT DELIVERY PANEL                         */}
        {/* ================================================================= */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
              <ShoppingCart size={15} className="text-primary" />
              Shopping Bag
            </div>
            <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[11px] rounded-full">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cart Subtotal
            </span>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {formatCurrency(subtotal)}
            </div>
          </div>

          {/* Digital Instant Delivery Guarantee */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <Zap size={13} className="text-emerald-600 shrink-0" />
              <span>Instant Google Drive Access</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              Verified automated delivery with lifetime downloads and cloud updates.
            </p>
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-sm shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Go to Cart ({cart.length})</span>
              <ArrowRight size={14} />
            </button>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Secure Checkout</span>
              </button>
            )}
          </div>

          {/* Cart Items Compact List */}
          {cart.length > 0 ? (
            <div className="pt-3 border-t border-slate-100 space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Items in Bag
              </span>
              {cart.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                    <SafeImage
                      src={item.coverImage || item.thumbnail || ''}
                      alt={item.title || item.name || 'Cart item'}
                      fallbackType="product"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {item.title || item.name}
                    </h5>
                    <span className="text-xs font-black text-primary block">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-400 font-medium">
              Your shopping bag is currently empty.
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 2. RECENTLY VIEWED PRODUCTS WIDGET                                */}
        {/* ================================================================= */}
        {recentlyViewed.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History size={13} className="text-primary" />
                Recently Viewed
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                {recentlyViewed.length}
              </span>
            </div>

            <div className="space-y-2">
              {recentlyViewed.slice(0, 4).map(item => (
                <Link
                  key={item.id}
                  to={`/products/${item.slug || item.id}`}
                  className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <SafeImage
                      src={item.coverImage || item.thumbnail || ''}
                      alt={item.title}
                      fallbackType="product"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h5>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-slate-900">
                        {item.price === 0 ? 'FREE' : formatCurrency(item.price)}
                      </span>
                      <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        View <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. RELATED DIGITAL ASSETS RECOMMENDATIONS                          */}
        {/* ================================================================= */}
        {relatedAssets.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                Featured Picks
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                Recommended
              </span>
            </div>

            <div className="space-y-2.5">
              {relatedAssets.map(prod => (
                <Link
                  key={prod.id}
                  to={`/products/${prod.slug || prod.id}`}
                  className="group flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <SafeImage
                      src={prod.coverImage || prod.thumbnail || ''}
                      alt={prod.name || prod.title}
                      fallbackType="product"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                      {prod.name || prod.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {prod.shortDescription || (typeof prod.category === 'object' ? prod.category?.name : prod.category)}
                    </p>
                    <span className="text-xs font-black text-primary mt-1 block">
                      {prod.price === 0 ? 'FREE' : formatCurrency(prod.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
