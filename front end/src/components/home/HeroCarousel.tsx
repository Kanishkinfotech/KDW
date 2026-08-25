import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SafeImage from '../ui/SafeImage';

interface SlideConfig {
  id: string;
  eyebrow: string;
  headline: string;
  description: string;
  primaryCta: string;
  primaryLink: string;
  secondaryCta: string;
  secondaryLink: string;
  categories: string[];
}

const slides: SlideConfig[] = [
  {
    id: 'marketplace',
    eyebrow: 'Premium Digital Products',
    headline: 'Everything Digital. One Place.',
    description: 'Discover practical templates, AI tools, business resources and creative assets built to help you get more done.',
    primaryCta: 'Explore Products →',
    primaryLink: '/categories/all-products',
    secondaryCta: 'View Best Sellers',
    secondaryLink: '/best-sellers',
    categories: [] // Uses general best sellers / featured
  },
  {
    id: 'templates',
    eyebrow: 'Templates & Business Resources',
    headline: 'Build Faster With Ready-Made Templates.',
    description: 'Professional website kits, business templates and ready-to-use resources that save hours of work.',
    primaryCta: 'Explore Templates →',
    primaryLink: '/categories/templates',
    secondaryCta: 'View Business Assets',
    secondaryLink: '/categories/business-templates',
    categories: ['Templates', 'Business Templates', 'Website Kits']
  },
  {
    id: 'ai',
    eyebrow: 'AI & Automation',
    headline: 'Work Smarter With AI & Automation.',
    description: 'Practical AI resources and automation tools designed to reduce repetitive work and speed up your workflow.',
    primaryCta: 'Explore AI Tools →',
    primaryLink: '/categories/automation',
    secondaryCta: 'View Best Sellers',
    secondaryLink: '/best-sellers',
    categories: ['AI Prompt Bundles', 'Automation']
  },
  {
    id: 'creative',
    eyebrow: 'Creative & Social Media',
    headline: 'Create Better. Launch Faster.',
    description: 'Premium social media resources, creative assets and digital kits for creators and businesses.',
    primaryCta: 'Explore Creative Assets →',
    primaryLink: '/categories/social-media-bundles',
    secondaryCta: 'View Graphics',
    secondaryLink: '/categories/graphics',
    categories: ['Social Media Bundles', 'Graphics', 'Agency Kits']
  }
];

