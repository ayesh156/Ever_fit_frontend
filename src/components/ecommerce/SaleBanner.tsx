import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SaleBannerProps {
  image?: string;
  heading?: string;
  subheading?: string;
  buttonLink?: string;
}

export const SaleBanner: React.FC<SaleBannerProps> = ({
  image,
  heading = 'Season End Sale',
  subheading = 'Up to 40% off on selected items. Don\'t miss out on our exclusive end-of-season deals.',
  buttonLink = '/shop',
}) => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80'}
          alt="Season Sale"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28 text-center">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Limited Time</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          {heading}
        </h2>
        <p className="text-white/70 text-base lg:text-lg mb-8 max-w-lg mx-auto">
          {subheading}
        </p>
        <NavLink
          to={buttonLink}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-neutral-100 transition-all shadow-xl"
        >
          Shop Now
          <ArrowRight className="w-4 h-4" />
        </NavLink>
      </div>
    </section>
  );
};