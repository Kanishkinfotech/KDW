import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { 
  ShoppingCart, Star, Package, Check, ArrowLeft,
  Heart, Share2, Download, Zap, Shield, Crown, Lock, Smartphone, AlertTriangle,
  HelpCircle, ChevronDown
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import CheckoutModal from '../components/CheckoutModal';
import { Mail, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductReviews from '../components/product/ProductReviews';
import BundleCountdownBadge from '../components/BundleCountdownBadge';
import { getBundleEffectivePricing } from '../utils/bundlePricing';
import { trackOfferView, trackOfferClick } from '../utils/offerTracking';

export default function BundleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bundles, addToCart, isCartOpen, setCartOpen } = useStore();
  const { isAuthenticated, user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const [ownedProducts, setOwnedProducts] = useState<string[]>([]);
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(false);
  const [apiBundle, setApiBundle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const memoryBundle = bundles.find(b => b.id === id || b.slug === id);
  const bundle = apiBundle || memoryBundle;

  useEffect(() => {
    if (id) {
      if (!memoryBundle) {
        setLoading(true);
      }
      axios.get(`/api/bundles/${id}`)
        .then(res => {
          if (res.data?.success && res.data.data) {
            setApiBundle(res.data.data);
          } else {
            axios.get(`/api/products/${id}`).then(pRes => {
              if (pRes.data?.success && pRes.data.data) {
                navigate(`/product/${pRes.data.data.slug || id}`, { replace: true });
              }
            }).catch(() => {});
          }
        })
        .catch(err => {
          axios.get(`/api/products/${id}`).then(pRes => {
            if (pRes.data?.success && pRes.data.data) {
              navigate(`/product/${pRes.data.data.slug || id}`, { replace: true });
            }
          }).catch(() => {
            console.error("Error fetching bundle:", err);
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const bundleFaqs = useMemo<{ question: string; answer: string }[]>(() => {
    let raw = bundle?.faqs;
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed)) {
          const valid = parsed
            .filter((item: any) => item && (item.question || item.q) && (item.answer || item.a))
            .map((item: any) => ({
              question: String(item.question || item.q).trim(),
              answer: String(item.answer || item.a).trim()
            }))
            .filter(item => item.question && item.answer);
          if (valid.length > 0) return valid;
        }
      } catch (e) {
        console.warn('Failed to parse bundle FAQs', e);
      }
    }

    // Default Fallback FAQs if bundle has no specific FAQs configured
    return [
      {
        question: 'What is included in this bundle?',
        answer: 'You get full instant access to all digital assets listed in this bundle with lifetime updates and personal licence.'
      },
      {
        question: 'How do I access my files after payment?',
        answer: 'Immediately after verified payment, download links are sent to your account email and permanently stored in your KDW Purchases library.'
      },
      {
        question: 'Do I get lifetime updates for the products in this bundle?',
        answer: 'Yes! All future version upgrades, new additions, and bug fixes for the included digital assets are provided free for life.'
      },
      {
        question: 'Can I use this bundle for personal projects?',
        answer: 'Yes, this bundle includes a personal licence permitting lifetime usage for personal and individual projects.'
      }
    ];
  }, [bundle?.faqs]);

  const bundleProducts = (bundle?.bundleItems?.length ? bundle.bundleItems.map((bi: any) => bi.product).filter(Boolean) : bundle?.products) || [];

  useEffect(() => {
    if (isAuthenticated) {
      if (bundle && bundleProducts.length > 0) checkOwnership();
    }
  }, [bundle, isAuthenticated]);

  useEffect(() => {
    if (user?.email) {
      setDeliveryEmail(user.email);
    }
  }, [user]);

  const checkOwnership = async () => {
    if (!bundleProducts || bundleProducts.length === 0) return;
    
    try {
      setIsCheckingOwnership(true);
      const productIds = bundleProducts.map((p: any) => p.id || p.productId).filter(Boolean);
      if (productIds.length === 0) return;
      
      const res = await axios.post('/api/purchases/check-ownership', {
        productIds
      }, {
        withCredentials: true // Ensure HttpOnly cookies are sent
      });
      
      if (res.data.success) {
        setOwnedProducts(res.data.data.ownedProductIds || []);
      }
    } catch (error) {
      console.error("Failed to check ownership", error);
    } finally {
      setIsCheckingOwnership(false);
    }
  };

  const pricing = useMemo(() => getBundleEffectivePricing(bundle), [bundle]);

  useEffect(() => {
    if (pricing.isDealActive && pricing.activeDeal?.offerId) {
      trackOfferView(pricing.activeDeal.offerId);
    }
  }, [pricing.isDealActive, pricing.activeDeal?.offerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfbf9]">
        <div className="w-8 h-8 rounded-full border-2 border-[#5b21b6] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading bundle details...</p>
      </div>
    );
  }

  const isArchived = bundle?.status === 'ARCHIVED' && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN';

  if (!bundle || isArchived) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfbf9] text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Package className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Bundle Unavailable</h1>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          This digital bundle has been archived and is no longer available in the public catalog. Existing customers can continue to access their downloads from their Purchases library.
        </p>
        <Button onClick={() => navigate('/bundles')}>Browse Active Bundles</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (pricing.isDealActive && pricing.activeDeal?.offerId) {
      trackOfferClick(pricing.activeDeal.offerId);
    }
    const cartItem = {
      id: bundle.id,
      title: bundle.title,
      price: pricing.effectivePrice,
      coverImage: bundle.coverImage,
      category: 'Bundle',
      type: 'bundle',
      quantity: 1
    };
    
    addToCart(cartItem);
    toast.success('Bundle added to cart!');
    if (!isCartOpen) setCartOpen(true);
  };

  const handleBuyNow = () => {
    if (pricing.isDealActive && pricing.activeDeal?.offerId) {
      trackOfferClick(pricing.activeDeal.offerId);
    }
    const trimmedEmail = deliveryEmail.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter a delivery email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError('');
    setIsCheckoutOpen(true);
  };

  const benefits = [
    { icon: Download, text: 'Instant Digital Download' },
    { icon: Zap, text: 'Lifetime Updates' },
    { icon: Shield, text: 'Personal License' },
    { icon: Crown, text: 'Premium Quality' },
    { icon: Lock, text: 'Secure Payment' },
    { icon: Smartphone, text: 'Mobile Friendly' }
  ];

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50">
      <SEO title={`${bundle.title} | Premium Bundle`} description={bundle.description} />
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        product={{ ...bundle, price: pricing.effectivePrice, originalPrice: pricing.originalPrice, type: 'bundle' }}
        deliveryEmail={deliveryEmail.trim()}
      />
      
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/bundles')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Bundles
        </button>

        {/* Limited Time Deal Countdown Banner */}
        {pricing.isDealActive && (
          <div className="mb-8">
            <BundleCountdownBadge 
              offerEndAt={pricing.offerEndAt} 
              offerStartAt={pricing.offerStartAt} 
              variant="banner" 
            />
          </div>
        )}

        {pricing.isDealExpired && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block text-sm">Special Limited-Time Deal Expired</span>
                <span className="text-xs text-amber-700">This bundle offer deadline has passed. The discount has auto-reverted to 0% and is available at standard price.</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-200/70 text-amber-900 text-xs font-mono font-bold rounded-lg shrink-0">Standard Price</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 lg:p-12 shadow-sm border border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* Left: Image */}
          <div className="space-y-6">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative group border border-slate-100">
              <img 
                src={bundle.coverImage} 
                alt={bundle.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800') {
                    target.src = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800';
                  }
                }}
              />
              <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm z-10">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package size={16} className="text-accent" />
                  {bundle.itemsIncluded} Products Included
                </span>
              </div>
            </div>
            
            {/* Bundle Benefits */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-sm">{benefit.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {pricing.isDealActive && (
                  <span className="px-3 py-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-full text-xs font-black tracking-wide uppercase shadow-sm flex items-center gap-1.5">
                    <Zap size={13} className="fill-white" />
                    {pricing.badgeText || 'SPECIAL DEAL'}
                  </span>
                )}
                {bundle.featured && !pricing.isDealActive && (
                  <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-bold tracking-wide uppercase border border-amber-300 shadow-xs flex items-center gap-1">
                    ★ Featured Bundle
                  </span>
                )}
                {pricing.isDealActive && pricing.offerEndAt && (
                  <BundleCountdownBadge offerEndAt={pricing.offerEndAt} variant="pill" />
                )}
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold tracking-wide uppercase">
                  Best Value
                </span>
                {pricing.discount > 0 && (
                  <span className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-bold tracking-wide uppercase">
                    Save {formatCurrency(pricing.discount)} ({pricing.discountPercent}%)
                  </span>
                )}
                <span className="flex items-center gap-1 text-yellow-500 text-sm font-bold bg-yellow-50 px-2 py-1 rounded-full">
                  <Star size={14} fill="currentColor" />
                  {bundle.rating || '4.9'} ({bundle.reviewsCount || bundle.reviews?.length || 0} Reviews)
                </span>
              </div>
              
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                {bundle.title}
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                {bundle.description}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 mb-8">
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-medium">Total Value</span>
                  <span className={`${pricing.discount > 0 ? 'line-through' : 'font-bold'} text-lg`}>
                    {formatCurrency(pricing.originalPrice)}
                  </span>
                </div>
                {pricing.discount > 0 ? (
                  <div className="flex justify-between items-center text-success">
                    <span className="font-bold">Bundle Discount</span>
                    <span className="font-bold">-{formatCurrency(pricing.discount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-medium text-xs">Bundle Discount</span>
                    <span className="font-mono text-xs">₹0 (0% - Standard Price)</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                  <div>
                    <span className="text-lg font-bold text-slate-900 block">Bundle Price</span>
                    {pricing.isDealActive && (
                      <span className="text-[11px] font-mono text-rose-600 font-bold block">
                        ⚡ Limited-Time Deal Active
                      </span>
                    )}
                  </div>
                  <span className="text-5xl font-black text-slate-900">{formatCurrency(pricing.effectivePrice)}</span>
                </div>
              </div>

              {ownedProducts.length > 0 && (
                <div className={`mb-6 p-4 rounded-xl flex gap-3 ${
                  bundleProducts.length > 0 && ownedProducts.length === bundleProducts.length
                    ? 'bg-success/10 text-success-dark border border-success/20'
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                  <AlertTriangle size={24} className={bundleProducts.length > 0 && ownedProducts.length === bundleProducts.length ? "text-success" : "text-yellow-600"} />
                  <div>
                    <h4 className="font-bold">
                      {bundleProducts.length > 0 && ownedProducts.length === bundleProducts.length 
                        ? "You already own this complete bundle!" 
                        : `You already own ${ownedProducts.length} of the ${bundleProducts.length} products in this bundle.`
                      }
                    </h4>
                    {ownedProducts.length < (bundleProducts.length || 0) && (
                      <p className="text-sm mt-1">Purchasing this bundle will grant you access to the remaining products.</p>
                    )}
                  </div>
                </div>
              )}

              {!(bundleProducts.length > 0 && ownedProducts.length === bundleProducts.length) && (
                <>
                  <div className="space-y-4 mb-4" id="buy-section">
                    <div className="flex flex-col gap-1.5 mb-2">
                      <label htmlFor="deliveryEmail" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        Delivery Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          id="deliveryEmail"
                          value={deliveryEmail}
                          onChange={(e) => {
                            setDeliveryEmail(e.target.value);
                            if (emailError) setEmailError('');
                          }}
                          placeholder="Enter email for product delivery"
                          className={`w-full pl-10 pr-4 py-3 bg-white border ${emailError ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 transition-all`}
                          required
                        />
                      </div>
                      {emailError && (
                        <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={14} /> {emailError}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                        <Check size={12} className="text-success" /> We'll send purchase access to this email.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Button 
                      size="lg" 
                      className="flex-1 text-lg h-14"
                      onClick={handleBuyNow}
                    >
                      Buy Bundle Now
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg" 
                      className="flex-1 text-lg h-14 flex items-center justify-center gap-3"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart size={20} />
                      Add to Cart
                    </Button>
                  </div>
                </>
              )}
              
              <div className="flex gap-4">
                <button 
                  onClick={() => toast.success('Added to wishlist')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                >
                  <Heart size={18} /> Wishlist
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                >
                  <Share2 size={18} /> Share
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Questions about this bundle?</span>
                <Link
                  to={`/support/contact?subject=${encodeURIComponent('Inquiry regarding ' + (bundle?.name || 'Bundle'))}`}
                  className="font-bold text-[#5b21b6] hover:text-[#7c3aed] transition-colors"
                >
                  Contact Support &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Included Products Section */}
        {bundleProducts && bundleProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Package className="text-primary" size={32} />
              Included in this bundle ({bundleProducts.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundleProducts.map((product: any) => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={product.thumbnail || product.coverImage} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center gap-1 shadow-sm">
                      <Check size={14} /> Included
                    </div>
                    {ownedProducts.includes(product.id) && (
                      <div className="absolute top-4 right-4 bg-success/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1">
                        <Check size={14} /> You Own This
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        {(typeof product.category === 'object' ? product.category?.name : product.category) || 'Digital Product'}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {product.shortDescription || product.description}
                      </p>
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Individual Price</span>
                        <span className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</span>
                      </div>
                      <Link to={`/product/${product.id}`} className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bundle Frequently Asked Questions (FAQs) Section */}
        {bundleFaqs.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6 mt-16">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Frequently Asked Questions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Everything you need to know about this bundle package, licensing, and delivery.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {bundleFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left flex items-center justify-between gap-4 group cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-primary transition-colors flex items-start gap-2.5">
                        <span className="text-primary font-mono text-sm font-black mt-0.5">Q.</span>
                        {faq.question}
                      </span>
                      <ChevronDown 
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pl-6 font-normal whitespace-pre-line">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="pt-12 border-t border-slate-200/60 mt-16">
          <ProductReviews 
            productId={bundle.id} 
            productTitle={bundle.title} 
            productImage={bundle.coverImage} 
          />
        </div>
      </div>
    </div>
  );
}