export default function HeroCarousel() {
  const { products } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  // Navigation Logic
  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentSlide((prev) => (prev + newDirection + slides.length) % slides.length);
  }, []);

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = offset.x;
    if (swipe < -50) {
      paginate(1);
    } else if (swipe > 50) {
      paginate(-1);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  // Auto-play interval
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, paginate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate]);

  // Product Selection Logic
  const getSlideProducts = (slide: SlideConfig) => {
    let matchedProducts: any[] = [];
    
    // 1. Find matching category products
    if (slide.categories.length > 0) {
      matchedProducts = products.filter(p => {
        const pCategory = typeof p.category === 'object' ? (p.category as any).name : p.category;
        return slide.categories.includes(pCategory);
      });
    }

    // 2. Filter to active & prefer featured
    matchedProducts = matchedProducts.filter(p => p.price > 0 && p.coverImage);
    matchedProducts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    // 3. Fallbacks if insufficient products
    if (matchedProducts.length < 3) {
      const bestSellers = [...products]
        .filter(p => p.price > 0 && p.coverImage)
        .sort((a, b) => (b.totalUnitsSold || 0) - (a.totalUnitsSold || 0));
      
      const needed = 3 - matchedProducts.length;
      const additional = bestSellers.filter(p => !matchedProducts.find(m => m.id === p.id)).slice(0, needed);
      matchedProducts = [...matchedProducts, ...additional];
    }

    return matchedProducts.slice(0, 3);
  };

  const slideProducts = getSlideProducts(slides[currentSlide]);
  const activeSlide = slides[currentSlide];

  // Animation variants
  const variants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: prefersReducedMotion ? 0 : dir < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section 
      className="relative bg-[#F8FAFC] border-b border-slate-200 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      aria-roledescription="carousel"
      aria-label="Featured Products"
    >
      {/* Background Enhancements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24 min-h-[500px] lg:min-h-[560px] flex items-center relative z-10">
        
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-8 cursor-grab active:cursor-grabbing"
          >
            {/* LEFT 45% - Text Content */}
            <div className="w-full lg:w-[45%] flex flex-col items-start text-left z-20">
              <span className="text-xs font-black tracking-widest text-primary uppercase mb-4 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                {activeSlide.eyebrow}
              </span>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                {activeSlide.headline}
              </h2>
              
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-lg leading-relaxed font-medium">
                {activeSlide.description}
              </p>
              
              {currentSlide === 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link 
                    to={activeSlide.primaryLink}
                    className="w-full sm:w-auto bg-primary text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                  >
                    {activeSlide.primaryCta}
                  </Link>
                </div>
              )}

            </div>

            {/* RIGHT 55% - Product Collage */}
            <div className="w-full lg:w-[55%] relative h-[350px] sm:h-[400px] md:h-[450px] flex items-center justify-center lg:justify-end">
              {slideProducts.length >= 3 && (
                <div className="relative w-full max-w-[500px] h-full flex items-center justify-center">
                  
                  {/* Product 3 (Bottom Right/Back) */}
                  <button 
                    onClick={() => navigate(`/product/${slideProducts[2].id}`)}
                    className="absolute bottom-[5%] right-[0%] w-[60%] bg-white p-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 rotate-6 hover:rotate-0 hover:z-30 hover:-translate-y-2 transition-all duration-500 group text-left flex flex-col"
                    aria-label={`View ${slideProducts[2].title}`}
                  >
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-50">
                      <SafeImage 
                        src={slideProducts[2].coverImage || ''} 
                        alt=""
                        fallbackType="product"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="mt-2 px-1 w-full">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{slideProducts[2].title}</h3>
                      <p className="text-[10px] font-black text-primary">₹{slideProducts[2].price}</p>
                    </div>
                  </button>

                  {/* Product 2 (Top Left/Back) */}
                  <button 
                    onClick={() => navigate(`/product/${slideProducts[1].id}`)}
                    className="absolute top-[5%] left-[0%] w-[65%] bg-white p-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 -rotate-6 hover:rotate-0 hover:z-30 hover:-translate-y-2 transition-all duration-500 group text-left flex flex-col"
                    aria-label={`View ${slideProducts[1].title}`}
                  >
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-50">
                      <SafeImage 
                        src={slideProducts[1].coverImage || ''} 
                        alt=""
                        fallbackType="product"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="mt-2 px-1 w-full">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{slideProducts[1].title}</h3>
                      <p className="text-[10px] font-black text-primary">₹{slideProducts[1].price}</p>
                    </div>
                  </button>

                  {/* Product 1 (Primary Center Front) */}
                  <button 
                    onClick={() => navigate(`/product/${slideProducts[0].id}`)}
                    className="absolute top-[20%] left-[15%] w-[75%] bg-white p-2.5 rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.15)] border border-white z-20 hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 group text-left flex flex-col"
                    aria-label={`View ${slideProducts[0].title}`}
                  >
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 relative">
                      <SafeImage 
                        src={slideProducts[0].coverImage || ''} 
                        alt={slideProducts[0].title || ''}
                        fallbackType="product"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-1.5">
                          Preview <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 px-1 w-full flex justify-between items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{slideProducts[0].title}</h3>
                      <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-black shrink-0">
                        ₹{slideProducts[0].price}
                      </div>
                    </div>
                  </button>

                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-30">
          <button 
            onClick={() => paginate(-1)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
            {slides.map((_, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={currentSlide === index}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  currentSlide === index 
                    ? 'w-8 bg-primary' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={() => paginate(1)}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
      
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {currentSlide + 1} of {slides.length} — {activeSlide.headline}
      </div>
    </section>
  );
}
