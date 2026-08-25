import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Eye, X, ArrowRight, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import type { Product } from '../data/mockData';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import SafeImage from './ui/SafeImage';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [showQuickView, setShowQuickView] = useState(false);
  const isWishlisted = wishlist.some(item => item.id === product.id);
  
  // Handle price and discount logic based on schema
  const currentPrice = product.price;
  const discountAmount = (product as any).discountPrice || 0;
  const originalPrice = (product as any).compareAtPrice || ((product as any).discountPrice ? currentPrice + discountAmount : currentPrice);
  const hasDiscount = discountAmount > 0 || ((product as any).compareAtPrice && (product as any).compareAtPrice > currentPrice);

  const rawRating = (product as any).rating;
  const actualRating = typeof rawRating === 'number' && !isNaN(rawRating) && rawRating > 0
    ? rawRating
    : ((product as any).reviews && Array.isArray((product as any).reviews) && (product as any).reviews.length > 0
      ? (product as any).reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / (product as any).reviews.length
      : 5.0);

  const reviewCount = (product as any).reviews && Array.isArray((product as any).reviews)
    ? (product as any).reviews.length
    : (typeof (product as any).reviews === 'number' ? (product as any).reviews : 0);

  const productLink = `/products/${product.slug || product.id}`;
  const categoryName = typeof product.category === 'object' 
    ? (product.category as any)?.name 
    : (product.category || 'Digital Asset');

  // =========================================================================
  // LIST VIEW LAYOUT (Horizontal Row Card)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative">
        {/* Left: Thumbnail image */}
        <Link to={productLink} className="relative w-full sm:w-48 aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-slate-100 shrink-0 block">
          <SafeImage 
            src={product.coverImage || (product as any).thumbnail || ''}
            alt={product.title || (product as any).name || 'Product'} 
            fallbackType="product"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/90 text-white rounded text-[10px] font-black uppercase tracking-wider">
            {categoryName}
          </span>
        </Link>

        {/* Center: Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {categoryName}
            </span>
            {product.isBestSeller && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-md text-[9px] font-black uppercase">
                Best Seller
              </span>
            )}
            {product.isHot && (
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-md text-[9px] font-black uppercase">
                Hot Deal
              </span>
            )}
          </div>

          <Link to={productLink} className="block group-hover:text-primary transition-colors">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 mb-1">
              {product.title || (product as any).name || 'Untitled Product'}
            </h3>
          </Link>

          <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">
            {(product as any).shortDescription || product.description || 'Instant digital download with Google Drive access and lifetime updates.'}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="text-slate-800">{actualRating.toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-slate-400 font-normal">({reviewCount})</span>}
            </div>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Instant Digital Delivery</span>
          </div>
        </div>

        {/* Right: Pricing & CTA */}
        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
          <div className="text-left sm:text-right">
            {currentPrice === 0 ? (
              <span className="font-black text-sm text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md uppercase tracking-wider">
                FREE
              </span>
            ) : (
              <div>
                <div className="text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(currentPrice)}
                </div>
                {hasDiscount && (
                  <span className="text-xs text-slate-400 line-through font-medium block">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product);
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isWishlisted 
                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200'
              }`}
              title="Add to Wishlist"
            >
              <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-sm shadow-primary/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <ShoppingCart size={15} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GRID VIEW LAYOUT (Apple-Style Minimal Card)
  // =========================================================================
  return (
    <div className="group bg-white flex flex-col h-full hover:shadow-[0_12px_36px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 rounded-2xl border border-slate-200/80 hover:border-primary/40 relative">
      <Link to={productLink} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block rounded-t-2xl">
        <SafeImage 
          src={product.coverImage || (product as any).thumbnail || ''}
          alt={product.title || (product as any).name || 'Product'} 
          fallbackType="product"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        
        {/* Subtle hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pr-12">
          <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-sm rounded-lg text-[10px] uppercase tracking-wider font-black text-white shadow-xs">
            {categoryName}
          </span>
          {product.isBestSeller && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-md text-[9px] uppercase tracking-wider font-black shadow-xs">
              Best Seller
            </span>
          )}
          {product.isHot && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-md text-[9px] uppercase tracking-wider font-black shadow-xs">
              Hot
            </span>
          )}
        </div>
        
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-sm z-10 cursor-pointer ${
            isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-700 hover:text-rose-500 hover:bg-white'
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart size={15} className={isWishlisted ? "fill-current" : ""} />
        </button>
      </Link>
      
      <div className="p-4 flex flex-col flex-1 relative">
        <Link to={productLink} className="flex-col group/link mb-3 block">
          <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 group-hover/link:text-primary transition-colors">
            {product.title || (product as any).name || 'Untitled Product'}
          </h3>
          <p className="text-slate-500 text-xs line-clamp-1 font-medium">
            {(product as any).shortDescription || product.category || 'Digital Resource'}
          </p>
        </Link>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              {currentPrice === 0 ? (
                <span className="font-black text-xs text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  FREE
                </span>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-black text-base text-slate-900">
                    {formatCurrency(currentPrice)}
                  </span>
                  {hasDiscount && currentPrice > 0 && (
                    <span className="text-[11px] text-slate-400 line-through font-medium">
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-slate-700">
                <Star className="fill-amber-400 text-amber-400" size={11} />
                <span className="text-xs font-bold">{actualRating > 0 ? actualRating.toFixed(1) : '5.0'}</span>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(product);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-primary text-slate-700 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs focus-visible:outline-none hover:scale-105 active:scale-95 cursor-pointer"
                aria-label={`Add to cart`}
              >
                <ShoppingCart size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
