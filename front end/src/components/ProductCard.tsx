import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Eye, X } from 'lucide-react';
import type { Product } from '../data/mockData';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import SafeImage from './ui/SafeImage';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [showQuickView, setShowQuickView] = useState(false);
  const isWishlisted = wishlist.some(item => item.id === product.id);
  
  // Handle price and discount logic based on schema
  const currentPrice = product.price;
  const discountAmount = (product as any).discountPrice || 0;
  const originalPrice = discountAmount > 0 ? currentPrice + discountAmount : currentPrice;
  const hasDiscount = discountAmount > 0;

  const rawRating = (product as any).rating;
  const actualRating = typeof rawRating === 'number' && !isNaN(rawRating) && rawRating > 0
    ? rawRating
    : ((product as any).reviews && Array.isArray((product as any).reviews) && (product as any).reviews.length > 0
      ? (product as any).reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / (product as any).reviews.length
      : 0);

  return (
    <div className="group bg-white flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 rounded-2xl border border-transparent hover:border-slate-200/60 relative z-10 hover:z-50">
      <Link to={`/product/${product.id}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block rounded-t-2xl">
        <SafeImage 
          src={product.coverImage || ''}
          alt={product.title || (product as any).name || 'Product'} 
          fallbackType="product"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        {/* Subtle gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pr-12">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-wider font-bold text-slate-800 shadow-sm">
            {product.category && typeof product.category === 'object' ? (product.category as any).name : (typeof product.category === 'object' ? (product.category as any).name : product.category) || 'Category'}
          </span>
          {product.isHot && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-slate-900 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm animate-pulse">
              Hot
            </span>
          )}
        </div>
        
        <button 
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm z-10"
          aria-label="Toggle wishlist"
        >
          <Heart size={16} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
        </button>


      </Link>
      
      <div className="p-4 flex flex-col flex-1 relative">
        <Link to={`/product/${product.id}`} className="flex-col group/link mb-3 block">
          <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1 group-hover/link:text-primary transition-colors">
            {product.title || (product as any).name || 'Untitled Product'}
          </h3>
          <p className="text-slate-500 text-xs line-clamp-1">
            {(product as any).shortDescription || product.category || 'Digital Resource'}
          </p>
        </Link>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {currentPrice === 0 ? (
                <span className="font-extrabold text-sm text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  FREE
                </span>
              ) : (
                <span className="font-bold text-lg text-slate-900">
                  {formatCurrency(currentPrice)}
                </span>
              )}
              {hasDiscount && currentPrice > 0 && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full text-slate-700">
                <Star className="fill-amber-400 text-amber-400" size={11} />
                <span className="text-xs font-bold">{actualRating > 0 ? actualRating.toFixed(1) : '0'}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(product);
                }}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-primary text-slate-700 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm focus-visible:outline-none transform hover:scale-110 active:scale-95"
                aria-label={`Add to cart`}
              >
                <ShoppingCart size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setShowQuickView(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div 
            className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowQuickView(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors z-10"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-[4/3] md:aspect-auto bg-slate-100 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden relative">
                <SafeImage src={product.coverImage || ''} alt={product.title || (product as any).name || 'Product'} fallbackType="product" className="w-full h-full object-cover" />
              </div>
              <div className="p-6 md:p-8 flex flex-col h-full">
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
                  {product.category && typeof product.category === 'object' ? (product.category as any).name : (typeof product.category === 'object' ? (product.category as any).name : product.category) || 'Category'}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">
                  {product.title || (product as any).name || 'Untitled Product'}
                </h3>
                <div className="flex items-center gap-1.5 mb-4">
                  <Star className="fill-amber-400 text-amber-400" size={14} />
                  <span className="text-sm font-bold text-slate-900">{(product.rating || 0).toFixed(1)}</span>
                  <span className="text-xs text-slate-500 font-medium">({product.reviews || 0} reviews)</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {product.description || 'No description available.'}
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl font-black text-slate-900">{formatCurrency(currentPrice)}</span>
                    {hasDiscount && (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through">{formatCurrency(originalPrice)}</span>
                        <span className="text-xs font-bold text-emerald-600">Save {formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        addToCart(product);
                        setShowQuickView(false);
                      }}
                      className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <ShoppingCart size={18} /> Add to Cart
                    </button>
                    <Link 
                      to={`/product/${product.id}`}
                      className="flex-1 bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Outside Hover Description Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] p-4 bg-slate-900 text-white rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 shadow-2xl pointer-events-none translate-y-2 group-hover:translate-y-0 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-t-slate-900 hidden md:block">
        <h4 className="font-bold mb-1.5 text-white line-clamp-1">{product.title || (product as any).name}</h4>
        <p className="text-slate-300 text-xs leading-relaxed line-clamp-4">
          {product.description || (product as any).shortDescription || 'No description provided.'}
        </p>
      </div>
    </div>
  );
}
