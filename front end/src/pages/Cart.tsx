import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Lock, ShieldCheck, Tag, X, CheckCircle2, Loader2, Smartphone, AlertCircle, Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { formatCurrency } from '../utils/currency';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Cart() {
  const { cart, removeFromCart, clearCart, addOrder } = useStore();
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

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const type = appliedCoupon.discountType || 'PERCENTAGE';
    const val = Number(appliedCoupon.discountValue || appliedCoupon.discountPercentage || 0);
    if (type === 'FIXED') {
      return Math.min(total, val);
    }
    return (total * val) / 100;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = Math.max(0, total - discountAmount);

  useEffect(() => {
    if (user?.email) {
      setDeliveryEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get('/api/coupons');
        if (res.data.success) {
          setAvailableCoupons(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch coupons');
      }
    };
    fetchCoupons();
  }, []);

  const handleApplyCoupon = async (e?: React.FormEvent, codeToApply?: string) => {
    if (e) e.preventDefault();
    const code = codeToApply || couponCode;
    if (!code.trim()) return;
    
    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await axios.post('/api/coupons/validate', { code });
      if (res.data.success) {
        setAppliedCoupon(res.data.data);
        setCouponCode(res.data.data.code);
        setCouponError('');
        setCouponSuccess(res.data.message || `🎉 Congratulations! Discount applied successfully!`);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setCouponSuccess('');
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

      const verifyPaymentOnServer = async (razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) => {
        try {
          setPaymentState('verifying');
          
          const verifyRes = await axios.post('/api/payments/verify-payment', {
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

      if (orderData.paymentMode === 'mock') {
        setPaymentState('waiting');
        setTimeout(() => {
          verifyPaymentOnServer(
            orderData.razorpayOrderId,
            'pay_mock_' + Date.now(),
            'sig_mock_dummy'
          );
        }, 1500);
        return;
      }

      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', 
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Kanishk Digital World',
        description: 'Complete your purchase',
        order_id: orderData.razorpayOrderId,
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
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: function() {
            setPaymentState('idle');
            setPaymentError('Payment cancelled. Your cart is still saved.');
          }
        }
      };

      if (!options.key) throw new Error("Razorpay Key ID is not configured.");

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        setPaymentError('Payment failed. No order was completed. Please try again.');
        setPaymentState('idle');
      });
      paymentObject.open();

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
                        <div className="flex justify-end mt-4">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-danger transition-colors"
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
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
                    
                    <div className="space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-6 mb-6">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(total)}</span>
                      </div>
                      
                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-success font-medium">
                          <span>Discount ({appliedCoupon.code})</span>
                          <span>-{formatCurrency(discountAmount)}</span>
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
                        <div className="mt-3">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Available Coupons</span>
                          <div className="flex flex-wrap gap-1.5">
                            {availableCoupons.map((c) => (
                              <button
                                key={c.id || c.code}
                                type="button"
                                onClick={() => handleApplyCoupon(undefined, c.code)}
                                className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Tag size={12} /> {c.code} ({c.discountValue}{c.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF)
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mb-8">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="text-3xl font-black text-slate-900">{formatCurrency(finalTotal)}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-6 mb-6">
                      <label htmlFor="deliveryEmail" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                        Delivery Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          id="deliveryEmail"
                          value={deliveryEmail}
                          onChange={(e) => {
                            if (!user?.email) {
                              setDeliveryEmail(e.target.value);
                              if (emailError) setEmailError('');
                            }
                          }}
                          readOnly={!!user?.email}
                          disabled={!!user?.email}
                          placeholder="Where to send your files"
                          className={`w-full pl-10 pr-4 py-3 border ${emailError ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'} rounded-xl focus:outline-none focus:ring-4 transition-all ${user?.email ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-medium' : 'bg-white'}`}
                          required
                        />
                      </div>
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
