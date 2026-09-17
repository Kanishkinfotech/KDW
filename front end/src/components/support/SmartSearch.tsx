import { useState, useEffect, useRef } from 'react';
import { Search, FileText, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{articles: any[], faqs: any[]}>({ articles: [], faqs: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Simple debounce hook logic
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ articles: [], faqs: [] });
      setIsOpen(false);
      return;
    }

    const fetchSearch = async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/api/support/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.data.success) {
          setResults(res.data.data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    };
    
    fetchSearch();
  }, [debouncedQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = results.articles.length + results.faqs.length;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto z-50">
      <div className="relative flex items-center">
        <Search className="absolute left-4 text-slate-400" size={24} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder="Search for articles, tutorials, or FAQs..." 
          className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-lg text-lg font-medium"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 text-primary animate-spin" size={24} />
        )}
      </div>

        {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {totalResults === 0 && !isSearching ? (
              <div className="p-8 text-center text-slate-500">
                <p>No help articles found for "{query}"</p>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/support/contact');
                  }} 
                  className="mt-4 text-[#5b21b6] font-bold hover:underline cursor-pointer"
                >
                  Contact Customer Support &rarr;
                </button>
              </div>
            ) : (
              <>
                {results.articles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Knowledge Base Articles</h4>
                    <div className="space-y-1">
                      {results.articles.map((article: any) => (
                        <Link 
                          key={article.id} 
                          to={`/support/articles/${article.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-start gap-3 p-3 hover:bg-[#ede9fe]/40 rounded-xl transition-colors group"
                        >
                          <div className="bg-[#ede9fe] text-[#5b21b6] p-2 rounded-lg mt-0.5 shrink-0">
                            <FileText size={16} />
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 group-hover:text-[#5b21b6] transition-colors text-sm">{article.title}</h5>
                            <p className="text-xs text-slate-500 line-clamp-1">{article.content.substring(0, 100)}...</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.faqs.length > 0 && (
                  <div>
                    <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Frequently Asked Questions</h4>
                    <div className="space-y-1">
                      {results.faqs.map((faq: any) => (
                        <div 
                          key={faq.id} 
                          className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer"
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/faq');
                          }}
                        >
                          <div className="bg-amber-50 text-amber-600 p-2 rounded-lg mt-0.5 shrink-0">
                            <HelpCircle size={16} />
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-900 text-sm">{faq.question}</h5>
                            <p className="text-xs text-slate-500 line-clamp-1">{faq.answer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {totalResults > 0 && (
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Found {totalResults} matching results</span>
              <Link 
                to="/support/articles" 
                onClick={() => setIsOpen(false)}
                className="text-[#5b21b6] font-bold flex items-center gap-1 hover:underline"
              >
                Browse All Guides <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
