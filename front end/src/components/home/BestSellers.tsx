import { Link } from 'react-router-dom';
import { ArrowRight, Flame, TrendingUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProductCard from '../ProductCard';

export default function BestSellers() {
  const { products } = useStore();
  
  if (!products || products.length === 0) return null;

  // Real data: sort by units sold, fallback to featured or just slice
  const bestSellers = [...products]
    .sort((a: any, b: any) => (b.totalUnitsSold || 0) - (a.totalUnitsSold || 0))
    .slice(0, 4);

  if (bestSellers.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 py-12 font-medium">
          Popular products will appear here as customers discover the store.
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Trending Resources
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl font-medium">
              The highest-rated and most downloaded products this week.
            </p>
          </div>
          <Link 
            to="/best-sellers" 
            className="flex items-center gap-2 text-primary font-bold hover:text-blue-700 transition-colors group"
          >
            View All Products
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
