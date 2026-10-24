import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Layers, FileCode, CheckCircle2, 
  Zap, Grid, Download, ShieldCheck, Infinity, Clock, BookOpen, Package,
  ChevronLeft, ChevronRight, Tag, Star, HardDrive
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import HomeFAQ from '../components/home/HomeFAQ';
import SEO from '../components/SEO';
import BundleCountdownBadge from '../components/BundleCountdownBadge';
import { getBundleEffectivePricing, formatTimeRemaining } from '../utils/bundlePricing';
import { trackOfferView, trackOfferClick } from '../utils/offerTracking';
import { useSettings } from '../context/SettingsContext';
import axios from 'axios';

export default function Home() {
  const { settings } = useSettings();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [journalArticles, setJournalArticles] = useState<any[]>([]);
  const [publishedBanner, setPublishedBanner] = useState<any>(null);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [activeOffer, setActiveOffer] = useState<any>(null);
  const [offerCountdown, setOfferCountdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const bundleScrollRef = useRef<HTMLDivElement>(null);

  const defaultFallbackBanners = [
    {
      id: 'default-1',
      name: 'AI WORKFLOW AUTOMATION KIT',
      headline: 'AI Workflow Automation Kit & Production Blueprints',
      supportingText: 'Polished templates, practical bundles, and workflow foundations for capable independent teams. Clean architecture, immediate utility, zero fluff.',
      desktopImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
      altText: 'AI Workflow Automation Kit',
      ctaLabel: 'View AI Workflow Kit',
      ctaUrl: '/product/ai-workflow-automation-kit',
      priority: 1
    },
    {
      id: 'default-2',
      name: 'THE ULTIMATE FREELANCER BUNDLE',
      headline: 'The Ultimate Freelancer Digital Toolkit Bundle',
      supportingText: 'Skip months of fragmented building. Our curated digital bundles package design kits, business frameworks, and automated workflows into one unified download with lifetime access.',
      desktopImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
      altText: 'The Ultimate Freelancer Bundle',
      ctaLabel: 'View Freelancer Bundle',
      ctaUrl: '/bundles/the-ultimate-freelancer-bundle',
      priority: 2
    },
    {
      id: 'default-3',
      name: 'AGENCY STARTER PACK',
      headline: 'Agency Starter Pack — Full Commercial Asset Suite',
      supportingText: 'Purpose-built agency starter kits, AI automation workflows, and financial dashboard templates. Instant direct download with lifetime commercial usage license.',
      desktopImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&auto=format&fit=crop&q=80',
      altText: 'Agency Starter Pack',
      ctaLabel: 'View Agency Starter Pack',
      ctaUrl: '/product/agency-starter-pack',
      priority: 3
    }
  ];

  const getSlideDestination = (slide: any, index: number): string => {
    // If slide explicitly links to a specific product or bundle
    if (slide?.ctaUrl && (
      slide.ctaUrl.startsWith('/product/') ||
      slide.ctaUrl.startsWith('/products/') ||
      slide.ctaUrl.startsWith('/bundles/') ||
      slide.ctaUrl.startsWith('/item/') ||
      slide.ctaUrl.startsWith('/templates/')
    )) {
      return slide.ctaUrl;
    }
    if (slide?.productId) {
      return `/product/${slide.productId}`;
    }
    // If slide links to a generic listing page like /categories, /bundles, /shop, or is missing:
    // Resolve to guaranteed specific live products / bundles
    if (index === 0) {
      const p = featuredProducts[0];
      return p?.slug ? `/product/${p.slug}` : '/product/ai-workflow-automation-kit';
    }
    if (index === 1) {
      const b = bundles[0];
      return b?.slug ? `/bundles/${b.slug}` : '/bundles/the-ultimate-freelancer-bundle';
    }
    if (index === 2) {
      const p = featuredProducts[1] || featuredProducts[0];
      return p?.slug ? `/product/${p.slug}` : '/product/agency-starter-pack';
    }
    return '/product/ai-workflow-automation-kit';
  };

  const activeHeroSlides = heroBanners.length > 0 ? heroBanners : defaultFallbackBanners;

  // Hero Banner Carousel State with 3-Second Auto-Scroll
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    if (isHeroPaused || activeHeroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide(prev => (prev + 1) % activeHeroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isHeroPaused, activeHeroSlides.length]);

  // Bundles Horizontal Auto-Scroll (High-Performance Sub-Pixel Continuous Drift)
  const [isBundlesPaused, setIsBundlesPaused] = useState(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const container = bundleScrollRef.current;
    if (!container || bundles.length === 0) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    // Reduced scroll speed for smooth, readable, non-rushed automatic scrolling
    const scrollSpeed = 75;

    const animateScroll = (currentTimestamp: number) => {
      const elapsed = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      if (!isBundlesPaused && container) {
        scrollPosRef.current += scrollSpeed * elapsed;
        const halfScroll = container.scrollWidth / 2;
        if (halfScroll > 0 && scrollPosRef.current >= halfScroll) {
          scrollPosRef.current -= halfScroll;
        }
        container.scrollLeft = scrollPosRef.current;
      } else if (container) {
        // Sync ref with container position if user manually scrolled while paused
        scrollPosRef.current = container.scrollLeft;
      }

      animationFrameId = requestAnimationFrame(animateScroll);
    };

    animationFrameId = requestAnimationFrame(animateScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bundles.length, isBundlesPaused]);


  const storeStatus = settings?.store_status || 'ACTIVE';
  const maintenanceMessage = settings?.maintenance_message || '';

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, bannerRes, offerRes, blogRes, bundleRes] = await Promise.allSettled([
          axios.get('/api/products?featured=true&limit=4'),
          axios.get('/api/categories'),
          axios.get('/api/content/banners/placement/HOMEPAGE_HERO'),
          axios.get('/api/offers/active'),
          axios.get('/api/content/blogs?limit=3'),
          axios.get('/api/bundles?limit=12&status=ACTIVE')
        ]);

        // 1. KDW Journal
        if (blogRes.status === 'fulfilled' && blogRes.value.data?.success) {
          const list = blogRes.value.data.blogs || blogRes.value.data.data;
          if (Array.isArray(list)) {
            setJournalArticles(list);
          }
        }

        // 2. Bundles
        if (bundleRes.status === 'fulfilled' && (bundleRes.value.data?.success || Array.isArray(bundleRes.value.data?.bundles || bundleRes.value.data?.data))) {
          const bList = bundleRes.value.data.bundles || bundleRes.value.data.data;
          if (Array.isArray(bList) && bList.length > 0) {
            const activeOnly = bList.filter((b: any) => {
              const st = (b.status || 'ACTIVE').toUpperCase();
              return st === 'ACTIVE' || st === 'PUBLISHED';
            });
            const sortedBundles = [...activeOnly].sort((a: any, b: any) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
            setBundles(sortedBundles);
          }
        }

        // 3. Featured Products
        if (prodRes.status === 'fulfilled' && prodRes.value.data?.success) {
          const list = prodRes.value.data.data;
          if (Array.isArray(list) && list.length > 0) {
            setFeaturedProducts(list);
          } else {
            try {
              const allRes = await axios.get('/api/products?limit=8');
              if (allRes.data?.success && Array.isArray(allRes.data.data)) {
                setFeaturedProducts(allRes.data.data);
              }
            } catch (e) {
              setFeaturedProducts([]);
            }
          }
        } else {
          setFeaturedProducts([]);
        }

        // 4. Categories
        if (catRes.status === 'fulfilled' && catRes.value.data?.success) {
          const dbCats = catRes.value.data.data;
          if (Array.isArray(dbCats) && dbCats.length > 0) {
            const primaryOnly = dbCats.filter((c: any) => !c.parentId);
            const sorted = [...primaryOnly].sort((a: any, b: any) => {
              const aFeatured = (a.featured || a.featuredPlacement === 'HOMEPAGE_CARD') ? 1 : 0;
              const bFeatured = (b.featured || b.featuredPlacement === 'HOMEPAGE_CARD') ? 1 : 0;
              if (bFeatured !== aFeatured) return bFeatured - aFeatured;
              return (b.featuredPriority || 0) - (a.featuredPriority || 0);
            }).slice(0, 5);

            if (sorted.length > 0) {
              const mapped = sorted.map((c: any, index: number) => ({
                id: c.id,
                seq: (index + 1).toString().padStart(2, '0'),
                title: c.name,
                image: c.image || '/images/products/saas_website.jpg',
                description: c.description || c.shortDescription || `Curated digital toolkits and assets for ${c.name}.`,
                href: `/categories/${encodeURIComponent(c.slug || c.name)}`,
                featured: c.featured
              }));
              setCategories(mapped);
            }
          }
        }

        // 5. Banners
        if (bannerRes.status === 'fulfilled' && bannerRes.value.data?.success) {
          const banners = bannerRes.value.data.banners || bannerRes.value.data.data;
          if (Array.isArray(banners) && banners.length > 0) {
            setHeroBanners(banners);
          }
        }

        // 6. Active Hero Banner Offer
        if (offerRes.status === 'fulfilled' && offerRes.value.data?.success) {
          const offers = offerRes.value.data.offers;
          if (Array.isArray(offers) && offers.length > 0) {
            const heroOffer = offers.find((o: any) =>
              ['STOREFRONT_BANNER', 'STOREFRONT_HERO_BANNER', 'BANNER_AND_PRODUCT', 'ALL_PLACEMENTS'].includes(o.displayPlacement)
            );
            if (heroOffer) {
              setActiveOffer(heroOffer);
              trackOfferView(heroOffer.id);
            } else {
              setActiveOffer(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Live countdown ticker for hero banner offer
  useEffect(() => {
    if (!activeOffer?.endAt) return;
    const updateCountdown = () => {
      const diff = new Date(activeOffer.endAt).getTime() - Date.now();
      if (diff <= 0) {
        setOfferCountdown('');
      } else {
        const { formatted } = formatTimeRemaining(diff);
        setOfferCountdown(formatted);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeOffer]);

  const handleOfferClick = () => {
    if (activeOffer?.id) {
      trackOfferClick(activeOffer.id);
    }
  };

  const handleBannerClick = (bannerId?: string) => {
    if (bannerId && !bannerId.startsWith('default-')) {
      axios.post(`/api/content/banners/${bannerId}/click`).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9] text-[#171325]">
      <SEO 
        title="Kanishk Digital World (KDW) — Better systems for the work you want to grow."
        description="Discover polished templates, practical bundles, and workflow foundations for capable independent teams."
      />

      {/* Store Maintenance / Paused Notification Banner */}
      {(storeStatus === 'MAINTENANCE' || storeStatus === 'PAUSED') && (
        <div className="bg-amber-50 border-b border-amber-200 py-3.5 px-4 sm:px-6">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs sm:text-sm font-medium text-amber-900 font-sans">
                <strong className="font-bold">Store Notice:</strong> {maintenanceMessage || 'Store purchases are temporarily undergoing scheduled maintenance. Existing customer library access is fully operational.'}
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-full shrink-0">
              {storeStatus} MODE
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. CUSTOMER HERO SECTION (3-PAGE AUTO-SCROLLING CAROUSEL) */}
      {/* ======================================================== */}
      <section 
        className="w-full relative overflow-hidden bg-gradient-to-br from-[#faf9f7] via-[#f5f3ff]/30 to-[#ede9fe]/25 text-slate-900 py-12 sm:py-16 lg:py-20 border-b border-[#e2e8f0]"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {/* Soft radial purple/indigo ambient lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#5b21b6]/5 rounded-full blur-3xl pointer-events-none" />

        {/* DYNAMIC HORIZONTAL SLIDER TRACK */}
        <div 
          className="flex w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentHeroSlide * 100}%)` }}
        >
          {activeHeroSlides.map((slide, index) => {
            const targetUrl = getSlideDestination(slide, index);
            const targetLabel = slide.ctaLabel || (targetUrl.includes('bundle') ? 'View Bundle' : 'View Product');

            return (
            <div key={slide.id || index} className="min-w-full w-full shrink-0">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                  
                  {/* Left Hero Column (~58%) */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* 1. Premium Brand Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/70 text-[#5b21b6] text-[11px] font-sans font-bold tracking-[0.18em] uppercase backdrop-blur-xs shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#7c3aed] fill-[#7c3aed]" />
                      <span>{slide.name || 'KDW DIGITAL TOOLKIT'}</span>
                    </div>

                    {/* 2. Large Editorial Headline with Purple Accent */}
                    <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-serif text-[#171325] leading-[1.08] tracking-tight">
                      {slide.headline || slide.name}
                    </h1>

                    {/* 3. Subtitle / Value Proposition */}
                    <p className="text-base sm:text-lg text-slate-600 font-sans leading-relaxed max-w-xl">
                      {slide.supportingText || 'Polished templates, practical bundles, and workflow foundations for capable independent teams.'}
                    </p>

                    {/* Active Hero Offer Promotional Banner (first slide only if offer active) */}
                    {index === 0 && activeOffer && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg relative overflow-hidden group border border-white/20">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-mono font-bold tracking-widest uppercase border border-white/20">
                                {activeOffer.badgeText || 'HOT DEAL'}
                              </span>
                              {offerCountdown && (
                                <span className="text-[11px] font-mono text-amber-100 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-200" />
                                  Ends in: {offerCountdown}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-bold font-sans text-white">
                              {activeOffer.bannerText || activeOffer.name}
                            </h3>
                            <p className="text-xs text-white/90 font-sans">
                              Save {activeOffer.discountType === 'PERCENTAGE' ? `${activeOffer.discountValue}% OFF` : `₹${activeOffer.discountValue} FLAT OFF`} on eligible digital toolkits!
                            </p>
                          </div>
                          <Link
                            to={activeOffer.targetBundles?.length === 1 ? `/bundles/${activeOffer.targetBundles[0].slug || activeOffer.targetBundles[0].id}` : '/shop'}
                            onClick={handleOfferClick}
                            className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-amber-50 text-xs font-bold font-sans uppercase tracking-wider shrink-0 transition shadow-md flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
                          >
                            <span>Claim Deal</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* 4. Action CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <Link
                        to={targetUrl}
                        onClick={() => handleBannerClick(slide.id)}
                        className="px-7 py-3.5 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-sm font-sans font-bold tracking-wide transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2 group kdw-button-press cursor-pointer"
                      >
                        <span>{targetLabel}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        to={targetUrl.includes('bundle') ? '/shop' : '/bundles'}
                        className="px-7 py-3.5 rounded-full border border-[#cbd5e1] hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-sm font-sans font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        <span>{targetUrl.includes('bundle') ? 'Browse All Products' : 'Explore All Bundles'}</span>
                      </Link>
                    </div>

                    {/* 5. Proof / Trust Highlights Row */}
                    <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-slate-600 font-sans">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-[#5b21b6]" />
                        <span>Instant digital delivery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#5b21b6]" />
                        <span>Commercial use licence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Infinity className="w-4 h-4 text-[#5b21b6]" />
                        <span>Lifetime file updates</span>
                      </div>
                    </div>

                  </div>

                  {/* Right Hero Column (~42%) — Clean Minimalist Device Showcase Visual */}
                  <div className="lg:col-span-5 relative">
                    <div className="relative mx-auto max-w-[520px] rounded-3xl p-3 bg-gradient-to-b from-white/80 to-white/40 border border-white/60 shadow-xl backdrop-blur-md">
                      
                      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group">
                        {/* Laptop Top Browser Bar */}
                        <Link 
                          to={targetUrl}
                          onClick={() => handleBannerClick(slide.id)}
                          className="h-7 bg-slate-800/90 px-4 flex items-center justify-between border-b border-slate-700/50 hover:bg-slate-800 transition-colors block cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 truncate max-w-[260px] flex items-center gap-1">
                            <span className="text-purple-400">kanishkdigitalworld.com</span>
                            <span>{targetUrl}</span>
                          </span>
                          <div className="w-10" />
                        </Link>

                        {/* Banner Image Showcase - Entire container is a clickable link to the particular product */}
                        <div className="relative aspect-16/10 sm:aspect-4/3 overflow-hidden bg-slate-950">
                          <Link 
                            to={targetUrl} 
                            onClick={() => handleBannerClick(slide.id)}
                            className="block w-full h-full cursor-pointer relative"
                            title={`Open ${slide.headline || slide.name}`}
                          >
                            <img 
                              src={slide.desktopImage || '/images/products/saas_website.jpg'} 
                              alt={slide.altText || slide.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/products/saas_website.jpg'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                            {/* Top Badges */}
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-[#5b21b6] text-white font-black text-[10px] uppercase font-mono tracking-wider shadow-md">
                                {slide.altText || 'Featured Product'}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[10px] border border-white/20">
                                Priority #{slide.priority || (index + 1)}
                              </span>
                            </div>

                            {/* Bottom Caption on Image */}
                            <div className="absolute bottom-3 left-4 right-4 text-white flex items-end justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold font-sans text-base sm:text-lg drop-shadow-sm truncate group-hover:text-purple-300 transition-colors">
                                  {slide.headline || slide.name}
                                </h4>
                                <p className="text-xs text-slate-300 line-clamp-1 font-sans mt-0.5">
                                  {slide.supportingText || 'Curated digital tools & lifetime access'}
                                </p>
                              </div>
                              <span
                                className="px-3 py-1 bg-white hover:bg-purple-50 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0 shadow-sm ml-2 group-hover:bg-[#5b21b6] group-hover:text-white"
                              >
                                {targetLabel} &rarr;
                              </span>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Floating Micro-Badge */}
                      <div className="absolute -bottom-3 -left-3 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200/80 flex items-center gap-2.5 text-xs font-sans">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">Verified Digital Asset</span>
                          <span className="text-[10px] text-slate-400">Instant Direct Access</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* LEFT & RIGHT NAVIGATION ARROWS */}
        {activeHeroSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrentHeroSlide(p => (p === 0 ? activeHeroSlides.length - 1 : p - 1))}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-950 shadow-md border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
              aria-label="Previous Hero Slide"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentHeroSlide(p => (p === activeHeroSlides.length - 1 ? 0 : p + 1))}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-950 shadow-md border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
              aria-label="Next Hero Slide"
            >
              <ChevronRight size={20} />
            </button>

            {/* BOTTOM DOT INDICATORS */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {activeHeroSlides.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => setCurrentHeroSlide(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentHeroSlide === idx
                      ? 'w-7 h-2 bg-[#5b21b6]'
                      : 'w-2 h-2 bg-slate-300/80 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ======================================================== */}
      {/* OPTIONAL PUBLISHED BANNER BAND                          */}
      {/* ======================================================== */}
      {publishedBanner && (
        <div className="bg-[#ede9fe] border-b border-[#ddd6fe] py-3 px-4 text-center text-xs font-sans text-[#5b21b6] flex items-center justify-center gap-3">
          <span className="font-bold uppercase tracking-wider">{publishedBanner.headline || publishedBanner.name || publishedBanner.title}</span>
          {(publishedBanner.supportingText || publishedBanner.subtitle || publishedBanner.message) && (
            <span className="text-slate-600 hidden sm:inline">{publishedBanner.supportingText || publishedBanner.subtitle || publishedBanner.message}</span>
          )}
          {(publishedBanner.ctaUrl || publishedBanner.ctaLink) && (
            <Link 
              to={publishedBanner.ctaUrl || publishedBanner.ctaLink} 
              onClick={() => {
                if (publishedBanner.id) {
                  axios.post(`/api/content/banners/${publishedBanner.id}/click`).catch(() => {});
                }
              }}
              className="underline font-bold text-[#5b21b6] hover:text-[#431407]"
            >
              {publishedBanner.ctaLabel || publishedBanner.ctaText || 'Learn More →'}
            </Link>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FEATURED PRODUCTS COLLECTION BAND                     */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#e2e8f0]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block mb-1">
                SELECTED FOR BUILDERS
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#171325]">
                Premium-ready tools, without the clutter.
              </h2>
            </div>

            <Link
              to="/shop"
              className="text-xs font-semibold font-sans text-[#5b21b6] hover:text-[#6d28d9] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto group"
            >
              <span>View all products</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Product Grid with Little Spacing (Square Edges) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. KDW BUNDLES HORIZONTAL DISCOVERY STRIP                */}
      {/* ======================================================== */}
      {bundles.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#faf9f7] border-b border-[#e2e8f0] overflow-hidden">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#5b21b6] block mb-1">
                  SYSTEM VALUE & SAVINGS
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#171325]">
                  Curated bundle collections.
                </h2>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <Link
                  to="/bundles"
                  className="text-xs font-semibold font-sans text-[#5b21b6] hover:text-[#6d28d9] inline-flex items-center gap-1.5 transition-colors group"
                >
                  <span>Explore all bundles</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Horizontal Scroll Track: Left-to-Right Slow Auto-Scrolling */}
            <div 
              ref={bundleScrollRef}
              onMouseEnter={() => setIsBundlesPaused(true)}
              onMouseLeave={() => setIsBundlesPaused(false)}
              onTouchStart={() => setIsBundlesPaused(true)}
              onTouchEnd={() => setIsBundlesPaused(false)}
              className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', willChange: 'scroll-position' }}
            >
              {(bundles.length > 0 ? [...bundles, ...bundles] : []).map((bundle, index) => {
                const pricing = getBundleEffectivePricing(bundle);
                if (pricing.isDealActive && pricing.activeDeal?.offerId) {
                  trackOfferView(pricing.activeDeal.offerId);
                }

                return (
                  <Link
                    key={`${bundle.id}-${index}`}
                    to={`/bundles/${bundle.slug || bundle.id}`}
                    onClick={() => {
                      if (pricing.isDealActive && pricing.activeDeal?.offerId) {
                        trackOfferClick(pricing.activeDeal.offerId);
                      }
                    }}
                    className="shrink-0 w-[300px] sm:w-[340px] md:w-[370px] bg-white border border-[#e2e8f0] flex flex-col justify-between hover:border-[#5b21b6] hover:shadow-xl transition-all duration-300 group select-none"
                  >
                    {/* Upper Cover Image (Clean & Uncluttered) */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900 select-none">
                      {bundle.coverImage ? (
                        <img
                          src={bundle.coverImage}
                          alt={bundle.title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#3b0764] via-[#4c1d95] to-[#0f172a]" />
                      )}

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {bundle.featured && (
                            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-amber-950 border border-amber-300 shadow-xs flex items-center gap-0.5">
                              ★ FEATURED
                            </span>
                          )}
                          {pricing.isDealActive ? (
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs flex items-center gap-1">
                                <Zap size={10} className="fill-white" />
                                {pricing.badgeText || 'DEAL'}
                              </span>
                              {pricing.offerEndAt && (
                                <BundleCountdownBadge offerEndAt={pricing.offerEndAt} variant="badge" />
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-black/80 text-white/95 border border-white/20 backdrop-blur-xs">
                              {pricing.isDealExpired ? 'STANDARD PRICE' : 'BUNDLE SAVINGS'}
                            </span>
                          )}
                        </div>

                        {pricing.discountPercent > 0 && (
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-400 text-emerald-950 shrink-0">
                            {pricing.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-2.5 flex-grow flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-[#5b21b6]">
                            KDW CURATED SUITE
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Lifetime Access
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors line-clamp-1 leading-snug">
                          {bundle.title}
                        </h3>

                        <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-2">
                          {bundle.description || bundle.shortDescription || 'Complete operating foundation combining templates, blueprints, and assets.'}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-[#e2e8f0] flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-mono font-bold text-[#171325]">
                              ₹{Number(pricing.effectivePrice || 0).toLocaleString('en-IN')}
                            </span>
                            {pricing.originalPrice > pricing.effectivePrice && pricing.discount > 0 && (
                              <span className="text-xs font-mono text-slate-400 line-through">
                                ₹{Number(pricing.originalPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {pricing.isDealActive ? '⚡ Limited-Time Deal Price' : 'One-time bundle license'}
                          </span>
                        </div>

                        <span className="px-3 py-1.5 bg-[#5b21b6] group-hover:bg-[#4c1d95] text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors">
                          <span>View Bundle</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. CATEGORY DISCOVERY BAND                               */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#e2e8f0]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block mb-1">
                START WITH INTENTION
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#171325]">
                Find the leverage you need.
              </h2>
            </div>

            <Link
              to="/categories"
              className="text-xs font-semibold font-sans text-[#5b21b6] hover:text-[#6d28d9] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto group"
            >
              <span>Browse categories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Category Grid with Little Spacing (Square Edges) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.seq}
                to={cat.href}
                className="group flex flex-col justify-between overflow-hidden relative bg-white border border-[#e2e8f0] hover:border-[#5b21b6] transition-all duration-300 select-none shadow-2xs hover:shadow-xl"
              >
                {/* Category Image Cover (Square Edges, Dark Vignette) */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-900 select-none">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#3b0764] via-[#4c1d95] to-[#0f172a]" />
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40 pointer-events-none" />

                  {/* Seq & Featured Badge */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-white bg-black/80 px-2 py-0.5 border border-white/20 inline-block backdrop-blur-xs">
                      {cat.seq}
                    </span>
                    {cat.featured && (
                      <span className="text-[9px] font-mono font-bold bg-amber-400 text-amber-950 px-2 py-0.5 border border-amber-300 shadow-xs">
                        ★ FEATURED
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Details */}
                <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow space-y-2 bg-white">
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#5b21b6] block mb-1">
                      COLLECTION
                    </span>
                    <h3 className="text-base font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] font-mono font-bold text-[#5b21b6] group-hover:text-[#4c1d95]">
                    <span>Explore Hub</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. KDW JOURNAL / EDITORIAL DISCOVERY BAND                */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-20 bg-[#faf9f7] border-b border-[#e2e8f0]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#ddd6fe] bg-[#ede9fe]/60 text-[#5b21b6] text-[10px] font-bold font-sans tracking-[0.18em] uppercase mb-2">
                <Sparkles className="w-3 h-3 text-[#7c3aed]" />
                <span>KDW JOURNAL</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#171325]">
                Ideas, guides, and practical insights.
              </h2>
            </div>

            <Link
              to="/blog"
              className="text-xs font-semibold font-sans text-[#5b21b6] hover:text-[#6d28d9] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto group"
            >
              <span>Explore the KDW Journal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {journalArticles.length > 0 ? (
              journalArticles.slice(0, 3).map((article) => (
                <article
                  key={article.id || article.slug}
                  className="kdw-card bg-white rounded-3xl overflow-hidden flex flex-col justify-between hover:border-[#5b21b6]/40 transition-all duration-300 group shadow-2xs"
                >
                  <Link
                    to={`/blog/${article.slug}`}
                    className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 block select-none"
                  >
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt={article.title}
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
                        {article.category?.name || article.categoryName || 'Guide'}
                      </span>
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{article.readingTimeMinutes || 6} min read</span>
                      </div>
                      <Link to={`/blog/${article.slug}`}>
                        <h3 className="text-lg font-serif font-bold text-[#171325] group-hover:text-[#5b21b6] transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-400">By {article.authorName || 'KDW Team'}</span>
                      <Link
                        to={`/blog/${article.slug}`}
                        className="font-bold text-[#5b21b6] hover:text-[#6d28d9] inline-flex items-center gap-1 group/btn"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-xs text-slate-400">
                Editorial publications loading...
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. FREQUENTLY ASKED QUESTIONS (PRE-FOOTER FAQ SECTION)   */}
      {/* ======================================================== */}
      <HomeFAQ />

    </div>
  );
}
