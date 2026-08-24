import { LifeBuoy, MessageSquare, FileText, ChevronRight, HelpCircle, Mail, Ticket, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import SmartSearch from '../components/support/SmartSearch';
import SEO from '../components/SEO';

export default function Support() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <SEO title="Support Center | Kanishk Digital World" description="Get help with your orders, products, downloads, and account inquiry." />

      {/* Hero Section */}
      <div className="bg-slate-900 pt-24 pb-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-accent/20 blur-3xl rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 text-sm font-bold tracking-wide mb-8">
            <LifeBuoy size={16} className="text-primary" />
            <span>Support Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-8">
            How can we help you today?
          </h1>
          <SmartSearch />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20 pb-24 space-y-12">
        
        {/* Support Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link to="/contact" className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ticket size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Contact Us</h3>
              <p className="text-slate-600 text-sm font-medium">Send a support inquiry for your orders, assets, or account.</p>
            </div>
            <div className="mt-6 text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Contact Us <ChevronRight size={16} />
            </div>
          </Link>

          <Link to="/account/orders" className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Order Help</h3>
              <p className="text-slate-600 text-sm font-medium">Check order status, invoices, and re-download purchased files.</p>
            </div>
            <div className="mt-6 text-emerald-500 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Go to Orders <ChevronRight size={16} />
            </div>
          </Link>

          <Link to="/faq" className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">FAQs</h3>
              <p className="text-slate-600 text-sm font-medium">Instant answers to frequently asked billing & delivery questions.</p>
            </div>
            <div className="mt-6 text-amber-500 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Browse FAQs <ChevronRight size={16} />
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
