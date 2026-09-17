import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PhoneCall, Ticket, FileText, Download, Key, 
  HelpCircle, ChevronRight, ArrowRight, CheckCircle2,
  BookOpen, Sparkles, MessageSquare, ShieldCheck
} from 'lucide-react';
import SmartSearch from '../../components/support/SmartSearch';
import SEO from '../../components/SEO';
import axios from 'axios';

interface PopularArticle {
  id: string;
  title: string;
  slug: string;
  category?: { name: string; slug: string };
  views?: number;
  content?: string;
  updatedAt?: string;
}

export default function SupportHubPage() {
  const [popularArticles, setPopularArticles] = useState<PopularArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/support/articles')
      .then(res => {
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          setPopularArticles(res.data.data.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingArticles(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171325] font-sans pb-24">
      <SEO 
        title="Support Center & Help Desk | KDW" 
        description="Search our knowledge base, verify your digital order, track tickets, or contact our customer support team." 
      />

      {/* Top Hero Section */}
      <section className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0] bg-white relative overflow-hidden">
        <div className="absolute top-0 right-10 w-96 h-96 bg-[#7c3aed]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#5b21b6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1040px] mx-auto space-y-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">Support Center</span>
          </nav>

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/70 text-[#5b21b6] text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-xs shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
              <span>SUPPORT CENTER</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#171325] tracking-tight">
              We're here to help you get the most out of KDW.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              Search our verified knowledge base, track ongoing support tickets, contact assistance, or access your purchased digital downloads and commercial licenses.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto pt-2">
            <SmartSearch />
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        
        {/* HOW CAN WE HELP YOU TODAY? */}
        <section className="space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold font-mono tracking-widest text-[#5b21b6] uppercase block mb-1">
              HELP NAVIGATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
              How can we help you today?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Knowledge Base */}
            <Link
              to="/support/articles"
              className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#5b21b6]/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-[#ede9fe] text-[#5b21b6] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors">
                  Knowledge Base
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Browse guides, installation tutorials, and software requirements.
                </p>
              </div>
              <div className="mt-6 text-[#5b21b6] font-bold text-xs flex items-center gap-1 group-hover:gap-1.5 transition-all">
                <span>Explore</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 2: My Tickets */}
            <Link
              to="/support/tickets"
              className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#5b21b6]/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors">
                  My Tickets
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Track the status of your existing requests and view staff conversations.
                </p>
              </div>
              <div className="mt-6 text-[#5b21b6] font-bold text-xs flex items-center gap-1 group-hover:gap-1.5 transition-all">
                <span>View</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 3: Contact Support */}
            <Link
              to="/support/contact"
              className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#5b21b6]/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors">
                  Contact Support
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Reach out directly to our dedicated customer resolution team.
                </p>
              </div>
              <div className="mt-6 text-[#5b21b6] font-bold text-xs flex items-center gap-1 group-hover:gap-1.5 transition-all">
                <span>Contact</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 4: Downloads & Licenses */}
            <Link
              to="/account/downloads"
              className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#5b21b6]/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors">
                  Downloads & Licenses
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Access your purchased archives, cloud files, and commercial licenses.
                </p>
              </div>
              <div className="mt-6 text-[#5b21b6] font-bold text-xs flex items-center gap-1 group-hover:gap-1.5 transition-all">
                <span>Downloads</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </section>

        {/* POPULAR ARTICLES */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold font-mono tracking-widest text-[#5b21b6] uppercase block mb-1">
                RECOMMENDED READING
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                Popular Articles
              </h2>
            </div>
            <Link 
              to="/support/articles" 
              className="text-xs font-bold text-[#5b21b6] hover:text-[#7c3aed] flex items-center gap-1"
            >
              All Articles &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingArticles ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))
            ) : popularArticles.length > 0 ? (
              popularArticles.map((art) => (
                <Link
                  key={art.id}
                  to={'/support/articles/' + art.slug}
                  className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#5b21b6]/40 hover:shadow-xs transition-all group flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5b21b6] bg-[#ede9fe] px-2 py-0.5 rounded-md inline-block">
                      {art.category?.name || 'Guide'}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug line-clamp-1">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans line-clamp-2 leading-relaxed">
                      {art.content?.substring(0, 120) || 'Practical walkthrough for digital asset access, licensing, and tools.'}...
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#5b21b6] transition-colors shrink-0 mt-2" />
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-500 col-span-2">No articles available.</p>
            )}
          </div>
        </section>


        {/* STILL NEED HELP? CTA */}
        <section className="bg-gradient-to-br from-[#2e1065] via-[#5b21b6] to-[#7c3aed] rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Still need help?
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 max-w-md font-sans">
              Our customer team is available to assist with downloads, enterprise licensing, or order inquiries.
            </p>
          </div>

          <Link
            to="/support/contact"
            className="px-6 py-3 rounded-full bg-white text-[#5b21b6] text-xs font-bold font-sans uppercase tracking-wider hover:bg-slate-50 transition-all shrink-0 shadow-sm"
          >
            Contact Support &rarr;
          </Link>
        </section>
      </div>
    </div>
  );
}
