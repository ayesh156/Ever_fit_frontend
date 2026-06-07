import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product, Size } from '../data/mockData';

export interface CartItem {
  product: Product;
  size: Size;
  color: string;
  quantity: number;
  variantId: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: Size, color: string, quantity?: number, variantId?: number) => void;
  removeFromCart: (productId: string, size: Size, color: string) => void;
  updateQuantity: (productId: string, size: Size, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // QuickAdd drawer
  quickAddProduct: Product | null;
  openQuickAdd: (product: Product) => void;
  closeQuickAdd: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('everfit-cart');
      if (saved) {
        try {
          const parsed: CartItem[] = JSON.parse(saved);
          // Check for stale cache: if any item has variantId === productId or variantId === 70, clear cart
          const hasStaleCache = parsed.some(item => 
            item.variantId === Number(item.product.id) || item.variantId === 70
          );
          if (hasStaleCache) {
            localStorage.removeItem('everfit-cart');
            return [];
          }
          return parsed.filter(i => typeof i.variantId === 'number' && i.variantId > 0);
        } catch { return []; }
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);

  const openQuickAdd  = (product: Product) => setQuickAddProduct(product);
  const closeQuickAdd = () => setQuickAddProduct(null);

  useEffect(() => {
    localStorage.setItem('everfit-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, size: Size, color: string, quantity = 1, variantId?: number) => {
    const vid = variantId && variantId > 0 ? variantId : 1;
    setItems(prev => {
      const existing = prev.find(
        i => i.product.id === product.id && i.size === size && i.color === color
      );
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.size === size && i.color === color
            ? { ...i, quantity: i.quantity + quantity, variantId: vid }
            : i
        );
      }
      return [...prev, { product, size, color, quantity, variantId: vid }];
    });
  };

  const removeFromCart = (productId: string, size: Size, color: string) => {
    setItems(prev => prev.filter(
      i => !(i.product.id === productId && i.size === size && i.color === color)
    ));
  };

  const updateQuantity = (productId: string, size: Size, color: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId, size, color);
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId && i.size === size && i.color === color
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, totalPrice, isCartOpen, setIsCartOpen,
      quickAddProduct, openQuickAdd, closeQuickAdd,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};