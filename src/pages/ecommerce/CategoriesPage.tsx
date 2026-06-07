import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { mockCategories } from '../../data/mockData';
import { ArrowRight } from 'lucide-react';

const activeCategories = mockCategories.filter(c => c.status === 'active');

export const CategoriesPage: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6">
        <NavLink to="/" className={`${dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'}`}>Home</NavLink>
        <span className={dark ? 'text-neutral-600' : 'text-gray-300'}>/</span>
        <span className={dark ? 'text-neutral-300' : 'text-gray-700'}>Categories</span>
      </div>

      <div className="text-center mb-12">
        <h1 className={`font-display text-3xl lg:text-5xl font-bold mb-3 ${dark ? 'text-white' : 'text-brand-900'}`}>
          Shop by Category
        </h1>
        <p className={`text-sm max-w-lg mx-auto ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Browse our curated collections. From street style to formal elegance, find your perfect look.
        </p>
      </div>

      {/* Featured Category */}
      <NavLink
        to={`/store/shop?category=${encodeURIComponent(activeCategories[0]?.name || '')}`}
        className="block relative rounded-3xl overflow-hidden mb-8 group"
      >
        <div className="aspect-[21/9] sm:aspect-[3/1]">
          <img
            src={activeCategories[0]?.image || ''}
            alt={activeCategories[0]?.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-6 sm:p-10">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Featured Collection</p>
          <h2 className="text-white font-display text-2xl sm:text-4xl font-bold mb-2">{activeCategories[0]?.name}</h2>
          <p className="text-white/70 text-sm mb-4 max-w-md">{activeCategories[0]?.description}</p>
          <span className="inline-flex items-center gap-2 text-white text-sm font-semibold group-hover:gap-3 transition-all">
            Explore Collection <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </NavLink>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {activeCategories.slice(1).map(cat => (
          <NavLink
            key={cat.id}
            to={`/store/shop?category=${encodeURIComponent(cat.name)}`}
            className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer"
          >
            <img
              src={cat.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80'}
              alt={cat.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 translate-y-2 group-hover:translate-y-0 transition-transform">
              <p className="text-white font-semibold text-sm sm:text-base">{cat.name}</p>
              <p className="text-white/60 text-xs mt-0.5">{cat.productCount} items</p>
              <span className="inline-flex items-center gap-1.5 mt-2 text-white/80 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Shop Now <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
