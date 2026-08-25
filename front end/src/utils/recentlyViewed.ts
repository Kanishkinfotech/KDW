export interface RecentlyViewedProduct {
  id: string;
  title: string;
  name?: string;
  slug?: string;
  price: number;
  discountPrice?: number | null;
  coverImage?: string;
  thumbnail?: string;
  category?: string | { name: string; slug?: string };
  rating?: number;
  productType?: string;
}

const STORAGE_KEY = 'kdw_recently_viewed';
const MAX_ITEMS = 8;

export function getRecentlyViewed(): RecentlyViewedProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading recently viewed items:', err);
    return [];
  }
}

export function addRecentlyViewed(product: RecentlyViewedProduct): void {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    const current = getRecentlyViewed();
    const filtered = current.filter(item => item.id !== product.id);
    const updated = [
      {
        id: product.id,
        title: product.title || product.name || 'Digital Product',
        name: product.name || product.title,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        coverImage: product.coverImage || product.thumbnail,
        thumbnail: product.thumbnail || product.coverImage,
        category: product.category,
        rating: product.rating,
        productType: product.productType
      },
      ...filtered
    ].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error adding recently viewed item:', err);
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing recently viewed items:', err);
  }
}
