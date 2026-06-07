import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  totalProducts: number;
  totalCategories: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ totalProducts, totalCategories }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <section className="relative w-full min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT PANEL — text content */}
      <div className={`
        relative z-10 flex flex-col justify-center
        w-full lg:w-[45%] px-8 sm:px-12 lg:px-16 xl:px-24
        py-24 lg:py-0
        ${dark ? 'bg-brand-950' : 'bg-[#f7f4f0]'}
      `}>
        <div className="flex items-center gap-3 mb-8">
          <span className={`h-px w-10 ${dark ? 'bg-neutral-600' : 'bg-neutral-400'}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${
            dark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            New Season — 2026
          </span>
        </div>

        <h1 className={`font-display leading-[1.05] mb-6 ${dark ? 'text-white' : 'text-brand-900'}`}>
          <span className="block text-5xl sm:text-6xl xl:text-7xl font-light italic">Dressed</span>
          <span className="block text-5xl sm:text-6xl xl:text-7xl font-bold mt-1">With Intent.</span>
        </h1>

        <p className={`text-sm sm:text-base leading-relaxed max-w-sm mb-10 ${
          dark ? 'text-neutral-400' : 'text-gray-500'
        }`}>
          Curated collections for the modern Sri Lankan wardrobe — from effortless everyday wear to refined statement pieces.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-12">
          <NavLink
            to="/shop?filter=new"
            className={`inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 ${
              dark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-brand-900 text-white hover:bg-brand-800'
            }`}
          >
            Shop New Arrivals
            <ArrowRight className="w-4 h-4" />
          </NavLink>
          <NavLink
            to="/shop"
            className={`text-sm font-medium underline underline-offset-4 transition-colors ${
              dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-brand-900'
            }`}
          >
            View All
          </NavLink>
        </div>

        <div className={`flex items-center gap-8 pt-8 border-t ${dark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          {[
            { value: `${totalProducts}+`, label: 'Products' },
            { value: `${totalCategories}+`, label: 'Categories' },
            { value: '2K+', label: 'Happy Clients' },
          ].map(stat => (
            <div key={stat.label}>
              <p className={`text-2xl font-bold font-display ${dark ? 'text-white' : 'text-brand-900'}`}>{stat.value}</p>
              <p className={`text-[11px] uppercase tracking-wider mt-0.5 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — full-bleed image */}
      <div className="relative w-full lg:w-[55%] min-h-[60vw] lg:min-h-0">
        <img
          src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1400&q=85"
          alt="New Season Collection"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className={`absolute inset-y-0 left-0 w-24 ${
          dark ? 'bg-gradient-to-r from-brand-950 to-transparent' : 'bg-gradient-to-r from-[#f7f4f0] to-transparent'
        }`} />

        <div className={`
          absolute bottom-8 left-8 lg:bottom-12 lg:left-12
          px-5 py-4 rounded-2xl backdrop-blur-md shadow-xl
          ${dark ? 'bg-brand-950/80 border border-neutral-800/60' : 'bg-white/85 border border-white/60'}
        `}>
          <p className={`text-[10px] uppercase tracking-[0.18em] mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Featured</p>
          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-brand-900'}`}>Summer Linen Edit</p>
          <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>From Rs. 2,800</p>
        </div>

        <div className={`
          absolute top-8 right-8 inline-flex items-center gap-2 px-4 py-2 rounded-full
          backdrop-blur-md text-xs font-medium
          ${dark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-white'}
        `}>
          <Sparkles className="w-3.5 h-3.5" />
          New Collection
        </div>
      </div>
    </section>
  );
};