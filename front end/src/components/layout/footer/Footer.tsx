import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ShieldCheck, Lock, ExternalLink, Mail, Phone } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-[#e2e8f0] text-slate-600 font-sans mt-auto">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">

        {/* 4-Column Proportional Grid on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pt-4">
          
          {/* Column 1 & 2 (Span 2): Brand Mark, Title, Bio & Trust Badges */}
          <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-6">
            <Link 
              to="/" 
              onClick={scrollToTop} 
              className="inline-flex items-center gap-3 group select-none"
              title={`${settings?.store_name || 'Kanishk Digital World'} - Home`}
            >
              {/* Lavender-to-Purple Square Mark (36px) */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ddd6fe] via-[#7c3aed] to-[#5b21b6] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <span className="font-serif font-bold text-white text-lg leading-none">
                  {(settings?.store_name || 'K').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif font-bold text-[#171325] text-base leading-tight group-hover:text-[#5b21b6] transition-colors">
                  {settings?.store_name || 'Kanishk Digital World'}
                </span>
                <span className="text-[9px] font-sans font-bold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
                  DIGITAL ASSETS & SYSTEMS
                </span>
              </div>
            </Link>

            <div className="space-y-1.5 text-xs text-slate-500 font-sans pt-1">
              {settings?.support_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#5b21b6]" />
                  <a href={`mailto:${settings.support_email}`} className="hover:text-[#5b21b6] transition-colors">
                    {settings.support_email}
                  </a>
                </div>
              )}
              {settings?.support_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#5b21b6]" />
                  <a href={`tel:${settings.support_phone}`} className="hover:text-[#5b21b6] transition-colors">
                    {settings.support_phone}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant Access
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-slate-600">
                <Lock className="w-3.5 h-3.5 text-[#5b21b6]" /> Verified Licensing
              </span>
            </div>
          </div>

          {/* Column 3: SUPPORT & ACCOUNT */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold font-sans tracking-[0.18em] text-[#171325] uppercase">
              SUPPORT & ACCOUNT
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/account/orders" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  My Orders & Receipts
                </Link>
              </li>
              <li>
                <Link to="/account/downloads" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Download Library
                </Link>
              </li>
              <li>
                <Link to="/support" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Help & Support Center
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Contact Assistance
                </Link>
              </li>
              <li>
                <Link to="/faq" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: POLICIES & COMPANY */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold font-sans tracking-[0.18em] text-[#171325] uppercase">
              POLICIES
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/terms" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Refund & Delivery Policy
                </Link>
              </li>
              <li>
                <Link to="/license" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Commercial Licensing
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  About KDW
                </Link>
              </li>
              <li>
                <Link to="/blog" onClick={scrollToTop} className="text-slate-500 hover:text-[#5b21b6] transition-colors">
                  Editorial & Guides
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & Back to top row */}
        <div className="pt-6 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} {settings?.legal_business_name || settings?.store_name || 'Kanishk Digital World (KDW)'}. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6 text-[11px] font-mono text-slate-400">
            <span>GST Compliance Ready</span>
            <span>•</span>
            <span>256-bit Encrypted Delivery</span>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="hover:text-[#5b21b6] transition-colors inline-flex items-center gap-1 cursor-pointer font-sans"
              title="Scroll back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
