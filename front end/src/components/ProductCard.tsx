import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, Heart, ArrowUpRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import { toast } from 'react-hot-toast';
import { getBundleEffectivePricing } from '../utils/bundlePricing';
import { trackOfferView, trackOfferClick } from '../utils/offerTracking';

export interface ProductCardProps {
  product: any;
  viewMode?: 'grid' | 'list';
  attached?: boolean;
}

export default function ProductCard({ product, viewMode = 'grid', attached = false }: ProductCardProps) {
  const { settings } = useSettings();
  const { cart, wishlist, addToCart, toggleWishlist } = useStore();
  const isInCart = cart.some((item) => item.id === product.id);
  const isWishlisted = wishlist.some((item) => item.id === product.id);

  const isBundle = product.type === 'bundle';
  const bundlePricing = isBundle ? getBundleEffectivePricing(product) : null;
  const activeDeal = product.activeDeal;
  const isDealActive = Boolean(activeDeal && (!activeDeal.endAt || new Date(activeDeal.endAt) >= new Date()));
  const dealOfferId = activeDeal?.offerId || bundlePricing?.activeDeal?.offerId;
  const isAnyDealActive = isDealActive || Boolean(bundlePricing?.isDealActive);
  const effectivePrice = bundlePricing 
    ? bundlePricing.effectivePrice 
    : (isDealActive ? activeDeal.effectivePrice : (Number(product.price) || 0));
  const originalPrice = bundlePricing
    ? bundlePricing.originalPrice
    : (isDealActive ? activeDeal.originalPrice : (product.compareAtPrice || product.price));

  useEffect(() => {
    if (dealOfferId && isAnyDealActive) {
      trackOfferView(dealOfferId);
    }
  }, [dealOfferId, isAnyDealActive]);

  const handleDealClick = () => {
    if (dealOfferId && isAnyDealActive) {
      trackOfferClick(dealOfferId);
    }
  };

  const productLink = product.canonicalUrl || (isBundle ? `/bundles/${product.slug || product.id}` : `/product/${product.slug || product.id}`);
  const categoryName = typeof product.category === 'object' 
    ? (product.category?.name || 'Digital System') 
    : (product.category || 'Digital System');

  const isNew = product.isNew || product.badge === 'NEW';
  const isFeatured = Boolean(product.featured || product.isFeatured || product.badge === 'FEATURED');
  const isBestSeller = Boolean(product.bestSeller || product.isBestSeller || product.badge === 'BESTSELLER');

  // Determine cover gradient tone based on product title or category
  const getCoverGradient = (title: string, category: string) => {
    const t = `${title} ${category}`.toLowerCase();
    if (t.includes('proposal') || t.includes('agreement') || t.includes('sales') || t.includes('amber')) {
      return 'from-[#78350f] via-[#92400e] to-[#1c1917]'; // Deep amber noir
    }
    if (t.includes('social') || t.includes('marketing') || t.includes('creator') || t.includes('rose') || t.includes('media')) {
      return 'from-[#831843] via-[#9d174d] to-[#1c1917]'; // Deep wine noir
    }
    if (t.includes('website') || t.includes('launch') || t.includes('ui') || t.includes('sky')) {
      return 'from-[#075985] via-[#0369a1] to-[#0f172a]'; // Deep slate blue
    }
    if (t.includes('automation') || t.includes('lead') || t.includes('workflow') || t.includes('emerald')) {
      return 'from-[#065f46] via-[#047857] to-[#022c22]'; // Deep pine noir
    }
    return 'from-[#3b0764] via-[#4c1d95] to-[#0f172a]'; // Deep royal violet
  };

  const gradientClass = getCoverGradient(product.title || product.name || '', categoryName);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDealClick();
    if (isInCart) {
      toast('Item is already in your selection', { icon: 'ℹ️' });
      return;
    }
    addToCart({
      ...product,
      price: effectivePrice
    });
    toast.success(`Added "${product.title || product.name}" to selection`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group flex flex-col justify-between overflow-hidden relative bg-white border border-[#e2e8f0] transition-all duration-300 hover:border-[#5b21b6] hover:shadow-xl select-none">
      {/* Product Link wrapper */}
      <Link to={productLink} onClick={handleDealClick} className="block relative">
        
        {/* ======================================================== */}
        {/* 1. UPPER VISUAL COVER MOTIF (Clean & Uncluttered)        */}
        {/* ======================================================== */}
        <div className={`relative h-52 sm:h-56 w-full overflow-hidden bg-gradient-to-br ${gradientClass} p-4 flex flex-col justify-between select-none`}>
          {/* Product Image */}
          {(product.coverImage || product.thumbnail || product.image) && (
            <img 
              src={product.coverImage || product.thumbnail || product.image} 
              alt={product.title || product.name || 'Product Cover'} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 z-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/50 z-1 pointer-events-none" />

          {/* Fine dotted grid */}
          <div className="absolute inset-0 kdw-cover-grid opacity-25 pointer-events-none z-1" />

          {/* Top badges & Wishlist Button */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-black/80 text-white/90 border border-white/20 backdrop-blur-xs">
                {product.type === 'bundle' ? 'KDW BUNDLE' : 'KDW SYSTEM'}
              </span>
              {isDealActive && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-rose-600 to-amber-600 text-white border border-rose-400 shadow-xs flex items-center gap-0.5">
                  ⚡ {activeDeal?.badgeText || 'SPECIAL DEAL'}
                </span>
              )}
              {isFeatured && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 border border-amber-300 shadow-xs flex items-center gap-0.5">
                  ★ FEATURED
                </span>
              )}
              {isBestSeller && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-600 text-white border border-purple-400">
                  BEST SELLER
                </span>
              )}
              {isNew && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-amber-950">
                  NEW
                </span>
              )}
            </div>

            {/* Quick Wishlist Button (Sharp Square) */}
            <button
              onClick={handleToggleWishlist}
              className={`w-7 h-7 flex items-center justify-center backdrop-blur-md transition-colors border ${
                isWishlisted
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-black/60 text-white/80 hover:bg-black/90 hover:text-white border-white/20'
              }`}
              title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* ======================================================== */}
          {/* HOVER OVERLAY: REVEALS DESCRIPTION ON CURSOR MOVE        */}
          {/* ======================================================== */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/85 to-black/60 p-5 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-20 pointer-events-none">
            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out">
              <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1.5">
                DIGITAL OVERVIEW
              </span>
              <p className="text-xs text-slate-200 line-clamp-4 leading-relaxed font-sans mb-3">
                {product.shortDescription || product.description || 'Production-grade templates, customizable assets, and modular foundations for independent teams.'}
              </p>
              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-slate-300">{product.licenceType ? (product.licenceType.toUpperCase() === 'PERSONAL' ? 'Personal Licence' : `${product.licenceType} Licence`) : 'Personal Licence'}</span>
                <span className="text-white font-medium flex items-center gap-0.5">
                  Explore <ArrowUpRight className="w-3 h-3 text-[#c4b5fd]" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PRODUCT CARD BODY (Sharp Square Typography)           */}
        {/* ======================================================== */}
        <div className="p-5 space-y-2.5">
          {/* Category eyebrow */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-[#5b21b6]">
              {categoryName}
            </span>
            {product.type === 'bundle' && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[#ede9fe] text-[#5b21b6] font-bold border border-[#ddd6fe]">
                BUNDLE
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-base font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors line-clamp-1 leading-snug">
            {product.title || product.name}
          </h3>

          {/* Description Section with Smooth Hover Expand */}
          <div className="relative">
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans transition-colors group-hover:text-slate-700">
              {product.shortDescription || product.description || 'Production-grade templates, customizable assets, and modular foundations for independent teams.'}
            </p>
          </div>

          {/* Square tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(settings?.show_licence_summary ?? true) && (
              <span className="px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                {product.licenceType ? (product.licenceType.toUpperCase() === 'PERSONAL' ? 'Personal Licence' : `${product.licenceType} Licence`) : 'Personal Licence'}
              </span>
            )}
            {(settings?.show_download_format ?? true) && product.format && (
              <span className="px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                {product.format}
              </span>
            )}
            {(settings?.show_file_size ?? true) && product.fileSize && (
              <span className="px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                {product.fileSize}
              </span>
            )}
            {(settings?.show_version ?? true) && product.version && (
              <span className="px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-mono uppercase tracking-wider">
                v{product.version}
              </span>
            )}
            <span className="px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-mono uppercase tracking-wider">
              Instant Delivery
            </span>
          </div>
        </div>
      </Link>

      {/* ======================================================== */}
      {/* 3. BOTTOM ROW: PRICE & SQUARE ACTION BUTTON              */}
      {/* ======================================================== */}
      <div className="px-5 pb-5 pt-3 border-t border-[#e2e8f0] flex items-center justify-between mt-auto bg-slate-50/50">
        <div>
          <div className="flex items-baseline gap-1.5">
            <div className="text-lg font-bold font-mono text-[#171325]">
              {formatCurrency(Number(effectivePrice) || 0)}
            </div>
            {((bundlePricing && bundlePricing.originalPrice > bundlePricing.effectivePrice && bundlePricing.discount > 0) || (isDealActive && originalPrice > effectivePrice)) && (
              <div className="text-xs text-slate-400 line-through font-mono">
                {formatCurrency(originalPrice)}
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {bundlePricing?.isDealActive || isDealActive ? `⚡ ${activeDeal?.name || 'Limited-time deal'}` : 'One-time purchase'}
          </span>
        </div>

        {/* Sharp Square Plus Button */}
        <button
          onClick={handleAddToCart}
          className={`w-9 h-9 flex items-center justify-center transition-all kdw-button-press ${
            isInCart
              ? 'bg-[#5b21b6] text-white'
              : 'border border-[#cbd5e1] bg-white text-[#171325] hover:border-[#5b21b6] hover:bg-[#5b21b6] hover:text-white'
          }`}
          title={isInCart ? 'Already in selection' : 'Add to selection'}
          aria-label={`Add ${product.title || product.name} to selection`}
        >
          {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
