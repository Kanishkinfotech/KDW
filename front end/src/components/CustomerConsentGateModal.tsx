import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, ShoppingBag, Key, Download, 
  CreditCard, MessageSquare, CheckCircle2, 
  LogOut, Shield, FileText, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function CustomerConsentGateModal() {
  const { user, isAuthenticated, logout } = useAuth();
  const [hasConsented, setHasConsented] = useState<boolean>(true);
  const [agreedToMandatory, setAgreedToMandatory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Check consent state whenever authentication status changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const storageKey = `kwd_policy_accepted_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setHasConsented(false);
      } else {
        setHasConsented(true);
      }
    } else {
      setHasConsented(true);
    }
  }, [isAuthenticated, user?.id]);

  if (hasConsented || !isAuthenticated || !user) {
    return null;
  }

  const handleAgreeAndProceed = async () => {
    if (!agreedToMandatory) {
      toast.error('Please confirm your acknowledgement by checking the agreement box.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Dispatch acceptance record to backend audit log
      try {
        await fetch('/api/settings/legal/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentSlug: 'customer-terms-and-data-consent',
            versionNumber: 1,
            customerId: user.id,
            customerEmail: user.email
          })
        });
      } catch (err) {
        console.warn('Backend policy acceptance recording failed silently:', err);
      }

      // 2. Ensure default safe cookie consent exists locally
      if (!localStorage.getItem('kwd_cookie_consent')) {
        const cookieData = {
          status: 'ACCEPTED_ALL',
          essential: true,
          analytics: true,
          marketing: true,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('kwd_cookie_consent', JSON.stringify(cookieData));
        window.dispatchEvent(new CustomEvent('kdw:cookie-consent-updated', { detail: cookieData }));
      }

      // 3. Mark user consent as accepted locally
      const storageKey = `kwd_policy_accepted_${user.id}`;
      localStorage.setItem(storageKey, new Date().toISOString());

      setHasConsented(true);
      toast.success(`Welcome to Kanishk Digital World, ${user.name}! Access granted.`);
    } catch (error) {
      console.error('Error saving consent:', error);
      toast.error('An error occurred while saving your consent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      window.location.href = '/login';
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col overflow-y-auto selection:bg-[#ede9fe] selection:text-[#5b21b6] font-sans">
      
      {/* Sticky Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#1e1b4b] via-[#312e81] to-[#5b21b6] text-white flex items-center justify-center shadow-md shadow-indigo-950/10 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-serif font-bold tracking-tight text-slate-900 truncate">
                  Mandatory Terms &amp; Shopping Data Consent
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Required to Access
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <span>Account Verified:</span>
                <strong className="text-slate-800 font-semibold">{user.name}</strong>
                <span className="text-slate-400">({user.email})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Scrollable Document Flow */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Executive Banner */}
        <div className="bg-gradient-to-br from-sky-100/90 via-sky-50 to-blue-100/70 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-sky-200/90 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 rounded-full bg-blue-200/30 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-sky-200 text-xs font-semibold text-sky-700 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Customer Transparency &amp; Data Governance</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Customer Agreement &amp; Data Transparency Disclosure
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              To guarantee lifetime digital asset delivery, valid commercial licensing, and secure account access, Kanishk Digital World maintains encrypted records of your transactions and entitlements. Please review the exhaustive disclosures below before continuing to your account dashboard.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-sky-200/80 shadow-xs font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>256-Bit Encrypted Data Storage</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-sky-200/80 shadow-xs font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Zero Third-Party Advertising</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-sky-200/80 shadow-xs font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Perpetual License Entitlement Records</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: STORED SHOPPING DETAILS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5b21b6] flex items-center justify-center font-bold text-xs shrink-0">
              01
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#5b21b6]" />
                Stored Customer Shopping &amp; Account Data
              </h3>
              <p className="text-xs text-slate-500">
                The specific operational data elements recorded under your customer profile to facilitate order fulfillment and digital delivery.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Shopping History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-colors space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5b21b6] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Shopping &amp; Order History
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Order IDs (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">KDW-2026-XXXXX</code>), purchased product and bundle titles, quantities, invoices, GST breakdown, discount codes, and order timestamps.
              </p>
            </div>

            {/* 2. Licence Keys */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-colors space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Commercial Licence Keys
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unique commercial licence tokens generated per order, activation limits, authorized deployment domains, and digital entitlement records.
              </p>
            </div>

            {/* 3. Download & Cloud Access */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Download Activity &amp; Storage
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Timestamps of file access, IP address at download time, and secure Google Drive access tokens to prevent unauthorized file tampering or redistribution.
              </p>
            </div>

            {/* 4. Payment References */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Payment Gateway Reference
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Razorpay Payment IDs and Gateway Order references. <em className="text-slate-500">(Debit/Credit cards and UPI PINs are processed exclusively by PCI-DSS compliant Razorpay and are never stored on KDW servers)</em>.
              </p>
            </div>

            {/* 5. Support & Communications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors space-y-2 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Support Inquiries &amp; Refund Communications
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submitted support tickets, customer explanation notes for refund claims, administrative decision notes, and WhatsApp/Email delivery notifications.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: PRIVACY STANDARDS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5b21b6] flex items-center justify-center font-bold text-xs shrink-0">
              02
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#5b21b6]" />
                Customer Privacy Rules &amp; Standards
              </h3>
              <p className="text-xs text-slate-500">
                Our strict governance protocols regarding confidentiality, zero data resale, and account portability.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  1. Strict No-Sale Rule
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Zero Data Sharing
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                We never sell, rent, trade, or monetize your shopping history, email address, or personal identifiers to any third-party advertisers, data brokers, or external marketing networks.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  2. Lifetime Digital Access Retention
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Perpetual Preservation
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your digital purchase records, generated commercial licences, and download tokens are preserved indefinitely so that you retain uninterrupted lifetime access to re-download assets and invoices anytime from your account dashboard.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  3. Right to Data Portability &amp; Account Erasure
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  Full Customer Control
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                You reserve the statutory right to request a complete machine-readable export of your personal shopping records or request permanent account erasure/anonymization in accordance with applicable data privacy regulations.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: TERMS & LICENSING */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5b21b6] flex items-center justify-center font-bold text-xs shrink-0">
              03
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#5b21b6]" />
                Terms of Service &amp; Commercial Digital Licensing
              </h3>
              <p className="text-xs text-slate-500">
                The binding legal terms governing intellectual property usage, template distribution, and digital delivery.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Commercial Usage Rights
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Purchased digital assets may be deployed in unlimited commercial client projects, personal web applications, and business ventures. However, resale, redistribution, sublicensing, or public file-sharing of the raw digital files, templates, or licence tokens is strictly prohibited.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Digital Delivery &amp; Refund Policy
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                All digital items are delivered instantly via direct secure download links and Google Drive permissions upon payment verification. Due to the immediate irrevocable delivery of downloadable assets, refund claims are evaluated solely on factual grounds of technical corruption or non-delivery as detailed in our refund policy.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Sticky Bottom Agreement & Action Bar */}
      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-4 sm:py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <label className="flex items-start gap-3 cursor-pointer select-none group max-w-2xl">
            <input
              type="checkbox"
              id="mandatory-consent-checkbox"
              checked={agreedToMandatory}
              onChange={e => setAgreedToMandatory(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded-md text-[#5b21b6] focus:ring-[#5b21b6] border-slate-300 transition-all cursor-pointer shrink-0 accent-[#5b21b6]"
            />
            <span className="text-xs sm:text-sm text-slate-700 leading-snug">
              I have reviewed and agree to the <strong className="text-slate-900 font-semibold">Terms of Service</strong>, <strong className="text-slate-900 font-semibold">Privacy Rules</strong>, and consent to the secure storage and processing of my <strong className="text-slate-900 font-semibold">shopping and order details</strong> as disclosed above.
            </span>
          </label>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel &amp; Sign Out
            </button>

            <button
              type="button"
              disabled={!agreedToMandatory || isSubmitting}
              onClick={handleAgreeAndProceed}
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-[#5b21b6] to-[#4338ca] hover:from-[#4c1d95] hover:to-[#3730a3] disabled:from-slate-300 disabled:to-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <span>Recording Agreement...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Agree &amp; Access User Interface</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
