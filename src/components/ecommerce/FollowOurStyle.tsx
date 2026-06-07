import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const images = [
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80',
];

export const FollowOurStyle: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <section className={`py-16 lg:py-20 ${dark ? 'bg-brand-900/20' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            @everfit.fashion
          </p>
          <h2 className={`font-display text-3xl lg:text-4xl font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>
            Follow Our Style
          </h2>
          <p className={`text-sm mt-2 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Tag us on Instagram for a chance to be featured
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {images.map((img, idx) => (
            <a
              href="#"
              key={idx}
              className="group relative aspect-square rounded-xl overflow-hidden"
            >
              <img
                src={img}
                alt={`Style ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
                  View Post
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};