import React, { useState, useEffect } from 'react';
import { HelpCircle, Search, ChevronDown, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SEO from '../components/SEO';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  categoryName?: string;
  category?: string;
  displayOrder?: number;
}

const FALLBACK_FAQS: FAQItem[] = [
  {
    id: 'faq-0',
    question: 'How do I download and access products using my License Key?',
    answer: 'When you purchase or claim a free digital product on KDW, an automated confirmation email is immediately dispatched to your delivery email. This email contains your unique **Commercial License Key** and a direct **Verification Link**. Simply click the link in your email (or copy & paste your license key into our [License Verification Portal](/verify-license)) to instantly verify your commercial license and unlock direct download and Google Drive access to all product files.',
    categoryName: 'Delivery & Access'
  },
  {
    id: 'faq-1',
    question: 'What do I receive after purchasing or claiming a digital product?',
    answer: 'Immediately upon checkout or free claim completion, your unique Commercial License Key is generated and emailed to you. You can verify and unlock your downloads anytime at [License Verification](/verify-license) or access all files directly in your [Account Library](/account/library).',
    categoryName: 'Delivery & Access'
  },
  {
    id: 'faq-2',
    question: 'How does digital delivery and license verification work?',
    answer: 'Our automated fulfillment engine generates a unique license key for each order item and sends a verification link to your email. Clicking the link or entering your key at [Verify License](/verify-license) verifies your entitlement on our security server and unlocks access to high-speed cloud storage folders and Google Drive deliverables.',
    categoryName: 'Delivery & Access'
  },
  {
    id: 'faq-3',
    question: 'What payment methods are supported on KDW?',
    answer: 'We support all major payment options securely processed via Razorpay with 256-bit bank-grade encryption. You can pay seamlessly using UPI (Google Pay, PhonePe, Paytm, BHIM), Credit Cards, Debit Cards, and Net Banking across all major banks.',
    categoryName: 'Payments & Checkout'
  },
  {
    id: 'faq-4',
    question: 'Can I use purchased toolkits for client and commercial projects?',
    answer: 'Yes! Every standard digital product on KDW includes a perpetual, royalty-free commercial license. You can freely use and customize these assets for unlimited client deliverables, commercial websites, and internal business operations. Reselling or redistributing raw source files is prohibited under our [Commercial Licensing Policy](/license).',
    categoryName: 'Licensing & Rights'
  },
  {
    id: 'faq-5',
    question: 'What are KDW Bundles and how do they save me money?',
    answer: 'KDW Bundles are curated, production-ready system collections that combine multiple complementary toolkits—such as full agency starter systems, proposal kits, client onboarding pipelines, and automation blueprints—at significant discounts of up to 40% off individual prices. Explore our curated [Bundle Collections](/bundles).',
    categoryName: 'Bundles & Savings'
  },
  {
    id: 'faq-6',
    question: 'Where can I access my purchased products and order receipts?',
    answer: 'You can track all your completed purchases, copy your license keys, download tax receipts, and access license details anytime by visiting [My Orders](/account/orders) and [My Licenses](/account/licenses) in your KDW customer account dashboard.',
    categoryName: 'Account & Orders'
  },
  {
    id: 'faq-7',
    question: 'Do I get free updates when a product is improved?',
    answer: 'Yes! All future product enhancements, template revisions, and software compatibility upgrades are provided 100% free of charge. You can re-verify your license key at [License Verification](/verify-license) or re-download the latest version anytime from your [Account Library](/account/downloads).',
    categoryName: 'Updates & Lifetime Access'
  },
  {
    id: 'faq-8',
    question: 'How can I contact KDW support if I need assistance with a download or license?',
    answer: 'Our dedicated customer assistance team is here to help. You can submit an inquiry directly through our [Help & Support Center](/support), or reach out through our [Contact Assistance](/contact) page for quick assistance.',
    categoryName: 'Support & Help'
  }
];

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>(FALLBACK_FAQS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const [contentRes, supportRes] = await Promise.allSettled([
          axios.get('/api/content/faqs?scope=ALL'),
          axios.get('/api/support/faqs')
        ]);

        if (contentRes.status === 'fulfilled' && contentRes.value.data?.success) {
          const rawList = Array.isArray(contentRes.value.data.faqs) 
            ? contentRes.value.data.faqs 
            : (Array.isArray(contentRes.value.data.data) ? contentRes.value.data.data : []);
          
          if (rawList.length > 0) {
            const list: FAQItem[] = rawList
              .filter((f: any) => f && f.question && f.answer)
              .map((f: any) => ({
                id: f.id || `faq-${Math.random()}`,
                question: f.question,
                answer: f.answer,
                categoryName: f.categoryName || f.category?.name || 'General',
                displayOrder: f.displayOrder || f.sortOrder || 0
              }))
              .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
            if (list.length > 0) {
              setFaqs(list);
              return;
            }
          }
        }

        if (supportRes.status === 'fulfilled' && supportRes.value.data?.success) {
          const rawList = Array.isArray(supportRes.value.data.data) 
            ? supportRes.value.data.data 
            : (Array.isArray(supportRes.value.data.faqs) ? supportRes.value.data.faqs : []);
          
          if (rawList.length > 0) {
            const list: FAQItem[] = rawList
              .filter((f: any) => f && f.question && f.answer)
              .map((f: any) => ({
                id: f.id || `faq-${Math.random()}`,
                question: f.question,
                answer: f.answer,
                categoryName: f.category?.name || f.categoryName || 'General',
                displayOrder: f.displayOrder || f.sortOrder || 0
              }))
              .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
            if (list.length > 0) {
              setFaqs(list);
            }
          }
        }
      } catch (err) {
        console.warn('Using fallback FAQ items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.categoryName || f.category).filter(Boolean))) as string[]];

  const filteredFaqs = faqs.filter(f => {
    const cat = f.categoryName || f.category || '';
    const matchesCat = activeCategory === 'All' || cat.toLowerCase() === activeCategory.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const renderFormattedAnswer = (text: string) => {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const href = match[2];
      parts.push(
        <Link
          key={`${href}-${match.index}`}
          to={href}
          className="text-[#5b21b6] hover:text-[#6d28d9] font-bold underline underline-offset-2 decoration-[#5b21b6]/40 hover:decoration-[#5b21b6] transition-colors"
        >
          {label}
        </Link>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-12 lg:py-20">
      <SEO 
        title="Frequently Asked Questions | KDW" 
        description="Find answers to common questions regarding digital delivery, commercial licences, and template compatibility."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/70 text-[#5b21b6] text-[10px] font-bold font-sans tracking-[0.2em] uppercase backdrop-blur-xs shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>KNOWLEDGE BASE & FAQ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
            Frequently Asked Questions
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed max-w-xl mx-auto">
            Everything you need to know about our digital toolkits, delivery access, and licensing terms.
          </p>
        </div>

        {/* Search Field */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs (e.g. licence, download, delivery)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#e2e8f0] bg-white text-xs font-sans placeholder-slate-400 focus:outline-none focus:border-[#5b21b6] shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#5b21b6] text-white font-bold shadow-xs'
                    : 'bg-white border border-[#e2e8f0] text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Expandable Details Rows */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <details
                key={faq.id}
                className="group bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 shadow-2xs open:border-[#5b21b6]/40 transition-all select-none"
              >
                <summary className="font-serif font-semibold text-sm sm:text-base text-[#171325] cursor-pointer flex items-center justify-between list-none">
                  <div className="flex items-center gap-2 pr-2 flex-wrap text-left flex-1">
                    <span>{faq.question}</span>
                    {faq.categoryName && faq.categoryName !== 'General' && (
                      <span className="text-[10px] font-sans font-semibold text-[#5b21b6] bg-[#ede9fe] px-2 py-0.5 rounded-full shrink-0">
                        {faq.categoryName}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-3 group-open:text-[#5b21b6]" />
                </summary>
                <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                  {renderFormattedAnswer(faq.answer)}
                </div>
              </details>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-sans">
              No matching FAQs found for "{searchQuery}". Try searching another keyword.
            </div>
          )}
        </div>

        {/* Support Help Footnote */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e2e8f0] text-center space-y-3 shadow-2xs">
          <h3 className="text-base sm:text-lg font-serif font-bold text-[#171325]">
            Still have questions?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-md mx-auto">
            Our help desk is ready to assist with custom licensing requirements or specific workflow integration questions.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/support"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#5b21b6] text-white text-xs font-semibold font-sans hover:bg-[#6d28d9] transition-all shadow-xs"
            >
              <span>Open Support Ticket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
