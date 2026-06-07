import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Truck, Shield, RotateCcw, Star } from 'lucide-react';

const badges = [
  { icon: Truck, title: 'Free Delivery', desc: 'On orders over Rs. 5,000' },
  { icon: Shield, title: 'Secure Payment', desc: 'Cash, Card & Bank Transfer' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: Star, title: 'Premium Quality', desc: 'Hand-picked collections' },
];

export const TrustBadges: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <section className={`py-6 border-y ${dark ? 'bg-brand-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {badges.map(item => (
            <div key={item.title} className="flex items-center gap-3 py-2">
              <div className={`p-2.5 rounded-xl ${dark ? 'bg-neutral-800/50' : 'bg-white shadow-sm'}`}>
                <item.icon className={`w-5 h-5 ${dark ? 'text-neutral-300' : 'text-brand-700'}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};