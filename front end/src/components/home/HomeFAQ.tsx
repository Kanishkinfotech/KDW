import { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomeFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I access my purchased digital files?',
      a: 'Immediately after successful payment, your files will be added to your Account Library (/account/library). You will also receive an instant delivery email containing secure download links.'
    },
    {
      q: 'Can I use these assets for client and commercial projects?',
      a: 'Yes! Commercial licenses grant rights for unlimited client builds, commercial websites, and monetized marketing assets. Redistribution or reselling raw files is prohibited.'
    },
    {
      q: 'What happens if a product gets updated?',
      a: 'All future product updates are provided free of charge! You can re-download the latest version anytime directly from your Account Dashboard.'
    },
    {
      q: 'What payment methods are supported?',
      a: 'We support all major payment options via Razorpay including UPI (Google Pay, PhonePe, Paytm), Credit Cards, Debit Cards, and Net Banking.'
    }
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-black tracking-widest text-primary uppercase mb-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 inline-flex items-center gap-1.5">
            <HelpCircle size={14} /> GOT QUESTIONS?
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-base mt-2 font-medium">
            Everything you need to know about purchasing, delivery, and licenses on KDW.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left font-bold text-slate-900 flex justify-between items-center gap-4 hover:text-primary transition-colors text-lg"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-400'}`} size={20} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 font-medium text-base leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link to="/faq" className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-sm">
            View All FAQs <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
