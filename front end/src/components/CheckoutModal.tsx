import { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, CheckCircle2, Loader2, QrCode, Smartphone, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
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

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    coverImage: string;
    type?: string;
  };
  deliveryEmail?: string;
}

export default function CheckoutModal({ isOpen, onClose, product, deliveryEmail }: CheckoutModalProps) {
  const [paymentState, setPaymentState] = useState<'idle' | 'waiting' | 'verifying' | 'success'>('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addOrder } = useStore();
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discountPercentage: number} | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Price is now strictly handled in INR
  const priceInr = product.price;
  const discountAmount = appliedCoupon ? (priceInr * appliedCoupon.discountPercentage) / 100 : 0;
  const finalTotal = priceInr - discountAmount;

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/coupons')
        .then(res => {
          if (res.data.success) setAvailableCoupons(res.data.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleApplyCoupon = async (e?: React.FormEvent, codeToApply?: string) => {
    if (e) e.preventDefault();
    const code = codeToApply || couponCode;
    if (!code.trim()) return;
    
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await axios.post('/api/coupons/validate', { code });
      if (res.data.success) {
        setAppliedCoupon(res.data.data);
        setCouponCode(res.data.data.code);
        setCouponError('');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  if (!isOpen) return null;

  const handlePayment = async () => {
    setPaymentState('waiting');
    setError('');

    try {
      // The backend will enforce authentication via HttpOnly cookies

      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      let orderData;
      try {
        const orderResponse = await axios.post('/api/payments/create-order', {
          items: [{ 
            id: product.id,
            productId: product.type !== 'bundle' ? product.id : undefined,
            bundleId: product.type === 'bundle' ? product.id : undefined,
            type: product.type || 'product',
            name: product.title,
            price: product.price,
            quantity: 1 
          }],
          customerId: user?.id,
          guestName: user?.name || 'Guest User',
          guestEmail: deliveryEmail || 'guest@example.com',
          couponCode: appliedCoupon?.code
        });
        
        if (!orderResponse.data.success) {
          throw new Error(orderResponse.data.message);
        }
        orderData = { ...orderResponse.data.data, isFree: orderResponse.data.isFree };
      } catch (err: any) {
        const apiError = err.response?.data?.message || err.message || 'Failed to create order on server.';
        throw new Error(apiError);
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
              items: [product],
              total: finalTotal,
              status: 'completed'
            };
            addOrder(order);
            setPaymentState('success');
            
            setTimeout(() => {
              onClose();
              navigate(`/payment-success/${order.id}`);
              setTimeout(() => setPaymentState('idle'), 500);
            }, 1500);
          } else {
            throw new Error(verifyRes.data.message || 'Verification failed');
          }
        } catch (err: any) {
          setError(err.response?.data?.message || err.message || 'Payment verification failed.');
          setPaymentState('idle');
        }
      };

      if (orderData.isFree || orderData.paymentMode === 'free') {
        const order = {
          id: orderData.orderId,
          date: new Date().toISOString(),
          items: [product],
          total: 0,
          status: 'completed'
        };
        addOrder(order);
        setPaymentState('success');
        setTimeout(() => {
          onClose();
          navigate(`/payment-success/${order.id}`);
          setTimeout(() => setPaymentState('idle'), 500);
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
        description: product.title,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          await verifyPaymentOnServer(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: ''
        },
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: function() {
            setPaymentState('idle');
          }
        }
      };

      if (!options.key) {
        throw new Error("Razorpay Key ID is not configured in the frontend environment.");
      }



      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response.error.description);
        setPaymentState('idle');
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message || 'An error occurred during payment');
      setPaymentState('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock size={20} className="text-slate-700" />
            {finalTotal === 0 ? 'Claim Free Asset' : 'Secure UPI Checkout'}
          </h2>
          {paymentState === 'idle' && (
            <button 
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentState === 'success' ? (
            <div className="py-10 flex flex-col items-center text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <CheckCircle2 size={40} className="text-success" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
              <p className="text-slate-600">Your order has been verified.</p>
              <p className="text-sm text-slate-500 mt-6 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <Loader2 size={14} className="animate-spin" /> Redirecting to receipt...
              </p>
            </div>
          ) : paymentState === 'waiting' || paymentState === 'verifying' ? (
            <div className="py-8 flex flex-col items-center text-center animate-in fade-in duration-300">
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
              <p className="text-slate-600">
                {paymentState === 'waiting' 
                  ? `Please complete the payment in the Razorpay window.` 
                  : 'Verifying signature with bank securely...'}
              </p>
            </div>
          ) : (
            <>
              {error && <div className="p-3 mb-4 text-sm font-bold bg-red-100 text-red-600 rounded-lg text-center">{error}</div>}
              {/* Order Summary */}
              <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100 shadow-sm">
                <img src={product.coverImage} alt={product.title} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 line-clamp-1">{product.title}</h4>
                  <div className="text-primary font-bold text-lg">
                    {formatCurrency(product.price)}
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
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
                      className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm uppercase font-medium disabled:bg-slate-100"
                    />
                  </div>
                  {!appliedCoupon ? (
                    <button type="submit" disabled={isApplyingCoupon} className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 disabled:opacity-50">Apply</button>
                  ) : (
                    <button type="button" onClick={handleRemoveCoupon} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-sm flex items-center gap-1">
                      <X size={16} />
                    </button>
                  )}
                </form>
                {couponError && <p className="text-red-500 text-xs font-bold mt-2">{couponError}</p>}
                
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableCoupons.map(c => (
                      <button 
                        key={c.code}
                        type="button"
                        onClick={() => handleApplyCoupon(undefined, c.code)}
                        className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors uppercase tracking-wider"
                      >
                        {c.code} (-{c.discountPercentage}%)
                      </button>
                    ))}
                  </div>
                )}
                
                {appliedCoupon && (
                  <div className="mt-3 flex justify-between items-center text-sm font-medium border-t border-slate-100 pt-3">
                    <span className="text-slate-600">Subtotal: {formatCurrency(priceInr)}</span>
                    <span className="text-success">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Pay Button */}
              <button 
                onClick={handlePayment}
                className="w-full py-4 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Lock size={18} />
                {finalTotal === 0 ? 'Claim Free Asset' : `Pay ${formatCurrency(finalTotal)} Securely`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
