import SEO from '../components/SEO';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { Package, Star, ShoppingBag, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Bundles() {
  const bundles = useStore(state => state.bundles);
  return (
    <div className="min-h-screen py-12 px-6">
      <SEO title="Premium Bundles" description="Explore our premium digital bundles to save money and get more value." />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-3 bg-accent/20 rounded-xl text-accent">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Premium Bundles</h1>
            <p className="text-slate-600 mt-1">Save up to 60% by purchasing our curated product bundles.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bundles.map(bundle => (
            <div key={bundle.id} className="glass rounded-3xl p-2 flex flex-col group hover:shadow-[0_0_40px_rgba(56,189,248,0.15)] transition-all duration-300">
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-6">
                <Link to={`/bundles/${bundle.id}`} className="block h-full">
                  <img 
                    src={bundle.coverImage} 
                    alt={bundle.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800') {
                        target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800';
                      }
                    }}
                  />
                </Link>
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-sm z-10 flex items-center gap-2">
                  <Tag size={14} className="text-accent" />
                  <span className="text-xs font-bold text-slate-900">
                    SAVE {formatCurrency(bundle.originalPrice - bundle.price)}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
                  <Package size={16} className="text-accent" />
                  {bundle.itemsIncluded} Products Included
                </div>
              </div>
              <div className="px-6 pb-6 flex flex-col flex-1">
                <div className="flex items-center gap-1 text-yellow-400 mb-2">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm text-slate-700 font-medium">{bundle.rating}</span>
                </div>
                <Link to={`/bundles/${bundle.id}`}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3 hover:text-primary transition-colors">{bundle.title}</h2>
                </Link>
                <p className="text-slate-600 mb-8">{bundle.description}</p>
                
                <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-6">
                  <div className="flex flex-col items-end text-right">
                    <span className="text-sm text-slate-500 line-through block mb-1">{formatCurrency(bundle.originalPrice)}</span>
                    <span className="text-3xl font-extrabold text-slate-900">{formatCurrency(bundle.price)}</span>
                  </div>
                  <button className="px-6 py-3 bg-white/10 hover:bg-accent hover:text-slate-900 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                    <ShoppingBag size={18} />
                    Get Bundle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
