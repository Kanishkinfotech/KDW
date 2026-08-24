import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-primary text-white relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight">
          Find Your Next Digital Resource.
        </h2>
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
          Explore practical products designed to help you learn, create and work smarter.
        </p>
        
        <Link 
          to="/categories/all-products" 
          className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 hover:scale-105 transition-all shadow-xl text-lg w-full sm:w-auto"
        >
          Explore Products <ArrowRight size={24} />
        </Link>
      </div>
    </section>
  );
}
