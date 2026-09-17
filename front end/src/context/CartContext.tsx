import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useStore } from '../store/useStore';

export interface CartItem {
  id: string;
  title: string;
  name?: string;
  slug?: string;
  price: number;
  discountPrice?: number | null;
  coverImage?: string | null;
  thumbnail?: string | null;
  image?: string | null;
  category?: string | any;
  productType?: string;
  quantity: number;
  [key: string]: any;
}

export interface CartContextType {
  cartItems: CartItem[];
  subtotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: any, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { cart, isCartOpen, setCartOpen, addToCart: storeAddToCart, removeFromCart: storeRemoveFromCart, clearCart: storeClearCart } = useStore();

  const isInCart = useCallback((productId: string): boolean => {
    return cart.some((item) => item.id === productId || item._id === productId);
  }, [cart]);

  const addToCart = useCallback((product: any, quantity: number = 1): boolean => {
    storeAddToCart(product, quantity);
    return true;
  }, [storeAddToCart]);

  const removeFromCart = useCallback((productId: string) => {
    storeRemoveFromCart(productId);
  }, [storeRemoveFromCart]);

  const clearCart = useCallback(() => {
    storeClearCart();
  }, [storeClearCart]);

  // Calculate Subtotal dynamically from real item prices
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [cart]);

  const itemCount = cart.length;

  return (
    <CartContext.Provider
      value={{
        cartItems: cart,
        subtotal,
        itemCount,
        isCartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;

