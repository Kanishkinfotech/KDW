import { Link, useNavigate } from 'react-router-dom';
import { Gift, ArrowRight, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SafeImage from '../ui/SafeImage';

export default function FreeProducts() {
  const { products } = useStore();
  const navigate = useNavigate();

  const freeProducts = products?.filter((p: any) => p.price === 0 || p.discountPrice === 0 || p.isFree) || [];

  if (freeProducts.length === 0) return null;

  return (
    <section className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-emerald-600 uppercase mb-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
              <Gift size={14} /> FREE RESOURCES
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Free Digital Assets
            </h2>
            <p className="text-slate-600 text-base mt-1 max-w-xl font-medium">
              Start building immediately with zero-cost templates, starter packs, and creative samples.
            </p>
          </div>
          <Link 
            to="/shop?filter=free" 
            className="text-emerald-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all shrink-0"
          >
            View All Free Assets <ArrowRight size={18} />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {freeProducts.slice(0, 4).map((product: any) => (
            <div 
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                  <SafeImage 
                    src={product.coverImage || product.thumbnail || ''} 
                    alt={product.title || product.name}
                    fallbackType="product"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles size={12} /> FREE
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    {(product.category as any)?.name || product.category || 'Digital Asset'}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors line-clamp-1 mb-2">
                    {product.title || product.name}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {product.shortDescription || product.description?.substring(0, 90) + '...'}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-slate-100/60 pt-4">
                <span className="text-lg font-black text-emerald-600">₹0 FREE</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/product/${product.id}`);
                  }}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Download size={14} /> Get Asset
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
