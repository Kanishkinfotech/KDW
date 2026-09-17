import React, { useState, useEffect, useId } from 'react';
import { 
  HelpCircle, Plus, Minus, ArrowRight, MessageSquare, 
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  categoryName?: string;
  scopeType?: string;
  displayOrder?: number;
}

const FALLBACK_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What do I receive after purchasing a digital product?',
    answer: 'Immediately upon completing your checkout, your unique download access token and encrypted cloud storage links are generated. All files, templates, and documentation become perpetually accessible in your [Account Downloads](/account/downloads) dashboard, and an instant confirmation email with your purchase receipt is sent to your inbox.',
    categoryName: 'Delivery & Access',
    displayOrder: 1
  },
  {
    id: 'faq-2',
    question: 'How does digital delivery work?',
    answer: 'Our automated fulfillment engine instantly provisions direct high-speed download links and Google Drive cloud folders. Files are delivered in clean, universal formats—including Figma UI kits, Notion operating systems, n8n JSON automation blueprints, PDF documentation, and DOCX templates—with lifetime re-download rights.',
    categoryName: 'Delivery & Access',
    displayOrder: 2
  },
  {
    id: 'faq-3',
    question: 'What payment methods are supported on KDW?',
    answer: 'We support all major payment options securely processed via Razorpay with 256-bit bank-grade encryption. You can pay seamlessly using UPI (Google Pay, PhonePe, Paytm, BHIM), Credit Cards, Debit Cards, and Net Banking across all major banks.',
    categoryName: 'Payments & Checkout',
    displayOrder: 3
  },
  {
    id: 'faq-4',
    question: 'Can I use purchased toolkits for client and commercial projects?',
    answer: 'Yes! Every standard digital product on KDW includes a perpetual, royalty-free commercial license. You can freely use and customize these assets for unlimited client deliverables, commercial websites, and internal business operations. Reselling or redistributing raw source files is prohibited under our [Commercial Licensing Policy](/license).',
    categoryName: 'Licensing & Rights',
    displayOrder: 4
  },
  {
    id: 'faq-5',
    question: 'What are KDW Bundles and how do they save me money?',
    answer: 'KDW Bundles are curated, production-ready system collections that combine multiple complementary toolkits—such as full agency starter systems, proposal kits, client onboarding pipelines, and automation blueprints—at significant discounts of up to 40% off individual prices. Explore our curated [Bundle Collections](/bundles).',
    categoryName: 'Bundles & Savings',
    displayOrder: 5
  },
  {
    id: 'faq-6',
    question: 'Where can I access my purchased products and order receipts?',
    answer: 'You can track all your completed purchases, download tax receipts, and access license details anytime by visiting [My Orders](/account/orders) in your KDW customer account dashboard.',
    categoryName: 'Account & Orders',
    displayOrder: 6
  },
  {
    id: 'faq-7',
    question: 'Do I get free updates when a product is improved?',
    answer: 'Yes! All future product enhancements, template revisions, and software compatibility upgrades are provided 100% free of charge. You can re-download the latest version anytime directly from your [Account Library](/account/downloads).',
    categoryName: 'Updates & Lifetime Access',
    displayOrder: 7
  },
  {
    id: 'faq-8',
    question: 'How can I contact KDW support if I need assistance?',
    answer: 'Our dedicated customer assistance team is here to help. You can submit an inquiry or ticket directly through our [Help & Support Center](/support), or reach out through our [Contact Assistance](/contact) page for sub-24h turnaround.',
    categoryName: 'Support & Help',
    displayOrder: 8
  }
];

