import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, Lock, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const FooterLink = ({ to, onClick, children }: { to?: string, onClick?: () => void, children: React.ReactNode }) => {
  const content = (
    <span className="text-slate-400 hover:text-white transition-colors relative group inline-block text-sm font-medium cursor-pointer">
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full"></span>
    </span>
  );

  if (onClick) {
    return (
      <motion.li whileHover={{ x: 4 }} onClick={onClick}>
        {content}
      </motion.li>
    );
  }

  return (
    <motion.li whileHover={{ x: 4 }}>
      <Link to={to || '#'}>
        {content}
      </Link>
    </motion.li>
  );
};

const AccordionSection = ({ title, links, isOpen, onToggle }: { title: string, links: any[], isOpen: boolean, onToggle: () => void }) => (
  <div className="border-b border-white/10 md:border-none md:pb-0">
    <button 
      onClick={onToggle}
      className="flex items-center justify-between w-full py-4 md:py-0 md:mb-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      <h4 className="text-white font-semibold tracking-wide">{title}</h4>
      <ChevronDown 
        size={16} 
        className={`text-slate-400 md:hidden transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
      />
    </button>
    <AnimatePresence initial={false}>
      {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
        <motion.ul 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 pb-4 md:pb-0 overflow-hidden md:!h-auto md:!opacity-100"
        >
          {links.map((link, idx) => (
            <FooterLink key={idx} to={link.to} onClick={link.onClick}>{link.label}</FooterLink>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  </div>
);

export default function Footer() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    support_email: 'support@kdwmarketplace.com',
    business_hours: 'Mon–Fri, 9:00 AM – 6:00 PM IST',
    office_location: 'Bangalore, India'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings/public');
        if (res.data.success && res.data.data) {
          setSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (error) {
        // silently fail and use fallback
      }
    };
    fetchSettings();
  }, []);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const sections = [
    {
      title: "SHOP",
      links: [
        { label: "All Products", to: "/categories/all-products" },
        { label: "Categories", to: "/categories" },
        { label: "Bundles", to: "/bundles" },
        { label: "My Account", to: "/account" }
      ]
    },
    {
      title: "HELP",
      links: [
        { label: "Support Center", to: "/support" },
        { label: "FAQs", to: "/faq" },
        { label: "Digital Delivery Help", to: "/digital-delivery" }
      ]
    },
    {
      title: "COMPANY",
      links: [
        { label: "About Us", to: "/about" },
        { label: "Contact Us", to: "/contact" },
        { label: "Blog", to: "/blog" }
      ]
    },
    {
      title: "LEGAL",
      links: [
        { label: "Privacy Policy", to: "/privacy-policy" },
        { label: "Terms & Conditions", to: "/terms-and-conditions" },
        { label: "Refund Policy", to: "/refund-policy" },
        { label: "License Policy", to: "/license-policy" },
        { label: "Cookie Policy", to: "/cookie-policy" },
        { label: "Security", to: "/security" }
      ]
    }
  ];

  return (
    <footer className="bg-[#0B0F19] text-slate-300 relative overflow-hidden font-sans border-t border-white/5 selection:bg-primary/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid-dark.svg')] opacity-10 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
      
      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        {/* Brand Row */}
        <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 group focus-visible:ring-2 focus-visible:ring-primary rounded outline-none w-max">
              <span className="text-3xl font-black text-white tracking-tight group-hover:text-primary transition-colors">Kanishk Digital World</span>
            </Link>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Premium digital marketplace for templates, UI kits, AI resources, automation workflows and business assets.
            </p>
          </div>
        </div>

        {/* 4 Columns Links Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {sections.map((section, idx) => (
            <AccordionSection 
              key={idx}
              title={section.title}
              links={section.links}
              isOpen={openAccordion === section.title}
              onToggle={() => setOpenAccordion(openAccordion === section.title ? null : section.title)}
            />
          ))}
        </div>

        {/* Contact Row */}
        <div className="flex justify-center py-6 border-t border-b border-white/10 mb-6">
          <div className="flex flex-col items-center text-center px-4 w-full max-w-4xl">
            <h4 className="text-white font-bold mb-4 tracking-wide text-sm">CONTACT US</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8 w-full">
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5">EMAIL</p>
                <a href={`mailto:${settings.support_email}`} className="text-sm text-slate-300 hover:text-white transition-colors font-medium">
                  {settings.support_email}
                </a>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5">BUSINESS HOURS</p>
                <p className="text-sm text-slate-300 font-medium text-center">{settings.business_hours}</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5">OFFICE</p>
                <p className="text-sm text-slate-300 font-medium text-center">{settings.office_location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Area & Bottom Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400" title="Secure Checkout">
                <Lock size={14} className="text-primary" /> Secure Checkout
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400" title="Instant Download">
                <Download size={14} className="text-success" /> Digital Delivery
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400" title="Customer Support">
                <MessageCircle size={14} className="text-info" /> Customer Support
              </div>
            </div>
            
            {/* Payment Icons */}
            <div className="flex gap-2 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['Razorpay', 'Visa', 'Mastercard', 'UPI'].map((provider) => (
                <div key={provider} className="h-6 px-2 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white uppercase border border-white/5 tracking-wider" title={provider}>
                  {provider}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
            <div className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Kanishk Digital World. All rights reserved.
            </div>
            
            <div className="flex gap-6 text-sm text-slate-500">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/refund-policy" className="hover:text-white transition-colors">Refunds</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
