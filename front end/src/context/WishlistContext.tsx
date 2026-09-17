import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useStore } from '../store/useStore';

export interface WishlistItem {
  id: string;
  title: string;
  name?: string;
  slug?: string;
  price: number;
  coverImage?: string | null;
  thumbnail?: string | null;
  image?: string | null;
  category?: string | any;
  [key: string]: any;
}

export interface WishlistContextType {
  wishlistItems: WishlistItem[];
  itemCount: number;
  isWishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  toggleWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wishlist, isWishlistOpen, setWishlistOpen, toggleWishlist: storeToggleWishlist, clearWishlist: storeClearWishlist } = useStore();

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlist.some((item) => item.id === productId || item._id === productId);
  }, [wishlist]);

  const toggleWishlist = useCallback((product: any) => {
    storeToggleWishlist(product);
  }, [storeToggleWishlist]);

  const removeFromWishlist = useCallback((productId: string) => {
    const target = wishlist.find((item) => item.id === productId || item._id === productId);
    if (target) {
      storeToggleWishlist(target);
    }
  }, [wishlist, storeToggleWishlist]);

  const clearWishlist = useCallback(() => {
    storeClearWishlist();
  }, [storeClearWishlist]);

  const itemCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems: wishlist,
        itemCount,
        isWishlistOpen,
        setWishlistOpen,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

export default WishlistContext;
