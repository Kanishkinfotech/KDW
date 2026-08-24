import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { formatCurrency } from '../utils/currency';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50">
      <SEO title="Your Wishlist | Kanishk Digital World" description="View and manage your saved premium templates and kits." />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Heart size={32} className="text-primary fill-primary" />
            Your Wishlist
          </h1>
          {wishlist.length > 0 && (
            <span className="text-slate-500 font-medium">{wishlist.length} saved items</span>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Your wishlist is empty</h2>
            <p className="text-slate-600 mb-8">
              Keep track of the products you love. Click the heart icon on any product to save it here for later.
            </p>
            <Button onClick={() => navigate('/shop')} size="lg">
              Explore Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col h-full">
                <Link to={`/product/${item.id}`} className="relative aspect-video overflow-hidden">
                  <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                    {typeof item.category === 'object' ? (item.category as any).name : item.category}
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <Link to={`/product/${item.id}`} className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 hover:text-primary transition-colors">{item.title}</h3>
                  </Link>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900">{formatCurrency(item.price)}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleWishlist(item)}
                        className="p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          addToCart(item);
                          toggleWishlist(item); // Optional: remove from wishlist when adding to cart
                        }}
                        className="w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
