import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

export default function About() {
  const { settings } = useSettings();
  const storeName = settings?.store_name || 'Kanishk Digital World';
  const storeDescription = settings?.store_description || 'the premium marketplace for digital assets, website templates, automation workflows, UI kits, and AI resources.';
  const legalName = settings?.legal_business_name || 'Kanishk Digital World Private Limited';

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-8 sm:py-12">
      <SEO title={`About Us | ${storeName}`} description={`Learn more about ${storeName}, our mission, and digital asset standards.`} />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Return to Storefront */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#5b21b6] font-sans transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to storefront</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            COMPANY & ETHOS
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] tracking-tight leading-tight">
            About Us
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed max-w-2xl">
            Mission, operating standards, and commercial digital asset governance for {storeName}.
          </p>
        </div>

        {/* Central Clean Card */}
        <div className="kdw-card p-6 sm:p-8 space-y-6 font-sans text-xs sm:text-sm text-slate-700 leading-relaxed bg-white rounded-2xl border border-[#e2e8f0] shadow-xs">
          
          <div className="pb-4 border-b border-slate-100">
            <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed">
              Welcome to <strong className="font-semibold text-slate-900">{storeName}</strong> ({legalName}), {storeDescription}
            </p>
          </div>

          <section className="space-y-1.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-sans">
              Our Mission
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
              We serve digital creators, agencies, developers, and businesses by providing high-quality 
              digital products designed to accelerate their workflows. We believe in a digital-first economy 
              where high-quality resources should be accessible, well-documented, and ready for production.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-sans">
              What We Offer
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 font-sans pl-1">
              <li><strong className="font-semibold text-slate-800">Website Kits:</strong> Fully responsive, production-ready website templates.</li>
              <li><strong className="font-semibold text-slate-800">Business Templates:</strong> Professional documents and frameworks.</li>
              <li><strong className="font-semibold text-slate-800">Automation:</strong> Ready-to-use workflows and scripts.</li>
              <li><strong className="font-semibold text-slate-800">AI Resources:</strong> Curated prompt bundles and AI integration guides.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-sans">
              Our Commitment
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
              Every product on our marketplace undergoes strict quality checks. We are committed to 
              providing excellent customer support, clear documentation, and transparent licensing for 
              everything we sell.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}

