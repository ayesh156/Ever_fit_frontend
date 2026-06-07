import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// ── Collection data ──────────────────────────────────────────────────────────
// Swap image URLs for your own CDN/public assets when ready.
const collections = [
  {
    id: 'linen',
    label: 'Summer Linen',
    sub: 'Breathe easy, dress sharp',
    path: '/store/shop?collection=linen',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=85',
    // spans 2 rows in the grid — the "hero" tile
    featured: true,
  },
  {
    id: 'evening',
    label: 'Evening Wear',
    sub: 'Refined for every occasion',
    path: '/store/shop?collection=evening',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=700&q=85',
    featured: false,
  },
  {
    id: 'essentials',
    label: 'Everyday Essentials',
    sub: 'Effortless from morning to night',
    path: '/store/shop?collection=essentials',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=85',
    featured: false,
  },
  {
    id: 'organic',
    label: 'Organic Edit',
    sub: 'Conscious fabrics, clean silhouettes',
    path: '/store/shop?collection=organic',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&q=85',
    featured: false,
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export const Collections: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <section className={`py-20 lg:py-28 ${dark ? 'bg-brand-950' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-14">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`h-px w-8 ${dark ? 'bg-neutral-600' : 'bg-neutral-300'}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                dark ? 'text-neutral-500' : 'text-neutral-400'
              }`}>
                Curated For You
              </span>
            </div>
            <h2 className={`font-display leading-tight ${dark ? 'text-white' : 'text-brand-900'}`}>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-light italic">Shop by</span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold">Collection</span>
            </h2>
          </div>

          <NavLink
            to="/shop"
            className={`hidden sm:inline-flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${
              dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-brand-900'
            }`}
          >
            View All Collections
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>

        {/* ── Asymmetric grid ─────────────────────────────────────────────────
            Layout (desktop):
            ┌──────────────────┬──────────┐
            │                  │  tile 2  │
            │   featured tile  ├──────────┤
            │   (2 rows tall)  │  tile 3  │
            ├──────────────────┴──────────┤  ← full-width bottom row
            │  tile 4 (half)  │  (space) │
            └─────────────────────────────┘
            On mobile: single column stack.
        ──────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

          {/* Tile 1 — featured, spans 2 rows on lg */}
          <CollectionTile
            item={collections[0]}
            dark={dark}
            className="lg:row-span-2 lg:col-span-1"
            aspectClass="aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-full"
          />

          {/* Tile 2 */}
          <CollectionTile
            item={collections[1]}
            dark={dark}
            className="lg:col-span-2"
            aspectClass="aspect-[4/3] sm:aspect-[16/9]"
          />

          {/* Tiles 3 & 4 — side by side on lg */}
          <CollectionTile
            item={collections[2]}
            dark={dark}
            className=""
            aspectClass="aspect-[4/3]"
          />
          <CollectionTile
            item={collections[3]}
            dark={dark}
            className=""
            aspectClass="aspect-[4/3]"
          />
        </div>

        {/* Mobile CTA */}
        <div className="flex justify-center mt-8 sm:hidden">
          <NavLink
            to="/shop"
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium border transition-all ${
              dark
                ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            View All Collections
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </section>
  );
};

// ── Reusable tile ────────────────────────────────────────────────────────────
interface TileProps {
  item: typeof collections[number];
  dark: boolean;
  className?: string;
  aspectClass?: string;
}

const CollectionTile: React.FC<TileProps> = ({ item, dark, className = '', aspectClass = 'aspect-[4/3]' }) => (
  <NavLink
    to={item.path}
    className={`group relative overflow-hidden block ${aspectClass} ${className}`}
  >
    {/* Image — zoom on hover, contained by overflow-hidden on parent */}
    <img
      src={item.image}
      alt={item.label}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
    />

    {/* Gradient overlay — deepens on hover */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

    {/* Text content */}
    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
      {/* Sub label */}
      <p className={`text-[10px] uppercase tracking-[0.2em] mb-1.5 transition-opacity duration-300 ${
        item.featured ? 'opacity-70 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-70'
      } text-white/80`}>
        {item.sub}
      </p>

      {/* Main label */}
      <h3 className="font-display text-white leading-tight">
        {item.featured ? (
          <>
            <span className="block text-2xl sm:text-3xl font-light italic">{item.label.split(' ')[0]}</span>
            <span className="block text-2xl sm:text-3xl font-bold">{item.label.split(' ').slice(1).join(' ')}</span>
          </>
        ) : (
          <span className="block text-xl sm:text-2xl font-semibold">{item.label}</span>
        )}
      </h3>

      {/* Arrow — slides in on hover */}
      <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
        <span className="text-white/90 text-xs font-medium tracking-wide">Shop Now</span>
        <ArrowRight className="w-3.5 h-3.5 text-white/90" />
      </div>
    </div>

    {/* Top-right badge for featured tile */}
    {item.featured && (
      <div className={`
        absolute top-4 right-4 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em]
        backdrop-blur-md transition-opacity duration-300
        ${dark ? 'bg-white/10 text-white/80' : 'bg-white/20 text-white'}
      `}>
        Featured
      </div>
    )}
  </NavLink>
);
