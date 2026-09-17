import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft, Trash2, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/Button';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-hot-toast';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const navigate = useNavigate();

  const handleAddAllToCart = () => {
    let count = 0;
    wishlist.forEach((item) => {
      addToCart(item);
      count++;
    });
    if (count > 0) {
      toast.success(`Added ${count} item${count > 1 ? 's' : ''} to cart`);
    }
  };

  const handleClearWishlist = () => {
    [...wishlist].forEach((item) => toggleWishlist(item));
    toast.success('Wishlist cleared');
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#fafaf9]">
      <SEO 
        title="Saved Items & Liked Products | Kanishk Digital World" 
        description="View and manage your saved premium digital assets, templates, and systems." 
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-6 flex-wrap gap-4">
          <div>
            <Link 
              to="/shop" 
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-[#5b21b6] mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Store Catalog
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-2xs">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                  Liked & Saved Products
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your curated collection of premium templates, design kits, and automation systems.
                </p>
              </div>
            </div>
          </div>

          {wishlist.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearWishlist}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Remove all saved products"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
              <button
                onClick={handleAddAllToCart}
                className="px-4 py-2 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer kdw-button-press"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add All to Cart</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-[#e2e8f0] shadow-sm max-w-xl mx-auto my-12">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-100">
              <Heart className="w-9 h-9 text-rose-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#171325] mb-2">
              No saved products yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">
              Explore our digital catalog and click the heart icon on any product or bundle to save it here for later.
            </p>
            <Button onClick={() => navigate('/shop')} size="lg" className="inline-flex items-center gap-2">
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                Showing {wishlist.length} saved product{wishlist.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
