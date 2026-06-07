import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Star } from 'lucide-react';

interface ReviewItem {
  reviewerName: string;
  productName: string;
  rating: number;
  description: string | null;
}

interface CustomerReviewsProps {
  reviews: ReviewItem[];
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ reviews }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  if (reviews.length === 0) return null;

  return (
    <section className={`py-16 lg:py-20 ${dark ? 'bg-brand-900/20' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Real Reviews
          </p>
          <h2 className={`font-display text-3xl lg:text-4xl font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((item, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${
                dark
                  ? 'bg-brand-900/40 border-neutral-800/60'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < item.rating
                        ? 'text-amber-400 fill-amber-400'
                        : dark ? 'text-neutral-700' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-sm leading-relaxed mb-4 line-clamp-3 ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
                "{item.description || 'Great product, highly recommended!'}"
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {(item.reviewerName || '?')[0]}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                    {item.reviewerName}
                  </p>
                  <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                    on {item.productName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};