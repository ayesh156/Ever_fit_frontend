import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingBag, Heart, ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { mockProducts } from '../../data/mockData';
import type { Product } from '../../data/mockData';

// ── Data — top 8 in-stock products as "best sellers" ────────────────────────
const bestSellers: Product[] = mockProducts
  .filter(p => p.status !== 'out-of-stock')
  .slice(0, 8);

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

// ── Component ────────────────────────────────────────────────────────────────
export const BestSellers: React.FC = () => {
  const { theme } = useTheme();
  const { openQuickAdd } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const dark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickAdd(product);
  };

  return (
    <section className={`py-20 lg:py-28 ${dark ? 'bg-brand-950' : 'bg-[#f7f4f0]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-14">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-px w-8 ${dark ? 'bg-neutral-600' : 'bg-neutral-300'}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                dark ? 'text-neutral-500' : 'text-neutral-400'
              }`}>
                Most Loved
              </span>
            </div>
            <h2 className={`font-display leading-tight ${dark ? 'text-white' : 'text-brand-900'}`}>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-light italic">Our</span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold">Best Sellers</span>
            </h2>
          </div>

          {/* Desktop: nav arrows + view all */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className={`p-2.5 rounded-full border transition-all ${
                dark
                  ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  : 'border-gray-300 text-gray-500 hover:bg-white hover:text-brand-900 hover:shadow-sm'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className={`p-2.5 rounded-full border transition-all ${
                dark
                  ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  : 'border-gray-300 text-gray-500 hover:bg-white hover:text-brand-900 hover:shadow-sm'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <NavLink
              to="/shop"
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors duration-150 ml-2 ${
                dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-brand-900'
              }`}
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>

        {/* ── Scroll track ────────────────────────────────────────────────────
            Desktop: 4 cards visible, no scrollbar shown.
            Mobile: 1.5 cards peek to signal scrollability.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {bestSellers.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              dark={dark}
              rank={idx + 1}
              onQuickAdd={handleQuickAdd}
              isWishlisted={isInWishlist(product.id)}
              onToggleWishlist={(e, p) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p); }}
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="flex justify-center mt-8 sm:hidden">
          <NavLink
            to="/shop"
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium border transition-all ${
              dark
                ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                : 'border-gray-300 text-gray-700 hover:bg-white'
            }`}
          >
            View All Products
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </section>
  );
};

// ── Product Card ─────────────────────────────────────────────────────────────
interface CardProps {
  product: Product;
  dark: boolean;
  rank: number;
  onQuickAdd: (e: React.MouseEvent, product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (e: React.MouseEvent, product: Product) => void;
}

const ProductCard: React.FC<CardProps> = ({ product, dark, rank, onQuickAdd, isWishlisted, onToggleWishlist }) => (
  <NavLink
    to={`/store/product/${product.id}`}
    // Snap + fixed width: 1 card on mobile, 2 on sm, 4 on lg
    className={`
      group relative flex-shrink-0 snap-start
      w-[72vw] sm:w-[44vw] lg:w-[calc(25%-12px)]
      rounded-none overflow-hidden
      transition-all duration-300
      ${dark
        ? 'bg-brand-900/40 hover:bg-brand-900/60'
        : 'bg-white hover:shadow-xl'
      }
    `}
  >
    {/* ── Image container ── */}
    <div className="relative aspect-[3/4] overflow-hidden">
      <img
        src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80'}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Rank badge — top left */}
      <div className={`
        absolute top-3 left-3 w-7 h-7 flex items-center justify-center
        text-[11px] font-bold backdrop-blur-md
        ${dark ? 'bg-white/15 text-white' : 'bg-black/20 text-white'}
      `}>
        {String(rank).padStart(2, '0')}
      </div>

      {/* Status badge */}
      {product.status === 'low-stock' && (
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-semibold backdrop-blur-sm">
          Few Left
        </span>
      )}

      {/* ── Hover action bar — slides up from bottom ── */}
      <div className={`
        absolute bottom-0 left-0 right-0 flex items-center gap-2 p-3
        translate-y-full group-hover:translate-y-0
        transition-transform duration-300 ease-out
        ${dark ? 'bg-brand-950/90 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}
      `}>
        {product.status !== 'out-of-stock' ? (
          <button
            onClick={(e) => onQuickAdd(e, product)}
            className={`
              flex-1 flex items-center justify-center gap-2
              py-2.5 text-xs font-semibold tracking-wide
              transition-colors duration-150
              ${dark
                ? 'bg-white text-black hover:bg-neutral-100'
                : 'bg-brand-900 text-white hover:bg-brand-800'
              }
            `}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Quick Add
          </button>
        ) : (
          <span className={`flex-1 text-center py-2.5 text-xs font-semibold ${
            dark ? 'text-neutral-500' : 'text-gray-400'
          }`}>
            Sold Out
          </span>
        )}
        <button
          onClick={e => onToggleWishlist(e, product)}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`p-2.5 border transition-colors duration-150 ${
            isWishlisted
              ? 'border-red-300 text-red-500'
              : dark
                ? 'border-neutral-700 text-neutral-400 hover:text-red-400 hover:border-red-400'
                : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500' : ''}`} />
        </button>
      </div>
    </div>

    {/* ── Card body ── */}
    <div className="p-4">
      {/* Category */}
      <p className={`text-[10px] uppercase tracking-[0.18em] mb-1.5 ${
        dark ? 'text-neutral-500' : 'text-gray-400'
      }`}>
        {product.category}
      </p>

      {/* Name */}
      <h3 className={`font-medium text-sm leading-snug line-clamp-2 mb-3 ${
        dark ? 'text-neutral-200' : 'text-gray-800'
      }`}>
        {product.name}
      </h3>

      {/* Price row */}
      <div className="flex items-center justify-between">
        <p className={`font-bold text-sm font-display ${
          dark ? 'text-white' : 'text-brand-900'
        }`}>
          {formatPrice(product.sellingPrice)}
        </p>

        {/* Star rating — static 4.5 placeholder */}
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>4.5</span>
        </div>
      </div>

      {/* Color swatches */}
      {product.colors.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {product.colors.slice(0, 4).map(color => (
            <span
              key={color}
              title={color}
              className={`w-3.5 h-3.5 rounded-full border ${
                dark ? 'border-neutral-600' : 'border-gray-300'
              }`}
              style={{
                backgroundColor:
                  color.toLowerCase().replace(/ /g, '') === 'white'
                    ? '#f5f5f5'
                    : color.toLowerCase().split('/')[0].split('&')[0].trim().replace(/ /g, ''),
              }}
            />
          ))}
          {product.colors.length > 4 && (
            <span className={`text-[10px] ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>
              +{product.colors.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  </NavLink>
);
