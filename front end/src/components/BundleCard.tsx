import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Package, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import SafeImage from './ui/SafeImage';
import BundleCountdownBadge from './BundleCountdownBadge';
import { getBundleEffectivePricing } from '../utils/bundlePricing';
import { trackOfferView, trackOfferClick } from '../utils/offerTracking';

interface BundleCardProps {
  bundle: any;
}

export default function BundleCard({ bundle }: BundleCardProps) {
  const { addToCart } = useStore();
  const pricing = getBundleEffectivePricing(bundle);

  useEffect(() => {
    if (pricing.isDealActive && pricing.activeDeal?.offerId) {
      trackOfferView(pricing.activeDeal.offerId);
    }
  }, [pricing.isDealActive, pricing.activeDeal?.offerId]);

  const handleDealClick = () => {
    if (pricing.isDealActive && pricing.activeDeal?.offerId) {
      trackOfferClick(pricing.activeDeal.offerId);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDealClick();
    const cartItem = {
      id: bundle.id,
      title: bundle.title,
      price: pricing.effectivePrice,
      coverImage: bundle.coverImage,
      category: 'Bundle',
      type: 'bundle',
      quantity: 1
    };
    addToCart(cartItem);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden flex flex-col h-full border border-slate-200/60 hover:border-primary/30 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
      <Link to={`/bundles/${bundle.slug || bundle.id}`} onClick={handleDealClick} className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <SafeImage 
          src={bundle.coverImage} 
          alt={bundle.title} 
          fallbackType="bundle"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pr-3 items-center z-10">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-wider font-bold text-slate-800 shadow-sm flex items-center gap-1">
            <Package size={12} /> Bundle
          </span>
          {pricing.isDealActive && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black rounded-full text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Zap size={11} className="fill-white" />
              {pricing.badgeText || 'SPECIAL DEAL'}
            </span>
          )}
          {bundle.featured && !pricing.isDealActive && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-bold border border-amber-300 rounded-full text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
              ★ Featured Bundle
            </span>
          )}
          {pricing.isDealActive && (
            <BundleCountdownBadge offerEndAt={pricing.offerEndAt} variant="pill" />
          )}
        </div>
        
      </Link>
      
      <div className="p-5 flex flex-col flex-grow relative">
        <Link to={`/bundles/${bundle.slug || bundle.id}`} onClick={handleDealClick} className="flex-grow group/link">
          <h3 className="text-lg font-bold text-slate-900 mb-1.5 line-clamp-2 group-hover/link:text-primary transition-colors leading-snug">
            {bundle.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
            {bundle.description}
          </p>
        </Link>
        
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100/80">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="flex text-amber-400">
                <Star className="fill-amber-400" size={13} />
              </div>
              <span className="text-xs font-bold text-slate-900">{bundle.rating?.toFixed(1) || '5.0'}</span>
              <span className="text-[11px] text-slate-400 font-medium">
                {bundle.itemsIncluded ? `(${bundle.itemsIncluded} items)` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-black text-slate-900 tracking-tight">
                {formatCurrency(pricing.effectivePrice)}
              </div>
              {pricing.originalPrice > pricing.effectivePrice && pricing.discount > 0 && (
                <div className="text-xs text-slate-400 line-through font-medium">
                  {formatCurrency(pricing.originalPrice)}
                </div>
              )}
            </div>
            {pricing.isDealActive && (
              <span className="text-[10px] font-bold text-rose-600 block flex items-center gap-1">
                <Zap size={10} className="fill-rose-600" />
                {pricing.offerName ? `Sale: ${pricing.offerName}` : 'Limited-time deal'}
              </span>
            )}
            {pricing.isDealExpired && (
              <span className="text-[10px] text-slate-400 font-medium block">
                Standard Price
              </span>
            )}
          </div>
          
          <button 
            type="button"
            onClick={handleAddToCart}
            className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all duration-200 shadow-sm shadow-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none hover:scale-105 active:scale-95 cursor-pointer"
            aria-label={`Add ${bundle.title} to cart`}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
