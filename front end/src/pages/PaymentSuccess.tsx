import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Package, Mail, RefreshCw, LifeBuoy, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axios.get('/api/purchases');
        if (res.data.success && res.data.purchases) {
          const matched = res.data.purchases.find((p: any) => p.orderId === orderId || p.orderNumber === orderId || p.id === orderId);
          if (matched) {
            setOrder(matched);
          }
        }
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    let timer: any;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResendEmail = async () => {
    if (!orderId) return;
    if (!isAuthenticated) {
      toast.error("Please login to resend your delivery email.");
      return;
    }
    if (cooldownSeconds > 0) {
      toast.error(`Please wait ${cooldownSeconds}s before resending.`);
      return;
    }

    setResendingEmail(true);
    try {
      const res = await axios.post(`/api/purchases/resend-email/${orderId || order?.orderId}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Access email resent successfully!');
        setCooldownSeconds(60);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend access email';
      toast.error(msg);
      if (err.response?.status === 429) {
        setCooldownSeconds(60);
      }
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen py-16 md:py-24 px-6 bg-slate-50 flex items-center justify-center font-sans">
      <SEO title="Payment Successful | Kanishk Digital World" description="Your payment was successful and your digital product access has been generated." />
      
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          
          {/* Success Banner */}
          <div className="bg-success/10 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-success"></div>
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-success/20">
              <CheckCircle2 size={40} className="text-success" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">Payment Successful!</h1>
            <p className="text-slate-600 font-medium text-base">Your digital order has been processed and access granted.</p>
          </div>

          <div className="p-8 md:p-10 space-y-8">
            
            {/* Order Ref */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Reference</p>
                <p className="font-mono font-bold text-slate-900 text-lg">{order?.orderNumber || orderId || 'ORD-COMPLETED'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Access Status</p>
                <span className="px-3 py-1 bg-success/10 text-success font-bold text-xs rounded-full uppercase">
                  READY IN LIBRARY
                </span>
              </div>
            </div>

            {/* Email Notification Card */}
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
              <div className="flex items-center gap-3 text-blue-900 font-bold">
                <Mail size={20} className="text-blue-600" />
                <span>Access Email Sent</span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                An email containing your direct download links has been dispatched to your email address ({user?.email || 'your registered email'}).
              </p>

              <button 
                onClick={handleResendEmail}
                disabled={resendingEmail || cooldownSeconds > 0}
                className="w-full py-2.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {resendingEmail ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {cooldownSeconds > 0 ? `Resend Email (${cooldownSeconds}s)` : 'Resend Access Email'}
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3">
              <Link 
                to="/dashboard?tab=library" 
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Package size={20} /> Open My Library <ArrowRight size={18} />
              </Link>
              
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to="/categories/all-products" 
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center transition-colors"
                >
                  Continue Shopping
                </Link>
                <Link 
                  to="/support/ticket" 
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                >
                  <LifeBuoy size={14} /> Contact Support
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