export default function HomeFAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>(FALLBACK_FAQS);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const baseId = useId();

  useEffect(() => {
    let isMounted = true;

    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const [contentRes, supportRes] = await Promise.allSettled([
          axios.get('/api/content/faqs?scope=ALL'),
          axios.get('/api/support/faqs')
        ]);

        let rawFaqs: any[] = [];

        if (contentRes.status === 'fulfilled' && contentRes.value.data?.success) {
          const list = Array.isArray(contentRes.value.data.faqs) 
            ? contentRes.value.data.faqs 
            : (Array.isArray(contentRes.value.data.data) ? contentRes.value.data.data : []);
          if (list.length > 0) {
            rawFaqs = list;
          }
        }

        if (rawFaqs.length === 0 && supportRes.status === 'fulfilled' && supportRes.value.data?.success) {
          const list = Array.isArray(supportRes.value.data.data) 
            ? supportRes.value.data.data 
            : (Array.isArray(supportRes.value.data.faqs) ? supportRes.value.data.faqs : []);
          if (list.length > 0) {
            rawFaqs = list;
          }
        }

        if (isMounted && rawFaqs.length > 0) {
          const serverFaqs: FAQItem[] = rawFaqs
            .filter((f: any) => f && f.question && f.answer)
            .map((f: any) => ({
              id: f.id || `faq-${Math.random()}`,
              question: f.question,
              answer: f.answer,
              categoryName: f.category?.name || f.categoryName || 'General',
              scopeType: f.scopeType,
              displayOrder: f.displayOrder || f.sortOrder || 0
            }))
            .sort((a: FAQItem, b: FAQItem) => (a.displayOrder || 0) - (b.displayOrder || 0));

          if (serverFaqs.length > 0) {
            setFaqs(serverFaqs);
            setOpenId(serverFaqs[0].id);
          }
        }
      } catch (err) {
        console.warn('Using fallback KDW FAQs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  const [showAll, setShowAll] = useState(false);
  const INITIAL_LIMIT = 12;
  const displayedFaqs = showAll || faqs.length <= INITIAL_LIMIT ? faqs : faqs.slice(0, INITIAL_LIMIT);

  const toggleFAQ = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

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
    <section 
      className="py-16 sm:py-24 bg-[#faf9f7] border-t border-[#e2e8f0] relative overflow-hidden"
      aria-labelledby="home-faq-heading"
    >
      <div className="absolute top-0 right-10 w-96 h-96 bg-[#7c3aed]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#5b21b6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/70 text-[#5b21b6] text-[10px] font-bold font-sans tracking-[0.2em] uppercase backdrop-blur-xs shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>

          <h2 
            id="home-faq-heading"
            className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] tracking-tight"
          >
            Everything you need to know before getting started.
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
            Practical answers regarding instant digital delivery, commercial licensing, Razorpay payments, and perpetual account access.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {loading && faqs.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3"
              >
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              </div>
            ))
          ) : (
            displayedFaqs.map((faq, index) => {
              const isOpen = openId === faq.id;
              const buttonId = `${baseId}-btn-${faq.id}`;
              const panelId = `${baseId}-panel-${faq.id}`;

              return (
                <div
                  key={faq.id || index}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-[#5b21b6]/40 shadow-xs ring-1 ring-[#5b21b6]/10'
                      : 'border-[#e2e8f0] hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <button
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-5 py-4 sm:py-4.5 text-left flex items-center justify-between gap-4 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b21b6] focus-visible:ring-inset"
                  >
                    <div className="flex items-center gap-2 pr-2 flex-wrap text-left flex-1">
                      <span className="text-sm sm:text-base font-serif font-semibold text-[#171325] group-hover:text-[#5b21b6] transition-colors">
                        {faq.question}
                      </span>
                      {faq.categoryName && faq.categoryName !== 'General' && (
                        <span className="text-[10px] font-sans font-semibold text-[#5b21b6] bg-[#ede9fe] px-2 py-0.5 rounded-full shrink-0">
                          {faq.categoryName}
                        </span>
                      )}
                    </div>

                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen 
                          ? 'bg-[#5b21b6] text-white' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-[#ede9fe] group-hover:text-[#5b21b6]'
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 transition-transform duration-200" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 transition-transform duration-200" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 pb-5 pt-2 text-xs sm:text-sm text-slate-600 font-sans leading-relaxed border-t border-slate-100 animate-fadeIn"
                    >
                      {renderFormattedAnswer(faq.answer)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Show More / Show Fewer Questions Toggle */}
        {faqs.length > INITIAL_LIMIT && (
          <div className="text-center pt-1">
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#ddd6fe] bg-white hover:bg-[#ede9fe]/50 text-[#5b21b6] text-xs font-bold font-sans shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              {showAll ? (
                <>
                  <span>Show Fewer Questions</span>
                  <Minus className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show More Questions ({faqs.length - INITIAL_LIMIT} more)</span>
                  <Plus className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Bottom Support & Knowledge Base Strip */}
        <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-[#5b21b6]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#171325]">
                Still have questions?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
                Our support team is here to assist with any pre-purchase questions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              to="/support"
              className="px-5 py-2.5 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-xs sm:text-sm font-sans font-bold inline-flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/faq"
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-sans font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View all FAQs</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
