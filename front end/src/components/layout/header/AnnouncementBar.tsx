import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, ArrowRight, X, Package, Sparkles } from 'lucide-react';
import axios from 'axios';
import { formatTimeRemaining } from '../../../utils/bundlePricing';
import { trackOfferView, trackOfferClick } from '../../../utils/offerTracking';

export default function AnnouncementBar() {
  const [activeOffer, setActiveOffer] = useState<any | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchActiveOffer = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/offers/active', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (res.data.success && Array.isArray(res.data.offers) && res.data.offers.length > 0) {
          // Only display offer if placement matches STOREFRONT_HEADLINE or ALL_PLACEMENTS
          const headlineOffer = res.data.offers.find((o: any) =>
            o.displayPlacement === 'STOREFRONT_HEADLINE' || o.displayPlacement === 'ALL_PLACEMENTS'
          );

          if (isMounted) {
            setActiveOffer(headlineOffer || null);
            if (headlineOffer?.id) {
              trackOfferView(headlineOffer.id);
            }
          }
        }
      } catch {
        // Fallback silently
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActiveOffer();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live countdown ticker if endAt exists
  useEffect(() => {
    if (!activeOffer?.endAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(activeOffer.endAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('');
      } else {
        const { formatted } = formatTimeRemaining(diff);
        setTimeRemaining(formatted);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeOffer]);

  if (isDismissed) return null;

  // Determine message, target URL, and styling
  let message = '⚡ 100% VERIFIED DIGITAL ASSETS · INSTANT GOOGLE DRIVE ACCESS · PERSONAL LICENCE INCLUDED';
  let targetLink = '/shop';
  let ctaText = 'Explore Shop';
  let isBundleOffer = false;
  let isFlashSale = false;

  if (activeOffer) {
    const isBundle = ['BUNDLE_OFFER', 'BUNDLE_DEAL'].includes(activeOffer.offerType);
    const isFlash = ['FLASH_SALE', 'TIME_LIMITED'].includes(activeOffer.offerType);
    isBundleOffer = isBundle;
    isFlashSale = isFlash;

    const discountLabel = activeOffer.discountType === 'PERCENTAGE'
      ? `${activeOffer.discountValue}% OFF`
      : `₹${activeOffer.discountValue} OFF`;

    if (activeOffer.bannerText && activeOffer.bannerText.trim()) {
      message = activeOffer.bannerText.trim();
    } else if (isBundle) {
      if (activeOffer.targetBundles && activeOffer.targetBundles.length === 1) {
        const targetBundle = activeOffer.targetBundles[0];
        message = `🎁 BUNDLE DEAL: ${targetBundle.title} is now ${discountLabel}!`;
        targetLink = `/bundles/${targetBundle.slug || targetBundle.id}`;
        ctaText = 'Claim Bundle';
      } else {
        message = `🎁 EXCLUSIVE BUNDLE SALE: ${activeOffer.name} — Get ${discountLabel} on curated bundles!`;
        targetLink = '/bundles';
        ctaText = 'View Bundles';
      }
    } else if (isFlash) {
      message = `⚡ FLASH SALE: ${activeOffer.name} is LIVE! Enjoy ${discountLabel} Storewide`;
      targetLink = '/shop';
      ctaText = 'Shop Flash Sale';
    } else {
      message = `🔥 SPECIAL OFFER: ${activeOffer.name} — Save ${discountLabel} for a limited time!`;
      targetLink = '/shop';
      ctaText = 'Shop Offer';
    }
  }

  const bgGradient = isFlashSale
    ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 text-white'
    : isBundleOffer
    ? 'bg-gradient-to-r from-violet-700 via-purple-700 to-pink-600 text-white'
    : 'bg-[#12101c] text-slate-200 border-b border-white/10';

  return (
    <div className={`relative z-50 transition-all select-none ${bgGradient} px-3 py-1.5 sm:py-2 text-xs font-sans shadow-sm`}>
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
        
        {/* Left / Center Promo Headline */}
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center">
          {activeOffer && (
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
              {isBundleOffer ? <Package size={11} /> : isFlashSale ? <Zap size={11} className="fill-white" /> : <Sparkles size={11} />}
              {activeOffer.badgeText || (isBundleOffer ? 'BUNDLE DEAL' : 'FLASH SALE')}
            </span>
          )}

          <span className="font-bold tracking-wide text-xs sm:text-sm drop-shadow-xs">
            {message}
          </span>

          {/* Real-time Countdown Timer Pill */}
          {timeRemaining && (
            <span className="inline-flex items-center gap-1 bg-black/25 backdrop-blur-xs text-amber-200 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold shadow-inner">
              <Clock size={11} />
              <span>Ends in: {timeRemaining}</span>
            </span>
          )}

          <Link
            to={targetLink}
            onClick={() => {
              if (activeOffer?.id) {
                trackOfferClick(activeOffer.id);
              }
            }}
            className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:text-amber-200 transition-colors ml-1 text-xs cursor-pointer"
          >
            <span>{ctaText}</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Close Button */}
        {activeOffer && (
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-black/20 rounded-full transition text-white/80 hover:text-white shrink-0 ml-2 cursor-pointer"
            aria-label="Dismiss Announcement"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
