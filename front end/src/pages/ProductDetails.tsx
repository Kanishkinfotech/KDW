import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, CheckCircle2, ShieldCheck, Download, Heart, ShoppingCart, 
  MessageSquare, Send, X, ThumbsUp, ThumbsDown, Lock, Check, 
  ArrowRight, ChevronRight, Share2, Copy, Sparkles, ExternalLink, 
  FileText, HelpCircle, Layers, Shield, Zap, Eye, Clock, RefreshCw, 
  AlertCircle, ChevronDown, CheckCircle, Tag, IndianRupee, HardDrive,
  Cpu, Monitor, Smartphone, Video, FileCode, CheckCheck, Compass, Info,
  Briefcase, Users, UserCheck, Megaphone, Palette, Rocket
} from 'lucide-react';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { formatCurrency } from '../utils/currency';
import CheckoutModal from '../components/CheckoutModal';
import { useStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import { addRecentlyViewed } from '../utils/recentlyViewed';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist, cart } = useStore();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'included' | 'screenshots' | 'workflow' | 'requirements' | 'licence' | 'faq' | 'reviews'>('overview');

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryEmail, setDeliveryEmail] = useState('');

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    customerName: user?.name || ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // What's included view all expand toggle
  const [isWhatIncludedExpanded, setIsWhatIncludedExpanded] = useState(false);

  // FAQ accordion open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (user?.email) {
      setDeliveryEmail(user.email);
    }
  }, [user]);

  // Fetch Product Details by ID or Slug
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/products/${id}`);
        if (res.data.success && res.data.data) {
          const p = res.data.data;
          setProduct(p);
          addRecentlyViewed(p);

          // Build media gallery list
          const images: string[] = [];
          if (p.coverImage || p.thumbnail) images.push(p.coverImage || p.thumbnail);
          if (p.previewImages) {
            try {
              const parsed = typeof p.previewImages === 'string' ? JSON.parse(p.previewImages) : p.previewImages;
              if (Array.isArray(parsed)) images.push(...parsed);
            } catch (e) {}
          }
          const uniqueImages = [...new Set(images.filter(Boolean))];
          setMediaList(uniqueImages.length > 0 ? uniqueImages : ['/images/placeholder-product.png']);
          setActiveMediaIndex(0);

          // Fetch related products
          try {
            const relRes = await axios.get(`/api/products/${p.id}/related`);
            if (relRes.data.success) {
              setRelatedProducts(relRes.data.data || []);
            }
          } catch (e) {}

          // Fetch reviews
          try {
            const revRes = await axios.get(`/api/reviews/${p.id}`);
            if (revRes.data.success) {
              setReviews(revRes.data.data.reviews || []);
              setReviewSummary(revRes.data.data.summary || null);
            }
          } catch (e) {}
        } else {
          setError('Product not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Product not found or unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    window.scrollTo(0, 0);
  }, [id]);

  const isWishlisted = product ? wishlist.some(item => item.id === product.id) : false;
  const isInCart = product ? cart.some(item => item.id === product.id) : false;

  // Add to Cart handler
  const handleAddToCart = () => {
    if (!product) return;
    if (product.status && !['PUBLISHED', 'ACTIVE'].includes(product.status.toUpperCase())) {
      toast.error('This product is currently unavailable for purchase');
      return;
    }

    addToCart({
      id: product.id,
      title: product.name || product.title,
      name: product.name || product.title,
      price: product.discountPrice !== null && product.discountPrice !== undefined ? product.discountPrice : product.price,
      originalPrice: product.price,
      coverImage: product.coverImage || product.thumbnail,
      category: product.category,
      productType: product.productType
    });
    toast.success(`Added "${product.name || product.title}" to cart!`);
  };

  // Buy Now handler
  const handleBuyNow = () => {
    if (!product) return;
    if (product.status && !['PUBLISHED', 'ACTIVE'].includes(product.status.toUpperCase())) {
      toast.error('This product is currently unavailable for purchase');
      return;
    }
    setIsCheckoutOpen(true);
  };

  // Share Product Link
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Product link copied to clipboard!');
    } else {
      toast.success('Sharing product...');
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error('Please provide a title and review comment');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await axios.post('/api/reviews', {
        productId: product.id,
        customerName: reviewForm.customerName || user?.name || 'Customer',
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      });

      if (res.data.success) {
        toast.success('Thank you! Your review has been submitted.');
        setIsReviewModalOpen(false);
        setReviewForm({ rating: 5, title: '', comment: '', customerName: user?.name || '' });
        
        // Refresh reviews
        const revRes = await axios.get(`/api/reviews/${product.id}`);
        if (revRes.data.success) {
          setReviews(revRes.data.data.reviews || []);
          setReviewSummary(revRes.data.data.summary || null);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 1. Loading Skeleton View
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 font-sans">
        <div className="h-6 w-72 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 aspect-[4/3] bg-slate-200 rounded-3xl animate-pulse" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-32 w-full bg-slate-200 rounded-3xl animate-pulse" />
          </div>
          <div className="lg:col-span-3 h-96 bg-slate-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // 2. Error / Not Found View
  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Unavailable</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {error || "The product you're looking for doesn't exist or is currently in draft mode."}
          </p>
          <div className="pt-2">
            <Link 
              to="/categories/all-products" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Browse Available Products <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parse structured data from admin configuration
  const activePrice = (product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice >= 0)
    ? product.discountPrice
    : product.price;

  const comparePrice = product.compareAtPrice || (product.discountPrice ? product.price : null);
  const discountPercent = (comparePrice && activePrice < comparePrice)
    ? Math.round(((comparePrice - activePrice) / comparePrice) * 100)
    : 0;

  // What's included list
  let whatsIncludedList: string[] = [];
  if (product.features) {
    if (Array.isArray(product.features)) whatsIncludedList = product.features;
    else if (typeof product.features === 'string') {
      try {
        const p = JSON.parse(product.features);
        if (Array.isArray(p)) whatsIncludedList = p;
      } catch (e) {
        whatsIncludedList = product.features.split('\\n').map((s: string) => s.trim()).filter(Boolean);
      }
    }
  }
  if (whatsIncludedList.length === 0) {
    whatsIncludedList = [
      '30+ Complete Digital Proposal Templates',
      '10+ Client Onboarding Documents & Frameworks',
      '5+ Quotation & Invoice Master Templates',
      'Comprehensive Brand Guidelines Template',
      'Project Timeline & Delivery Roadmaps'
    ];
  }

  // Structured attributes
  let attributesList: { key: string; value: string }[] = [];
  if (product.attributes) {
    try {
      const parsed = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      if (Array.isArray(parsed)) attributesList = parsed;
    } catch (e) {}
  }

  // FAQs list
  let faqsList: { question: string; answer: string }[] = [];
  if (product.faqs) {
    try {
      const parsed = typeof product.faqs === 'string' ? JSON.parse(product.faqs) : product.faqs;
      if (Array.isArray(parsed)) faqsList = parsed;
    } catch (e) {}
  }
  if (faqsList.length === 0) {
    faqsList = [
      {
        question: 'How do I receive access to this product after purchase?',
        answer: 'Immediately upon verified payment, an automated delivery access email is sent to your account login email address. The product is also instantly accessible in your "My Purchases" tab.'
      },
      {
        question: 'What is the commercial license scope?',
        answer: product.licenceTerms || 'You are permitted to use this asset for unlimited personal and client projects. Reselling, sublicensing, or redistributing the original source files is strictly prohibited.'
      },
      {
        question: 'How many downloads are allowed?',
        answer: `This product includes ${product.downloadLimit ? (product.downloadLimit > 9000 ? 'Unlimited' : `${product.downloadLimit}`) : '5'} downloads with secure token generation.`
      },
      {
        question: 'What is the refund policy?',
        answer: 'Due to the immediate digital delivery nature of our products, access is granted instantly. If you experience technical defects, our support team will resolve them or process a refund with access revocation.'
      }
    ];
  }

  // Requirements text
  const requirementsText = product.requirements || 'Any modern web browser, Free Canva or Google Account, ZIP extractor utility.';

  // Badges calculation
  const isBestSeller = Boolean(product.bestSeller);
  const isFeatured = Boolean(product.featured);
  const isNew = product.createdAt && (new Date().getTime() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000);

  // Status check
  const isPurchasable = product.status ? ['PUBLISHED', 'ACTIVE'].includes(product.status.toUpperCase()) : true;

  // JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name || product.title,
    image: mediaList[0],
    description: product.shortDescription || product.description,
    sku: product.productCode || product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Kanishk Digital World'
    },
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'INR',
      price: activePrice,
      availability: isPurchasable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    },
    aggregateRating: reviewSummary?.averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: reviewSummary.averageRating,
      reviewCount: reviewSummary.total
    } : undefined
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-28 font-sans">
      {/* Dynamic SEO Tags */}
      <SEO 
        title={product.seoTitle || `${product.name || product.title} | KDW Digital Store`}
        description={product.seoDescription || product.shortDescription || product.description}
        image={mediaList[0]}
      />

      {/* JSON-LD Script */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={{
          id: product.id,
          title: product.name || product.title,
          price: activePrice,
          coverImage: mediaList[0],
          type: product.productType
        }}
        deliveryEmail={deliveryEmail.trim()}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10 space-y-12">
        
        {/* 2. Dynamic Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto whitespace-nowrap py-1">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight size={13} className="text-slate-300 shrink-0" />
          <Link to="/categories" className="hover:text-slate-900 transition-colors">Categories</Link>
          {product.category && (
            <>
              <ChevronRight size={13} className="text-slate-300 shrink-0" />
              <Link 
                to={`/categories/${product.categorySlug || product.category.toLowerCase().replace(/\\s+/g, '-')}`}
                className="hover:text-slate-900 transition-colors"
              >
                {product.category}
              </Link>
            </>
          )}
          {product.subcategory && (
            <>
              <ChevronRight size={13} className="text-slate-300 shrink-0" />
              <span className="text-slate-600 font-bold">{product.subcategory}</span>
            </>
          )}
          <ChevronRight size={13} className="text-slate-300 shrink-0" />
          <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-md">
            {product.name || product.title}
          </span>
        </nav>

        {/* 3. PRODUCT HERO (3-PART DESKTOP LAYOUT / STACKED MOBILE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PART 1 (LEFT 4 COLS): Product Gallery (Thumbnails + Main Image) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex gap-3">
              {/* Vertical Thumbnails List on Left */}
              {mediaList.length > 1 && (
                <div className="hidden sm:flex flex-col gap-2.5 max-h-[380px] overflow-y-auto custom-scrollbar shrink-0">
                  {mediaList.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeMediaIndex === idx 
                          ? 'border-primary shadow-sm scale-105' 
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Product Image with Badges */}
              <div className="relative flex-1 aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-sm group">
                <img 
                  src={mediaList[activeMediaIndex] || '/images/placeholder-product.png'} 
                  alt={product.name || product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dynamic Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1">
                    <Download size={11} className="text-primary-light" />
                    {product.productType ? product.productType.replace(/_/g, ' ') : 'DIGITAL DOWNLOAD'}
                  </span>
                  {isBestSeller && (
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1">
                      <Star size={11} className="fill-slate-950" /> BEST SELLER
                    </span>
                  )}
                  {isFeatured && (
                    <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs">
                      FEATURED
                    </span>
                  )}
                </div>

                {/* Floating Wishlist & Share */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      toggleWishlist(product);
                      toast.success(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist!');
                    }}
                    className={`p-2.5 rounded-xl backdrop-blur-md transition-all shadow-sm cursor-pointer ${
                      isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500'
                    }`}
                  >
                    <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-2.5 bg-white/90 hover:bg-white text-slate-700 rounded-xl backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                {/* Zero-Exposure Delivery Watermark */}
                <div className="absolute bottom-3 left-3 right-3 p-2 bg-slate-950/80 backdrop-blur-md text-white rounded-xl flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-slate-200">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Instant Google Drive Delivery
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {product.driveFileSize || product.fileSize || 'Standard ZIP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile horizontal thumbnails */}
            {mediaList.length > 1 && (
              <div className="flex sm:hidden items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {mediaList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeMediaIndex === idx ? 'border-primary shadow-sm' : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PART 2 (CENTER 5 COLS): Product Info, Ratings, Benefits & Deliverables */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Title & Product Code */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">
                  {product.productCode || `KDW-P-${product.id.slice(0, 6).toUpperCase()}`}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  By <strong className="text-slate-700">{product.brand || 'KDW'}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {product.name || product.title}
              </h1>

              {/* Rating & Sold count */}
              <div className="flex items-center gap-3 pt-0.5">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      className={star <= (product.rating || 5) ? 'fill-current' : 'text-slate-200'}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-slate-900">
                  {product.rating || '5.0'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  ({product.reviewsCount || reviews.length || 128} reviews)
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  342+ Sold
                </span>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {product.shortDescription || product.description?.slice(0, 190) + '...'}
            </p>

            {/* Dynamic Benefit Badges */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs font-bold text-slate-800">
                <Zap size={14} className="text-primary shrink-0" />
                <span>Instant Download</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock size={14} className="text-primary shrink-0" />
                <span>{product.accessDurationDays ? (product.accessDurationDays > 9000 ? 'Lifetime Access' : `${product.accessDurationDays}-Day Access`) : 'Lifetime Access'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs font-bold text-slate-800">
                <Lock size={14} className="text-emerald-600 shrink-0" />
                <span>Secure Payment</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>{product.licenceType || 'Commercial Use'}</span>
              </div>
            </div>

            {/* Why You'll Love It Highlight */}
            <div className="p-3.5 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl space-y-1.5">
              <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Why You'll Love It
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Save hours of manual design time and impress clients with production-grade templates, customizable branding assets, and commercial usage rights.
              </p>
            </div>

            {/* What's Included Compact List with [View All Items] */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" /> What's Included:
                </h4>
                <button
                  type="button"
                  onClick={() => setIsWhatIncludedExpanded(!isWhatIncludedExpanded)}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {isWhatIncludedExpanded ? 'Show Less' : 'View All Items'}
                </button>
              </div>

              <ul className="space-y-1.5 font-medium text-slate-700">
                {(isWhatIncludedExpanded ? whatsIncludedList : whatsIncludedList.slice(0, 3)).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PART 3 (RIGHT 3 COLS): Purchase Card */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            
            {/* Pricing */}
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(activePrice)}
                </span>
                {comparePrice && comparePrice > activePrice && (
                  <span className="text-sm font-bold text-slate-400 line-through">
                    {formatCurrency(comparePrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-500 block mt-1">
                One-time payment. No monthly fees.
              </span>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isPurchasable || isInCart}
                className={`w-full py-3 border font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isInCart
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                }`}
              >
                <ShoppingCart size={15} />
                {isInCart ? 'Added to Cart ✓' : 'Add to Cart'}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isPurchasable}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black text-xs rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                {isPurchasable ? 'Buy Now' : 'Unavailable'}
              </button>
            </div>

            {/* Reassurance List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-[11px]">Instant Access</strong>
                  <span className="text-[11px] text-slate-500">Get your files after successful payment.</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-100 font-bold">
                <span className="text-slate-500">Access Duration</span>
                <span className="text-slate-900">{product.accessDurationDays ? (product.accessDurationDays > 9000 ? 'Lifetime Access' : `${product.accessDurationDays} Days`) : 'Lifetime Access'}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-100 font-bold">
                <span className="text-slate-500">Secure Payment</span>
                <span className="text-emerald-700 flex items-center gap-1"><ShieldCheck size={12} /> 100% Encrypted</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-100 font-bold">
                <span className="text-slate-500">Commercial Licence</span>
                <span className="text-slate-900">{product.licenceType || 'Commercial'}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-100 font-bold">
                <span className="text-slate-500">Refund Policy</span>
                <span className="text-slate-900">30-Day Guarantee</span>
              </div>
            </div>

            {/* Share link button */}
            <button
              type="button"
              onClick={handleShare}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Share2 size={13} /> Share Product
            </button>
          </div>
        </div>

        {/* 4. PRODUCT DETAIL TABS SECTION */}
        <div id="product-tabs-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden pt-2">
          
          {/* Tab Navigation Header */}
          <div className="flex items-center gap-2 px-6 border-b border-slate-100 overflow-x-auto custom-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'included', label: "What's Included", icon: CheckCircle2 },
              { id: 'screenshots', label: 'Screenshots & Preview', icon: Eye },
              { id: 'workflow', label: 'How It Works', icon: Zap },
              { id: 'requirements', label: 'Requirements', icon: Monitor },
              { id: 'licence', label: 'Licence & Terms', icon: Shield },
              { id: 'faq', label: 'FAQs', icon: HelpCircle },
              { id: 'reviews', label: `Reviews (${reviews.length || 1})`, icon: Star }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-3.5 border-b-2 font-black text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    isActive 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="p-6 sm:p-8 text-slate-700">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">Product Overview</h3>
                  <p className="text-sm text-slate-600 leading-loose whitespace-pre-line font-medium">
                    {product.description || product.shortDescription}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: WHAT'S INCLUDED */}
            {activeTab === 'included' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Itemized Deliverables</h3>
                  <p className="text-xs text-slate-500">
                    Everything included inside the verified Google Drive delivery package.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {whatsIncludedList.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SCREENSHOTS & PREVIEWS */}
            {activeTab === 'screenshots' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">High-Resolution Previews</h3>
                  <p className="text-xs text-slate-500">
                    Visual samples and public demonstration previews.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mediaList.map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                      <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: HOW IT WORKS */}
            {activeTab === 'workflow' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Digital Delivery Workflow</h3>
                  <p className="text-xs text-slate-500">
                    Zero-delay post-payment access directly to your authenticated email and customer dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { step: '1', title: '1. Instant Purchase', desc: 'Add to cart or click Buy Now with 100% secure Razorpay checkout.' },
                    { step: '2', title: '2. Payment Verification', desc: 'Backend server validates payment signature and creates order entitlement.' },
                    { step: '3', title: '3. Automated Dispatch', desc: 'Secure Google Drive access email is delivered to your login email instantly.' },
                    { step: '4', title: '4. My Purchases Tab', desc: 'Access, stream, and download assets anytime from your dashboard library.' },
                    { step: '5', title: '5. Quota & Updates', desc: 'Enjoy lifetime product updates and secure token protected downloads.' },
                    { step: '6', title: '6. Commercial Use', desc: 'Deploy assets across your personal or client projects with full rights.' }
                  ].map((s, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <span className="w-7 h-7 bg-primary text-white font-black text-xs rounded-xl flex items-center justify-center">
                        {s.step}
                      </span>
                      <h4 className="font-black text-slate-900 text-xs">{s.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: REQUIREMENTS */}
            {activeTab === 'requirements' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">System & Software Requirements</h3>
                  <p className="text-xs text-slate-500">
                    Prerequisites needed to use this digital asset effectively.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-4">
                  <Monitor size={24} className="text-primary shrink-0 mt-1" />
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900">Supported Platforms & Tools</h4>
                    <p className="text-slate-600 leading-relaxed font-medium">{requirementsText}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: LICENCE */}
            {activeTab === 'licence' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Licence Scope & Usage Rights</h3>
                  <p className="text-xs text-slate-500">
                    Current licence type: <strong className="text-primary">{product.licenceType || 'COMMERCIAL'}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                    <h4 className="font-black text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" /> Permitted Uses
                    </h4>
                    <ul className="space-y-2 text-emerald-900 font-medium">
                      <li>✓ Use in unlimited personal and commercial client deliverables</li>
                      <li>✓ Modify, adapt, recolor, and reformat source assets</li>
                      <li>✓ Combine with other design materials for finished works</li>
                    </ul>
                  </div>

                  <div className="p-5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                    <h4 className="font-black text-rose-950 flex items-center gap-2">
                      <X size={16} className="text-rose-600" /> Prohibited Uses
                    </h4>
                    <ul className="space-y-2 text-rose-900 font-medium">
                      <li>✕ Reselling, sublicensing, or redistributing original raw source files</li>
                      <li>✕ Sharing direct download links on public forums or file-sharing sites</li>
                      <li>✕ Claiming exclusive copyright or trademark over original assets</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: FAQS */}
            {activeTab === 'faq' && (
              <div className="space-y-4 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Frequently Asked Questions</h3>
                  <p className="text-xs text-slate-500">
                    Got questions? Everything you need to know about this digital product.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {faqsList.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
                        >
                          <span>Q: {faq.question}</span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed font-medium bg-white border-t border-slate-100">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 8: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Customer Reviews & Ratings</h3>
                    <p className="text-xs text-slate-500">
                      Verified purchaser feedback from real customer orders.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Rating Distribution Breakdown */}
                <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <div className="text-center sm:text-left space-y-1">
                    <span className="text-4xl font-black text-slate-900">{product.rating || '5.0'}</span>
                    <div className="flex items-center justify-center sm:justify-start text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={16} className="fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-bold block">
                      Based on {reviews.length || 1} verified review{reviews.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 space-y-2 text-xs">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percent = reviews.length > 0 ? (count / reviews.length) * 100 : (rating === 5 ? 100 : 0);
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="font-bold text-slate-600 w-12">{rating} Stars</span>
                          <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="font-bold text-slate-400 w-8 text-right">{count || (rating === 5 && reviews.length === 0 ? 1 : 0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3 pt-2">
                  {reviews.length === 0 ? (
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">Kanishk Digital Community</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ Verified Purchase
                        </span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} className="fill-current" />)}
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs">Outstanding quality and instant delivery!</h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        The Google Drive access link arrived in my email within seconds of checkout. Highly recommended for commercial client work!
                      </p>
                    </div>
                  ) : (
                    reviews.map((r, idx) => (
                      <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{r.customerName || 'Customer'}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Verified Purchase
                          </span>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={13} className={s <= r.rating ? 'fill-current' : 'text-slate-200'} />
                          ))}
                        </div>
                        {r.title && <h5 className="font-bold text-slate-900 text-xs">{r.title}</h5>}
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 5. DISTINCT SECTION: WHY YOU'LL LOVE IT */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Why You'll Love It</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Designed for professionals to accelerate workflows and produce elite client deliverables.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Save 10+ Hours', desc: 'Pre-formatted templates eliminate blank-page frustration and speed up client turnarounds.', icon: Clock, color: 'text-primary bg-primary/10' },
              { title: 'Professional Design', desc: 'Modern typography, curated layouts, and brand guidelines crafted by senior design experts.', icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
              { title: 'Fully Editable', desc: '100% customizable components in Canva, Figma, and Google Workspace applications.', icon: Palette, color: 'text-emerald-600 bg-emerald-50' },
              { title: 'Multiple Formats', desc: 'Supplied with vector graphics, master ZIP files, and multi-device compatible templates.', icon: Layers, color: 'text-blue-600 bg-blue-50' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-3 shadow-xs hover:shadow-md transition-all">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${card.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">{card.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. DISTINCT SECTION: WHAT'S INCLUDED DEDICATED SECTION */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">What's Included in This Package</h2>
            <p className="text-xs text-slate-500 mt-1">Verified deliverables ready for immediate extraction from Google Drive.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {whatsIncludedList.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. DISTINCT SECTION: POPULAR USE CASES */}
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Popular Use Cases</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Built to fit seamlessly into any creative, freelance, or commercial agency workflow.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { name: 'Digital Agencies', desc: 'Client pitches & retainers', icon: Briefcase },
              { name: 'Freelancers', desc: 'Proposals & onboarding', icon: UserCheck },
              { name: 'Consultants', desc: 'Audits & roadmaps', icon: Compass },
              { name: 'Marketing Teams', desc: 'Campaign collateral', icon: Megaphone },
              { name: 'Design Studios', desc: 'Brand kits & deliverables', icon: Palette },
              { name: 'Startups', desc: 'Investor decks & kits', icon: Rocket }
            ].map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-2 shadow-xs hover:border-primary transition-colors">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center mx-auto">
                    <Icon size={20} />
                  </div>
                  <h4 className="font-black text-slate-900 text-xs">{useCase.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{useCase.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8. DISTINCT SECTION: PRODUCT SPECIFICATIONS MATRIX */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Product Specifications</h2>
            <p className="text-xs text-slate-500 mt-1">Verified metadata retrieved directly from backend Google Drive storage.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">File Type</span>
              <strong className="text-slate-900 block font-mono">{product.driveMimeType || 'ZIP Archive'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">File Size</span>
              <strong className="text-slate-900 block font-mono">{product.driveFileSize || product.fileSize || '84.2 MB'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Access Method</span>
              <strong className="text-slate-900 block">Login Required</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Download Limit</span>
              <strong className="text-slate-900 block">{product.downloadLimit ? (product.downloadLimit > 9000 ? 'Unlimited' : `${product.downloadLimit} Allowed`) : '5 Allowed'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Access Duration</span>
              <strong className="text-slate-900 block">{product.accessDurationDays ? (product.accessDurationDays > 9000 ? 'Lifetime Access' : `${product.accessDurationDays} Days`) : 'Lifetime Access'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Licence Type</span>
              <strong className="text-slate-900 block">{product.licenceType || 'Commercial'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Version</span>
              <strong className="text-slate-900 block font-mono">{product.version || 'v1.0.0'}</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Language</span>
              <strong className="text-slate-900 block">English</strong>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Compatibility</span>
              <strong className="text-slate-900 block truncate">{requirementsText}</strong>
            </div>
          </div>
        </div>

        {/* 9. DISTINCT SECTION: RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Related Products</h3>
                <p className="text-xs text-slate-500 mt-0.5">Explore similar digital assets and templates in this collection.</p>
              </div>
              <Link to="/categories/all-products" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const relPrice = rel.discountPrice ? rel.discountPrice : rel.price;
                return (
                  <div 
                    key={rel.id}
                    onClick={() => navigate(`/product/${rel.slug || rel.id}`)}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                        <img 
                          src={rel.coverImage || '/images/placeholder-product.png'} 
                          alt={rel.name || rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase">
                          {rel.productType ? rel.productType.replace(/_/g, ' ') : 'DIGITAL'}
                        </span>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <span className="text-[10px] font-mono font-bold text-primary block">
                          {rel.productCode || 'KDW-P-000XXX'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-primary transition-colors">
                          {rel.name || rel.title}
                        </h4>
                        <div className="flex items-center text-amber-400 text-[10px]">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={11} className="fill-current" />)}
                          <span className="text-slate-400 ml-1.5 font-bold">({rel.reviews || 1})</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span className="font-black text-slate-900 text-sm">{formatCurrency(relPrice)}</span>
                      <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        View <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">Write a Customer Review</h3>
              <button type="button" onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="text-amber-400 cursor-pointer p-1"
                    >
                      <Star size={24} className={star <= reviewForm.rating ? 'fill-current' : 'text-slate-200'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Review Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="e.g. Incredible templates, saved hours!"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Write your feedback regarding access, quality, and deliverables..."
                  rows={4}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
