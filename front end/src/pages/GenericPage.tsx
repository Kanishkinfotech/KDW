import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const formatTitle = (pathname: string) => {
  const segment = pathname.split('/').pop() || '';
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function GenericPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = formatTitle(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      <SEO title={`${title} | KDW Marketplace`} description={`Read our ${title.toLowerCase()}.`} />
      
      {/* Hero Section */}
      <div className="bg-slate-900 relative overflow-hidden pt-32 pb-20 px-6">
        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8 font-medium">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">{title}</span>
          </nav>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors mb-6 font-semibold"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed">
              Everything you need to know about our {title.toLowerCase()}. We value transparency and are committed to providing the best experience for our community of creators.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="prose prose-lg prose-slate max-w-none"
        >
          <div className="bg-slate-50 p-8 md:p-12 rounded-3xl border border-slate-100 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Welcome to the {title} page of KDW Marketplace. This section is designed to give you comprehensive information regarding our policies, guidelines, and services. As a premium digital marketplace, we ensure that our creators and customers have a seamless, secure, and transparent experience.
            </p>
            <p className="text-slate-600 mb-6 leading-relaxed">
              If you have any specific questions that are not addressed here, our support team is available 24/7. We continuously update our documentation to reflect the latest industry standards and platform improvements.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-10 mb-4">Key Principles</h3>
            <ul className="space-y-4 mb-8">
              {[
                'Commitment to high-quality digital assets and tools.',
                'Transparent pricing and secure payment processing.',
                'Dedicated support for both creators and buyers.',
                'Continuous platform improvements and feature rollouts.'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-600">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 mt-10">
              <h4 className="font-bold text-slate-900 mb-2">Need further assistance?</h4>
              <p className="text-slate-500 mb-4 text-sm">Our support team is ready to help you with any questions regarding this topic.</p>
              <Link 
                to="/support"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
