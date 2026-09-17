import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

// Helper to determine the currently authenticated customer identifier
export const getCurrentCustomerKey = (): string => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.id) return `cust_${parsed.id}`;
      if (parsed?.email) return `cust_${parsed.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
  } catch (e) {}
  return 'guest';
};

// Customer-scoped storage keys
export const getCustomerCartKey = (key: string = getCurrentCustomerKey()) => `kdw_cart_${key}`;
export const getCustomerWishlistKey = (key: string = getCurrentCustomerKey()) => `kdw_wishlist_${key}`;

// Safe JSON loaders for customer-scoped data
export const loadCustomerCart = (key: string = getCurrentCustomerKey()): any[] => {
  try {
    const raw = localStorage.getItem(getCustomerCartKey(key));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

export const loadCustomerWishlist = (key: string = getCurrentCustomerKey()): any[] => {
  try {
    const raw = localStorage.getItem(getCustomerWishlistKey(key));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

// Safe JSON savers for customer-scoped data
export const saveCustomerCart = (cart: any[], key: string = getCurrentCustomerKey()) => {
  try {
    localStorage.setItem(getCustomerCartKey(key), JSON.stringify(cart));
  } catch (e) {}
};

export const saveCustomerWishlist = (wishlist: any[], key: string = getCurrentCustomerKey()) => {
  try {
    localStorage.setItem(getCustomerWishlistKey(key), JSON.stringify(wishlist));
  } catch (e) {}
};

// Migrate initial legacy shared data to currently active customer once, then clear legacy shared data
const performInitialCustomerMigration = () => {
  try {
    const activeKey = getCurrentCustomerKey();
    const cartKey = getCustomerCartKey(activeKey);
    const wishlistKey = getCustomerWishlistKey(activeKey);

    const hasCustomerCart = localStorage.getItem(cartKey) !== null;
    const hasCustomerWishlist = localStorage.getItem(wishlistKey) !== null;

    if (!hasCustomerCart || !hasCustomerWishlist) {
      const legacyStore = localStorage.getItem('kdw-store-v6');
      if (legacyStore) {
        const parsed = JSON.parse(legacyStore);
        if (!hasCustomerCart && Array.isArray(parsed?.state?.cart) && parsed.state.cart.length > 0) {
          saveCustomerCart(parsed.state.cart, activeKey);
        }
        if (!hasCustomerWishlist && Array.isArray(parsed?.state?.wishlist) && parsed.state.wishlist.length > 0) {
          saveCustomerWishlist(parsed.state.wishlist, activeKey);
        }
        if (parsed?.state) {
          parsed.state.cart = [];
          parsed.state.wishlist = [];
          localStorage.setItem('kdw-store-v6', JSON.stringify(parsed));
        }
      }
    }
  } catch (e) {}
};

performInitialCustomerMigration();

interface StoreState {
  cart: any[];
  wishlist: any[];
  currentCustomerKey: string;
  products: any[];
  categories: any[];
  bundles: any[];
  orders: any[];
  supportCategories: any[];
  supportArticles: any[];
  activeCoupons: any[];
  activeTestimonials: any[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  addToCart: (product: any, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  toggleWishlist: (product: any) => void;
  setCartOpen: (isOpen: boolean) => void;
  setWishlistOpen: (isOpen: boolean) => void;
  clearCart: () => void;
  clearWishlist: () => void;
  syncCustomerData: (forcedCustomerKey?: string) => void;
  addProduct: (product: any) => void;
  updateProduct: (productId: string, updatedData: any) => void;
  removeProduct: (productId: string) => void;
  setProducts: (products: any[]) => void;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchBundles: () => Promise<void>;
  fetchSupportCategories: () => Promise<void>;
  fetchSupportArticles: () => Promise<void>;
  fetchCoupons: () => Promise<void>;
  fetchTestimonials: () => Promise<void>;
  addCategory: (category: any) => void;
  removeCategory: (categoryId: string) => void;
  addOrder: (order: any) => void;
  razorpayAccounts: any[];
  addRazorpayAccount: (account: any) => void;
  setRazorpayAccountDefault: (accountId: string) => void;
  toggleRazorpayAccountActive: (accountId: string) => void;
}

const initialCustomer = getCurrentCustomerKey();

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: loadCustomerCart(initialCustomer),
      wishlist: loadCustomerWishlist(initialCustomer),
      currentCustomerKey: initialCustomer,
      products: [],
      categories: [],
      bundles: [],
      orders: [],
      supportCategories: [],
      supportArticles: [],
      activeCoupons: [],
      activeTestimonials: [],
      isCartOpen: false,
      isWishlistOpen: false,
      
      addToCart: (product, quantity = 1) => set((state) => {
        const customerKey = getCurrentCustomerKey();
        const existingIndex = state.cart.findIndex(item => item.id === product.id || item._id === product.id);
        let newCart: any[];
        if (existingIndex > -1) {
          newCart = [...state.cart];
          const currentQty = newCart[existingIndex].quantity || 1;
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: currentQty + quantity
          };
        } else {
          newCart = [...state.cart, { ...product, quantity: Math.max(1, quantity) }];
        }
        saveCustomerCart(newCart, customerKey);
        return { cart: newCart, currentCustomerKey: customerKey, isCartOpen: true };
      }),

      updateCartQuantity: (productId, quantity) => set((state) => {
        const customerKey = getCurrentCustomerKey();
        const newCart = quantity <= 0
          ? state.cart.filter(item => item.id !== productId && item._id !== productId)
          : state.cart.map(item => (item.id === productId || item._id === productId) ? { ...item, quantity } : item);
        saveCustomerCart(newCart, customerKey);
        return { cart: newCart, currentCustomerKey: customerKey };
      }),
      
      removeFromCart: (productId) => set((state) => {
        const customerKey = getCurrentCustomerKey();
        const newCart = state.cart.filter(item => item.id !== productId && item._id !== productId);
        saveCustomerCart(newCart, customerKey);
        return { cart: newCart, currentCustomerKey: customerKey };
      }),
      
      toggleWishlist: (product) => set((state) => {
        const customerKey = getCurrentCustomerKey();
        const targetId = product.id || product._id;
        const exists = state.wishlist.find(item => item.id === targetId || item._id === targetId);
        const newWishlist = exists
          ? state.wishlist.filter(item => item.id !== targetId && item._id !== targetId)
          : [...state.wishlist, product];
        saveCustomerWishlist(newWishlist, customerKey);
        return { wishlist: newWishlist, currentCustomerKey: customerKey, isWishlistOpen: !exists };
      }),
      
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),
      
      clearCart: () => set(() => {
        const customerKey = getCurrentCustomerKey();
        saveCustomerCart([], customerKey);
        return { cart: [], currentCustomerKey: customerKey };
      }),

      clearWishlist: () => set(() => {
        const customerKey = getCurrentCustomerKey();
        saveCustomerWishlist([], customerKey);
        return { wishlist: [], currentCustomerKey: customerKey };
      }),

      syncCustomerData: (forcedCustomerKey?: string) => {
        const key = forcedCustomerKey || getCurrentCustomerKey();
        const newCart = loadCustomerCart(key);
        const newWishlist = loadCustomerWishlist(key);
        set({ cart: newCart, wishlist: newWishlist, currentCustomerKey: key });
      },

      addProduct: (product) => set((state) => ({
        products: [product, ...state.products]
      })),
      updateProduct: (productId, updatedData) => set((state) => ({
        products: state.products.map(p => p.id === productId ? { ...p, ...updatedData } : p)
      })),
      removeProduct: (productId) => set((state) => ({
        products: state.products.filter(p => p.id !== productId)
      })),
      setProducts: (products) => set({ products }),
      fetchProducts: async () => {
        try {
          const response = await axios.get('/api/products?limit=1000&_t=' + Date.now());
          if (response.data.success) {
            const mappedProducts = response.data.data.map((p: any) => {
              let tagsArray = [];
              if (Array.isArray(p.tags)) {
                tagsArray = p.tags;
              } else if (typeof p.tags === 'string') {
                try {
                  tagsArray = JSON.parse(p.tags);
                } catch (e) {
                  tagsArray = p.tags.split(',').map((t: string) => t.trim());
                }
              }
              let badge = '';
              if (p.bestSeller) badge = 'Best Seller';
              else if (p.featured) badge = 'Featured';
              let featuresArray: string[] = [];
              if (Array.isArray(p.features)) {
                featuresArray = p.features;
              } else if (typeof p.features === 'string') {
                try {
                  featuresArray = JSON.parse(p.features);
                } catch (e) {
                  featuresArray = p.features.split('\n').filter(Boolean);
                }
              }

              let includedFilesArray: string[] = [];
              if (Array.isArray(p.includedFiles)) {
                includedFilesArray = p.includedFiles;
              } else if (typeof p.includedFiles === 'string') {
                try {
                  includedFilesArray = JSON.parse(p.includedFiles);
                } catch (e) {
                  includedFilesArray = p.includedFiles.split('\n').filter(Boolean);
                }
              }

              let imagesArray: string[] = [];
              if (Array.isArray(p.images)) {
                imagesArray = p.images;
              } else if (Array.isArray(p.previewImages)) {
                imagesArray = p.previewImages;
              } else if (typeof p.previewImages === 'string') {
                try {
                  imagesArray = JSON.parse(p.previewImages);
                } catch (e) {
                  imagesArray = p.previewImages.split(',').filter(Boolean);
                }
              }
              
              return {
                ...p,
                id: p._id || p.id,
                title: p.name,
                description: p.description,
                price: p.price,
                category: (typeof p.category === 'object' ? (p.category as any).name : p.category) || 'Uncategorized',
                coverImage: p.coverImage || p.thumbnail || undefined,
                status: p.status || 'ACTIVE',
                totalUnitsSold: p.totalUnitsSold || 0,
                sales: p.totalUnitsSold || 0, // Fallback for any existing components using 'sales'
                rating: (p.averageRating === 0 && p.reviewCount === 0) ? null : p.averageRating,
                reviews: p.reviewCount || 0,
                isBestSeller: p.bestSeller || false,
                isFeatured: p.featured || false,
                tags: tagsArray,
                features: featuresArray,
                includedFiles: includedFilesArray,
                images: imagesArray,
                badge: badge
              };
            });
            set({ products: mappedProducts });
          } else {
            toast.error("Failed to load products.");
          }
        } catch (error) {
          console.error("Error fetching products:", error);
          toast.error("Error fetching products. Please check your connection.");
        }
      },
      fetchCategories: async () => {
        try {
          const response = await axios.get('/api/categories?_t=' + Date.now());
          if (response.data.success) {
            const mappedCategories = response.data.data.map((c: any) => ({
              ...c,
              id: c._id || c.id,
              image: c.coverImage || c.image || undefined
            }));
            set({ categories: mappedCategories });
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      },
      fetchBundles: async () => {
        try {
          const response = await axios.get('/api/bundles?status=ACTIVE&_t=' + Date.now());
          if (response.data.success) {
            const activeOnly = (response.data.data || []).filter((b: any) => {
              const st = (b.status || 'ACTIVE').toUpperCase();
              return st === 'ACTIVE' || st === 'PUBLISHED';
            });
            set({ bundles: activeOnly });
          }
        } catch (error) {
          console.error("Error fetching bundles:", error);
        }
      },
      fetchSupportCategories: async () => {
        try {
          const res = await axios.get('/api/support/categories');
          if (res.data.success) {
            set({ supportCategories: res.data.data });
          }
        } catch (error) {
          // Silent fallback for missing endpoints
        }
      },
      fetchSupportArticles: async () => {
        try {
          const res = await axios.get('/api/support/articles?_t=' + Date.now());
          if (res.data.success) {
            set({ supportArticles: res.data.data });
          }
        } catch (error) {
          // Silent fallback for missing endpoints
        }
      },
      fetchCoupons: async () => {
        try {
          const res = await axios.get('/api/coupons?_t=' + Date.now());
          if (res.data?.success) {
            set({ activeCoupons: res.data.data.filter((c: any) => c.status === 'ACTIVE') });
          }
        } catch (error) {
          // Silent fallback
        }
      },
      fetchTestimonials: async () => {
        try {
          const res = await axios.get('/api/testimonials?_t=' + Date.now());
          if (res.data?.success) {
            set({ activeTestimonials: res.data.data.filter((t: any) => t.status === 'ACTIVE') });
          }
        } catch (error) {
          // Silent fallback
        }
      },
      addCategory: (category) => set((state) => ({
        categories: [category, ...state.categories]
      })),
      removeCategory: (categoryId) => set((state) => ({
        categories: state.categories.filter(c => c.id !== categoryId)
      })),
      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),
      razorpayAccounts: [
        {
          id: 'acc_1',
          accountId: 'acc_Gj98KjlM34vX',
          name: 'Main Business Account',
          bankName: 'HDFC Bank (**** 4512)',
          isDefault: true,
          isActive: true
        }
      ],
      addRazorpayAccount: (account) => set((state) => ({
        razorpayAccounts: [...state.razorpayAccounts, { ...account, id: `acc_${Date.now()}` }]
      })),
      setRazorpayAccountDefault: (id) => set((state) => ({
        razorpayAccounts: state.razorpayAccounts.map(acc => ({
          ...acc,
          isDefault: acc.id === id
        }))
      })),
      toggleRazorpayAccountActive: (id) => set((state) => ({
        razorpayAccounts: state.razorpayAccounts.map(acc => {
          if (acc.id === id) {
            return { ...acc, isActive: !acc.isActive };
          }
          return acc;
        })
      }))
    }),
    {
      name: 'kdw-store-v6',
      partialize: (state) => ({ 
        orders: state.orders,
        razorpayAccounts: state.razorpayAccounts
      }), 
    }
  )
);

// Cross-tab and Customer Authentication Listeners for isolated shopping data
if (typeof window !== 'undefined') {
  // Listen for customer change events (dispatched on login, logout, session refresh)
  window.addEventListener('kdw:customer-changed', (e: any) => {
    const key = e.detail?.customerKey || getCurrentCustomerKey();
    useStore.getState().syncCustomerData(key);
  });

  // Listen for storage events (e.g. login/logout in another tab, or cart/wishlist sync)
  window.addEventListener('storage', (e) => {
    if (e.key === 'user' || e.key === 'authToken') {
      useStore.getState().syncCustomerData();
    } else {
      const activeKey = getCurrentCustomerKey();
      if (e.key === getCustomerCartKey(activeKey)) {
        if (e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            if (Array.isArray(updated)) useStore.setState({ cart: updated });
          } catch {}
        } else {
          useStore.setState({ cart: [] });
        }
      } else if (e.key === getCustomerWishlistKey(activeKey)) {
        if (e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            if (Array.isArray(updated)) useStore.setState({ wishlist: updated });
          } catch {}
        } else {
          useStore.setState({ wishlist: [] });
        }
      }
    }
  });
}

