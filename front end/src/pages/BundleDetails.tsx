import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { 
  ShoppingCart, Star, Package, Check, ArrowLeft,
  Heart, Share2, Download, Zap, Shield, Crown, Lock, Smartphone, AlertTriangle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import CheckoutModal from '../components/CheckoutModal';
import { Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductReviews from '../components/product/ProductReviews';

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

  const bundle = bundles.find(b => b.id === id || b.slug === id);
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
    if (!bundle || !bundle.products || bundle.products.length === 0) return;
    
    try {
      setIsCheckingOwnership(true);
      const productIds = bundle.products.map((p: any) => p.id);
      
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

  if (!bundle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold mb-4">Bundle not found</h1>
        <Button onClick={() => navigate('/bundles')}>Back to Bundles</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    const cartItem = {
      id: bundle.id,
      title: bundle.title,
      price: bundle.price,
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

  const savings = bundle.originalPrice - bundle.price;

  const benefits = [
    { icon: Download, text: 'Instant Digital Download' },
    { icon: Zap, text: 'Lifetime Updates' },
    { icon: Shield, text: 'Commercial License' },
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
        product={{ ...bundle, type: 'bundle' }}
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
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold tracking-wide uppercase">
                  Best Value
                </span>
                <span className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-bold tracking-wide uppercase">
                  Save {formatCurrency(savings)}
                </span>
                <span className="flex items-center gap-1 text-yellow-500 text-sm font-bold bg-yellow-50 px-2 py-1 rounded-full">
                  <Star size={14} fill="currentColor" />
                  {bundle.rating} ({Math.floor(Math.random() * 500) + 100} Reviews)
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
                  <span className="line-through text-lg">{formatCurrency(bundle.originalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-success">
                  <span className="font-bold">Bundle Discount</span>
                  <span className="font-bold">-{formatCurrency(savings)}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-900">Bundle Price</span>
                  <span className="text-5xl font-black text-slate-900">{formatCurrency(bundle.price)}</span>
                </div>
              </div>

              {ownedProducts.length > 0 && (
                <div className={`mb-6 p-4 rounded-xl flex gap-3 ${
                  ownedProducts.length === (bundle.products?.length || 0)
                    ? 'bg-success/10 text-success-dark border border-success/20'
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                  <AlertTriangle size={24} className={ownedProducts.length === bundle.products?.length ? "text-success" : "text-yellow-600"} />
                  <div>
                    <h4 className="font-bold">
                      {ownedProducts.length === bundle.products?.length 
                        ? "You already own this complete bundle!" 
                        : `You already own ${ownedProducts.length} of the ${bundle.products?.length} products in this bundle.`
                      }
                    </h4>
                    {ownedProducts.length < (bundle.products?.length || 0) && (
                      <p className="text-sm mt-1">Purchasing this bundle will grant you access to the remaining products.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-4" id="buy-section">
                {ownedProducts.length !== (bundle.products?.length || 0) && (
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
                )}
              </div>

              {ownedProducts.length !== (bundle.products?.length || 0) && (
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
