import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { QuickAddDrawer } from '../ui/QuickAddDrawer';
import {
  ShoppingBag,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Heart,
  User,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  ArrowUp,
  MessageCircle,
  LayoutDashboard,
  Package,
} from 'lucide-react';

// ── Navigation Links ────────────────────────────────────────────────────────
const navLinks = [
  { label: 'Home',    path: '/' },
  { label: 'Shop',    path: '/shop' },
  { label: 'About',   path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export const EcommerceLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { totalItems, setIsCartOpen } = useCart();
  const { totalWishlist } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen]           = useState(false);
  const dark = theme === 'dark';

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-brand-950 text-white' : 'bg-white text-gray-900'}`}>
      {/* Top Bar */}
      <div className={`hidden md:block text-xs py-2 ${dark ? 'bg-brand-900 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> 071 135 0123</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> ravindrakumarash@gmail.com</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Free delivery on orders over Rs. 5,000</span>
            <span>|</span>
            <NavLink to="/system" className="hover:text-white transition-colors">Admin System</NavLink>
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 border-b transition-all ${
          dark ? 'bg-brand-950 border-neutral-800/60' : 'bg-white border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2">
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shadow-sm">
                <img src="/images/logo.jpeg" alt="Ever Fit" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold tracking-[0.2em] uppercase">EVER FIT</h1>
                <p className={`text-[9px] tracking-[0.15em] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Premium Clothing</p>
              </div>
            </NavLink>

            {/* ── Desktop Nav ── */}
            <nav className="hidden lg:flex items-center gap-0">
              {navLinks.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-150 ${
                      isActive
                        ? dark ? 'text-white' : 'text-brand-900'
                        : dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2.5 rounded-full transition-all ${
                  dark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
              <NavLink
                to="/track-order"
                className={`p-2.5 rounded-full transition-all ${
                  dark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Track Order"
              >
                <Package className="w-5 h-5" />
              </NavLink>
              <NavLink
                to="/wishlist"
                className={`relative p-2.5 rounded-full transition-all hidden sm:flex ${
                  dark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {totalWishlist > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {totalWishlist}
                  </span>
                )}
              </NavLink>
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-full transition-all ${
                  dark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NavLink
                to="/cart"
                className="relative p-2.5 rounded-full transition-all group"
                onClick={() => setIsCartOpen(false)}
              >
                <ShoppingBag className={`w-5 h-5 transition-colors ${
                  dark ? 'text-neutral-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'
                }`} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/system"
                aria-label="Admin System"
                className={`hidden sm:flex p-2.5 rounded-full transition-all ${
                  dark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <User className="w-5 h-5" />
              </NavLink>
            </div>
          </div>
        </div>

        {/* ── Mega Menu Dropdown Panel ─────────────────────────────────────── */}
        {/* Removed — navigation is now a flat 4-link structure                  */}

        {/* Search Bar */}
        {searchOpen && (
          <div className={`border-t py-4 px-4 ${dark ? 'border-neutral-800/60 bg-brand-950' : 'border-gray-200 bg-white'}`}>
            <div className="max-w-2xl mx-auto relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search for products, categories, brands..."
                autoFocus
                className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm ${
                  dark
                    ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-neutral-500/30`}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile Menu Overlay ──────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] shadow-2xl overflow-y-auto ${
            dark ? 'bg-brand-950' : 'bg-white'
          }`}>
            {/* Drawer header */}
            <div className={`flex items-center justify-between h-16 px-4 border-b ${
              dark ? 'border-neutral-800/60' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-lg overflow-hidden">
                <img src="/images/logo.jpeg" alt="Ever Fit" className="w-full h-full object-cover rounded-full" />
              </div>
                <h1 className="font-display text-lg font-bold tracking-[0.2em] uppercase">EVER FIT</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="py-4 px-3 space-y-1">
              {navLinks.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                        : dark ? 'text-neutral-300 hover:bg-neutral-800/50' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </NavLink>
              ))}

              {/* Divider */}
              <div className={`my-2 h-px ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`} />

              <NavLink
                to="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  dark
                    ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  Track Order
                </span>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </NavLink>
              {/* Admin System link — mobile only */}
              <NavLink
                to="/system"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  dark
                    ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin System
                </span>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </NavLink>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

      {/* QuickAdd Drawer — portal-like, available on all store pages */}
      <QuickAddDrawer />

      {/* Footer */}
      <footer className={`border-t ${dark ? 'bg-brand-950 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl overflow-hidden">
                  <img src="/images/logo.jpeg" alt="Ever Fit" className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-[0.2em] uppercase">EVER FIT</h3>
                  <p className={`text-[9px] tracking-[0.15em] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Premium Clothing</p>
                </div>
              </div>
              <p className={`text-sm leading-relaxed ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Premium clothing brand based in Kamburupitiya, Matara. Offering quality fashion for the modern Sri Lankan wardrobe.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <a href="#" className={`p-2.5 rounded-full border transition-all ${
                  dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                }`}><Facebook className="w-4 h-4" /></a>
                <a href="#" className={`p-2.5 rounded-full border transition-all ${
                  dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                }`}><Instagram className="w-4 h-4" /></a>
                <a href="https://wa.me/94711350123" target="_blank" rel="noopener noreferrer" className={`p-2.5 rounded-full border transition-all ${
                  dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-100 text-gray-500'
                }`}><MessageCircle className="w-4 h-4" /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className={`font-semibold text-sm uppercase tracking-wider mb-4 ${dark ? 'text-neutral-300' : 'text-gray-800'}`}>Quick Links</h4>
              <ul className="space-y-2.5">
                {['Shop All', 'New Arrivals', 'Best Sellers', 'Sale'].map(link => (
                  <li key={link}>
                    <NavLink to="/shop" className={`text-sm transition-colors ${
                      dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    }`}>{link}</NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Care */}
            <div>
              <h4 className={`font-semibold text-sm uppercase tracking-wider mb-4 ${dark ? 'text-neutral-300' : 'text-gray-800'}`}>Customer Care</h4>
              <ul className="space-y-2.5">
                {['Size Guide', 'Shipping Policy', 'Returns & Exchange', 'FAQ'].map(link => (
                  <li key={link}>
                    <a href="#" className={`text-sm transition-colors ${
                      dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    }`}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className={`font-semibold text-sm uppercase tracking-wider mb-4 ${dark ? 'text-neutral-300' : 'text-gray-800'}`}>Contact Us</h4>
              <ul className="space-y-3">
                <li className={`flex items-start gap-2.5 text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Ransegoda, Kamburupitiya, Matara</span>
                </li>
                <li className={`flex items-center gap-2.5 text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>077 678 5990</span>
                </li>
                <li className={`flex items-center gap-2.5 text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>ravindrakumarash@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
            dark ? 'border-neutral-800/60' : 'border-gray-200'
          }`}>
            <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
              © 2026 NebulaInfinite Software Solutions. All rights reserved.
            </p>
            <div className={`flex items-center gap-4 text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/94711350123?text=Hi%20Reliance!%20I%E2%80%99m%20interested%20in%20your%20products."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-6 z-50 p-3.5 rounded-full bg-green-500 text-white shadow-xl hover:bg-green-600 transition-all hover:scale-110 group"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat with us
        </span>
      </a>

      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-xl transition-all border ${
          dark
            ? 'bg-brand-800 border-neutral-700 text-white hover:bg-neutral-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};
