import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, ShoppingBag, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { toast } from 'sonner';
import type { Product } from '../../data/mockData';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

export const WishlistPage: React.FC = () => {
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const { items, removeFromWishlist } = useWishlist();
  const dark = theme === 'dark';

  const handleAddToCart = (product: Product) => {
    const variant = (product as any).variants?.find((v: any) => v.size === product.sizes[0] && v.color === product.colors[0]);
    const vid = variant?.id || (product as any).variants?.[0]?.id || 1;
    addToCart(product, product.sizes[0], product.colors[0], 1, vid);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className={`min-h-[70vh] ${dark ? 'bg-brand-950' : 'bg-[#f9f7f4]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20 lg:pt-14 lg:pb-28">

        {/* ── Page header ── */}
        <div className="mb-10 lg:mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className={`h-px w-8 ${dark ? 'bg-neutral-600' : 'bg-neutral-400'}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
              dark ? 'text-neutral-500' : 'text-neutral-400'
            }`}>
              Saved Items
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <h1 className={`font-display leading-tight ${dark ? 'text-white' : 'text-brand-900'}`}>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-light italic">Your</span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold">Wishlist</span>
            </h1>
            {items.length > 0 && (
              <p className={`text-sm mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── Empty state ── */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={`w-16 h-16 flex items-center justify-center border mb-6 ${
              dark ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <Heart className={`w-7 h-7 ${dark ? 'text-neutral-700' : 'text-neutral-300'}`} strokeWidth={1.25} />
            </div>
            <h2 className={`font-display text-2xl font-semibold mb-2 ${
              dark ? 'text-neutral-300' : 'text-brand-900'
            }`}>
              Nothing saved yet
            </h2>
            <p className={`text-sm mb-8 max-w-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
              Tap the heart on any product to save it here for later.
            </p>
            <NavLink
              to="/shop"
              className={`inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold tracking-wide transition-all ${
                dark
                  ? 'bg-white text-black hover:bg-neutral-100'
                  : 'bg-brand-900 text-white hover:bg-brand-800'
              }`}
            >
              Browse the Shop
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        ) : (
          <>
            {/* ── Product grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {items.map(product => (
                <div
                  key={product.id}
                  className={`group relative overflow-hidden transition-all duration-300 ${
                    dark
                      ? 'bg-brand-900/40 hover:bg-brand-900/60'
                      : 'bg-white hover:shadow-xl'
                  }`}
                >
                  {/* Remove button — top right */}
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    aria-label="Remove from wishlist"
                    className={`
                      absolute top-3 right-3 z-10
                      w-7 h-7 flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                      ${dark
                        ? 'bg-brand-950/80 text-neutral-400 hover:text-white'
                        : 'bg-white/90 text-gray-400 hover:text-brand-900'
                      }
                    `}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Image */}
                  <NavLink to={`/store/product/${product.id}`}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {product.status === 'out-of-stock' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="px-3 py-1 bg-black/70 text-white text-xs font-semibold">
                            Sold Out
                          </span>
                        </div>
                      )}
                      {product.status === 'low-stock' && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-semibold">
                          Few Left
                        </span>
                      )}
                    </div>
                  </NavLink>

                  {/* Card body */}
                  <div className="p-4">
                    <p className={`text-[10px] uppercase tracking-[0.18em] mb-1 ${
                      dark ? 'text-neutral-500' : 'text-gray-400'
                    }`}>
                      {product.category}
                    </p>
                    <NavLink to={`/store/product/${product.id}`}>
                      <h3 className={`font-medium text-sm leading-snug line-clamp-2 mb-3 ${
                        dark ? 'text-neutral-200 hover:text-white' : 'text-gray-800 hover:text-brand-900'
                      } transition-colors`}>
                        {product.name}
                      </h3>
                    </NavLink>
                    <p className={`font-bold text-sm font-display mb-4 ${
                      dark ? 'text-white' : 'text-brand-900'
                    }`}>
                      {formatPrice(product.sellingPrice)}
                    </p>

                    {/* Add to cart */}
                    {product.status !== 'out-of-stock' ? (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`
                          w-full flex items-center justify-center gap-2
                          py-2.5 text-xs font-semibold uppercase tracking-[0.12em]
                          transition-colors duration-150
                          ${dark
                            ? 'bg-white text-black hover:bg-neutral-100'
                            : 'bg-brand-900 text-white hover:bg-brand-800'
                          }
                        `}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                    ) : (
                      <div className={`w-full py-2.5 text-center text-xs font-semibold border ${
                        dark ? 'border-neutral-700 text-neutral-600' : 'border-gray-200 text-gray-300'
                      }`}>
                        Out of Stock
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Bottom CTA ── */}
            <div className={`mt-14 pt-10 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              dark ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                Items are saved to your device and may be removed if you clear your browser data.
              </p>
              <NavLink
                to="/shop"
                className={`inline-flex items-center gap-2 text-sm font-medium transition-colors flex-shrink-0 ${
                  dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-brand-900'
                }`}
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
