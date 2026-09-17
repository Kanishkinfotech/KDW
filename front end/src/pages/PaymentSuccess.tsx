import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight, Download, Mail, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';
import axios from 'axios';
import { formatCurrency } from '../utils/currency';

export default function PaymentSuccess() {
  const { orderId, orderNumber } = useParams<{ orderId?: string; orderNumber?: string }>();
  const identifier = orderNumber || orderId;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!identifier) return;
      try {
        setLoading(true);
        try {
          const res = await axios.get(`/api/orders/public/${encodeURIComponent(identifier)}`);
          if (res.data?.success && res.data.data) {
            setOrder(res.data.data);
            return;
          }
        } catch (e1) {
          // Fallback to lookup query
          try {
            const searchRes = await axios.get(`/api/orders/lookup?query=${encodeURIComponent(identifier)}`);
            if (searchRes.data?.success && searchRes.data.data) {
              setOrder(searchRes.data.data);
              return;
            }
          } catch (e2) {}
        }
      } catch (err) {
        console.error('Order query error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [identifier]);

  const isPaid = order && (
    order.status === 'PAID' || 
    order.status === 'COMPLETED' || 
    order.paymentStatus === 'PAID' || 
    order.orderStatus === 'PAID' || 
    order.orderStatus === 'FULFILLED' || 
    order.orderStatus === 'FULFILMENT_PROCESSING' ||
    order.accessStatus === 'ACTIVE' ||
    order.accessStatus === 'GRANTED' ||
    order.totalAmount === 0
  );
  const isPending = !order || (!isPaid && (order.status === 'PENDING' || order.status === 'AWAITING_VERIFICATION' || order.paymentStatus === 'PENDING'));

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-16 px-4 flex items-center justify-center font-sans">
      <SEO title="Order Status | KDW" description="Order confirmation and delivery entitlement status." />

      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#e2e8f0] shadow-sm text-center space-y-6">
        
        {loading ? (
          <div className="py-12 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#5b21b6]" />
            <p className="text-xs font-mono text-slate-400">Verifying order and entitlement records...</p>
          </div>
        ) : isPaid ? (
          <>
            {/* Green Verified Status Card (Only when verified by server) */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-emerald-700 block">
                PAYMENT VERIFIED & ENTITLEMENTS GRANTED
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                Order {order?.orderNumber || identifier}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
                Your transaction has been verified on the server. Your digital assets and download tokens are now active in your customer library.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs font-mono space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-emerald-700">VERIFIED_PAID</span>
              </div>
              <div className="flex justify-between">
                <span>Purchaser Email:</span>
                <span className="text-slate-800">{order?.customerEmail || 'Registered Account'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-[#171325]">{formatCurrency(Number(order?.totalAmount || 0))}</span>
              </div>
            </div>

            {/* License Key & Verification Direct Action */}
            {order?.licenceKeys && order.licenceKeys.length > 0 && (
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                    Commercial License Key Dispatched
                  </span>
                  <span className="text-[10px] font-mono text-purple-600">Sent to {order?.customerEmail || 'email'}</span>
                </div>

                {order.licenceKeys.map((lk: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl border border-purple-200 flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-900 truncate">{lk.key}</span>
                    <Link
                      to={`/verify-license?key=${encodeURIComponent(lk.key)}`}
                      className="px-3 py-1 bg-[#5b21b6] text-white text-[11px] font-bold font-sans rounded-lg hover:bg-[#6d28d9] transition-colors shrink-0"
                    >
                      Verify &amp; Unlock
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {order?.licenceKeys && order.licenceKeys.length > 0 ? (
                <Link
                  to={`/verify-license?key=${encodeURIComponent(order.licenceKeys[0].key)}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#5b21b6] text-white text-xs font-bold font-sans uppercase hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Verify License &amp; Download</span>
                </Link>
              ) : (
                <Link
                  to="/verify-license"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#5b21b6] text-white text-xs font-bold font-sans uppercase hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Verify License &amp; Download</span>
                </Link>
              )}
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#e2e8f0] text-slate-700 text-xs font-semibold font-sans hover:bg-slate-50 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Pending / Awaiting Confirmation (Does NOT look paid) */}
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-amber-700 block">
                ORDER RECORDED (PENDING VERIFICATION)
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#171325]">
                Order {order?.orderNumber || identifier}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
                Your order has been recorded into the persistent store. In accordance with security standards, entitlement tokens are provisioned once gateway capture verification is received.
              </p>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-left text-xs font-mono space-y-1.5 text-amber-950">
              <div className="flex justify-between">
                <span>Order State:</span>
                <span className="font-bold text-amber-800">PENDING_PAYMENT_VERIFICATION</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Email:</span>
                <span>{order?.customerEmail || 'Provided at checkout'}</span>
              </div>
              <div className="flex justify-between">
                <span>Entitlement State:</span>
                <span className="text-slate-500">AWAITING_VERIFIED_SETTLEMENT</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/shop"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#5b21b6] text-white text-xs font-bold font-sans uppercase hover:bg-[#6d28d9] transition-all"
              >
                Continue Browsing
              </Link>
              <Link
                to="/support"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#e2e8f0] text-slate-700 text-xs font-semibold font-sans hover:bg-slate-50 transition-all"
              >
                Contact Support
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
