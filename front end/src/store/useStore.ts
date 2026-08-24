import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

interface StoreState {
  cart: any[];
  wishlist: any[];
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
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  toggleWishlist: (product: any) => void;
  setCartOpen: (isOpen: boolean) => void;
  setWishlistOpen: (isOpen: boolean) => void;
  clearCart: () => void;
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

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
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
      
      addToCart: (product) => set((state) => {
        if (state.cart.find(item => item.id === product.id)) return state;
        return { cart: [...state.cart, product], isCartOpen: true };
      }),
      
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId)
      })),
      
      toggleWishlist: (product) => set((state) => {
        const exists = state.wishlist.find(item => item.id === product.id);
        if (exists) {
          return { wishlist: state.wishlist.filter(item => item.id !== product.id) };
        }
        return { wishlist: [...state.wishlist, product], isWishlistOpen: true };
      }),
      
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),
      clearCart: () => set({ cart: [] }),

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
          const response = await axios.get('/api/bundles?_t=' + Date.now());
          if (response.data.success) {
            set({ bundles: response.data.data });
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
        cart: state.cart, 
        wishlist: state.wishlist, 
        orders: state.orders,
        razorpayAccounts: state.razorpayAccounts
      }), 
    }
  )
);
