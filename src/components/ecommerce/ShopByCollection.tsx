import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowRight, Layers } from 'lucide-react';

interface CollectionItem {
  name: string;
  productCount: number;
  image: string;
}

interface ShopByCollectionProps {
  collections: CollectionItem[];
}

export const ShopByCollection: React.FC<ShopByCollectionProps> = ({ collections }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  if (collections.length === 0) return null;

  return (
    <section className={`py-16 lg:py-20 ${dark ? 'bg-brand-900/20' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
              <Layers className="w-3.5 h-3.5 inline mr-1.5" />Categories
            </p>
            <h2 className={`font-display text-3xl lg:text-4xl font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>
              Shop by Collection
            </h2>
          </div>
          <NavLink
            to="/shop"
            className={`hidden sm:flex items-center gap-1.5 text-sm font-medium transition-colors ${
              dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Shop All <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {collections.map((col) => (
            <NavLink
              key={col.name}
              to={`/shop?category=${encodeURIComponent(col.name)}`}
              className={`group relative aspect-[4/5] rounded-2xl overflow-hidden border transition-all duration-300 ${
                dark
                  ? 'bg-brand-900/40 border-neutral-800/60 hover:border-neutral-600'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                <h3 className="text-white font-semibold text-base lg:text-lg">{col.name}</h3>
                <p className="text-white/60 text-xs mt-1">{col.productCount} {col.productCount === 1 ? 'item' : 'items'}</p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium">
                  Shop <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </NavLink>
          ))}
        </div>

        <div className="flex justify-center mt-8 sm:hidden">
          <NavLink
            to="/shop"
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border transition-all ${
              dark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            View All Categories <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </section>
  );
};