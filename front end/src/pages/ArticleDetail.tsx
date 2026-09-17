import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronRight, Home, ThumbsUp, ThumbsDown, FileText, 
  Calendar, Eye, Loader2, ArrowLeft, LifeBuoy, CheckCircle2,
  Share2, ArrowRight
} from 'lucide-react';
import SEO from '../components/SEO';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';

export default function ArticleDetail() {
  const { slug } = useParams<{ slug?: string }>();
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'helpful' | 'unhelpful' | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/support/articles/' + slug);
        if (res.data.success) {
          setArticle(res.data.data);
          if (res.data.relatedArticles) {
            setRelatedArticles(res.data.relatedArticles);
          }
        }
      } catch (err) {
        console.error('Failed to fetch article', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchArticle();
  }, [slug]);

  const handleVote = async (isHelpful: boolean) => {
    if (voted || !article) return;
    try {
      await axios.post('/api/support/articles/' + article.id + '/vote', { helpful: isHelpful });
      setVoted(isHelpful ? 'helpful' : 'unhelpful');
      toast.success('Thank you for your feedback!');
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#faf9f7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b21b6]"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#faf9f7] text-center px-6 py-20 space-y-4">
        <FileText size={48} className="text-slate-300" />
        <h1 className="text-2xl font-serif font-bold text-[#171325]">Article Not Found</h1>
        <p className="text-xs text-slate-500 max-w-md font-sans">The guide you're looking for doesn't exist or has been relocated.</p>
        <Link 
          to="/support/articles"
          className="px-5 py-2.5 bg-[#5b21b6] text-white text-xs font-bold rounded-xl"
        >
          &larr; Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#171325] font-sans pb-24">
      <SEO 
        title={article.title + ' | Knowledge Base | KDW'} 
        description={article.content.substring(0, 150)} 
      />

      {/* Top Header with Breadcrumbs */}
      <div className="pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0] bg-white">
        <div className="max-w-[860px] mx-auto space-y-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/support" className="hover:text-[#5b21b6] transition-colors">Support</Link>
            <span className="text-slate-300">/</span>
            <Link to="/support/articles" className="hover:text-[#5b21b6] transition-colors">Knowledge Base</Link>
            {article.category && (
              <>
                <span className="text-slate-300">/</span>
                <Link to={'/support/category/' + article.category.slug} className="hover:text-[#5b21b6] transition-colors">
                  {article.category.name}
                </Link>
              </>
            )}
          </nav>

          <div className="space-y-3">
            {article.category?.name && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5b21b6] bg-[#ede9fe] px-2.5 py-0.5 rounded-md inline-block">
                {article.category.name}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#171325] leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>Updated: {new Date(article.updatedAt || article.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {article.views !== undefined && <span>&bull; {article.views} views</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        
        {/* Article Content */}
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#171325] prose-a:text-[#5b21b6] prose-a:font-bold prose-a:underline hover:prose-a:text-[#7c3aed] prose-pre:bg-slate-900 prose-pre:text-slate-100 text-sm leading-relaxed">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {/* Feedback Section */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900 font-sans">Was this article helpful?</p>
              <p className="text-[11px] text-slate-500">Let us know if this resolved your query.</p>
            </div>

            {voted ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Feedback submitted</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-[#e2e8f0] hover:border-[#5b21b6] hover:bg-[#ede9fe]/40 text-xs font-bold text-slate-700 hover:text-[#5b21b6] transition-all cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Yes
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-[#e2e8f0] hover:border-slate-400 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> No
                </button>
              </div>
            )}
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-[#171325]">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  to={'/support/articles/' + rel.slug}
                  className="bg-white p-5 rounded-2xl border border-[#e2e8f0] hover:border-[#5b21b6]/40 transition-all group flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <h4 className="text-xs sm:text-sm font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors truncate">
                      {rel.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {rel.category?.name || 'Guide'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#5b21b6] transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Still Need Help CTA Strip */}
        <div className="bg-gradient-to-br from-[#2e1065] via-[#5b21b6] to-[#7c3aed] rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-serif font-bold text-white">Still need help?</h3>
            <p className="text-xs text-purple-100 max-w-md font-sans">
              Our support team is on standby to assist with any pre-purchase or post-purchase questions.
            </p>
          </div>
          <Link
            to="/support/contact"
            className="px-6 py-2.5 rounded-full bg-white text-[#5b21b6] text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shrink-0"
          >
            Contact Support &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
