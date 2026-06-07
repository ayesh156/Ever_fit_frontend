import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Award, Users, Heart, TrendingUp, ArrowRight, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&q=80"
            alt="About"
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 ${dark ? 'bg-brand-950/80' : 'bg-white/80'}`} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Our Story</p>
          <h1 className={`font-display text-4xl lg:text-6xl font-bold mb-4 ${dark ? 'text-white' : 'text-brand-900'}`}>
            Crafted with Passion
          </h1>
          <p className={`text-base lg:text-lg max-w-2xl mx-auto ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
            Since 2020, Reliance has been Matara's premier fashion destination — bringing world-class style to the heart of the Southern Province.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Award, title: 'Premium Quality', desc: 'Every piece hand-picked for quality, comfort, and style that lasts beyond the season.' },
            { icon: Users, title: '2,000+ Happy Clients', desc: 'Built on trust — a growing community of fashion-forward customers across Sri Lanka.' },
            { icon: Heart, title: 'Ethical Fashion', desc: 'We partner with responsible suppliers who share our values of sustainability and fairness.' },
            { icon: TrendingUp, title: 'Always Trending', desc: 'Constantly updated collections inspired by global fashion capitals — Tokyo, Milan, London.' },
          ].map(item => (
            <div
              key={item.title}
              className={`p-6 rounded-2xl border text-center ${
                dark ? 'bg-brand-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className={`inline-flex p-3 rounded-xl mb-4 ${dark ? 'bg-neutral-800' : 'bg-white shadow-sm'}`}>
                <item.icon className={`w-6 h-6 ${dark ? 'text-neutral-300' : 'text-brand-800'}`} />
              </div>
              <h3 className={`font-semibold text-base mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
              <p className={`text-sm leading-relaxed ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className={`py-16 lg:py-20 ${dark ? 'bg-brand-900/20' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80"
                alt="Our Store"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>The Journey</p>
              <h2 className={`font-display text-3xl font-bold mb-5 ${dark ? 'text-white' : 'text-brand-900'}`}>
                From a Small Shop to Matara's Fashion Hub
              </h2>
              <div className={`space-y-4 text-sm leading-relaxed ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
                <p>
                  What started as a small clothing store in Makandura, Matara has grown into one of the Southern Province's most trusted fashion destinations. Our founder's vision was simple — bring world-class fashion to Sri Lanka at prices that make sense.
                </p>
                <p>
                  Today, we curate collections from the best local and international suppliers, offering everything from everyday essentials to luxury pieces for special occasions. Our team of fashion experts carefully selects each item, ensuring quality, style, and value.
                </p>
                <p>
                  At Reliance, fashion isn't just about clothing — it's about confidence, self-expression, and celebrating the beautiful diversity of Sri Lankan culture through style.
                </p>
              </div>
              <NavLink
                to="/shop"
                className={`inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                  dark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-brand-900 text-white hover:bg-brand-800'
                }`}
              >
                Explore Our Collection <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="max-w-7xl mx-auto px-4 py-16 lg:py-20">
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 lg:p-12 rounded-3xl border ${
          dark ? 'bg-brand-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
        }`}>
          {[
            { value: '6+', label: 'Years in Business' },
            { value: '200+', label: 'Products' },
            { value: '2,000+', label: 'Happy Customers' },
            { value: '15+', label: 'Categories' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className={`font-display text-3xl lg:text-4xl font-bold mb-1 ${dark ? 'text-white' : 'text-brand-900'}`}>{stat.value}</p>
              <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className={`py-16 lg:py-20 ${dark ? 'bg-brand-900/20' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={`rounded-3xl p-8 lg:p-14 text-center border ${
            dark ? 'bg-brand-900/40 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <h2 className={`font-display text-2xl lg:text-4xl font-bold mb-4 ${dark ? 'text-white' : 'text-brand-900'}`}>
              Ready to Elevate Your Style?
            </h2>
            <p className={`text-sm lg:text-base max-w-xl mx-auto mb-8 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Visit our store in Makandura, Matara or reach out to us. We'd love to help you find your perfect outfit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavLink
                to="/shop"
                className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
                  dark ? 'bg-white text-black hover:bg-neutral-100 shadow-white/10' : 'bg-brand-900 text-white hover:bg-brand-800 shadow-brand-900/30'
                }`}
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </NavLink>
              <a
                href="https://wa.me/94711350123?text=Hi%20Reliance!%20I%E2%80%99m%20interested%20in%20your%20products."
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold border transition-all ${
                  dark ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'border-green-600/30 text-green-700 hover:bg-green-50'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
              <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> 071 135 0123</span>
              <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> ravindrakumarash@gmail.com</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Makandura, Matara</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
