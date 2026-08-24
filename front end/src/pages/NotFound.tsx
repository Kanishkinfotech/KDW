import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
      <SEO title="Page Not Found" description="The page you are looking for does not exist." />
      
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-danger/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="text-center">
        <div className="w-20 h-20 bg-danger/20 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-7xl font-extrabold text-slate-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-200 mb-6">Page Not Found</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-10 text-lg">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <Home size={20} /> Back to Homepage
        </Link>
      </div>
    </div>
  );
}
