import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Clock, Calendar, User, Share2, 
  Copy, Check, Mail, MessageCircle, 
  BookOpen, Sparkles, HelpCircle, ChevronRight, ShoppingBag
} from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { blogApi, type BlogPostItem, newsletterApi } from '../api';
import { toast } from 'react-hot-toast';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPostItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!slug) return;

    const fetchPostData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await blogApi.getBlogBySlug(slug);
        if (res.success && res.post) {
          setPost(res.post);
          setRelatedProducts(res.relatedProducts || []);
          setRelatedArticles(res.relatedArticles || []);
        } else {
          setError('Article not found.');
        }
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
        setError('Unable to load this publication from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [slug]);

  // Extract Table of Contents from contentJson headings or markdown
  const tableOfContents = useMemo(() => {
    if (!post?.contentJson || !Array.isArray(post.contentJson)) return [];
    return post.contentJson
      .filter((block: any) => block.type === 'heading' && block.text)
      .map((block: any, idx: number) => {
        const anchorId = `section-${idx + 1}`;
        return {
          id: anchorId,
          title: block.text,
          level: block.level || 2
        };
      });
  }, [post]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Article link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTwitter = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${post.title} via @KanishkDigital`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!post) return;
    const text = encodeURIComponent(`${post.title} - ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribing(true);
    try {
      const res = await newsletterApi.subscribe(newsletterEmail);
      if (res.success) {
        setSubscribed(true);
        toast.success(res.message || 'Subscribed to the KDW Journal!');
        setNewsletterEmail('');
      } else {
        toast.error(res.message || 'Subscription failed.');
      }
    } catch (err) {
      toast.error('Unable to subscribe at this moment.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 border-3 border-[#5b21b6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-mono">Loading publication...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#171325]">Article Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          {error || 'The publication you are looking for is not currently available in the KDW Journal.'}
        </p>
        <Link
          to="/blog"
          className="px-6 py-2.5 rounded-full bg-[#5b21b6] text-white text-xs font-bold font-sans hover:bg-[#6d28d9] transition-all shadow-xs"
        >
          Return to Journal
        </Link>
      </div>
    );
  }

  const categoryTitle = post.category?.name || post.categoryName || 'AI & Automation';
  const categorySlug = post.category?.slug || (typeof post.category === 'string' ? post.category : 'all');

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] selection:bg-[#ede9fe] selection:text-[#5b21b6] font-sans pb-24">
      <SEO 
        title={post.seoTitle || `${post.title} | KDW Journal`}
        description={post.seoDescription || post.excerpt || ''}
      />

      {/* Navigation Breadcrumb Bar */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap font-medium">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/blog" className="hover:text-[#5b21b6] transition-colors">Journal</Link>
            <span className="text-slate-300">/</span>
            <Link 
              to={`/blog?category=${encodeURIComponent(categorySlug)}`}
              className="hover:text-[#5b21b6] transition-colors"
            >
              {categoryTitle}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
          </nav>

          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#5b21b6] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Articles</span>
          </Link>
        </div>
      </div>

      {/* Main Editorial Article Header */}
      <header className="pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto text-center space-y-6">
        <div>
          <Link
            to={`/blog?category=${encodeURIComponent(categorySlug)}`}
            className="inline-block px-3.5 py-1 rounded-full text-xs font-bold font-sans tracking-wider uppercase bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe] hover:bg-[#ddd6fe] transition-colors"
          >
            {categoryTitle}
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-serif font-bold text-[#171325] tracking-tight leading-[1.15]">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-base sm:text-lg text-slate-600 font-sans leading-relaxed max-w-2xl mx-auto">
            {post.excerpt}
          </p>
        )}

        {/* Author, Date & Reading Time Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-mono border-t border-slate-200/60 max-w-xl mx-auto">
          <span className="flex items-center gap-1.5 font-sans font-bold text-slate-700">
            <User className="w-3.5 h-3.5 text-[#5b21b6]" />
            {post.authorName || 'KDW Editorial Team'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {post.publishedAt 
              ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : 'September 2026'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTimeMinutes || 7} min read
          </span>
        </div>
      </header>

      {/* Large Featured 16:9 Landscape Image */}
      {post.coverImage && (
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      )}

      {/* Article Content & Side Rail Layout */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Side Rail (Table of Contents & Share Controls) ~30% */}
          <aside className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <div className="sticky top-24 space-y-8">
              
              {/* Table of Contents Box */}
              {tableOfContents.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold font-sans tracking-wider uppercase text-slate-800">
                    <BookOpen className="w-4 h-4 text-[#5b21b6]" />
                    <span>IN THIS ARTICLE</span>
                  </div>
                  <nav className="space-y-2">
                    {tableOfContents.map((item, idx) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block text-xs text-slate-600 hover:text-[#5b21b6] font-medium leading-snug py-1 border-l-2 border-transparent hover:border-[#5b21b6] pl-3 transition-colors"
                      >
                        <span className="text-slate-400 font-mono text-[10px] mr-1.5">{String(idx + 1).padStart(2, '0')}</span>
                        {item.title.replace(/^[0-9]+.s*/, '')}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Share Bar Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <span className="text-xs font-bold font-sans tracking-wider uppercase text-slate-800 block">
                  SHARE THIS ARTICLE
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-[#5b21b6] bg-slate-50 hover:bg-[#ede9fe]/40 text-xs font-bold text-slate-700 hover:text-[#5b21b6] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Copy article link"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy link'}</span>
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 text-slate-700 hover:text-black flex items-center justify-center transition-all cursor-pointer"
                    title="Share on X (Twitter)"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShareLinkedIn}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 text-slate-700 hover:text-blue-600 flex items-center justify-center transition-all cursor-pointer"
                    title="Share on LinkedIn"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 text-slate-700 hover:text-emerald-600 flex items-center justify-center transition-all cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </aside>

          {/* Right Main Article Prose Content ~70% */}
          <article className="lg:col-span-8 order-1 lg:order-2 space-y-8 bg-white p-6 sm:p-10 lg:p-12 rounded-3xl border border-slate-200/90 shadow-2xs">
            {post.contentJson && Array.isArray(post.contentJson) && post.contentJson.length > 0 ? (
              <div className="space-y-8 text-slate-800 font-sans leading-relaxed">
                {post.contentJson.map((block: any, idx: number) => {
                  if (block.type === 'heading') {
                    const headingId = `section-${idx + 1}`;
                    return (
                      <h2 
                        key={idx} 
                        id={headingId} 
                        className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] pt-4 tracking-tight scroll-mt-28"
                      >
                        {block.text || block.title}
                      </h2>
                    );
                  }

                  if (block.type === 'paragraph' || block.type === 'text') {
                    return (
                      <p key={idx} className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
                        {block.text || block.content}
                      </p>
                    );
                  }

                  if ((block.type === 'checklist' || block.type === 'featureList') && Array.isArray(block.items || block.features)) {
                    const listItems = block.items || block.features || [];
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3">
                        {block.title && <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{block.title}</h3>}
                        {listItems.map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-[#ede9fe] text-[#5b21b6] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                              ✓
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (block.type === 'quote') {
                    return (
                      <blockquote key={idx} className="border-l-4 border-[#5b21b6] pl-6 py-2 my-6 text-lg sm:text-xl font-serif italic text-slate-900 bg-[#ede9fe]/20 rounded-r-2xl">
                        "{block.text || block.content}"
                        {block.subtitle && <div className="text-xs font-sans not-italic text-slate-500 mt-2">— {block.subtitle}</div>}
                      </blockquote>
                    );
                  }

                  if (block.type === 'code') {
                    return (
                      <pre key={idx} className="bg-slate-900 text-slate-100 p-5 rounded-2xl overflow-x-auto text-xs font-mono">
                        <code>{block.code || block.content}</code>
                      </pre>
                    );
                  }

                  if (block.type === 'imageText') {
                    return (
                      <div key={idx} className="space-y-3 my-6">
                        {block.imageUrl && (
                          <img src={block.imageUrl} alt="" className="w-full rounded-2xl border border-slate-200 object-cover max-h-96" />
                        )}
                        {(block.content || block.text) && (
                          <p className="text-xs sm:text-sm text-slate-500 italic text-center">
                            {block.content || block.text}
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (block.type === 'cta') {
                    return (
                      <div key={idx} className="my-8 p-8 bg-gradient-to-br from-[#171325] to-[#2d2250] text-white rounded-3xl text-center space-y-3 shadow-sm">
                        <h3 className="text-xl font-bold font-serif">{block.title || 'Take action on this workflow'}</h3>
                        {block.subtitle && <p className="text-sm text-slate-300 max-w-md mx-auto">{block.subtitle}</p>}
                        <div className="pt-2">
                          <a
                            href={block.ctaUrl || '/shop'}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#171325] text-xs font-bold hover:bg-[#ede9fe] transition-all"
                          >
                            <span>{block.ctaLabel || 'Learn More'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'hero') {
                    return (
                      <div key={idx} className="p-8 bg-slate-50 border border-slate-200/80 rounded-3xl text-center space-y-2 my-6">
                        <h2 className="text-2xl font-black font-serif text-slate-900">{block.title || block.text}</h2>
                        {block.subtitle && <p className="text-sm text-slate-600">{block.subtitle}</p>}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ) : (
              <div className="prose prose-slate prose-lg max-w-none font-sans leading-relaxed text-slate-700 space-y-4">
                <p className="text-base sm:text-lg">
                  {post.content || post.excerpt || 'Explore this in-depth guide on the KDW platform.'}
                </p>
              </div>
            )}

            {/* Article Tags Strip */}
            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="pt-8 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags:</span>
                {post.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>

        </div>
      </div>

      {/* ======================================================== */}
      {/* RECOMMENDED KDW PRODUCTS (COMMERCE INTEGRATION)          */}
      {/* ======================================================== */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-16 border-t border-slate-200/80 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block mb-1">
                FEATURED WORKFLOW TOOLKITS
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                Recommended products for this workflow.
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-bold text-[#5b21b6] hover:underline inline-flex items-center gap-1"
            >
              <span>View full catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* YOU MAY ALSO LIKE (RELATED ARTICLES)                     */}
      {/* ======================================================== */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-16 border-t border-slate-200/80 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-slate-400 block mb-1">
                CONTINUE READING
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                You may also like.
              </h2>
            </div>
            <Link
              to="/blog"
              className="text-xs font-bold text-[#5b21b6] hover:underline inline-flex items-center gap-1"
            >
              <span>All articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <article
                key={rel.id || rel.slug}
                className="kdw-card bg-white rounded-3xl overflow-hidden flex flex-col justify-between hover:border-[#5b21b6]/40 transition-all group shadow-2xs"
              >
                <Link 
                  to={`/blog/${rel.slug}`}
                  className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 block select-none"
                >
                  {rel.coverImage ? (
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                      <BookOpen className="w-8 h-8 text-[#a78bfa]" />
                    </div>
                  )}
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold font-sans tracking-wider uppercase text-[#5b21b6]">
                      {rel.category?.name || rel.categoryName || 'Guide'}
                    </span>
                    <Link to={`/blog/${rel.slug}`}>
                      <h3 className="text-base font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug mt-1 line-clamp-2">
                        {rel.title}
                      </h3>
                    </Link>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{rel.readingTimeMinutes || 5} min read</span>
                    <span className="font-bold text-[#5b21b6] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      <span>Read →</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Footer Strip */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#0f172a] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Enjoyed this publication?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Join hundreds of builders who receive our editorial breakdowns, workflow templates, and systems insights.
            </p>
            {subscribed ? (
              <p className="text-xs text-emerald-300 font-bold">✓ You are subscribed to the KDW Journal.</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md pt-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:bg-white/15 focus:border-[#a78bfa] transition-all flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-6 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
