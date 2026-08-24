import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, MessageCircle, Mail, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SEO from '../components/SEO';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

interface GroupedFAQs {
  category: string;
  questions: { q: string; a: string }[];
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>('0-0');
  const [faqs, setFaqs] = useState<GroupedFAQs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchFAQs = async () => {
      setLoading(true);
      try {
        const queryParam = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
        const res = await axios.get(`/api/support/faqs${queryParam}`);
        
        if (res.data.success) {
          const rawFaqs: FAQItem[] = res.data.faqs;
          
          // Group by category
          const grouped = rawFaqs.reduce((acc, curr) => {
            const cat = curr.category || 'General';
            if (!acc[cat]) {
              acc[cat] = [];
            }
            acc[cat].push({ q: curr.question, a: curr.answer });
            return acc;
          }, {} as Record<string, { q: string; a: string }[]>);

          const formattedFaqs = Object.keys(grouped).map(key => ({
            category: key,
            questions: grouped[key]
          }));

          setFaqs(formattedFaqs);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [debouncedSearch]);

  const toggleAccordion = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <SEO title="Frequently Asked Questions | KDW Marketplace" description="Find answers to common questions about billing, licenses, and support." />
      
      <div className="max-w-3xl mx-auto pt-8 mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-6">
          <HelpCircle size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">Frequently Asked Questions</h1>
        <p className="text-lg text-slate-600">
          Everything you need to know about KDW Marketplace. Can't find the answer you're looking for? Reach out to our support team.
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-16 relative">
        <div className="relative flex items-center">
          <Search size={20} className="absolute left-6 text-slate-400" />
          <input
            type="text"
            placeholder="Search FAQs (e.g. 'refund')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-full py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-12 mb-20 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <HelpCircle size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
            <p className="text-slate-500">
              {debouncedSearch ? "We couldn't find any articles matching your search." : "No FAQs available at the moment."}
            </p>
            {debouncedSearch && (
              <button onClick={() => setSearchQuery('')} className="mt-4 text-primary font-bold hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          faqs.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{group.category}</h2>
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {group.questions.map((faq, faqIdx) => {
                  const index = `${groupIdx}-${faqIdx}`;
                  const isOpen = openIndex === index;
                  
                  return (
                    <div key={faqIdx} className="border-b border-slate-100 last:border-none">
                      <button
                        onClick={() => toggleAccordion(index)}
                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus-visible:bg-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-bold text-slate-900 text-lg pr-4">{faq.q}</span>
                        <ChevronDown 
                          size={20} 
                          className={`text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 text-slate-600 leading-relaxed bg-slate-50/50">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
