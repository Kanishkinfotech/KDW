import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import { useStore } from '../../store/useStore';
import BundleCard from '../BundleCard';

export default function BundlesSection() {
  const { bundles } = useStore();
  
  if (!bundles || bundles.length === 0) return null;

  // Make sure we have enough bundles to create a continuous scroll effect
  const displayBundles = bundles.length < 4 ? [...bundles, ...bundles, ...bundles] : [...bundles, ...bundles];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                <Package size={14} /> Value Packs
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Premium Bundles
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl font-medium">
              Get more for less. Curated collections of our best-selling digital resources at a massively discounted price.
            </p>
          </div>
          <Link 
            to="/bundles" 
            className="flex items-center gap-2 text-primary font-bold hover:text-blue-700 transition-colors group"
          >
            View All Bundles
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-hidden py-4 -mx-6 px-6 lg:mx-0 lg:px-0 relative">
          <style>{`
            @keyframes marquee-bundles {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-50% - 12px)); }
            }
            .animate-marquee-bundles {
              animation: marquee-bundles 40s linear infinite;
            }
            .animate-marquee-bundles:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="flex gap-6 w-max animate-marquee-bundles">
            {displayBundles.map((bundle, index) => (
              <div key={`${bundle.id}-${index}`} className="flex-shrink-0 w-[280px] sm:w-[360px] h-[400px]">
                <BundleCard bundle={bundle} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
