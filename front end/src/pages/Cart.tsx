import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Lock, ShieldCheck, Tag, X, CheckCircle2, Loader2, Smartphone, AlertCircle, Mail, Plus, Minus, Gift } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { formatCurrency } from '../utils/currency';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { paymentsApi } from '../api';
import { toast } from 'react-hot-toast';
import { trackOfferView, trackOfferClick } from '../utils/offerTracking';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity, clearCart, addOrder } = useStore();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const [paymentState, setPaymentState] = useState<'idle' | 'waiting' | 'verifying' | 'success'>('idle');
  const [paymentError, setPaymentError] = useState('');

  // Active Promotional Offers
  const [appliedOffers, setAppliedOffers] = useState<any[]>([]);
  const [promotionDiscount, setPromotionDiscount] = useState<number>(0);

  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.calculatedDiscount !== undefined) {
      return Number(appliedCoupon.calculatedDiscount);
    }
    const type = appliedCoupon.discountType || 'PERCENTAGE';
    const val = Number(appliedCoupon.discountValue || appliedCoupon.discountPercentage || 0);
    if (type === 'FIXED') {
      return Math.min(total, val);
    }
    return (total * val) / 100;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = Math.max(0, total - (promotionDiscount + discountAmount));

  // Evaluate Promotional Offers on Cart change
  useEffect(() => {
    const evaluatePromos = async () => {
      if (cart.length === 0) {
        setAppliedOffers([]);
        setPromotionDiscount(0);
        return;
      }

      try {
        const res = await axios.post('/api/offers/evaluate-cart', {
          items: cart.map(item => ({
            productId: item.productId || (item.type !== 'bundle' ? item.id : undefined),
            bundleId: item.bundleId || (item.type === 'bundle' ? item.id : undefined),
            quantity: 1,
            unitPrice: item.price
          })),
          customerId: user?.id,
          guestEmail: user?.email || deliveryEmail
        });

        if (res.data.success) {
          const applied = res.data.appliedOffers || [];
          setAppliedOffers(applied);
          setPromotionDiscount(res.data.totalPromotionDiscount || 0);
          applied.forEach((appOffer: any) => {
            if (appOffer.offerId) {
              trackOfferView(appOffer.offerId);
            }
          });
        }
      } catch (err) {
        console.error('Error evaluating promotional offers:', err);
      }
    };

    evaluatePromos();
  }, [cart, user, deliveryEmail]);

  useEffect(() => {
    if (user?.email) {
      setDeliveryEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/coupons', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { customerId: user?.id, email: user?.email || deliveryEmail }
        });
        if (res.data.success) {
          setAvailableCoupons(res.data.coupons || res.data.data || []);
        }
      } catch {
        console.error('Failed to fetch coupons');
      }
    };
    fetchCoupons();
  }, [user, deliveryEmail]);

  const handleApplyCoupon = async (e?: React.FormEvent, codeToApply?: string) => {
    if (e) e.preventDefault();
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    
    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/coupons/validate', {
        code,
        cartTotal: total,
        customerId: user?.id,
        guestEmail: user?.email || deliveryEmail,
        cartItems: cart.map(item => ({
          productId: item.productId || (item.type !== 'bundle' ? item.id : undefined),
          bundleId: item.bundleId || (item.type === 'bundle' ? item.id : undefined),
          quantity: 1,
          unitPrice: Number(item.price) || 0
        }))
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (res.data.success) {
        const couponData = res.data.data || res.data;
        setAppliedCoupon(couponData);
        setCouponCode(couponData.code);
        setCouponError('');
        setCouponSuccess(res.data.message || `🎉 Coupon applied! You save ₹${couponData.calculatedDiscount}`);
        toast.success(`Coupon "${couponData.code}" applied!`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Invalid coupon code';
      setCouponError(errMsg);
      setAppliedCoupon(null);
      setCouponSuccess('');
      toast.error(errMsg);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setCouponSuccess('');
  };

  const handlePayment = async () => {
    appliedOffers.forEach((o: any) => {
      if (o.offerId) {
        trackOfferClick(o.offerId);
      }
    });

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
    setPaymentState('waiting');
    setPaymentError('');

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error('Unable to open secure payment. Please try again.');
      }

      const orderItems = cart.map(item => ({
        id: item.id,
        productId: item.type !== 'bundle' ? item.id : undefined,
        bundleId: item.type === 'bundle' ? item.id : undefined,
        type: item.type,
        name: item.title,
        price: item.price,
        quantity: 1
      }));

      let orderData;
      try {
        const orderResponse = await axios.post('/api/payments/create-order', {
          items: orderItems,
          customerId: user?.id,
          guestName: user?.name || 'Guest User',
          guestEmail: trimmedEmail,
          couponCode: appliedCoupon?.code
        });
        
        if (!orderResponse.data.success) {
          throw new Error(orderResponse.data.message);
        }
        orderData = { ...orderResponse.data.data, isFree: orderResponse.data.isFree };
      } catch (err: any) {
        throw new Error(err.response?.data?.message || err.message || 'Failed to create order on server.');
      }

      const verifyPaymentOnServer = async (razorpay_order_id?: string, razorpay_payment_id?: string, razorpay_signature?: string) => {
        try {
          setPaymentState('verifying');
          
          const verifyRes = await axios.post('/api/payments/verify-payment', {
            orderId: orderData.orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
          });

          if (verifyRes.data.success) {
            const order = {
              id: orderData.orderId,
              date: new Date().toISOString(),
              items: [...cart],
              total: finalTotal,
              status: 'completed'
            };
            addOrder(order);
            setPaymentState('success');
            
            setTimeout(() => {
              clearCart();
              navigate(`/payment-success/${order.id}`);
            }, 1500);
          } else {
            throw new Error(verifyRes.data.message || 'Verification failed');
          }
        } catch (err: any) {
          setPaymentError(err.response?.data?.message || err.message || 'Payment verification failed.');
          setPaymentState('idle');
        }
      };

      if (orderData.isFree || orderData.paymentMode === 'free') {
        const order = {
          id: orderData.orderId,
          date: new Date().toISOString(),
          items: [...cart],
          total: 0,
          status: 'completed'
        };
        addOrder(order);
        setPaymentState('success');
        setTimeout(() => {
          clearCart();
          navigate(`/payment-success/${order.id}`);
        }, 1500);
        return;
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId || 'rzp_test_TM6mir3L7E2xAr';

      const options: any = {
        key: razorpayKey, 
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Kanishk Digital World',
        description: 'Complete your purchase',
        handler: async function (response: any) {
          await verifyPaymentOnServer(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: user?.name || '',
          email: trimmedEmail,
          contact: ''
        },
        theme: { color: '#0284c7' },
        modal: {
          ondismiss: function() {
            setPaymentState('idle');
            setPaymentError('Payment cancelled. Your cart is still saved.');
            if (trimmedEmail && cart.length > 0) {
              paymentsApi.trackCheckout({
                customerId: user?.id,
                customerEmail: trimmedEmail,
                customerName: user?.name,
                cartData: cart.map(it => ({
                  id: it.id,
                  productId: (it as any).productId || it.id,
                  title: it.title,
                  price: Number(it.price) || 0,
                  quantity: Number(it.quantity) || 1,
                  thumbnail: it.thumbnail || (it as any).coverImage
                })),
                totalAmount: finalTotal,
                status: 'ABANDONED'
              }).catch(() => {});
            }
          }
        }
      };

      if (orderData.razorpayOrderId && orderData.razorpayOrderId.startsWith('order_')) {
        options.order_id = orderData.razorpayOrderId;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setPaymentState('idle');
        const failureReason = response.error?.description || response.error?.reason || 'Declined by bank';
        setPaymentError(`Payment failed: ${failureReason}`);

        if (trimmedEmail && cart.length > 0) {
          paymentsApi.trackCheckout({
            customerId: user?.id,
            customerEmail: trimmedEmail,
            customerName: user?.name,
            cartData: cart.map(it => ({
              id: it.id,
              productId: (it as any).productId || it.id,
              title: it.title,
              price: Number(it.price) || 0,
              quantity: Number(it.quantity) || 1,
              thumbnail: it.thumbnail || (it as any).coverImage
            })),
            totalAmount: finalTotal,
            status: 'ABANDONED'
          }).catch(() => {});
        }

        // Authoritatively notify server of payment failure
        if (orderData?.orderId) {
          paymentsApi.recordPaymentFailure({
            orderId: orderData.orderId,
            failureReason,
            failureCode: response.error?.code || 'PAYMENT_FAILED',
            failureCategory: response.error?.source || 'GATEWAY',
            paymentId: response.error?.metadata?.payment_id
          }).catch((err) => {
            console.warn('Failed to record payment failure from cart:', err);
          });
        }
      });
      rzp.open();

    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred during payment');
      setPaymentState('idle');
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-50">
      <SEO title="Your Cart | Kanishk Digital World" description="View and manage items in your shopping cart." />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
          <ShoppingCart size={32} className="text-primary" />
          Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={40} className="text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
            <p className="text-slate-600 max-w-md mx-auto mb-8">
              Looks like you haven't added any premium templates or kits to your cart yet.
            </p>
            <Button onClick={() => navigate('/shop')} size="lg">
              Explore Products
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">{cart.length} Items</span>
                  <button onClick={clearCart} className="text-sm text-danger hover:underline">Clear Cart</button>
                </div>
                <div className="p-6 space-y-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                      <Link to={item.type === 'bundle' || item.category === 'Bundle' ? `/bundles/${item.id}` : `/product/${item.id}`} className="shrink-0">
                        <img src={item.coverImage} alt={item.title} className="w-full sm:w-32 aspect-video sm:aspect-square object-cover rounded-xl border border-slate-200" />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <Link to={item.type === 'bundle' || item.category === 'Bundle' ? `/bundles/${item.id}` : `/product/${item.id}`}>
                              <h3 className="text-lg font-bold text-slate-900 hover:text-primary transition-colors">{item.title}</h3>
                            </Link>
                            <span className="text-lg font-black text-slate-900">{formatCurrency(item.price)}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{item.type === 'bundle' ? 'Premium Bundle' : (typeof item.category === 'object' ? (item.category as any).name : item.category)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, (item.quantity || 1) - 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-800 select-none">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-danger transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary & Payment */}
            <div className="w-full lg:w-[420px]">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-24 overflow-hidden">
                {paymentState === 'success' ? (
                  <div className="p-10 flex flex-col items-center text-center animate-in zoom-in duration-300 bg-success/5">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                      <CheckCircle2 size={40} className="text-success" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                    <p className="text-slate-600">Your order has been verified.</p>
                    <p className="text-sm text-slate-500 mt-6 flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200">
                      <Loader2 size={14} className="animate-spin" /> Redirecting...
                    </p>
                  </div>
                ) : paymentState === 'waiting' || paymentState === 'verifying' ? (
                  <div className="p-10 flex flex-col items-center text-center animate-in fade-in duration-300">
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {paymentState === 'waiting' ? <Smartphone size={28} className="text-primary animate-pulse" /> : <ShieldCheck size={28} className="text-primary" />}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {paymentState === 'waiting' ? 'Waiting for Payment...' : 'Payment Received!'}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {paymentState === 'waiting' 
                        ? 'Please complete the payment in the Razorpay window.' 
                        : 'Verifying signature with bank securely...'}
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-6 mb-6">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(total)}</span>
                      </div>

                      {appliedOffers.map((offer: any) => (
                        <div key={offer.offerId} className="flex justify-between items-center text-amber-600 font-medium">
                          <span className="flex items-center gap-1 text-xs sm:text-sm">
                            <Tag size={14} className="text-amber-500 shrink-0" />
                            <span>{offer.offerName}</span>
                          </span>
                          <span>-{formatCurrency(offer.discountAmount)}</span>
                        </div>
                      ))}
                      
                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-success font-medium">
                          <span>Discount ({appliedCoupon.code})</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      
                      {appliedCoupon?.freeProduct && (
                        <div className="flex justify-between items-center text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-200">
                          <span className="flex items-center gap-1.5">
                            <Gift size={14} className="text-teal-600 shrink-0" />
                            <span>Free Gift: {appliedCoupon.freeProduct.name}</span>
                          </span>
                          <span className="text-teal-800 font-extrabold uppercase">FREE</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                          <input 
                            type="text" 
                            placeholder="Discount code" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={!!appliedCoupon}
                            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm uppercase font-medium disabled:bg-slate-50"
                          />
                        </div>
                        {!appliedCoupon ? (
                          <button type="submit" disabled={isApplyingCoupon} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">Apply</button>
                        ) : (
                          <button type="button" onClick={handleRemoveCoupon} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm flex items-center gap-1 transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </form>

                      {couponSuccess && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span>{couponSuccess}</span>
                        </div>
                      )}

                      {couponError && <p className="text-red-500 text-xs font-bold mt-2">{couponError}</p>}

                      {/* Available Coupons list */}
                      {!appliedCoupon && availableCoupons.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Available Coupons for You</span>
                          <div className="flex flex-wrap gap-1.5">
                            {availableCoupons.map((c) => {
                              const isEligible = c.isEligible !== false;
                              return (
                                <button
                                  key={c.id || c.code}
                                  type="button"
                                  disabled={!isEligible}
                                  onClick={() => handleApplyCoupon(undefined, c.code)}
                                  className={`px-2.5 py-1 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    !isEligible
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                      : c.isFirstOrder
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                  }`}
                                  title={!isEligible ? c.ineligibilityReason : (c.durationLabel || '')}
                                >
                                  <Tag size={12} />
                                  <span>{c.code}</span>
                                  <span>({c.formattedDiscount || `${c.discountValue}${c.discountType === 'PERCENTAGE' || c.discountType === 'FIRST_ORDER' ? '%' : '₹'} OFF`})</span>
                                  {c.durationBadge && (
                                    <span className="text-[9px] px-1 rounded bg-white/80 font-medium">{c.durationBadge}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mb-8">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="text-3xl font-black text-slate-900">{formatCurrency(finalTotal)}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-6 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="deliveryEmail" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          Delivery Email <span className="text-red-500">*</span>
                        </label>
                        {user?.email && (
                          <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                            <Lock size={12} className="text-slate-400" /> Account Locked
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          id="deliveryEmail"
                          value={user?.email || deliveryEmail}
                          onChange={(e) => {
                            if (!user?.email) {
                              setDeliveryEmail(e.target.value);
                              if (emailError) setEmailError('');
                            }
                          }}
                          readOnly={!!user?.email}
                          disabled={!!user?.email}
                          placeholder="Where to send your files"
                          className={`w-full pl-10 pr-4 py-3 border ${emailError ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 transition-all ${user?.email ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-medium select-none' : 'bg-white'}`}
                          required
                        />
                      </div>
                      {user?.email && (
                        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Lock size={12} className="text-slate-400 shrink-0" />
                          <span>All digital assets and download tokens are provisioned to your verified login email.</span>
                        </p>
                      )}
                      {emailError && (
                        <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-2">
                          <AlertCircle size={14} /> {emailError}
                        </p>
                      )}
                    </div>

                    {paymentError && (
                      <div className="p-3 mb-4 text-sm font-bold bg-red-50 border border-red-100 text-red-600 rounded-xl text-center">
                        {paymentError}
                      </div>
                    )}

                    <Button 
                      className="w-full flex justify-center items-center gap-2 rounded-xl text-lg font-bold shadow-lg !bg-blue-600 hover:!bg-blue-700 !shadow-blue-500/25 hover:-translate-y-1 transition-all" 
                      size="lg"
                      onClick={handlePayment}
                    >
                      <Lock size={18} />
                      Pay Securely {formatCurrency(finalTotal)}
                    </Button>
                    
                    <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1 mt-4 font-medium">
                      <ShieldCheck size={14} className="text-success" /> Secure payment powered by Razorpay
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
