export interface BundlePricingResult {
  isDealActive: boolean;
  isDealExpired: boolean;
  effectivePrice: number;
  originalPrice: number;
  discount: number;
  discountPercent: number;
  savings: number;
  timeRemainingMs: number;
  offerEndAt?: string | null;
  offerStartAt?: string | null;
  badgeText?: string | null;
  bannerText?: string | null;
  offerName?: string | null;
  activeDeal?: any | null;
}

/**
 * Resolves the effective pricing for a bundle based on special offer dates and promotional deals.
 * If active promotional deal exists, it takes precedence.
 * If offerEndAt is set and current time > offerEndAt, the deal is expired:
 * the discount automatically drops to ZERO and the price reverts to full original price.
 */
export function getBundleEffectivePricing(bundle: any): BundlePricingResult {
  if (!bundle) {
    return {
      isDealActive: false,
      isDealExpired: false,
      effectivePrice: 0,
      originalPrice: 0,
      discount: 0,
      discountPercent: 0,
      savings: 0,
      timeRemainingMs: 0
    };
  }

  const now = new Date();

  // 0. Active promotional deal from database (Prisma Offer)
  if (bundle.activeDeal) {
    const deal = bundle.activeDeal;
    const endDate = deal.endAt ? new Date(deal.endAt) : (bundle.offerEndAt ? new Date(bundle.offerEndAt) : null);
    const startDate = deal.startAt ? new Date(deal.startAt) : (bundle.offerStartAt ? new Date(bundle.offerStartAt) : null);
    
    let isDealActive = true;
    let timeRemainingMs = 0;
    if (endDate) {
      if (now > endDate) isDealActive = false;
      else timeRemainingMs = Math.max(0, endDate.getTime() - now.getTime());
    }
    if (startDate && now < startDate) {
      isDealActive = false;
    }

    if (isDealActive) {
      const effPrice = Number(deal.effectivePrice ?? bundle.price ?? 0);
      const origPrice = Number(deal.originalPrice ?? bundle.originalPrice ?? effPrice);
      const savings = Math.max(0, origPrice - effPrice);
      const discountPercent = origPrice > 0 ? Math.round((savings / origPrice) * 100) : 0;

      return {
        isDealActive: true,
        isDealExpired: false,
        effectivePrice: effPrice,
        originalPrice: origPrice,
        discount: savings,
        discountPercent,
        savings,
        timeRemainingMs,
        offerEndAt: deal.endAt || bundle.offerEndAt,
        offerStartAt: deal.startAt || bundle.offerStartAt,
        badgeText: deal.badgeText || (deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}% OFF` : 'BUNDLE DEAL'),
        bannerText: deal.bannerText,
        offerName: deal.offerName,
        activeDeal: deal
      };
    }
  }

  const rawOriginal = Number(bundle.originalPrice ?? bundle.price ?? 0);
  const rawDiscounted = Number(bundle.price ?? 0);

  const hasOfferDates = Boolean(bundle.offerEndAt);
  let isOfferStarted = true;
  let isOfferEnded = false;
  let timeRemainingMs = 0;

  if (hasOfferDates) {
    const endDate = new Date(bundle.offerEndAt);
    if (bundle.offerStartAt) {
      const startDate = new Date(bundle.offerStartAt);
      isOfferStarted = now >= startDate;
    }
    isOfferEnded = now > endDate;
    timeRemainingMs = Math.max(0, endDate.getTime() - now.getTime());
  }

  // 1. If deal is expired: auto-update to 0 discount and full original price
  if (isOfferEnded) {
    const fullPrice = rawOriginal > 0 ? rawOriginal : rawDiscounted;
    return {
      isDealActive: false,
      isDealExpired: true,
      effectivePrice: fullPrice,
      originalPrice: fullPrice,
      discount: 0,
      discountPercent: 0,
      savings: 0,
      timeRemainingMs: 0,
      offerEndAt: bundle.offerEndAt,
      offerStartAt: bundle.offerStartAt
    };
  }

  // 2. If limited-time deal is actively running
  if (hasOfferDates && isOfferStarted && !isOfferEnded) {
    const original = rawOriginal > 0 ? rawOriginal : rawDiscounted;
    const effective = rawDiscounted;
    const savings = Math.max(0, original - effective);
    const discountPercent = original > 0 ? Math.round((savings / original) * 100) : (bundle.discountPercent || 0);

    return {
      isDealActive: true,
      isDealExpired: false,
      effectivePrice: effective,
      originalPrice: original,
      discount: savings,
      discountPercent: discountPercent,
      savings: savings,
      timeRemainingMs: timeRemainingMs,
      offerEndAt: bundle.offerEndAt,
      offerStartAt: bundle.offerStartAt
    };
  }

  // 3. Regular bundle discount without expiration dates
  const original = rawOriginal > 0 ? rawOriginal : rawDiscounted;
  const effective = rawDiscounted;
  const savings = Math.max(0, original - effective);
  const discountPercent = original > 0 && savings > 0 
    ? Math.round((savings / original) * 100) 
    : (bundle.discountPercent || 0);

  return {
    isDealActive: false,
    isDealExpired: false,
    effectivePrice: effective,
    originalPrice: original,
    discount: savings,
    discountPercent: discountPercent,
    savings: savings,
    timeRemainingMs: 0,
    offerEndAt: bundle.offerEndAt,
    offerStartAt: bundle.offerStartAt
  };
}

/**
 * Formats milliseconds into a readable countdown string (e.g., '14h 23m 45s' or '02d 08h 12m')
 */
export function formatTimeRemaining(ms: number): { days: number; hours: number; minutes: number; seconds: number; formatted: string } {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00h 00m 00s' };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  } else {
    formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  return { days, hours, minutes, seconds, formatted };
}
