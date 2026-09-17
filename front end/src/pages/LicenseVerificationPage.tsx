import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Key, CheckCircle2, AlertCircle, RefreshCw, HelpCircle, Sparkles, Mail, Send, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import SEO from '../components/SEO';

interface DeliverableItem {
  productId?: string;
  id?: string;
  name: string;
  title?: string;
  slug?: string;
  coverImage?: string | null;
  fileSize?: string | null;
  version?: string;
  directDriveUrl?: string | null;
  driveUrl?: string | null;
  downloadUrl?: string | null;
  category?: string;
}

interface VerifiedPayload {
  verified: boolean;
  licenseKey?: string;
  licenceKey?: string;
  orderNumber: string;
  purchasedAt?: string;
  issuedAt?: string;
  customerEmail: string;
  customerName?: string;
  licenceType: string;
  product?: DeliverableItem;
  primaryDeliverable?: DeliverableItem;
  deliverables?: DeliverableItem[];
}

export default function LicenseVerificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKey = searchParams.get('key') || searchParams.get('licenseKey') || '';

  const [inputKey, setInputKey] = useState(initialKey);
  const [inputEmail, setInputEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifiedPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performVerification = async (keyToVerify: string, emailToVerify?: string) => {
    const cleanKey = keyToVerify.trim();
    if (!cleanKey) {
      toast.error('Please enter your license key to verify.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await axios.post('/api/licences/verify', {
        licenseKey: cleanKey,
        key: cleanKey,
        email: emailToVerify?.trim() || undefined
      });

      if (res.data?.success && res.data.data) {
        setVerifiedData(res.data.data);
        toast.success('Commercial License Verified! Active download links sent to your email.');
      } else {
        setErrorMessage(res.data?.message || 'Invalid or unverified license key.');
      }
    } catch (err: any) {
      console.error('License verification error:', err);
      setErrorMessage(err.response?.data?.message || 'Could not verify license key. Please check the key and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialKey) {
      setInputKey(initialKey);
      performVerification(initialKey);
    }
  }, [initialKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setSearchParams({ key: inputKey.trim() });
      performVerification(inputKey, inputEmail);
    }
  };

  const currentProduct: DeliverableItem | null = verifiedData ? (
    verifiedData.primaryDeliverable ||
    verifiedData.product ||
    (verifiedData.deliverables && verifiedData.deliverables[0]) || {
      name: 'Commercial Product Assets',
      driveUrl: 'https://drive.google.com/'
    }
  ) : null;

  const activeKey = verifiedData?.licenceKey || verifiedData?.licenseKey || inputKey;

  const handleResendEmail = async () => {
    const keyToSend = activeKey || inputKey;
    if (!keyToSend) {
      toast.error('License key is missing.');
      return;
    }

    setResending(true);
    try {
      const res = await axios.post('/api/licences/resend-email', {
        key: keyToSend,
        licenseKey: keyToSend,
        email: verifiedData?.customerEmail
      });

      if (res.data?.success) {
        toast.success(`Download links successfully resent to ${verifiedData?.customerEmail || 'your email'}!`);
      } else {
        toast.error(res.data?.message || 'Could not resend email.');
      }
    } catch (err: any) {
      console.error('Resend email error:', err);
      toast.error(err.response?.data?.message || 'Failed to resend download links. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const copyLicense = () => {
    if (activeKey) {
      navigator.clipboard.writeText(activeKey)
        .then(() => toast.success('License key copied!'))
        .catch(() => toast.error('Failed to copy.'));
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-12 lg:py-20 font-sans">
      <SEO 
        title="Verify License & Unlock Downloads | KDW" 
        description="Verify your commercial license key to unlock your digital product deliverables, downloads, and Google Drive access."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-bold tracking-[0.2em] uppercase shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>KDW LICENSE ACTIVATION &amp; VERIFICATION</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            Verify License &amp; Unlock Download
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-sans max-w-xl mx-auto leading-relaxed">
            Enter your unique Commercial License Key received in your order confirmation email to verify authenticity and access your product assets.
          </p>
        </div>

        {/* Main Verification Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Commercial License Key</span>
                <span className="text-[11px] font-normal text-slate-400 lowercase">(found in your confirmation email)</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. KDW-COMM-20260904-FREEGUIDE or KDW-LIC-..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !inputKey.trim()}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying License...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Unlock Deliverables</span>
                  </>
                )}
              </button>

              {verifiedData && (
                <button
                  type="button"
                  onClick={() => {
                    setVerifiedData(null);
                    setInputKey('');
                    setSearchParams({});
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-4 py-2"
                >
                  Verify Another Key
                </button>
              )}
            </div>
          </form>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{errorMessage}</p>
                <p className="text-red-600 text-xs">
                  Tip: Ensure you copied the entire license key from your email. If you claimed a free product, your key was dispatched to your delivery email.
                </p>
              </div>
            </div>
          )}

          {/* Verification Success & Deliverables Box */}
          {verifiedData && (
            <div className="pt-4 border-t border-slate-100 space-y-6">
              
              {/* Green Verified Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      License Status: Active &amp; Verified
                    </div>
                    <div className="text-xs text-emerald-700">
                      Commercial license verified on KDW Security Server
                    </div>
                  </div>
                </div>

                <span className="hidden sm:inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono rounded-full">
                  {verifiedData.licenceType}
                </span>
              </div>

              {/* Product Deliverables Card */}
              {/* Product Deliverables Card */}
              <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {currentProduct?.coverImage ? (
                    <img 
                      src={currentProduct.coverImage} 
                      alt={currentProduct.name} 
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xl">
                      KDW
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {currentProduct?.name || 'Commercial Product Assets'}
                    </h3>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Order: <strong className="text-slate-800 font-mono">{verifiedData.orderNumber}</strong></span>
                      {currentProduct?.version && <span>Version: <strong>{currentProduct.version}</strong></span>}
                      {currentProduct?.fileSize && <span>Size: <strong>{currentProduct.fileSize}</strong></span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      Delivery Email: <strong className="text-slate-800">{verifiedData.customerEmail}</strong>
                    </div>
                  </div>
                </div>

                {/* License Key Display & Copy */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="overflow-hidden">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Commercial License Key</div>
                    <div className="font-mono text-xs font-bold text-slate-800 truncate">{activeKey}</div>
                  </div>
                  <button
                    type="button"
                    onClick={copyLicense}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shrink-0"
                  >
                    Copy Key
                  </button>
                </div>

                {/* Secure Email Delivery Panel (Direct open removed from web, sent exclusively to email) */}
                <div className="pt-2">
                  <div className="p-5 rounded-2xl bg-[#5b21b6] text-white shadow-xl shadow-purple-900/15 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-700/80 flex items-center justify-center shrink-0 text-white">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                          Secure Download Links Sent to Email
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          Check your email inbox to open your assets
                        </h4>
                        <p className="text-xs text-purple-200 leading-relaxed">
                          For your security and commercial license protection, direct deliverable access is restricted to email delivery. 
                          Now that your key is verified, your secure time-limited download links have been unlocked and dispatched to:
                        </p>
                        <div className="inline-block mt-1 font-mono font-bold text-xs bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-700/50 text-purple-100">
                          ✉️ {verifiedData.customerEmail}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-purple-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[11px] text-purple-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Link token &amp; time limit strictly enforced for asset safety.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={resending}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-purple-950 hover:bg-purple-50 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm disabled:opacity-60"
                      >
                        {resending ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
                            <span>Resending Links...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-purple-700" />
                            <span>Resend Links to Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multiple Deliverables if bundle or multi-item order */}
                {verifiedData.deliverables && verifiedData.deliverables.length > 1 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Included Package Deliverables ({verifiedData.deliverables.length})
                    </div>
                    <div className="space-y-2">
                      {verifiedData.deliverables.map((del, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{del.name}</div>
                            <div className="text-slate-400 text-[11px]">{del.category || 'Package Component'}</div>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-lg text-[11px] border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unlocked in Email</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Commercial Rights Included */}
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs space-y-2 text-purple-900">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Commercial License Rights Granted:
                </div>
                <ul className="list-disc list-inside space-y-1 text-purple-800 text-[11px] leading-relaxed">
                  <li>Full permission for use in unlimited commercial, client, and personal projects.</li>
                  <li>Perpetual access to all templates, documentation, and cloud assets.</li>
                  <li>Free lifetime updates whenever newer versions of this toolkit are released.</li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* FAQ & How It Works Accordion */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            How License Verification Works
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                1
              </div>
              <h4 className="font-bold text-slate-900">Check Confirmation Email</h4>
              <p>When you purchase or claim a free item, your commercial key and link are emailed immediately to you.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                2
              </div>
              <h4 className="font-bold text-slate-900">Click or Paste Key</h4>
              <p>Clicking the link in your email automatically inputs your key, or you can paste it directly above.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="font-bold text-slate-900">Secure Email Delivery</h4>
              <p>Once verified, the secure time-limited Google Drive links sent to your email are immediately unlocked.</p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link to="/shop" className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1.5">
            <span>Return to KDW Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
