import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Check, ShieldCheck, Download, 
  FolderArchive, FileText, CheckCircle2, Layers, Sparkles, 
  Clock, Lock, ArrowRight, ExternalLink, HelpCircle, ChevronDown, Tag, HardDrive,
  Heart, Zap, RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import SEO from '../components/SEO';
import ProductReviews from '../components/product/ProductReviews';
import ReactMarkdown from 'react-markdown';
import { productsApi, type ProductItem } from '../api';
import { toast } from 'react-hot-toast';
import { trackOfferView, trackOfferClick } from '../utils/offerTracking';
import axios from 'axios';

export default function ProductDetails() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const identifier = slug || id;
  const navigate = useNavigate();
  
  const { cart, wishlist, addToCart, setCartOpen, toggleWishlist } = useStore();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<any>({
    show_product_ratings: true,
    show_download_format: true,
    show_file_size: true,
    show_version: true,
    show_licence_summary: true,
    show_related_products: true,
    is_maintenance: false
  });

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setStoreSettings(json.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!identifier) return;
      try {
        setLoading(true);
        setError(null);
        const res = await productsApi.getProductByIdOrSlug(identifier);
        if (res.success && res.data) {
          setProduct(res.data);
          const initialCover = res.data.coverImage || res.data.thumbnail || null;
          setSelectedImage(initialCover);
        } else {
          // Check if identifier is a bundle and redirect seamlessly
          try {
            const bundleRes = await axios.get(`/api/bundles/${identifier}`);
            if (bundleRes.data?.success && bundleRes.data.data) {
              navigate(`/bundles/${bundleRes.data.data.slug || identifier}`, { replace: true });
              return;
            }
          } catch (bErr) {
            // Not a bundle
          }
          setError('Product not found in current catalog.');
        }
      } catch (err: any) {
        // Fallback check if identifier is a bundle before throwing error
        try {
          const bundleRes = await axios.get(`/api/bundles/${identifier}`);
          if (bundleRes.data?.success && bundleRes.data.data) {
            navigate(`/bundles/${bundleRes.data.data.slug || identifier}`, { replace: true });
            return;
          }
        } catch (bErr) {}
        console.error('Error fetching product:', err);
        setError('Unable to load product information from the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [identifier]);

  useEffect(() => {
    if (product?.activeDeal?.offerId) {
      trackOfferView(product.activeDeal.offerId);
    }
  }, [product?.activeDeal?.offerId]);

  const isInCart = product ? cart.some((item) => item.id === product.id) : false;
  const isWishlisted = product ? wishlist.some((item) => item.id === product.id) : false;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const productFaqs = useMemo<{ question: string; answer: string }[]>(() => {
    if (!product?.faqs) return [];
    try {
      const parsed = typeof product.faqs === 'string' ? JSON.parse(product.faqs) : product.faqs;
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.question && item.answer);
      }
    } catch (e) {
      console.warn('Failed to parse product FAQs', e);
    }
    return [];
  }, [product?.faqs]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.activeDeal?.offerId) {
      trackOfferClick(product.activeDeal.offerId);
    }
    if (isInCart) {
      setCartOpen(true);
      return;
    }
    addToCart(product);
    toast.success(`Added "${product.title || product.name}" to selection`);
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.activeDeal?.offerId) {
      trackOfferClick(product.activeDeal.offerId);
    }
    const directItem = {
      id: product.id,
      productId: product.id,
      title: product.title || product.name,
      name: product.title || product.name,
      price: Number(product.price) || 0,
      thumbnail: product.thumbnail || product.coverImage,
      coverImage: product.coverImage || product.thumbnail,
      type: product.type || 'product',
      quantity: 1,
      version: product.version,
      shortDescription: product.shortDescription || product.description,
      format: formatValue
    };
    navigate(`/checkout?productId=${encodeURIComponent(product.id)}`, {
      state: { directItem }
    });
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
  };

  // Image list extraction
  const allImages = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    if (product.coverImage) list.push(product.coverImage);
    if (product.thumbnail && !list.includes(product.thumbnail)) list.push(product.thumbnail);

    if (Array.isArray(product.previewImages)) {
      product.previewImages.forEach((img: any) => {
        if (typeof img === 'string' && img && !list.includes(img)) list.push(img);
      });
    } else if (typeof product.previewImages === 'string') {
      try {
        const parsed = JSON.parse(product.previewImages);
        if (Array.isArray(parsed)) {
          parsed.forEach((img: string) => {
            if (img && !list.includes(img)) list.push(img);
          });
        }
      } catch (e) {
        const split = product.previewImages.split(',').map((s) => s.trim()).filter(Boolean);
        split.forEach((img) => {
          if (!list.includes(img)) list.push(img);
        });
      }
    }
    return list;
  }, [product]);

  // Deliverables ("What you will receive")
  const deliverablesList: string[] = useMemo(() => {
    if (!product) return [];
    
    if (Array.isArray(product.features) && product.features.length > 0) {
      return product.features;
    }
    if (typeof product.features === 'string' && product.features.trim()) {
      try {
        const parsed = JSON.parse(product.features);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        const lines = product.features.split('\n').map((s: string) => s.trim()).filter(Boolean);
        if (lines.length > 0) return lines;
      }
    }

    if (Array.isArray(product.whatsIncluded) && product.whatsIncluded.length > 0) {
      return product.whatsIncluded;
    }
    if (typeof product.whatsIncluded === 'string' && product.whatsIncluded.trim()) {
      try {
        const parsed = JSON.parse(product.whatsIncluded);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        const lines = product.whatsIncluded.split('\n').map((s: string) => s.trim()).filter(Boolean);
        if (lines.length > 0) return lines;
      }
    }

    return [
      'Master editable source files and production assets.',
      'Comprehensive step-by-step implementation guide & checklist.',
      'Commercial usage licence allowing deployment across client and internal operations.',
      'Direct download access with automated checksum integrity and lifetime version updates.'
    ];
  }, [product]);

  // Structured attributes & specifications
  const productAttributes = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.attributes)) {
      return product.attributes.filter((a: any) => a && (a.key || a.name) && (a.value || a.val));
    }
    if (typeof product.attributes === 'string' && product.attributes.trim()) {
      try {
        const parsed = JSON.parse(product.attributes);
        if (Array.isArray(parsed)) return parsed.filter((a: any) => a && (a.key || a.name) && (a.value || a.val));
      } catch (e) {}
    }
    return [];
  }, [product]);

  // Format determination
  const formatValue = useMemo(() => {
    const formatAttr = productAttributes.find((a: any) => (a.key || a.name || '').toLowerCase() === 'format');
    if (formatAttr) return formatAttr.value || formatAttr.val;
    if (product?.driveMimeType) {
      if (product.driveMimeType.includes('zip')) return 'ZIP Archive';
      if (product.driveMimeType.includes('pdf')) return 'PDF Document';
    }
    return 'Canva / ZIP / Source Code';
  }, [productAttributes, product]);

  // Software / Prerequisites determination
  const softwareValue = useMemo(() => {
    if (!product) return 'Modern Web Browser';
    if (typeof product.requirements === 'string' && product.requirements.trim()) {
      try {
        const parsed = JSON.parse(product.requirements);
        if (parsed.text) return parsed.text;
      } catch (e) {
        return product.requirements;
      }
    }
    if (product.requirements?.text) return product.requirements.text;
    if (product.requirements?.software) return product.requirements.software;
    const reqAttr = productAttributes.find((a: any) => (a.key || a.name || '').toLowerCase().includes('software') || (a.key || a.name || '').toLowerCase().includes('requirement'));
    if (reqAttr) return reqAttr.value || reqAttr.val;
    return 'Free Canva, Figma or Modern Web Browser';
  }, [product, productAttributes]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 border-3 border-[#5b21b6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-mono">Loading product information...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#171325]">Product Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
          {error || 'The digital system you are looking for is not currently active in the catalog.'}
        </p>
        <Link
          to="/shop"
          className="px-6 py-2.5 rounded-full bg-[#5b21b6] text-white text-xs font-bold font-sans hover:bg-[#6d28d9] transition-all shadow-xs"
        >
          Browse Full Catalog
        </Link>
      </div>
    );
  }

  const categoryName = typeof product.category === 'object' 
    ? (product.category?.name || 'Digital System') 
    : (product.category || 'Digital System');
  const title = product.title || product.name || 'Digital System Toolkit';

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] selection:bg-[#ede9fe] selection:text-[#5b21b6] font-sans pb-24">
      <SEO 
        title={`${title} | KDW Digital Assets`}
        description={product.shortDescription || product.description}
      />

      {/* Navigation Breadcrumb */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap font-medium">
          <Link to="/" className="hover:text-[#5b21b6] transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link to="/categories" className="hover:text-[#5b21b6] transition-colors">Categories</Link>
          {product.category && (
            <>
              <span className="text-slate-300">/</span>
              <Link 
                to={`/categories/${encodeURIComponent(product.categorySlug || (typeof product.category === 'object' ? product.category.slug : product.category))}`} 
                className="hover:text-[#5b21b6] transition-colors"
              >
                {categoryName}
              </Link>
            </>
          )}
          {product.subcategory && (
            <>
              <span className="text-slate-300">/</span>
              <Link 
                to={`/categories/${encodeURIComponent(product.categorySlug || (typeof product.category === 'object' ? product.category.slug : product.category))}/${encodeURIComponent(product.subcategory)}`} 
                className="hover:text-[#5b21b6] transition-colors"
              >
                {product.subcategory}
              </Link>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-none">{title}</span>
        </nav>
      </div>

      {/* Main Product Layout */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Stage Image / Motif */}
            <div className="relative aspect-video sm:aspect-4/3 w-full rounded-3xl overflow-hidden border border-[#e2e8f0] bg-slate-900 shadow-md">
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt={title} 
                  className="w-full h-full object-cover object-center"
                  onError={() => setSelectedImage(null)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#1e1b4b] p-8 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 kdw-cover-grid opacity-30 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-3 py-1 rounded text-xs font-mono font-bold tracking-wider uppercase bg-black/50 text-white border border-white/20">
                      KDW PRODUCTION SYSTEM
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-400 text-emerald-950">
                      VERIFIED ASSET
                    </span>
                  </div>
                  <div className="relative z-10 text-white space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">{title}</h2>
                    <p className="text-xs text-white/80 font-mono">100% Google Drive Direct Delivery</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery List */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === img ? 'border-[#5b21b6] scale-102 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Full Product Description / Overview Section */}
            {product.description && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-4 mt-8">
                <div className="flex items-center gap-2 text-[#5b21b6]">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-serif font-bold text-[#171325]">Product Overview & Details</h3>
                </div>
                <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed font-sans pt-1">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="leading-relaxed mb-3 text-slate-700 font-normal whitespace-pre-line" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2 font-serif" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-slate-900 mt-3 mb-2 font-serif" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-base font-bold text-slate-900 mt-2 mb-1" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1.5 my-3 text-slate-700" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1.5 my-3 text-slate-700" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#5b21b6] pl-4 italic text-slate-600 my-2" {...props} />
                    }}
                  >
                    {product.description}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* What's Included / Deliverables */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-4 mt-8">
              <h3 className="text-lg font-serif font-bold text-[#171325]">What is included in this toolkit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {deliverablesList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-4">
              <h3 className="text-lg font-serif font-bold text-[#171325]">Technical Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {storeSettings.show_download_format !== false && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-slate-400 block">Format</span>
                    <span className="text-xs font-bold text-[#171325]">{formatValue}</span>
                  </div>
                )}
                {storeSettings.show_version !== false && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-slate-400 block">Version</span>
                    <span className="text-xs font-bold text-[#171325]">{product.version || 'v1.0.0'}</span>
                  </div>
                )}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-slate-400 block">Software</span>
                  <span className="text-xs font-bold text-[#171325] truncate block" title={softwareValue}>{softwareValue}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-slate-400 block">Delivery</span>
                  <span className="text-xs font-bold text-emerald-600">Instant Drive Link</span>
                </div>
              </div>
            </div>

            {/* Product FAQs Section (Stage 8 Content & FAQs) */}
            {productFaqs.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-4 mt-8">
                <div className="flex items-center gap-2 text-[#5b21b6]">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="text-lg font-serif font-bold text-[#171325]">Frequently Asked Questions</h3>
                </div>
                <div className="divide-y divide-slate-100 pt-2">
                  {productFaqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full text-left flex items-center justify-between gap-4 group cursor-pointer"
                        >
                          <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#5b21b6] transition-colors flex items-start gap-2">
                            <span className="text-primary font-mono text-xs mt-0.5 font-black">Q.</span>
                            {faq.question}
                          </span>
                          <ChevronDown 
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
                          />
                        </button>
                        {isOpen && (
                          <div className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pl-5 font-normal whitespace-pre-line">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer Reviews Section (Store Setting Controlled) */}
            {storeSettings.show_product_ratings !== false && (
              <div className="mt-8">
                <ProductReviews 
                  productId={product.id} 
                  productTitle={title} 
                  productImage={selectedImage || product.coverImage || product.thumbnail || ''} 
                />
              </div>
            )}

          </div>

          {/* Right Column: Purchasing & Policy Card */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-lg shadow-purple-900/5 space-y-6 sticky top-24">
              
              {/* Category & Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold font-sans tracking-[0.16em] uppercase text-[#5b21b6]">
                    {categoryName}
                  </span>
                  {(product.featured || product.isFeatured) && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-amber-950 border border-amber-300 shadow-xs flex items-center gap-1">
                      ★ Featured Product
                    </span>
                  )}
                  {(product.bestSeller || product.isBestSeller) && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-600 text-white border border-purple-400">
                      Best Seller
                    </span>
                  )}
                </div>
                <button
                  onClick={handleToggleWishlist}
                  className={`p-2 rounded-full border transition-colors ${
                    isWishlisted 
                      ? 'bg-rose-50 border-rose-200 text-rose-600' 
                      : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50'
                  }`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Title & Short Description */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325] leading-tight">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  {product.shortDescription || product.description}
                </p>
              </div>

              {/* Active Deal Alert Banner */}
              {product.activeDeal && (
                <div className="p-3 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-300 rounded-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-800 font-medium text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                      ⚡ {product.activeDeal.badgeText || 'SPECIAL DEAL'}
                    </span>
                    <span className="font-semibold">{product.activeDeal.bannerText || product.activeDeal.name}</span>
                  </div>
                  {product.activeDeal.endAt && (
                    <span className="text-[10px] font-mono text-amber-800 shrink-0 font-bold">
                      Limited Time
                    </span>
                  )}
                </div>
              )}

              {/* Pricing Display */}
              <div className="pt-4 border-t border-slate-100 flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono text-[#171325]">
                  {formatCurrency(Number(product.price) || 0)}
                </span>
                {((product.compareAtPrice && product.compareAtPrice > product.price) || (product.originalPrice && product.originalPrice > product.price)) && (
                  <span className="text-sm font-mono text-slate-400 line-through">
                    {formatCurrency(product.originalPrice || product.compareAtPrice)}
                  </span>
                )}
                {product.activeDeal && (
                  <span className="text-xs font-bold text-rose-600 font-mono">
                    ⚡ {product.activeDeal.badgeText}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-sans ml-auto">One-time payment</span>
              </div>

              {/* Store Maintenance Warning Banner if Active */}
              {storeSettings.is_maintenance && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans space-y-1">
                  <span className="font-bold block text-amber-950">⚠️ Store Purchases Paused</span>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    {storeSettings.maintenance_message || 'Store purchases are currently paused for maintenance.'}
                  </p>
                </div>
              )}

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={storeSettings.is_maintenance}
                  className={`w-full py-4 px-6 rounded-2xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md kdw-button-press disabled:opacity-50 disabled:cursor-not-allowed ${
                    isInCart
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-[#5b21b6] text-white hover:bg-[#6d28d9]'
                  }`}
                >
                  {isInCart ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>In Selection (View Cart)</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Selection</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={storeSettings.is_maintenance}
                  className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md kdw-button-press disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Buy Now — Instant Checkout</span>
                </button>
              </div>

              {/* Guaranteed Trust Badges */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {storeSettings.show_licence_summary !== false && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-600 font-sans">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Commercial use & deployment rights included</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-sans">
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Instant access via secure tokenized download link</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-sans">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>256-bit encrypted Razorpay payment gateway</span>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>Questions or pre-purchase inquiry?</span>
                  <Link
                    to={`/support/contact?productName=${encodeURIComponent(title)}&subject=${encodeURIComponent('Inquiry regarding ' + title)}`}
                    className="font-bold text-[#5b21b6] hover:text-[#7c3aed] transition-colors"
                  >
                    Get Support &rarr;
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
