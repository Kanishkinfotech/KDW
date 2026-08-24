import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Play, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/currency';
import SafeImage from '../ui/SafeImage';

export default function FeaturedPromotion() {
  const { products, bundles, activeCoupons } = useStore();

  // 1. Check for Active Promotion
  const activeCoupon = activeCoupons?.find((c: any) => {
    if (c.expiryDate && new Date(c.expiryDate) < new Date()) return false;
    if (c.usageLimit && c.usedCount >= c.usageLimit) return false;
    return true;
  });

  if (activeCoupon) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden shadow-xl text-center">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full font-bold text-sm mb-6 uppercase tracking-wider backdrop-blur-md border border-white/20">
                <Tag size={16} /> Launch Sale
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                Save {activeCoupon.discountType === 'PERCENTAGE' ? `${activeCoupon.discountValue}%` : formatCurrency(activeCoupon.discountValue)} on Selected Products
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Use code <span className="text-white font-mono bg-black/20 px-3 py-1 rounded-lg border border-white/20 mx-1">{activeCoupon.code}</span> at checkout.
              </p>
              <Link to="/categories/all-products" className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-slate-50 transition-all hover:scale-105 shadow-xl">
                Shop the Sale <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Check for Featured Product
  const featuredProduct = products?.find((p: any) => p.featured && p.price > 0);

  if (featuredProduct) {
    let features = ['Ready-to-use resources', 'Easy to customize', 'Practical workflow'];
    if (featuredProduct.features) {
      if (typeof featuredProduct.features === 'string') {
        try {
          const parsed = JSON.parse(featuredProduct.features);
          if (Array.isArray(parsed) && parsed.length > 0) features = parsed.slice(0, 3);
        } catch (e) {
          features = featuredProduct.features.split(',').map((f: string) => f.trim()).slice(0, 3);
        }
      } else if (Array.isArray(featuredProduct.features)) {
        features = featuredProduct.features.slice(0, 3);
      }
    }

    const currentPrice = featuredProduct.price;
    const discountAmount = featuredProduct.discountPrice || 0;
    const originalPrice = discountAmount > 0 ? currentPrice + discountAmount : currentPrice;

    return (
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm group">
                <SafeImage 
                  src={featuredProduct.coverImage || featuredProduct.thumbnail || ''} 
                  alt={featuredProduct.title || featuredProduct.name}
                  fallbackType="product"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                  <Link to={`/product/${featuredProduct.id}`} className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg">
                    <Play size={18} /> Preview Product
                  </Link>
                </div>
              </div>

              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black tracking-widest text-primary uppercase mb-4 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                  Featured Resource
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                  {featuredProduct.title || featuredProduct.name}
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                  {featuredProduct.shortDescription || featuredProduct.description?.substring(0, 150) + '...'}
                </p>

                <div className="mb-8 w-full">
                  <p className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">What you'll get</p>
                  <ul className="space-y-2">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                        <span className="text-slate-600 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-end gap-3 mb-8">
                  <div className="text-3xl font-black text-slate-900">
                    {formatCurrency(currentPrice)}
                  </div>
                  {discountAmount > 0 && (
                    <div className="text-lg text-slate-400 line-through font-medium mb-1">
                      {formatCurrency(originalPrice)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Link 
                    to={`/product/${featuredProduct.id}`}
                    className="flex-1 bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                  >
                    Get Instant Access <ArrowRight size={20} />
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 3. Fallback to Bundle
  const featuredBundle = bundles?.find((b: any) => b.featured) || bundles?.[0];
  if (featuredBundle) {
    return (
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-3xl p-8 lg:p-16 border border-slate-200 text-center shadow-sm">
            <span className="text-[11px] font-black tracking-widest text-primary uppercase mb-6 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 inline-block">
              BUNDLE & SAVE
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{featuredBundle.title || featuredBundle.name}</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">{featuredBundle.description}</p>
            <div className="flex items-end justify-center gap-3 mb-8">
              <span className="text-3xl font-black text-slate-900">{formatCurrency(featuredBundle.price)}</span>
              <span className="text-lg text-slate-400 line-through font-medium mb-1">{formatCurrency(featuredBundle.originalPrice)}</span>
            </div>
            <Link to={`/bundles/${featuredBundle.id}`} className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25">
              View Bundle <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
