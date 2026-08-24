import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Package } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import SafeImage from './ui/SafeImage';

interface BundleCardProps {
  bundle: any;
}

export default function BundleCard({ bundle }: BundleCardProps) {
  const { addToCart } = useStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const cartItem = {
      id: bundle.id,
      title: bundle.title,
      price: bundle.price,
      coverImage: bundle.coverImage,
      category: 'Bundle',
      type: 'bundle',
      quantity: 1
    };
    addToCart(cartItem);
  };

  const savings = bundle.originalPrice - bundle.price;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden flex flex-col h-full border border-slate-200/60 hover:border-primary/30 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
      <Link to={`/bundles/${bundle.slug || bundle.id}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <SafeImage 
          src={bundle.coverImage} 
          alt={bundle.title} 
          fallbackType="bundle"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pr-12">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-wider font-bold text-slate-800 shadow-sm flex items-center gap-1">
            <Package size={12} /> Bundle
          </span>
          {bundle.featured && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-primary to-blue-500 text-white rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm">
              Best Value
            </span>
          )}
        </div>
        
      </Link>
      
      <div className="p-5 flex flex-col flex-grow relative">
        <Link to={`/bundles/${bundle.slug || bundle.id}`} className="flex-grow group/link">
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
                <Star className="fill-amber-400" size={14} />
              </div>
              <span className="text-sm font-bold text-slate-900">{bundle.rating?.toFixed(1) || '5.0'}</span>
              <span className="text-xs text-slate-600 font-medium">({Math.floor(Math.random() * 500) + 100})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-black text-slate-900 tracking-tight">
                {formatCurrency(bundle.price)}
              </div>
              <div className="text-sm text-slate-400 line-through font-medium">
                {formatCurrency(bundle.originalPrice)}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="w-11 h-11 rounded-xl bg-primary border border-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all duration-300 shadow-sm shadow-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none hover:-translate-y-0.5 active:translate-y-0"
            aria-label={`Add ${bundle.title} to cart`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
