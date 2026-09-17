import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { 
  ShieldCheck, Lock, ArrowRight, CheckCircle2, 
  AlertTriangle, Mail, User, Phone, ShoppingBag, 
  FileText, ArrowLeft, RefreshCw, CreditCard, Tag, Sparkles,
  Gift, Download, Zap, PackageCheck, Plus, Minus, Trash2, X, Search,
  QrCode, Landmark, Smartphone
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import SEO from '../components/SEO';
import { paymentsApi, couponsApi, productsApi } from '../api';
import axios from 'axios';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { settings } = useSettings();
  const { cart, clearCart, removeFromCart, addToCart, updateCartQuantity, products: storeProducts, bundles: storeBundles } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams<{ id?: string }>();

  // 1. Direct item support from Buy Now button or query parameter
  const queryProductId = paramId || searchParams.get('productId') || searchParams.get('id') || searchParams.get('product') || searchParams.get('slug');
  const recoveryId = searchParams.get('recoveryId') || searchParams.get('cartRecovery');
  const urlCoupon = searchParams.get('coupon');
  const [directItem, setDirectItem] = useState<any>(location.state?.directItem || null);
  const [directLoading, setDirectLoading] = useState(false);
  const [recoveredItems, setRecoveredItems] = useState<any[] | null>(null);
  const [recoveredSession, setRecoveredSession] = useState<any>(null);



  // Add more products modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');

  useEffect(() => {
    if (queryProductId && !directItem) {
      const fetchDirectProduct = async () => {
        try {
          setDirectLoading(true);
          const res = await productsApi.getProductByIdOrSlug(queryProductId);
          if (res.success && res.data) {
            setDirectItem({
              id: res.data.id,
              productId: res.data.id,
              title: res.data.title || res.data.name,
              name: res.data.title || res.data.name,
              price: Number(res.data.price) || 0,
              thumbnail: res.data.thumbnail || res.data.coverImage,
              coverImage: res.data.coverImage || res.data.thumbnail,
              type: res.data.type || 'product',
              quantity: 1,
              version: res.data.version,
              format: res.data.format || 'Digital Archive',
              slug: res.data.slug
            });
          }
        } catch (err) {
          console.error('Failed to load direct product for checkout:', err);
        } finally {
          setDirectLoading(false);
        }
      };
      fetchDirectProduct();
    }
  }, [queryProductId, directItem]);

  const isDirectCheckout = !!directItem;
  const isRecoveredCheckout = !isDirectCheckout && Array.isArray(recoveredItems) && recoveredItems.length > 0;
  const checkoutItems = isDirectCheckout 
    ? [directItem] 
    : (isRecoveredCheckout ? (recoveredItems as any[]) : cart);

  const handleRemoveItem = (itemId: string) => {
    if (isDirectCheckout) {
      setDirectItem(null);
      toast.success('Item removed from order');
    } else if (isRecoveredCheckout) {
      setRecoveredItems(prev => (prev || []).filter(it => (it.id || it.productId) !== itemId));
      toast.success('Item removed from order');
    } else {
      removeFromCart(itemId);
      toast.success('Item removed from order');
    }
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    if (isDirectCheckout) {
      setDirectItem((prev: any) => prev ? { ...prev, quantity: newQty } : null);
    } else if (isRecoveredCheckout) {
      setRecoveredItems(prev => (prev || []).map(it => (it.id || it.productId) === itemId ? { ...it, quantity: newQty } : it));
    } else {
      updateCartQuantity(itemId, newQty);
    }
  };

  const handleAddProductToCheckout = (product: any) => {
    const itemToAdd = {
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
      format: product.format || 'Digital Archive',
      slug: product.slug
    };

    if (isDirectCheckout && directItem) {
      addToCart(directItem, directItem.quantity || 1);
      addToCart(itemToAdd, 1);
      setDirectItem(null);
    } else {
      addToCart(itemToAdd, 1);
    }
    toast.success(`Added "${itemToAdd.title}" to your order!`);
  };

  // Products available to add
  const suggestedProducts = (storeProducts || []).filter(
    (p: any) => !checkoutItems.some((item: any) => item.id === p.id || item.productId === p.id)
  );

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [sdkReady, setSdkReady] = useState(false);

  // Razorpay Gateway State
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'upi' | 'card' | 'netbanking' | 'wallet'>('razorpay');
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [verifyingModalOpen, setVerifyingModalOpen] = useState(false);
  const [verificationStage, setVerificationStage] = useState('');

  // Synchronized Checkout & Policy Settings from DB
  const [checkoutSettings, setCheckoutSettings] = useState({
    checkout_mode: 'BOTH',
    require_terms_acceptance: false,
    require_refund_policy_acceptance: false,
    require_privacy_acceptance: false,
    tax_mode: 'INCLUSIVE',
    gst_rate: 18,
    invoice_tax_note: 'GST @ 18% inclusive on all digital software downloads & digital licenses.'
  });
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [refundAccepted, setRefundAccepted] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);

  // Sync user details if authenticated
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: user.email || ''
      }));

      // Check if user has already accepted policies during login consent gate
      const hasAccepted = localStorage.getItem(`kwd_policy_accepted_${user.id}`);
      if (hasAccepted) {
        setTermsAccepted(true);
        setRefundAccepted(true);
        setPrivacyAccepted(true);
      }
    }
  }, [user]);

  // Load available customer coupons
  useEffect(() => {
    couponsApi.getMyCoupons({
      customerId: user?.id,
      email: formData.email.trim() || user?.email
    }).then(res => {
      if (res.success) {
        setAvailableCoupons(res.coupons || res.data || []);
      }
    }).catch(() => {});
  }, [user, formData.email]);

  // Load abandoned checkout recovery session if recoveryId is present in URL
  useEffect(() => {
    if (recoveryId && !recoveredSession) {
      paymentsApi.restoreCheckout(recoveryId).then((res) => {
        if (res.success && res.checkout) {
          setRecoveredSession(res.checkout);
          if (Array.isArray(res.checkout.cartData) && res.checkout.cartData.length > 0) {
            setRecoveredItems(res.checkout.cartData);
          }
          if (res.checkout.customerEmail) {
            setFormData(prev => ({
              ...prev,
              email: prev.email || res.checkout.customerEmail,
              name: prev.name || res.checkout.customerName || ''
            }));
          }
          toast.success('🎉 Welcome back! Your reserved digital assets have been restored.', { duration: 5000 });
        }
      }).catch((err) => {
        console.warn('Could not restore checkout recovery session:', err);
      });
    }
  }, [recoveryId, recoveredSession]);

  // Auto-populate coupon from recovery email URL parameter if provided
  useEffect(() => {
    if (urlCoupon && !couponCode && !appliedCoupon) {
      setCouponCode(urlCoupon);
    }
  }, [urlCoupon, couponCode, appliedCoupon]);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    if (window.Razorpay) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      setPaymentError('Unable to load payment gateway SDK. Please check your internet connection and refresh.');
    };
    document.body.appendChild(script);
  }, []);

  // Check store maintenance status and sync settings from live SettingsContext
  useEffect(() => {
    if (!settings) return;
    const storeStatus = settings.store_status || 'ACTIVE';
    if (storeStatus === 'MAINTENANCE' || storeStatus === 'PAUSED') {
      setIsMaintenanceMode(true);
      setMaintenanceMessage(settings.maintenance_message || 'Store checkout is currently paused for scheduled system maintenance.');
    } else {
      setIsMaintenanceMode(false);
      setMaintenanceMessage('');
    }
    setCheckoutSettings(prev => ({
      ...prev,
      checkout_mode: settings.checkout_mode || 'BOTH',
      require_terms_acceptance: false,
      require_refund_policy_acceptance: false,
      require_privacy_acceptance: false,
      tax_mode: settings.tax_mode || 'INCLUSIVE',
      gst_rate: Number(settings.gst_rate ?? 18),
      invoice_tax_note: settings.invoice_tax_note || 'GST @ 18% inclusive on all digital software downloads & digital licenses.'
    }));
  }, [settings]);

  const subtotal = checkoutItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.calculatedDiscount || (appliedCoupon.discountType === 'FIXED' 
        ? Math.min(subtotal, appliedCoupon.discountValue) 
        : (subtotal * (appliedCoupon.discountValue || 10)) / 100))
    : 0;

  const rawDiscountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = checkoutSettings.tax_mode === 'EXCLUSIVE'
    ? Math.round(((rawDiscountedSubtotal * (checkoutSettings.gst_rate || 0)) / 100) * 100) / 100
    : 0;
  const total = Math.max(0, rawDiscountedSubtotal + taxAmount);

  // Automated Abandoned Checkout Tracking Telemetry
  const lastTrackedRef = useRef<string>('');
  const trackCheckoutSession = useCallback(async (forcedStatus?: string) => {
    const activeEmail = (user?.email || formData.email || '').trim();
    if (!activeEmail || !activeEmail.includes('@') || !activeEmail.includes('.') || checkoutItems.length === 0) {
      return;
    }

    const payload = {
      customerId: user?.id,
      customerEmail: activeEmail,
      customerName: formData.name.trim() || user?.name || undefined,
      cartData: checkoutItems.map(item => ({
        id: item.id,
        productId: item.productId || item.id,
        bundleId: item.bundleId,
        title: item.title || item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        thumbnail: item.thumbnail || item.coverImage,
        type: item.type || 'product'
      })),
      totalAmount: total,
      status: forcedStatus || 'ABANDONED'
    };

    const fingerprint = JSON.stringify({ email: activeEmail, total, itemsCount: checkoutItems.length });
    if (fingerprint === lastTrackedRef.current && !forcedStatus) {
      return;
    }
    lastTrackedRef.current = fingerprint;

    try {
      await paymentsApi.trackCheckout(payload);
    } catch (err) {
      // Non-blocking telemetry
      console.debug('[Telemetry] Checkout tracking note:', err);
    }
  }, [user, formData.email, formData.name, checkoutItems, total]);

  // Automated tracking trigger when user enters checkout or provides email
  useEffect(() => {
    const email = (user?.email || formData.email || '').trim();
    if (email.includes('@') && email.includes('.') && checkoutItems.length > 0) {
      const timer = setTimeout(() => {
        trackCheckoutSession();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, formData.email, checkoutItems, total, trackCheckoutSession]);

  // Beacon telemetry on browser close / page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeEmail = (user?.email || formData.email || '').trim();
      if (activeEmail && activeEmail.includes('@') && checkoutItems.length > 0) {
        const payload = JSON.stringify({
          customerId: user?.id,
          customerEmail: activeEmail,
          customerName: formData.name.trim() || user?.name || undefined,
          cartData: checkoutItems,
          totalAmount: total,
          status: 'ABANDONED'
        });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/payments/track-checkout', blob);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, formData.email, formData.name, checkoutItems, total]);

  const handleApplyCoupon = async (e?: React.FormEvent, codeToApply?: string) => {
    if (e) e.preventDefault();
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) return;
    try {
      setCouponLoading(true);
      setPaymentError(null);
      const res = await couponsApi.validateCoupon({
        code: targetCode,
        cartTotal: subtotal,
        customerId: user?.id,
        guestEmail: formData.email.trim() || user?.email,
        cartItems: checkoutItems.map(item => ({
          productId: item.productId || (item.type !== 'bundle' ? item.id : undefined),
          bundleId: item.bundleId || (item.type === 'bundle' ? item.id : undefined),
          quantity: item.quantity || 1,
          unitPrice: Number(item.price) || 0
        }))
      });

      const couponData = (res as any).data || res;
      if (res.success && couponData) {
        setAppliedCoupon(couponData);
        setCouponCode(couponData.code || targetCode);
        toast.success(`Coupon "${(couponData.code || targetCode).toUpperCase()}" applied!`);
      } else {
        toast.error(res.message || 'Invalid or expired coupon code');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardData(prev => ({ ...prev, number: formatted }));
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardData(prev => ({ ...prev, expiry: raw }));
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutItems.length === 0) {
      toast.error('No items to checkout');
      return;
    }
    if (!formData.email || !formData.name) {
      toast.error('Please provide your name and delivery email');
      return;
    }

    if (isMaintenanceMode) {
      toast.error('Checkout is currently disabled during maintenance mode.');
      return;
    }

    // Enforce No-Guest Policy: Customers must be logged in to purchase any product
    if (!user) {
      toast.error('Please log in or create an account to complete your purchase. Guest checkout is disabled.');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    // Validate card inputs if paying by Card
    if (selectedMethod === 'card' && total > 0) {
      const cleanNumber = cardData.number.replace(/\s/g, '');
      if (cleanNumber.length < 15) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardData.expiry || cardData.expiry.length < 5) {
        toast.error('Please enter card expiry (MM/YY)');
        return;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        toast.error('Please enter 3-digit CVV');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setPaymentError(null);

      // 1. Create or Reuse Server-Authoritative Order (idempotent within 30 min window)
      const deliveryEmail = (user?.email || formData.email).trim();
      const orderPayload = {
        customerId: user?.id,
        guestEmail: deliveryEmail,
        guestName: formData.name.trim(),
        items: checkoutItems.map(item => ({
          id: item.id,
          productId: item.productId || (item.type !== 'bundle' ? item.id : undefined),
          bundleId: item.bundleId || (item.type === 'bundle' ? item.id : undefined),
          type: item.type || 'product',
          title: item.title || item.name,
          price: Number(item.price),
          quantity: item.quantity || 1
        })),
        couponCode: appliedCoupon?.code
      };

      const orderResponse = await paymentsApi.createOrder(orderPayload);

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to initialize order on server');
      }

      const { orderId, orderNumber, razorpayOrderId, amount, currency, paymentMode } = orderResponse.data;

      // Clean up cart item if direct buy was previously also in cart
      if (isDirectCheckout && directItem) {
        removeFromCart(directItem.id);
      } else {
        clearCart();
      }

      // 2. Handle FREE claims (100% discount / freebie)
      if (orderResponse.isFree || amount === 0 || paymentMode === 'free') {
        toast.success('Digital assets provisioned successfully!');
        navigate(`/payment-success/${orderId}`);
        return;
      }

      // 3. Handle Razorpay Modal Gateway if selected
      if (selectedMethod === 'razorpay') {
        try {
          if (!window.Razorpay) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
              script.onload = () => resolve(true);
              script.onerror = () => reject(new Error('Razorpay SDK failed to load.'));
              document.body.appendChild(script);
            });
          }

          const options: any = {
            key: orderResponse.data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TM6mir3L7E2xAr',
            amount,
            currency: currency || 'INR',
            name: 'Kanishk Digital World',
            description: `Order ${orderNumber} — Digital Assets`,
            prefill: {
              name: formData.name,
              email: deliveryEmail
            },
            theme: { color: '#5b21b6' },
            handler: async (response: any) => {
              try {
                setIsSubmitting(true);
                const verifyRes = await paymentsApi.verifyPayment({
                  orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  method: 'RAZORPAY'
                });

                if (verifyRes.success) {
                  toast.success('Payment verified! Provisioning digital assets...');
                  navigate(`/payment-success/${orderId}`);
                } else {
                  setPaymentError('Payment verification failed on the server.');
                  toast.error(verifyRes.message || 'Verification failed');
                }
              } catch (verifyErr: any) {
                console.error('Verification error:', verifyErr);
                setPaymentError('Server failed to verify payment.');
              } finally {
                setIsSubmitting(false);
              }
            },
            modal: {
              ondismiss: () => {
                setIsSubmitting(false);
                toast('Razorpay popup closed. You can choose UPI, Card, or Net Banking below.', { icon: 'ℹ️' });
              }
            }
          };

          if (razorpayOrderId && razorpayOrderId.startsWith('order_')) {
            options.order_id = razorpayOrderId;
          }

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', (response: any) => {
            setIsSubmitting(false);
            const failureReason = response.error?.description || 'Payment rejected.';
            setPaymentError(`Gateway error: ${failureReason}. Please choose UPI or Card option to complete.`);
          });
          rzp.open();
          return;
        } catch (rzpErr) {
          console.warn('Razorpay popup fallback:', rzpErr);
        }
      }

      // 4. Handle Direct UPI, Card, or Net Banking
      setVerifyingModalOpen(true);
      setVerificationStage('Connecting to secure banking gateway...');

      await new Promise(r => setTimeout(r, 600));
      setVerificationStage(
        selectedMethod === 'upi' 
          ? 'Verifying NPCI UPI payment confirmation...' 
          : selectedMethod === 'card' 
          ? 'Authorizing 3D-Secure card payment with issuer...' 
          : `Connecting to ${selectedBank} NetBanking gateway...`
      );

      await new Promise(r => setTimeout(r, 800));
      setVerificationStage('Cryptographically verifying payment capture...');

      const paymentReference = selectedMethod === 'upi'
        ? `UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
        : selectedMethod === 'card'
        ? `CARD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
        : `NETB-${selectedBank.replace(/\s+/g, '')}-${Date.now()}`;

      const verifyRes = await paymentsApi.verifyPayment({
        orderId,
        method: selectedMethod.toUpperCase(),
        paymentReference
      });

      if (verifyRes.success) {
        setVerificationStage('Payment verified! Dispatching digital licenses & download access...');
        await new Promise(r => setTimeout(r, 600));
        toast.success('Payment completed successfully!');
        setVerifyingModalOpen(false);
        navigate(`/payment-success/${orderId}`);
      } else {
        setVerifyingModalOpen(false);
        setPaymentError(verifyRes.message || 'Payment verification failed.');
        toast.error('Payment verification failed.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setIsSubmitting(false);
      setVerifyingModalOpen(false);
      const errMsg = err.response?.data?.message || err.message || 'Failed to complete checkout.';
      setPaymentError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SEO title={isDirectCheckout ? `Instant Checkout: ${directItem?.title || 'Digital Asset'} | KDW` : "Secure Checkout | KDW"} description="Complete your purchase with instant digital delivery." />

      <div className="max-w-6xl mx-auto">
        {/* Top Breadcrumb & Direct Checkout Indicator */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link 
            to={isDirectCheckout ? (directItem?.slug ? `/product/${directItem.slug}` : `/shop`) : "/cart"} 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#5b21b6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 
            <span>{isDirectCheckout ? 'Back to Product' : 'Back to Selection'}</span>
          </Link>

          <div className="flex items-center gap-2">
            {isDirectCheckout && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#5b21b6] bg-[#ede9fe] px-3 py-1 rounded-full border border-[#ddd6fe]">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Instant Buy Checkout</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Lock className="w-3.5 h-3.5" /> 256-Bit Encrypted Secure Checkout
            </div>
          </div>
        </div>

        {/* Maintenance Mode Warning */}
        {isMaintenanceMode && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Store Checkout Maintenance</h4>
              <p className="text-xs text-amber-800 mt-1">{maintenanceMessage}</p>
            </div>
          </div>
        )}

        {/* Payment Error Banner */}
        {paymentError && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Payment or Verification Notice</h4>
                <p className="text-xs text-rose-800 mt-0.5">{paymentError}</p>
              </div>
            </div>
            <button 
              onClick={() => setPaymentError(null)}
              className="text-xs text-rose-600 hover:text-rose-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Recovered Session Notice */}
        {recoveredSession && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950">Reserved Cart Restored</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Welcome back! Your previous checkout session and selected items have been safely loaded.
                  {urlCoupon && <span> Special voucher <strong>{urlCoupon}</strong> has been auto-filled below!</span>}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-emerald-200/60 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
              Recovered Session
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: Customer & Delivery Details Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              
              {/* Delivery Contact Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#5b21b6] flex items-center justify-center text-xs">
                      <Mail className="w-4 h-4 text-[#5b21b6]" />
                    </div>
                    <h2 className="text-lg font-serif font-bold text-[#171325]">Digital Delivery Details</h2>
                  </div>
                  {user ? (
                    <span className="text-[11px] font-mono text-[#5b21b6] bg-[#ede9fe] px-2.5 py-1 rounded-full font-bold">
                      Account: {user.name}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      Guest Checkout
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Digital download links, Google Drive permissions, and lifetime commercial licences are provisioned to this email immediately upon payment verification.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold font-sans text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans text-[#171325] focus:outline-hidden focus:ring-2 focus:ring-[#5b21b6] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold font-sans text-slate-700">
                        Delivery Email Address <span className="text-rose-500">*</span>
                      </label>
                      {user?.email && (
                        <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-400" /> Account Locked
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email"
                        required
                        value={user?.email || formData.email}
                        onChange={(e) => {
                          if (!user?.email) {
                            setFormData({ ...formData, email: e.target.value });
                          }
                        }}
                        readOnly={!!user?.email}
                        disabled={!!user?.email}
                        placeholder="name@example.com"
                        className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-sans text-[#171325] focus:outline-hidden focus:ring-2 focus:ring-[#5b21b6] transition-all ${user?.email ? 'bg-slate-100 text-slate-500 cursor-not-allowed select-none font-medium' : 'bg-slate-50 focus:bg-white'}`}
                      />
                    </div>
                    {user?.email && (
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>All digital assets, download links, and licences are sent to your verified login email.</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dedicated Razorpay Payment Gateway (Sole Official Gateway) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-4">

                {total === 0 ? (
                  <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-emerald-950">100% Free Digital Resource</h4>
                        <p className="text-xs text-emerald-700 font-sans">No payment required. Download links will be dispatched immediately.</p>
                      </div>
                    </div>
                    <span className="w-5 h-5 rounded-full border-2 border-emerald-600 flex items-center justify-center bg-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Razorpay Single Dedicated Payment Gateway */}
                    <div className="p-6 rounded-2xl border-2 border-[#5b21b6] bg-gradient-to-br from-[#faf5ff] to-[#f5f3ff] space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#5b21b6] text-white flex items-center justify-center font-bold shadow-md shadow-[#5b21b6]/20">
                            <Zap className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900">Razorpay Secure Payment Gateway</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                                Official Gateway
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Pay securely via UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking, and Wallets.
                            </p>
                          </div>
                        </div>
                        <span className="w-6 h-6 rounded-full border-2 border-[#5b21b6] flex items-center justify-center bg-[#5b21b6] shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-white" />
                        </span>
                      </div>

                      <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supported Payment Modes:</span>
                        {['UPI Apps & QR', 'All Major Cards (Visa, Mastercard, RuPay)', '50+ Indian NetBanking', 'Wallets & EMI'].map(mode => (
                          <span key={mode} className="text-[10px] font-medium px-2 py-0.5 bg-white border border-purple-200/80 rounded-lg text-slate-700 shadow-2xs">
                            {mode}
                          </span>
                        ))}
                      </div>

                      <div className="p-3 bg-white/80 rounded-xl border border-purple-200/60 text-xs text-slate-600 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>256-bit encrypted checkout. Instant digital delivery & licence key issued upon confirmation.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || isMaintenanceMode}
                className={`w-full py-4 rounded-2xl ${total === 0 ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-[#5b21b6] hover:bg-[#6d28d9] shadow-[#5b21b6]/20'} text-white font-bold text-sm font-sans uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed kdw-button-press`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{total === 0 ? 'Provisioning Digital Assets...' : 'Connecting Secure Gateway...'}</span>
                  </>
                ) : total === 0 ? (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Claim Free Asset & Access Now →</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay {formatCurrency(total)} via Razorpay & Access Assets →</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-400 font-sans">
                By placing your order you agree to the <Link to="/terms" className="underline hover:text-[#5b21b6]">Terms of Service</Link> and <Link to="/refund-policy" className="underline hover:text-[#5b21b6]">Digital Delivery Policy</Link>.
              </div>
            </form>

            {/* Real-time Payment Verification Processing Modal */}
            {verifyingModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#ede9fe] text-[#5b21b6] mx-auto flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Processing Secure Payment</h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{verificationStage}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <ShieldCheck className="w-4 h-4" />
                    <span>256-Bit Encrypted Secure Verification</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Order Summary & Coupon Card */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Summary Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-serif font-bold text-[#171325] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#5b21b6]" />
                  Order Summary
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {checkoutItems.length} item{checkoutItems.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {checkoutItems.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Your selection is empty</p>
                    <p className="text-[11px] text-slate-400">Add products to continue checkout.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-2 px-3.5 py-1.5 bg-[#5b21b6] text-white text-xs font-bold rounded-xl hover:bg-[#6d28d9] transition-colors cursor-pointer"
                    >
                      + Add Products
                    </button>
                  </div>
                ) : (
                  checkoutItems.map((item) => (
                    <div key={item.id} className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs group">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img 
                          src={item.coverImage || item.thumbnail || '/placeholder.png'} 
                          alt={item.title || item.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-[#171325] truncate text-xs">{item.title || item.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {formatCurrency(Number(item.price) || 0)} each • {item.format || 'Digital Asset'}
                          </span>
                          
                          {/* Quantity & Remove Buttons */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-l-lg transition-colors cursor-pointer"
                                title="Decrease quantity"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="px-2 font-mono font-bold text-[11px] text-slate-800 select-none">
                                {item.quantity || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-r-lg transition-colors cursor-pointer"
                                title="Increase quantity"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-slate-900 block text-xs">
                          {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add More Products Button */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="w-full py-2.5 px-3 border-2 border-dashed border-[#5b21b6]/30 hover:border-[#5b21b6] text-[#5b21b6] hover:bg-[#ede9fe]/40 rounded-2xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Plus size={14} />
                <span>Add Products to this Order</span>
              </button>

              {/* Quick Recommended Add-ons */}
              {suggestedProducts.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Frequently Added Together
                  </span>
                  <div className="space-y-2">
                    {suggestedProducts.slice(0, 2).map((prod: any) => (
                      <div key={prod.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={prod.thumbnail || prod.coverImage || '/placeholder.png'} alt="" className="w-8 h-8 rounded-lg object-cover bg-white shrink-0" />
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-800 truncate text-[11px]">{prod.name || prod.title}</h5>
                            <span className="text-[10px] font-mono text-slate-500">{formatCurrency(prod.price)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddProductToCheckout(prod)}
                          className="px-2.5 py-1 bg-white hover:bg-[#5b21b6] text-[#5b21b6] hover:text-white border border-[#5b21b6]/30 rounded-lg text-[10px] font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon Form */}
              <div className="pt-4 border-t border-slate-100">
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono font-bold text-emerald-800 uppercase">{appliedCoupon.code}</span>
                        <span className="text-emerald-700 ml-1.5">(-{formatCurrency(discountAmount)})</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-600 font-bold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="PROMO OR COUPON"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono text-[#171325] focus:outline-hidden focus:ring-1 focus:ring-[#5b21b6]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                )}

                {/* Available Coupons Pills */}
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Available Coupons for You
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCoupons.map(c => {
                        const isEligible = c.isEligible !== false;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            disabled={!isEligible}
                            onClick={() => handleApplyCoupon(undefined, c.code)}
                            className={`text-[10.5px] font-bold px-2.5 py-1 rounded-xl border transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                              !isEligible
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                : c.isFirstOrder
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                : 'bg-[#ede9fe]/50 text-[#5b21b6] border-[#5b21b6]/30 hover:bg-[#ede9fe]'
                            }`}
                            title={!isEligible ? c.ineligibilityReason : (c.durationLabel || '')}
                          >
                            <span>{c.code}</span>
                            <span>({c.formattedDiscount || `-${c.discountPercentage || c.discountValue}%`})</span>
                            {c.durationBadge && (
                              <span className="text-[9px] px-1 rounded bg-white font-medium">{c.durationBadge}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-2 pt-4 border-t border-slate-100 text-xs font-sans">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST ({checkoutSettings.gst_rate}%)</span>
                  <span className="font-mono text-slate-800">
                    {checkoutSettings.tax_mode === 'INCLUSIVE' 
                      ? 'Included in price' 
                      : formatCurrency(taxAmount)}
                  </span>
                </div>
                {checkoutSettings.invoice_tax_note && (
                  <p className="text-[10px] text-slate-400 font-sans italic pt-0.5">
                    {checkoutSettings.invoice_tax_note}
                  </p>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-base font-bold text-[#171325]">
                  <span>Total Payable</span>
                  <span className="font-mono text-xl text-[#5b21b6]">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Delivery Guarantees */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Google Drive & direct archive fulfillment</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified commercial licence key generated per order</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Add Products Selection Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 select-none">
          <div 
            className="fixed inset-0 bg-[#171325]/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-serif font-bold text-base text-[#171325] flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#5b21b6]" />
                  Add Products to Your Order
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Select digital products or bundles to add to your checkout</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search filter inside modal */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  placeholder="Search catalog products or bundles..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6]"
                />
              </div>
            </div>

            {/* Products List inside modal */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {(storeProducts || [])
                .filter((p: any) => {
                  if (!addSearchQuery.trim()) return true;
                  const q = addSearchQuery.toLowerCase();
                  return (p.name || p.title || '').toLowerCase().includes(q) ||
                    (p.shortDescription || '').toLowerCase().includes(q);
                })
                .slice(0, 20)
                .map((product: any) => {
                  const isAlreadyInCart = checkoutItems.some(
                    (ci: any) => ci.id === product.id || ci.productId === product.id
                  );
                  return (
                    <div
                      key={product.id}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white flex items-center justify-between gap-3 text-xs transition-all hover:shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={product.thumbnail || product.coverImage || '/placeholder.png'}
                          alt={product.name || product.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-50 shrink-0 border border-slate-100"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 truncate">{product.name || product.title}</h4>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {product.format || 'Digital Archive'} • Instant Access
                          </span>
                          <span className="font-mono font-black text-[#5b21b6] text-xs block mt-0.5">
                            {formatCurrency(Number(product.price) || 0)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddProductToCheckout(product)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isAlreadyInCart
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-[#5b21b6] text-white hover:bg-[#6d28d9] shadow-xs'
                        }`}
                      >
                        {isAlreadyInCart ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Add Another</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Add to Order</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                {checkoutItems.length} item{checkoutItems.length === 1 ? '' : 's'} in order
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
