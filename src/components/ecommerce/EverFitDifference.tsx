import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sparkles, Truck, RotateCcw, Headphones } from 'lucide-react';

const DEFAULT_VALUES = [
  { icon: Sparkles, title: 'Premium Fabrics', desc: 'We source only the finest materials — from breathable cottons to premium linens — ensuring every piece feels as good as it looks.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Free delivery across Sri Lanka on orders over Rs. 5,000. Most orders arrive within 1–3 business days, straight to your doorstep.' },
  { icon: RotateCcw, title: 'Easy Returns', desc: 'Not your fit? Our hassle-free 7-day return policy means you can shop with confidence, no questions asked.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Our dedicated team is always here to help — via WhatsApp, phone, or in-store. Your satisfaction is our priority.' },
];

interface PromiseItem {
  title: string;
  desc: string;
}

interface EverFitDifferenceProps {
  promises?: PromiseItem[];
}

export const EverFitDifference: React.FC<EverFitDifferenceProps> = ({ promises }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const items = (promises && promises.length > 0)
    ? promises.map((p, idx) => ({
        title: p.title,
        desc: p.desc,
        icon: DEFAULT_VALUES[idx]?.icon || Sparkles,
      }))
    : DEFAULT_VALUES;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 lg:py-20">
      <div className="text-center mb-12">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
          Why Choose Us
        </p>
        <h2 className={`font-display text-3xl lg:text-4xl font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>
          The Ever Fit Difference
        </h2>
        <p className={`text-sm mt-3 max-w-md mx-auto ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          We believe in quality, comfort, and style — delivered with care.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`group p-6 lg:p-8 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 ${
              dark
                ? 'bg-brand-900/30 border-neutral-800/60 hover:border-neutral-600'
                : 'bg-white border-gray-200 hover:shadow-lg hover:border-gray-300'
            }`}
          >
            <div className={`inline-flex p-4 rounded-2xl mb-5 transition-colors ${
              dark ? 'bg-neutral-800 group-hover:bg-neutral-700' : 'bg-gray-50 group-hover:bg-gray-100 shadow-sm'
            }`}>
              <item.icon className={`w-7 h-7 ${dark ? 'text-neutral-300' : 'text-brand-700'}`} />
            </div>
            <h3 className={`font-semibold text-base mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
            <p className={`text-sm leading-relaxed ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};