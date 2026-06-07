import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Heart, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { Size } from '../../data/mockData';
import { toast } from 'sonner';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

export const QuickAddDrawer: React.FC = () => {
  const { theme } = useTheme();
  const { quickAddProduct, closeQuickAdd, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const dark = theme === 'dark';

  const product = quickAddProduct;
  const isOpen  = product !== null;

  const [selectedSize,  setSelectedSize]  = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Reset selections whenever a new product opens
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] ?? null);
      setSelectedColor(product.colors[0] ?? null);
    }
  }, [product?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQuickAdd(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeQuickAdd]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleAddToCart = () => {
    if (!product || !selectedSize || !selectedColor) return;
    const variant = (product as any).variants?.find((v: any) => v.size === selectedSize && v.color === selectedColor);
    const selectedVarId = variant?.id || (product as any).variants?.[0]?.id;
    if (!selectedVarId) { toast.error('Error: Product variants missing from database.'); return; }
    addToCart(product, selectedSize, selectedColor, 1, selectedVarId);
    toast.success(`${product.name} added to cart`);
    closeQuickAdd();
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={closeQuickAdd}
        className={`
          fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
      />

      {/* ── Drawer panel ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Quick add to cart"
        className={`
          fixed inset-y-0 right-0 z-[80]
          w-full sm:w-[420px]
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${dark ? 'bg-brand-950' : 'bg-white'}
        `}
      >
        {product && (
          <>
            {/* ── Header ── */}
            <div className={`flex items-center justify-between px-6 py-5 border-b flex-shrink-0 ${
              dark ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <div>
                <p className={`text-[10px] uppercase tracking-[0.2em] mb-0.5 ${
                  dark ? 'text-neutral-500' : 'text-neutral-400'
                }`}>
                  Quick Add
                </p>
                <h2 className={`font-display text-lg font-semibold leading-tight ${
                  dark ? 'text-white' : 'text-brand-900'
                }`}>
                  {product.name}
                </h2>
              </div>
              <button
                onClick={closeQuickAdd}
                aria-label="Close drawer"
                className={`p-2 transition-colors ${
                  dark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-brand-900'
                }`}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Product image + meta */}
              <div className="flex gap-4 px-6 py-5">
                <NavLink
                  to={`/store/product/${product.id}`}
                  onClick={closeQuickAdd}
                  className="w-24 aspect-[3/4] flex-shrink-0 overflow-hidden"
                >
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </NavLink>
                <div className="flex flex-col justify-center min-w-0">
                  <p className={`text-[10px] uppercase tracking-[0.18em] mb-1 ${
                    dark ? 'text-neutral-500' : 'text-neutral-400'
                  }`}>
                    {product.category} · {product.brand}
                  </p>
                  <p className={`font-display text-xl font-bold mb-1 ${
                    dark ? 'text-white' : 'text-brand-900'
                  }`}>
                    {formatPrice(product.sellingPrice)}
                  </p>
                  {product.status === 'low-stock' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-semibold w-fit">
                      Few Left
                    </span>
                  )}
                </div>
              </div>

              <div className={`h-px mx-6 ${dark ? 'bg-neutral-800' : 'bg-neutral-100'}`} />

              {/* ── Color selector ── */}
              {product.colors.length > 0 && (
                <div className="px-6 py-5">
                  <p className={`text-[10px] uppercase tracking-[0.18em] mb-3 ${
                    dark ? 'text-neutral-500' : 'text-neutral-400'
                  }`}>
                    Colour — <span className={`normal-case tracking-normal ${dark ? 'text-neutral-300' : 'text-brand-900'}`}>
                      {selectedColor}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => {
                      const bg = color.toLowerCase().replace(/ /g, '') === 'white'
                        ? '#f5f5f5'
                        : color.toLowerCase().split('/')[0].split('&')[0].trim().replace(/ /g, '');
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                          className={`w-7 h-7 transition-all ${
                            selectedColor === color
                              ? 'ring-2 ring-offset-2 ring-brand-900'
                              : 'hover:ring-1 hover:ring-offset-1 hover:ring-neutral-400'
                          } ${dark ? 'ring-offset-brand-950' : 'ring-offset-white'}`}
                          style={{ backgroundColor: bg }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`h-px mx-6 ${dark ? 'bg-neutral-800' : 'bg-neutral-100'}`} />

              {/* ── Size selector ── */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-[10px] uppercase tracking-[0.18em] ${
                    dark ? 'text-neutral-500' : 'text-neutral-400'
                  }`}>
                    Size — <span className={`normal-case tracking-normal ${dark ? 'text-neutral-300' : 'text-brand-900'}`}>
                      {selectedSize}
                    </span>
                  </p>
                  <button className={`text-[10px] uppercase tracking-[0.12em] underline underline-offset-2 ${
                    dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-brand-900'
                  }`}>
                    Size Guide
                  </button>
                </div>

                {/* Sharp-edged size boxes */}
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        min-w-[3rem] px-3 py-2.5
                        text-xs font-semibold uppercase tracking-wide
                        border transition-all duration-150
                        ${selectedSize === size
                          ? dark
                            ? 'bg-white text-black border-white'
                            : 'bg-brand-900 text-white border-brand-900'
                          : dark
                            ? 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
                            : 'border-neutral-200 text-gray-600 hover:border-neutral-400 hover:text-brand-900'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`h-px mx-6 ${dark ? 'bg-neutral-800' : 'bg-neutral-100'}`} />

              {/* View full details link */}
              <div className="px-6 py-4">
                <NavLink
                  to={`/store/product/${product.id}`}
                  onClick={closeQuickAdd}
                  className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                    dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-brand-900'
                  }`}
                >
                  View Full Details
                  <ChevronRight size={12} />
                </NavLink>
              </div>
            </div>

            {/* ── Footer actions — fixed at bottom ── */}
            <div className={`flex-shrink-0 px-6 py-5 border-t ${
              dark ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <div className="flex gap-3">
                {/* Wishlist toggle */}
                <button
                  onClick={() => toggleWishlist(product)}
                  aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`
                    flex-shrink-0 p-3.5 border transition-colors duration-150
                    ${isInWishlist(product.id)
                      ? 'border-red-400 text-red-500'
                      : dark
                        ? 'border-neutral-700 text-neutral-400 hover:border-red-400 hover:text-red-400'
                        : 'border-neutral-200 text-gray-400 hover:border-red-400 hover:text-red-500'
                    }
                  `}
                >
                  <Heart
                    size={18}
                    strokeWidth={1.5}
                    className={isInWishlist(product.id) ? 'fill-red-500' : ''}
                  />
                </button>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || product.status === 'out-of-stock'}
                  className={`
                    flex-1 flex items-center justify-center gap-2.5
                    py-3.5 text-sm font-semibold uppercase tracking-[0.12em]
                    transition-colors duration-150
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${dark
                      ? 'bg-white text-black hover:bg-neutral-100 disabled:hover:bg-white'
                      : 'bg-brand-900 text-white hover:bg-brand-800 disabled:hover:bg-brand-900'
                    }
                  `}
                >
                  <ShoppingBag size={16} strokeWidth={1.5} />
                  {product.status === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
