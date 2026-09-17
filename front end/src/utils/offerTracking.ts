import axios from 'axios';

// In-memory set to prevent duplicate view increments within the same session/page lifecycle
const trackedViews = new Set<string>();

/**
 * Tracks an offer impression view. Deduplicates impressions per offer in the current session.
 */
export function trackOfferView(offerId?: string | null): void {
  if (!offerId || trackedViews.has(offerId)) return;
  trackedViews.add(offerId);

  axios.post('/api/offers/track', {
    offerId,
    type: 'VIEW'
  }).catch(() => {
    // Fail silently in background
  });
}

/**
 * Tracks an offer click event immediately.
 */
export function trackOfferClick(offerId?: string | null): void {
  if (!offerId) return;

  axios.post('/api/offers/track', {
    offerId,
    type: 'CLICK'
  }).catch(() => {
    // Fail silently in background
  });
}
