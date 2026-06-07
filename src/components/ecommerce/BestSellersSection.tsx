import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowRight, TrendingUp, Star } from 'lucide-react';

export interface BestSellerProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  colors: string[];
  reviewCount: number;
  avgRating: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface BestSellersSectionProps {
  products: BestSellerProduct[];
}

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({ products }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  if (products.length === 0) return null;

  return (
    <section className={`py-16 lg:py-20 ${dark ? 'bg-brand-900/20' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
              <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />Most Loved
            </p>
            <h2 className={`font-display text-3xl lg:text-4xl font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>
              Our Best Sellers
            </h2>
          </div>
          <NavLink
            to="/shop"
            className={`hidden sm:flex items-center gap-1.5 text-sm font-medium transition-colors ${
              dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            View All <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map(product => (
            <NavLink
              key={product.id}
              to={`/product/${product.id}`}
              className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
                dark
                  ? 'bg-brand-900/40 border-neutral-800/60 hover:border-neutral-600'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {product.reviewCount > 0 && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 text-brand-900 text-[10px] font-semibold rounded-full backdrop-blur-sm flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {product.avgRating.toFixed(1)}
                  </span>
                )}
                {product.status === 'low-stock' && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-semibold rounded-full backdrop-blur-sm">
                    Few Left
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              <div className="p-4">
                <p className={`text-[10px] uppercase tracking-wider mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  {product.category}
                </p>
                <h3 className={`font-medium text-sm leading-snug mb-2 line-clamp-2 ${dark ? 'text-neutral-200' : 'text-gray-800'}`}>
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-brand-900'}`}>
                    {formatPrice(product.price)}
                  </p>
                  {product.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {product.colors.slice(0, 3).map((color, i) => (
                        <span
                          key={i}
                          title={color}
                          className={`w-3 h-3 rounded-full border ${dark ? 'border-neutral-600' : 'border-gray-300'}`}
                          style={{
                            backgroundColor:
                              color.toLowerCase().replace(/ /g, '') === 'white'
                                ? '#f5f5f5'
                                : color.toLowerCase().split('/')[0].split('&')[0].trim().replace(/ /g, ''),
                          }}
                        />
                      ))}
                      {product.colors.length > 3 && (
                        <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          +{product.colors.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </NavLink>
          ))}
        </div>

        <div className="flex justify-center mt-10 sm:hidden">
          <NavLink
            to="/shop"
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border transition-all ${
              dark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            View All Products <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </section>
  );
};