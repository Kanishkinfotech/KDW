import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Sparkles, ArrowRight, ShieldCheck, Download, Code, Layout, 
  Palette, Zap, ChevronLeft, ChevronRight, Pause, Play, Star, Layers, Box
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/currency';

export default function HeroBanner() {
  const { products, categories, bundles } = useStore();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // --- Data Extraction safely ---
  const featuredProducts = products?.filter((p: any) => p.featured) || products?.slice(0, 4) || [];
  const featuredProduct = featuredProducts[0] || null;
  const templateProduct = products?.find((p: any) => p.category?.toLowerCase().includes('template')) || featuredProducts[1] || featuredProducts[0];
  const bundle = bundles?.[0];
  
  const dashboardCat = categories?.find((c: any) => c.name.toLowerCase().includes('dashboard')) || categories?.[0];
  const uiKitCat = categories?.find((c: any) => c.name.toLowerCase().includes('ui kit') || c.name.toLowerCase().includes('ui')) || categories?.[1];
  const businessCat = categories?.find((c: any) => c.name.toLowerCase().includes('business') || c.name.toLowerCase().includes('portfolio')) || categories?.[2];

  const stripCategories = categories?.slice(0, 6) || [];

  const handleCardClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  // --- Auto Play Logic ---
  useEffect(() => {
    if (isHovered || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => clearInterval(timer);
  }, [currentSlide, isHovered, isPaused]);

  // --- Navigation Controls ---
  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev === 3 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev === 0 ? 3 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  // --- Swipe / Drag Handling ---
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  // --- Framer Motion Variants ---
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const transitionConfig = prefersReducedMotion ? { duration: 0 } : {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  // --- Slides Definitions ---

  const Slide1 = () => (
    <div className="w-full h-full lg:grid lg:grid-cols-2 gap-12 items-center flex flex-col justify-center px-6 max-w-7xl mx-auto py-12 lg:py-0">
      <div className="flex flex-col items-start text-left z-10 w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm mb-6 mt-16 lg:mt-0">
          <Sparkles size={16} className="text-blue-600" />
          <span className="text-slate-700 text-sm font-semibold tracking-wide">Introducing Kanishk Digital World 2.0</span>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
          Build Digital
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-2">Masterpieces.</span>
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-lg">
          Discover premium website templates, UI kits, dashboards, and digital resources crafted for modern creators, startups, and businesses.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-900 font-semibold"><Code size={18} className="text-blue-600" /><span>Premium Quality</span></div>
            <span className="text-xs text-slate-500">Handcrafted with precision</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-900 font-semibold"><ShieldCheck size={18} className="text-purple-600" /><span>Secure & Reliable</span></div>
            <span className="text-xs text-slate-500">Trusted digital marketplace</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-900 font-semibold"><Download size={18} className="text-green-600" /><span>Easy Access</span></div>
            <span className="text-xs text-slate-500">Access your purchased digital products</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/categories/all-products" className="group px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            Explore Marketplace <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
      {/* Visual */}
      <div className="relative h-full min-h-[400px] lg:min-h-[600px] w-full hidden md:block perspective-[1200px] pt-10">
        <motion.div
          initial={{ opacity: 0, rotateY: 10, z: -100 }}
          animate={{ opacity: 1, rotateY: 0, z: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onClick={(e) => featuredProduct && handleCardClick(e, featuredProduct.canonicalUrl || `/product/${featuredProduct.slug || featuredProduct.id}`)}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-full lg:w-[110%] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-20 transition-all ${featuredProduct ? 'cursor-pointer hover:shadow-blue-900/10 hover:border-blue-300' : ''}`}
        >
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
            <div className="mx-auto bg-white px-4 py-1 rounded-md text-xs text-slate-400 font-mono shadow-sm truncate max-w-[200px]">kdw.com/resources</div>
          </div>
          <div className="relative aspect-[16/10] bg-slate-50">
            {featuredProduct ? (
              <>
                <img src={featuredProduct.image || featuredProduct.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80"} alt={`${featuredProduct.name} preview`} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-6 pt-16">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{featuredProduct.category}</p>
                      <h3 className="text-white font-bold text-xl line-clamp-1">{featuredProduct.name}</h3>
                    </div>
                    {featuredProduct.price && (
                      <div className="bg-white text-slate-900 font-bold px-3 py-1.5 rounded-lg shadow-sm">{formatCurrency(featuredProduct.price)}</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Layout size={48} className="mb-4 opacity-50" />
                <p className="font-medium">Premium Digital Resources</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const Slide2 = () => (
    <div className="w-full h-full lg:grid lg:grid-cols-2 gap-12 items-center flex flex-col justify-center px-6 max-w-7xl mx-auto py-12 lg:py-0">
      <div className="flex flex-col items-start text-left z-10 w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm mb-6 mt-16 lg:mt-0">
          <Layout size={16} className="text-pink-600" />
          <span className="text-slate-700 text-sm font-semibold tracking-wide">Premium Templates</span>
        </div>
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
          Create Websites <br />
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 pb-2">That Stand Out.</span>
        </h2>
        <p className="text-lg text-slate-600 mb-8 max-w-lg">
          Explore professionally designed digital templates for modern businesses, startups, creators, and professionals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/categories/all-products?category=templates" className="group px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            Explore Templates <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
      {/* Visual */}
      <div className="relative h-full min-h-[400px] lg:min-h-[600px] w-full hidden md:flex items-center justify-center perspective-[1200px]">
        <motion.div
          animate={prefersReducedMotion ? {} : { y: [-10, 10, -10], rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-20 w-[90%] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-200"
        >
          {templateProduct ? (
             <div className="cursor-pointer" onClick={(e) => handleCardClick(e, templateProduct.canonicalUrl || `/product/${templateProduct.slug || templateProduct.id}`)}>
               <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between">
                 <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300"></div><div className="w-3 h-3 rounded-full bg-slate-300"></div></div>
                 <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">{templateProduct.category || "Template"}</div>
               </div>
               <div className="aspect-[4/3] bg-slate-50 relative group">
                 <img src={templateProduct.image || templateProduct.thumbnail} alt={templateProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                    <h3 className="text-white font-bold text-2xl mb-1">{templateProduct.name}</h3>
                    <p className="text-white/80 font-medium">{formatCurrency(templateProduct.price)}</p>
                 </div>
               </div>
             </div>
          ) : (
             <div className="aspect-[4/3] flex items-center justify-center bg-slate-100 text-slate-400">Premium Digital Resources</div>
          )}
        </motion.div>
        {featuredProducts[2] && (
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [10, -10, 10], rotate: [2, -2, 2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-5 bottom-[10%] w-48 bg-white p-3 rounded-2xl shadow-xl z-30 border border-slate-100 cursor-pointer"
            onClick={(e) => handleCardClick(e, featuredProducts[2].canonicalUrl || `/product/${featuredProducts[2].slug || featuredProducts[2].id}`)}
          >
             <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden mb-2">
               <img src={featuredProducts[2].image || featuredProducts[2].thumbnail} alt="preview" className="w-full h-full object-cover" />
             </div>
             <p className="text-sm font-bold text-slate-800 line-clamp-1">{featuredProducts[2].name}</p>
          </motion.div>
        )}
      </div>
    </div>
  );

  const Slide3 = () => (
    <div className="w-full h-full lg:grid lg:grid-cols-2 gap-12 items-center flex flex-col justify-center px-6 max-w-7xl mx-auto py-12 lg:py-0">
      <div className="flex flex-col items-start text-left z-10 w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm mb-6 mt-16 lg:mt-0">
          <Box size={16} className="text-emerald-600" />
          <span className="text-slate-700 text-sm font-semibold tracking-wide">Value Collections</span>
        </div>
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
          More Value. <br />
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 pb-2">One Powerful Bundle.</span>
        </h2>
        <p className="text-lg text-slate-600 mb-8 max-w-lg">
          Explore curated digital resources grouped together for better value and convenience. Perfect for agencies and prolific creators.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {bundles && bundles.length > 0 ? (
            <Link to="/bundles" className="group px-8 py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
              Explore Bundles <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link to="/categories/all-products" className="group px-8 py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
              Explore Collections <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Visual */}
      <div className="relative h-full min-h-[400px] lg:min-h-[600px] w-full hidden md:flex items-center justify-center">
        {bundle ? (
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-teal-400 rounded-3xl blur-[80px] opacity-20"></div>
            <motion.div 
              animate={prefersReducedMotion ? {} : { y: [-10, 10, -10] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 cursor-pointer"
              onClick={(e) => handleCardClick(e, `/bundles/${bundle.id}`)}
            >
              <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-6 relative">
                <img src={bundle.image || bundle.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80"} alt={bundle.name} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider">Bundle</div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{bundle.name}</h3>
              <p className="text-emerald-600 font-extrabold text-xl">{formatCurrency(bundle.price)}</p>
            </motion.div>
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            <motion.div 
              animate={prefersReducedMotion ? {} : { y: [-10, 10, -10] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100"
            >
              <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                 {featuredProduct ? <img src={featuredProduct.image} alt="fallback" className="w-full h-full object-cover opacity-80" /> : <Box size={48} className="text-slate-300" />}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Curated Digital Resources</h3>
              <p className="text-slate-500 text-sm">Discover top-tier digital assets bundled or selected for quality and precision.</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );

  const Slide4 = () => (
    <div className="w-full h-full lg:grid lg:grid-cols-2 gap-12 items-center flex flex-col justify-center px-6 max-w-7xl mx-auto py-12 lg:py-0">
      <div className="flex flex-col items-start text-left z-10 w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm mb-6 mt-16 lg:mt-0">
          <Layers size={16} className="text-indigo-600" />
          <span className="text-slate-700 text-sm font-semibold tracking-wide">Extensive Catalog</span>
        </div>
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
          Everything You Need <br />
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 pb-2">to Build Better.</span>
        </h2>
        <p className="text-lg text-slate-600 mb-8 max-w-lg">
          Explore dashboards, UI kits, business resources, creative templates, and other premium digital products.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/categories/all-products" className="group px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            Explore Resources <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
      {/* Visual */}
      <div className="relative h-full min-h-[400px] lg:min-h-[600px] w-full hidden md:block perspective-[1200px] pt-10">
        <div className="absolute inset-0 flex items-center justify-center">
          {dashboardCat && (
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [-5, 5, -5], rotate: [-2, -2, -2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              onClick={(e) => handleCardClick(e, `/shop?category=${encodeURIComponent(dashboardCat.name)}`)}
              className="absolute top-[10%] left-[10%] bg-white p-5 rounded-2xl shadow-xl border border-slate-100 z-20 w-56 cursor-pointer hover:shadow-2xl transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Layout size={24} /></div>
              <h4 className="font-bold text-lg text-slate-900 line-clamp-1">{dashboardCat.name}</h4>
              <p className="text-slate-500 text-sm">{dashboardCat.count !== undefined ? `${dashboardCat.count} Products` : 'Explore assets'}</p>
            </motion.div>
          )}

          {uiKitCat && (
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [5, -5, 5], rotate: [3, 3, 3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              onClick={(e) => handleCardClick(e, `/shop?category=${encodeURIComponent(uiKitCat.name)}`)}
              className="absolute top-[30%] right-[10%] bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 z-30 w-56 cursor-pointer hover:shadow-purple-500/20 transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Palette size={24} /></div>
              <h4 className="font-bold text-lg text-slate-900 line-clamp-1">{uiKitCat.name}</h4>
              <p className="text-slate-500 text-sm">{uiKitCat.count !== undefined ? `${uiKitCat.count} Products` : 'Explore assets'}</p>
            </motion.div>
          )}

          {businessCat && (
            <motion.div
              animate={prefersReducedMotion ? {} : { y: [-8, 8, -8], rotate: [-1, -1, -1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              onClick={(e) => handleCardClick(e, `/shop?category=${encodeURIComponent(businessCat.name)}`)}
              className="absolute bottom-[20%] left-[25%] bg-slate-900 p-5 rounded-2xl shadow-2xl border border-slate-800 z-10 w-56 text-white cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-4"><Zap size={24} /></div>
              <h4 className="font-bold text-lg line-clamp-1">{businessCat.name}</h4>
              <p className="text-white/70 text-sm">{businessCat.count !== undefined ? `${businessCat.count} Products` : 'Explore assets'}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  const slides = [<Slide1 key="1" />, <Slide2 key="2" />, <Slide3 key="3" />, <Slide4 key="4" />];

  return (
    <div 
      className="relative min-h-[90vh] py-12 lg:py-0 bg-slate-50 flex flex-col justify-center overflow-x-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply" />
      </div>

      {/* Main Carousel Viewport */}
      <div className="relative w-full max-w-7xl mx-auto flex-1 h-full flex overflow-x-hidden min-h-[600px] lg:min-h-[700px]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transitionConfig}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold || offset.x < -100) {
                nextSlide();
              } else if (swipe > swipeConfidenceThreshold || offset.x > 100) {
                prevSlide();
              }
            }}
            className="absolute inset-0 w-full h-full outline-none touch-pan-y"
            aria-live="polite"
          >
            {slides[currentSlide]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-x-4 lg:inset-x-10 top-1/2 -translate-y-1/2 flex justify-between z-40 pointer-events-none">
        <button 
          onClick={prevSlide}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white transition-all opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-auto focus:opacity-100 focus:translate-x-0"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white transition-all opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-auto focus:opacity-100 focus:translate-x-0"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Indicators and Pause Control */}
      <div className="absolute bottom-28 lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
        <div className="flex gap-2 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-200 shadow-sm">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                currentSlide === index ? 'bg-blue-600 w-8' : 'bg-slate-300 w-2.5 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={currentSlide === index ? "true" : "false"}
            />
          ))}
        </div>

      </div>

      {/* Interactive Category Strip */}
      {stripCategories && stripCategories.length > 0 && (
        <div className="relative z-30 w-full border-t border-slate-200 bg-white/70 backdrop-blur-md py-4 mt-auto overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-start md:justify-center gap-x-8 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              {stripCategories.map((cat: any) => (
                <Link
                  key={cat.id || cat.name}
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="flex items-center gap-2 group whitespace-nowrap"
                >
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </span>
                  {cat.count !== undefined && (
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      {cat.count}
                    </span>
                  )}
                </Link>
              ))}
              {bundles && bundles.length > 0 && (
                <Link
                  to="/bundles"
                  className="flex items-center gap-2 group whitespace-nowrap"
                >
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors">Bundles</span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">Packs</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
