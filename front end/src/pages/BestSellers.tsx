import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import Skeleton from '../components/ui/Skeleton';
import { Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BestSellers() {
  const storeProducts = useStore(state => state.products);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filter active products with valid sales > 0, and sort by sales (totalUnitsSold)
      const activeProducts = storeProducts.filter(p => p.status === 'ACTIVE' && (p.sales || p.totalUnitsSold) > 0);
      const sorted = [...activeProducts].sort((a, b) => {
        const salesA = a.sales || a.totalUnitsSold || 0;
        const salesB = b.sales || b.totalUnitsSold || 0;
        return salesB - salesA;
      });
      
      // Dynamically add the best seller badge to top 4 products for this specific page rendering
      const topProducts = sorted.map((product, index) => ({
        ...product,
        isBestSeller: index < 4,
        badge: index < 4 ? 'Best Seller' : product.badge
      }));

      setProducts(topProducts);
      setIsLoading(false);
    };

    loadProducts();
  }, [storeProducts]);

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50/50">
      <SEO title="Best Sellers" description="Discover the products our customers love the most." />
      <div className="max-w-7xl mx-auto flex flex-col gap-8 md:gap-12 relative">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-4 text-slate-500">
              <Link to="/home" className="hover:text-primary transition-colors">Home</Link>
              <ArrowRight size={14} />
              <span className="text-slate-800">Best Sellers</span>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
              <Award className="text-primary" size={36} />
              Best Sellers
            </h1>
            <p className="text-slate-500 font-medium">Discover the products our customers love the most.</p>
          </div>
        </div>

        <main>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <Skeleton className="h-4 w-16 mb-2 rounded-md" />
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {products.map((product, idx) => (
                <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: `${idx * 100}ms`, animationDuration: '500ms' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl h-[400px] rounded-3xl flex flex-col items-center justify-center text-center p-8 border border-slate-200/60 shadow-sm">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-600">
                <Award size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No best sellers yet.</h3>
              <p className="text-slate-500 mb-8 max-w-md">Our sales data will populate this page as customers complete purchases.</p>
              <Link 
                to="/shop"
                className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                Browse All Products
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
