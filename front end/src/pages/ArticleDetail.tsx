import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, Home, ThumbsUp, ThumbsDown, FileText, Calendar, Eye, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import ReactMarkdown from 'react-markdown';
import Button from '../components/Button';
import { useStore } from '../store/useStore';

export default function ArticleDetail() {
  const { slug } = useParams();
  const { fetchSupportArticles } = useStore();
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'helpful' | 'unhelpful' | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`/api/support/articles/${slug}`);
        if (res.data.success) {
          setArticle(res.data.data);
          if (res.data.relatedArticles) {
            setRelatedArticles(res.data.relatedArticles);
          }
          // Refresh global support articles so views increment immediately across the app
          fetchSupportArticles();
        }
      } catch (err) {
        console.error("Failed to fetch article", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchArticle();
  }, [slug, fetchSupportArticles]);

  const handleVote = async (isHelpful: boolean) => {
    if (voted || !article) return;
    try {
      await axios.post(`/api/support/articles/${article.id}/vote`, { helpful: isHelpful });
      setVoted(isHelpful ? 'helpful' : 'unhelpful');
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 text-center px-6">
        <FileText size={64} className="text-slate-300 mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Article Not Found</h1>
        <p className="text-slate-600 mb-8 max-w-md">The article you're looking for doesn't exist or has been moved.</p>
        <Link to="/docs">
          <Button>Back to Knowledge Base</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <SEO title={`${article.title} | Knowledge Base`} description={article.content.substring(0, 150)} />
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 sticky top-[72px] z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2 text-sm font-medium text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link to="/docs" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home size={16} /> Knowledge Base
          </Link>
          <ChevronRight size={16} />
          {article.category && (
            <>
              <Link to={`/docs/category/${article.category.slug}`} className="hover:text-primary transition-colors">
                {article.category.name}
              </Link>
              <ChevronRight size={16} />
            </>
          )}
          <span className="text-slate-900 truncate max-w-xs">{article.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12">
        {/* Article Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200">
              <Calendar size={16} className="text-primary" />
              Last updated on {new Date(article.updatedAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200">
              <Eye size={16} className="text-accent" />
              {article.views} views
            </div>
          </div>
        </div>

        {/* Content Body (Markdown) */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 mb-12">
          <div className="prose prose-slate prose-lg max-w-none 
                          prose-headings:font-bold prose-headings:text-slate-900 
                          prose-a:text-primary hover:prose-a:text-primary/80
                          prose-img:rounded-xl prose-img:shadow-md
                          prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:rounded
                          prose-pre:bg-slate-900 prose-pre:text-slate-100">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-12">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              Related Articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedArticles.map((rel: any) => (
                <Link
                  key={rel.id}
                  to={`/docs/${rel.slug}`}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-primary/5 border border-slate-200/60 hover:border-primary/30 transition-all group block"
                >
                  <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-sm mb-1 line-clamp-1">
                    {rel.title}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {rel.category?.name || 'Knowledge Base'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Was this article helpful?</h3>
          
          {voted ? (
            <div className="text-success font-bold flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <ThumbsUp size={24} />
              </div>
              Thanks for your feedback!
              {voted === 'unhelpful' && (
                <div className="mt-4 text-slate-600 font-medium text-sm">
                  Still need help? <Link to="/support/ticket" className="text-primary hover:underline">Raise a Support Ticket</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => handleVote(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-600 font-bold rounded-xl transition-all shadow-sm"
              >
                <ThumbsUp size={20} /> Yes
              </button>
              <button 
                onClick={() => handleVote(false)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-red-500 hover:text-red-500 text-slate-600 font-bold rounded-xl transition-all shadow-sm"
              >
                <ThumbsDown size={20} /> No
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
