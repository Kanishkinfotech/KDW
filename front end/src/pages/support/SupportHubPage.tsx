import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LifeBuoy, Ticket, FileText, ArrowDownToLine, Key, 
  RotateCcw, HelpCircle, Mail, ChevronRight, Search, CheckCircle2 
} from 'lucide-react';
import SmartSearch from '../../components/support/SmartSearch';
import SEO from '../../components/SEO';

export default function SupportHubPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  const handleSelfServiceCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !email) return;

    setChecking(true);
    setCheckError('');
    setOrderResult(null);

    try {
      const res = await fetch('/api/support/self-service/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email })
      });
      const json = await res.json();
      if (json.success) {
        setOrderResult(json.order);
      } else {
        setCheckError(json.message || 'No matching order found.');
      }
    } catch (err) {
      setCheckError('Failed to lookup order status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <SEO title="Support Center & Self-Service | Kanishk Digital World" description="Instant order status lookup, download refreshes, licence management, and contact support." />

      {/* Hero Header */}
      <div className="bg-slate-900 pt-24 pb-28 px-6 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold">
            <LifeBuoy className="w-4 h-4 text-blue-400" />
            <span>KDW Customer Resolution Center</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Search our knowledge base, verify your digital order, or contact our support team.
          </p>

          <SmartSearch />
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20 pb-24 space-y-12">
        {/* Quick Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/contact"
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Contact Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit an inquiry for order fulfillment, technical issues, or agency partnerships.
              </p>
            </div>
            <div className="mt-6 text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
              Submit Ticket <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/support/my-tickets"
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">My Support Tickets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                View ongoing inquiries, read agent updates, and submit satisfaction ratings.
              </p>
            </div>
            <div className="mt-6 text-emerald-600 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
              View Inquiries <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/faq"
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Frequently Asked Questions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant answers to digital download access, Google Drive permissions, and licensing.
              </p>
            </div>
            <div className="mt-6 text-amber-600 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
              Browse FAQs <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Self-Service Order & Download Lookup Tool */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">Instant Order & Download Access Lookup</h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify digital asset status, download attempt counts, and active entitlements without waiting for staff.
            </p>
          </div>

          <form onSubmit={handleSelfServiceCheck} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Order Number *</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="e.g. KDW-8821"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Billing Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={checking}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {checking ? 'Checking Status...' : 'Lookup Order'}
              </button>
            </div>
          </form>

          {checkError && (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs font-medium">
              {checkError}
            </div>
          )}

          {orderResult && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="font-bold text-slate-900 block">Order #{orderResult.orderNumber}</span>
                  <span className="text-slate-500">{new Date(orderResult.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {orderResult.status}
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Purchased Products:</span>
                {(orderResult.items || []).map((it: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{it.productTitle}</span>
                    <span className="font-bold text-slate-900">${it.price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to="/account/orders"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  Access your files inside Account Dashboard &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
