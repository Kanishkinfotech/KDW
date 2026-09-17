import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { 
  Search, ArrowRight, Clock, Calendar, BookOpen, 
  Sparkles, Layers, Tag, X, RefreshCw, Send, CheckCircle2
} from 'lucide-react';
import SEO from '../components/SEO';
import { blogApi, type BlogPostItem, type BlogCategoryItem, newsletterApi } from '../api';
import { toast } from 'react-hot-toast';

export default function Blog() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategoryParam = categorySlug || searchParams.get('category') || 'All';
  const activeSearchParam = searchParams.get('q') || searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(activeSearchParam);
  const [blogs, setBlogs] = useState<BlogPostItem[]>([]);
  const [featuredBlog, setFeaturedBlog] = useState<BlogPostItem | null>(null);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Debounced search sync
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const currentQ = searchParams.get('q') || '';
      if (trimmed !== currentQ) {
        const p = new URLSearchParams(searchParams);
        if (trimmed) {
          p.set('q', trimmed);
        } else {
          p.delete('q');
          p.delete('search');
        }
        setSearchParams(p);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, setSearchParams]);

  const fetchBlogData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { limit: 24 };
      if (activeCategoryParam && activeCategoryParam !== 'All') {
        params.category = activeCategoryParam;
      }
      if (activeSearchParam) {
        params.search = activeSearchParam;
      }

      const res = await blogApi.getBlogs(params);
      if (res.success) {
        setBlogs(res.blogs || []);
        setFeaturedBlog(res.featuredBlog || (res.blogs.length > 0 ? res.blogs[0] : null));
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      } else {
        throw new Error('Failed to retrieve publications.');
      }
    } catch (err: any) {
      console.error('Error fetching journal posts:', err);
      setError('Unable to load publications from the KDW editorial server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogData();
  }, [activeCategoryParam, activeSearchParam]);

  const handleCategorySelect = (categorySlug: string) => {
    const p = new URLSearchParams(searchParams);
    if (categorySlug === 'All') {
      p.delete('category');
    } else {
      p.set('category', categorySlug);
    }
    setSearchParams(p);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
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
        toast.success(res.message || 'Subscribed to the KDW Journal newsletter!');
        setNewsletterEmail('');
      } else {
        toast.error(res.message || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      toast.error('Unable to subscribe at this moment.');
    } finally {
      setSubscribing(false);
    }
  };

  // Remaining articles (excluding the top featured card if displayed prominently)
  const regularArticles = useMemo(() => {
    if (!featuredBlog || activeCategoryParam !== 'All' || activeSearchParam) {
      return blogs;
    }
    return blogs.filter(b => b.id !== featuredBlog.id);
  }, [blogs, featuredBlog, activeCategoryParam, activeSearchParam]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] selection:bg-[#ede9fe] selection:text-[#5b21b6] font-sans pb-24">
      <SEO 
        title="KDW Journal — Ideas, Guides & Technical Insights" 
        description="Practical insights into AI workflows, software architecture, design systems, and digital product craftsmanship."
      />

      {/* Hero Header Section */}
      <section className="relative pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#e2e8f0]/80 bg-gradient-to-b from-white via-[#faf9f7] to-[#fcfbf9]">
        <div className="max-w-[1360px] mx-auto space-y-8">
          
          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#5b21b6] font-bold">KDW Journal</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/60 text-[#5b21b6] text-[10px] font-bold tracking-[0.18em] uppercase">
                <Sparkles className="w-3 h-3 text-[#7c3aed]" />
                <span>KDW EDITORIAL & PUBLICATIONS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#171325] tracking-tight leading-tight">
                Ideas for building better with technology.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                Curated playbooks, software paradigms, design standards, and automation blueprints for modern builders.
              </p>
            </div>

            {/* Quick Catalog Link */}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 hover:border-[#5b21b6] bg-white text-xs font-bold text-slate-800 hover:text-[#5b21b6] transition-all shadow-2xs self-start lg:self-auto group"
            >
              <span>Explore Digital Toolkits</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="space-y-4 pt-4 border-t border-slate-200/70">
            {/* Search Input Bar */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search articles by title, topic, or keyword..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#5b21b6] focus:ring-2 focus:ring-[#ede9fe] transition-all shadow-2xs"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Topic / Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => handleCategorySelect('All')}
                className={`px-4 py-2 rounded-full text-xs font-medium font-sans whitespace-nowrap transition-all kdw-button-press ${
                  activeCategoryParam === 'All'
                    ? 'bg-[#5b21b6] text-white shadow-xs font-bold'
                    : 'bg-white border border-[#e2e8f0] text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                All Topics
              </button>

              {categories.map((cat) => {
                const isSelected = activeCategoryParam.toLowerCase() === cat.slug.toLowerCase() || activeCategoryParam.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`px-4 py-2 rounded-full text-xs font-medium font-sans whitespace-nowrap transition-all kdw-button-press ${
                      isSelected
                        ? 'bg-[#5b21b6] text-white shadow-xs font-bold'
                        : 'bg-white border border-[#e2e8f0] text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name} {cat.postCount ? `(${cat.postCount})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Main Articles Container */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-3 border-[#5b21b6] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-slate-500 font-mono">Loading KDW publications...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 space-y-4">
            <h3 className="text-base font-bold text-rose-800">Connection Issue</h3>
            <p className="text-xs text-rose-600">{error}</p>
            <button
              onClick={() => fetchBlogData()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry loading articles</span>
            </button>
          </div>
        )}

        {/* Empty Search Results State */}
        {!loading && !error && blogs.length === 0 && (
          <div className="bg-white border border-[#e2e8f0] rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#171325]">No publications found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {activeSearchParam 
                  ? `We couldn't find any articles matching "${activeSearchParam}".` 
                  : 'No articles currently listed in this category.'}
              </p>
            </div>
            {(activeCategoryParam !== 'All' || activeSearchParam) && (
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans transition-all shadow-xs"
              >
                View all articles
              </button>
            )}
          </div>
        )}

        {/* Top Featured Hero Card (When on All Topics and no active search) */}
        {!loading && !error && featuredBlog && activeCategoryParam === 'All' && !activeSearchParam && (
          <section className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-[#5b21b6]/40 transition-all group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Featured Visual (~55%) */}
              <Link 
                to={`/blog/${featuredBlog.slug}`}
                className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-slate-900 block select-none"
              >
                {featuredBlog.coverImage ? (
                  <img
                    src={featuredBlog.coverImage}
                    alt={featuredBlog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                    <BookOpen className="w-12 h-12 text-[#a78bfa]" />
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold font-sans tracking-wider uppercase bg-black/60 text-white backdrop-blur-md border border-white/20">
                    FEATURED PUBLICATION
                  </span>
                </div>
              </Link>

              {/* Featured Meta Details (~45%) */}
              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-md text-[10px] font-bold font-sans tracking-wider uppercase bg-[#ede9fe] text-[#5b21b6] border border-[#ddd6fe]">
                      {featuredBlog.category?.name || featuredBlog.categoryName || 'AI & Automation'}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredBlog.readingTimeMinutes || 6} min read
                    </span>
                  </div>

                  <Link to={`/blog/${featuredBlog.slug}`}>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug">
                      {featuredBlog.title}
                    </h2>
                  </Link>

                  <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed line-clamp-4">
                    {featuredBlog.excerpt || 'Explore practical recommendations, workflow automations, and software paradigms without the noise.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500">
                  <span>By {featuredBlog.authorName || 'KDW Editorial Team'}</span>
                  <Link
                    to={`/blog/${featuredBlog.slug}`}
                    className="font-bold text-[#5b21b6] hover:text-[#6d28d9] inline-flex items-center gap-1.5 transition-colors group/btn"
                  >
                    <span>Read full article</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Regular Articles Grid */}
        {!loading && !error && regularArticles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {activeCategoryParam !== 'All' ? `${activeCategoryParam} ARTICLES` : 'LATEST PUBLICATIONS'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {regularArticles.length} {regularArticles.length === 1 ? 'Article' : 'Articles'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {regularArticles.map((post) => (
                <article
                  key={post.id || post.slug}
                  className="kdw-card bg-white rounded-3xl overflow-hidden flex flex-col justify-between hover:border-[#5b21b6]/40 transition-all duration-300 group shadow-2xs"
                >
                  {/* Aspect 16:9 Cover Image */}
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 block select-none"
                  >
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                        <BookOpen className="w-8 h-8 text-[#a78bfa]" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-0.5 rounded-md text-[9px] font-bold font-sans tracking-wider uppercase bg-white/90 text-slate-800 backdrop-blur-md shadow-xs">
                        {post.category?.name || post.categoryName || 'Guide'}
                      </span>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTimeMinutes || 5} min
                        </span>
                        <span>•</span>
                        <span>
                          {post.publishedAt 
                            ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Recent'}
                        </span>
                      </div>

                      <Link to={`/blog/${post.slug}`}>
                        <h3 className="text-lg font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-2">
                        {post.excerpt || 'Read the complete technical breakdown and implementation details.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-400 truncate max-w-[120px]">
                        By {post.authorName || 'KDW Team'}
                      </span>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="font-bold text-[#5b21b6] hover:text-[#6d28d9] inline-flex items-center gap-1 group/link"
                      >
                        <span>Read article</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter Subscription Strip */}
        <section className="bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#0f172a] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-[#7c3aed]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-400/30 bg-purple-500/10 text-purple-300 text-[10px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3 text-[#c4b5fd]" />
              <span>KDW JOURNAL NEWSLETTER</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
              Get the best insights directly in your inbox.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              No daily spam. Only occasional deep dives into software tools, system architectures, and digital product playbooks.
            </p>

            {subscribed ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Thank you for subscribing! You'll receive our next editorial edition.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your work email address..."
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:bg-white/15 focus:border-[#a78bfa] transition-all flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-6 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold font-sans transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {subscribing ? (
                    <span>Subscribing...</span>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
