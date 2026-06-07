import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { MapPin, Phone, Clock, ArrowRight, Headphones } from 'lucide-react';

export const VisitOurStore: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Find Us
          </p>
          <h2 className={`font-display text-3xl lg:text-4xl font-bold mb-5 ${dark ? 'text-white' : 'text-brand-900'}`}>
            Visit Our Store
          </h2>
          <p className={`text-sm leading-relaxed mb-6 ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
            Come experience our full collection in person. Our showroom offers a premium shopping experience with friendly staff ready to help you find the perfect fit.
          </p>
          <div className="space-y-4">
            {[
              { icon: MapPin, label: 'Ransegoda, Kamburupitiya, Matara' },
              { icon: Headphones, label: '+94 77 678 5990' },
              { icon: Phone, label: 'ravindrakumarash@gmail.com' },
              { icon: Clock, label: 'Mon — Sat: 9AM — 8PM, Sun: 10AM — 6PM' },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-3 text-sm ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
                <div className={`p-2 rounded-lg ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <item.icon className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <NavLink
            to="/contact"
            className={`inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
              dark
                ? 'bg-white text-black hover:bg-neutral-100 shadow-white/10'
                : 'bg-brand-900 text-white hover:bg-brand-800 shadow-brand-900/30'
            }`}
          >
            Get Directions <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>

        <div className={`rounded-3xl overflow-hidden border h-[300px] lg:h-[400px] ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15895.751068654!2d80.5169!3d5.9549!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae13f57d92e1e5b%3A0x5c0c0c0c0c0c0c0c!2sMatara%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1690000000000!5m2!1sen!2slk"
            width="100%"
            height="100%"
            style={{ border: 0, filter: dark ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Our Location"
          />
        </div>
      </div>
    </section>
  );
};