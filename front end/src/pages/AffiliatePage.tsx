import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, TrendingUp, Link as LinkIcon, Copy, Check, 
  QrCode, ArrowUpRight, ShieldCheck, RefreshCw, Send, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { affiliatesApi } from '../api/affiliates.api';
import type { AffiliateStats } from '../api/affiliates.api';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';

export default function AffiliatePage() {
  const { user, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Application Form State
  const [applyData, setApplyData] = useState({
    promotionalMethod: 'SOCIAL_MEDIA',
    website: '',
    upiId: ''
  });
  const [isApplying, setIsApplying] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Payout Request State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutUpi, setPayoutUpi] = useState('');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  const fetchStats = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await affiliatesApi.getStats();
      if (res.success && res.stats) {
        setStats(res.stats);
        setIsRegistered(true);
      }
    } catch (err: any) {
      console.error('Error fetching affiliate stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isAuthenticated]);

  const handleCopyLink = () => {
    if (!stats?.referralLink) return;
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to register as an affiliate partner.');
      return;
    }

    try {
      setIsApplying(true);
      const res = await affiliatesApi.apply(applyData);
      if (res.success) {
        toast.success(res.message || 'Affiliate account activated!');
        setIsRegistered(true);
        fetchStats();
      } else {
        toast.error(res.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      console.error('Affiliate application error:', err);
      toast.error(err.response?.data?.message || 'Error submitting application.');
    } finally {
      setIsApplying(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum < 1000) {
      toast.error('Minimum payout request amount is ₹1,000');
      return;
    }

    if (stats && amountNum > stats.availableBalance) {
      toast.error('Requested amount exceeds available balance.');
      return;
    }

    try {
      setIsRequestingPayout(true);
      const res = await affiliatesApi.requestPayout({
        amount: amountNum,
        payoutMethod: 'UPI',
        upiId: payoutUpi
      });

      if (res.success) {
        toast.success(res.message || 'Payout request submitted successfully!');
        setShowPayoutModal(false);
        setPayoutAmount('');
      } else {
        toast.error(res.message || 'Payout request failed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting payout request.');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171325] py-12 lg:py-16 font-sans">
      <SEO 
        title="Affiliate Partner Program | KDW" 
        description="Earn 15% recurring commission by referring creators and engineering teams to KDW digital assets."
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-bold font-sans tracking-[0.2em] uppercase text-[#5b21b6] block">
            PARTNER PROGRAM
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#171325]">
            Earn 15% on every referred sale.
          </h1>
          <p className="text-sm text-slate-500 font-sans leading-relaxed">
            Recommend professional architecture toolkits, automation kits, and UI templates to your audience and receive instant commission payouts.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5b21b6] flex items-center justify-center font-bold">
              15%
            </div>
            <h3 className="font-serif font-bold text-base text-[#171325]">Generous Commission</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Earn 15% on all product and bundle sales generated through your unique tracking link.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#171325]">30-Day Cookie Window</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Long attribution windows ensure you receive credit even if customers complete checkout days later.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#171325]">Instant UPI Payouts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct disbursement via UPI or NEFT with complete transparency and zero transaction fees.
            </p>
          </div>
        </div>

        {/* Main Dashboard / Application Area */}
        {isAuthenticated && stats ? (
          <div className="space-y-8">
            
            {/* Referral Link & QR Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#5b21b6] block">
                    ACTIVE AFFILIATE LINK
                  </span>
                  <h2 className="text-xl font-serif font-bold text-[#171325] mt-0.5">
                    Your Personalized Tracking URL
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold font-sans">
                    Partner Code: {stats.referralCode}
                  </span>
                </div>
              </div>

              {/* Link Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full flex-1 px-4 py-3 bg-[#fcfbf9] border border-[#e2e8f0] rounded-xl text-xs font-mono text-slate-700 truncate select-all">
                  {stats.referralLink}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{showQR ? 'Hide QR' : 'QR Code'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic QR Display */}
              {showQR && (
                <div className="p-6 bg-[#fcfbf9] rounded-2xl border border-[#e2e8f0] flex flex-col sm:flex-row items-center gap-6">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(stats.referralLink)}`}
                      alt="Referral QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-serif font-bold text-sm text-[#171325]">Scan to Visit Store</h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Use this QR code in print materials, presentation decks, or video overlays to direct users through your affiliate tracking link.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Statistics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Clicks</span>
                <div className="text-2xl font-serif font-bold text-[#171325]">{stats.clicks}</div>
                <span className="text-[11px] text-slate-500">Unique visitor engagements</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversions</span>
                <div className="text-2xl font-serif font-bold text-[#171325]">{stats.conversions}</div>
                <span className="text-[11px] text-emerald-600 font-medium">Rate: {stats.conversionRate}</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Commission</span>
                <div className="text-2xl font-serif font-bold text-[#171325]">₹{stats.totalEarnings.toLocaleString()}</div>
                <span className="text-[11px] text-slate-500">{stats.commissionRate} on volume</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Payout</span>
                <div className="text-2xl font-serif font-bold text-[#5b21b6]">₹{stats.availableBalance.toLocaleString()}</div>
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="w-full py-2 px-3 rounded-lg bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <span>Request Payout</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Application Form for Unregistered / Guest Users */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#e2e8f0] shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#5b21b6] block">
                PARTNER ONBOARDING
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#171325]">
                Apply for Affiliate Partnership
              </h2>
              <p className="text-xs text-slate-500">
                Join our curated network of digital educators, agencies, and creators.
              </p>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Primary Channel / Website</label>
                <input
                  type="text"
                  required
                  placeholder="https://youtube.com/@yourchannel or yourwebsite.com"
                  value={applyData.website}
                  onChange={e => setApplyData({ ...applyData, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Promotional Strategy</label>
                <select
                  value={applyData.promotionalMethod}
                  onChange={e => setApplyData({ ...applyData, promotionalMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs text-slate-800 focus:outline-none focus:border-[#5b21b6]"
                >
                  <option value="SOCIAL_MEDIA">YouTube / Twitter / LinkedIn Content</option>
                  <option value="AGENCY_CLIENTS">Direct Client Deliverables & Recommendations</option>
                  <option value="BLOG_WEBSITE">Editorial Reviews & Tutorial Publications</option>
                  <option value="NEWSLETTER">Email Newsletter & Tech Communities</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Payout UPI ID (For Commission Transfer)</label>
                <input
                  type="text"
                  required
                  placeholder="yourname@okhdfcbank"
                  value={applyData.upiId}
                  onChange={e => setApplyData({ ...applyData, upiId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs placeholder-slate-400 focus:outline-none focus:border-[#5b21b6]"
                />
              </div>

              <button
                type="submit"
                disabled={isApplying}
                className="w-full py-3.5 rounded-full bg-[#5b21b6] hover:bg-[#6d28d9] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md mt-6"
              >
                {isApplying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Activate Affiliate Partnership</span>}
              </button>
            </form>
          </div>
        )}

        {/* Payout Request Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[#e2e8f0] shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-[#171325]">Request Commission Payout</h3>
                <button 
                  onClick={() => setShowPayoutModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Payout Amount (₹)</label>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    required
                    placeholder="e.g. 1500"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs focus:outline-none focus:border-[#5b21b6]"
                  />
                  <span className="text-[10px] text-slate-400">Available: ₹{stats?.availableBalance.toLocaleString()} (Min ₹1,000)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">UPI ID for Transfer</label>
                  <input
                    type="text"
                    required
                    placeholder="user@upi"
                    value={payoutUpi}
                    onChange={e => setPayoutUpi(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#fcfbf9] text-xs focus:outline-none focus:border-[#5b21b6]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRequestingPayout}
                    className="flex-1 py-2.5 rounded-full bg-[#5b21b6] text-white text-xs font-bold hover:bg-[#6d28d9] flex items-center justify-center gap-1.5"
                  >
                    {isRequestingPayout ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
