import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { Trash2, Minus, Plus, ArrowLeft, ArrowRight, Shield, Truck, Tag, ShoppingBag } from 'lucide-react';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

export const CartPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const dark = theme === 'dark';
  const [promoCode, setPromoCode] = useState('');

  const deliveryFee  = totalPrice >= 5000 ? 0 : 350;
  const grandTotal   = totalPrice + deliveryFee;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center px-4 py-24 text-center ${
        dark ? 'bg-brand-950' : 'bg-[#f9f7f4]'
      }`}>
        <div className={`w-16 h-16 flex items-center justify-center border mb-6 ${
          dark ? 'border-neutral-800' : 'border-neutral-200'
        }`}>
          <ShoppingBag className={`w-7 h-7`} strokeWidth={1.25}
            style={{ color: dark ? '#404040' : '#d4d4d4' }}
          />
        </div>
        <h2 className={`font-display text-2xl font-semibold mb-2 ${dark ? 'text-neutral-300' : 'text-brand-900'}`}>
          Your cart is empty
        </h2>
        <p className={`text-sm mb-8 max-w-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
          Discover our latest collections and add your favourite pieces.
        </p>
        <NavLink
          to="/shop"
          className={`inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold tracking-wide transition-all ${
            dark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-brand-900 text-white hover:bg-brand-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </NavLink>
      </div>
    );
  }

  // ── Filled cart ────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${dark ? 'bg-brand-950' : 'bg-[#f9f7f4]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20 lg:pt-14 lg:pb-28">

        {/* ── Page header ── */}
        <div className="mb-10 lg:mb-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] mb-5">
            <NavLink to="/" className={`transition-colors ${
              dark ? 'text-neutral-600 hover:text-neutral-400' : 'text-neutral-400 hover:text-neutral-600'
            }`}>Home</NavLink>
            <span className={dark ? 'text-neutral-700' : 'text-neutral-300'}>/</span>
            <span className={dark ? 'text-neutral-400' : 'text-neutral-600'}>Cart</span>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`h-px w-8 ${dark ? 'bg-neutral-600' : 'bg-neutral-400'}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                  dark ? 'text-neutral-500' : 'text-neutral-400'
                }`}>Your Selection</span>
              </div>
              <h1 className={`font-display leading-tight ${dark ? 'text-white' : 'text-brand-900'}`}>
                <span className="block text-3xl sm:text-4xl lg:text-5xl font-light italic">Shopping</span>
                <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold">Cart</span>
              </h1>
            </div>
            <p className={`text-sm mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 xl:gap-12">

          {/* ── LEFT — Cart items ── */}
          <div>
            {/* Column labels */}
            <div className={`hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 pb-3 mb-1 border-b text-[10px] uppercase tracking-[0.18em] ${
              dark ? 'border-neutral-800 text-neutral-600' : 'border-neutral-200 text-neutral-400'
            }`}>
              <span>Product</span>
              <span className="text-center w-28">Quantity</span>
              <span className="text-right w-24">Total</span>
            </div>

            {/* Items */}
            <div className={`divide-y ${dark ? 'divide-neutral-800' : 'divide-neutral-200'}`}>
              {items.map(item => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 py-6 items-start"
                >
                  {/* Product info */}
                  <div className="flex gap-4">
                    <NavLink
                      to={`/store/product/${item.product.id}`}
                      className="w-20 sm:w-24 aspect-[3/4] flex-shrink-0 overflow-hidden"
                    >
                      <img
                        src={item.product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80'}
                        alt={item.product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </NavLink>
                    <div className="flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <p className={`text-[10px] uppercase tracking-[0.15em] mb-1 ${
                          dark ? 'text-neutral-500' : 'text-neutral-400'
                        }`}>
                          {item.product.category}
                        </p>
                        <NavLink
                          to={`/store/product/${item.product.id}`}
                          className={`font-medium text-sm leading-snug line-clamp-2 transition-colors ${
                            dark ? 'text-neutral-200 hover:text-white' : 'text-gray-800 hover:text-brand-900'
                          }`}
                        >
                          {item.product.name}
                        </NavLink>
                        <p className={`text-xs mt-1.5 ${dark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                          {item.size} · {item.color}
                        </p>
                      </div>
                      {/* Unit price + remove (mobile) */}
                      <div className="flex items-center justify-between mt-3 sm:mt-0">
                        <p className={`font-display font-bold text-sm ${dark ? 'text-white' : 'text-brand-900'}`}>
                          {formatPrice(item.product.sellingPrice)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                          aria-label="Remove item"
                          className={`sm:hidden p-1.5 transition-colors ${
                            dark ? 'text-neutral-600 hover:text-red-400' : 'text-neutral-300 hover:text-red-500'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-3 sm:w-28 sm:justify-center">
                    <div className={`inline-flex items-center border ${
                      dark ? 'border-neutral-700' : 'border-neutral-200'
                    }`}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className={`w-8 h-8 flex items-center justify-center transition-colors ${
                          dark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-brand-900'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`w-8 text-center text-xs font-semibold ${
                        dark ? 'text-white' : 'text-brand-900'
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className={`w-8 h-8 flex items-center justify-center transition-colors ${
                          dark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-brand-900'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Remove — desktop */}
                    <button
                      onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                      aria-label="Remove item"
                      className={`hidden sm:block p-1.5 transition-colors ${
                        dark ? 'text-neutral-700 hover:text-red-400' : 'text-neutral-300 hover:text-red-500'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="hidden sm:flex sm:w-24 sm:justify-end items-start pt-0.5">
                    <p className={`font-display font-bold text-sm ${dark ? 'text-white' : 'text-brand-900'}`}>
                      {formatPrice(item.product.sellingPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer row */}
            <div className={`flex items-center justify-between pt-6 border-t ${
              dark ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <NavLink
                to="/shop"
                className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                  dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-brand-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </NavLink>
              <button
                onClick={clearCart}
                className={`text-xs uppercase tracking-[0.12em] transition-colors ${
                  dark ? 'text-neutral-600 hover:text-red-400' : 'text-neutral-400 hover:text-red-500'
                }`}
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* ── RIGHT — Order summary ── */}
          <div>
            <div className={`sticky top-28 border ${
              dark ? 'border-neutral-800 bg-brand-900/20' : 'border-neutral-200 bg-white'
            }`}>

              {/* Summary header */}
              <div className={`px-6 py-5 border-b ${dark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <p className={`text-[10px] uppercase tracking-[0.22em] mb-1 ${
                  dark ? 'text-neutral-500' : 'text-neutral-400'
                }`}>
                  Summary
                </p>
                <h2 className={`font-display text-xl font-semibold ${dark ? 'text-white' : 'text-brand-900'}`}>
                  Order Total
                </h2>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Line items */}
                <div className={`flex justify-between text-sm ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  <span>Subtotal ({totalItems} items)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className={`flex justify-between text-sm ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-500 font-medium' : ''}>
                    {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className={`text-xs ${dark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                    Add {formatPrice(5000 - totalPrice)} more for free delivery
                  </p>
                )}

                {/* Promo code */}
                <div className={`pt-2 border-t ${dark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                  <div className={`flex border ${dark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                    <div className="relative flex-1">
                      <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                        dark ? 'text-neutral-600' : 'text-neutral-400'
                      }`} />
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 text-xs bg-transparent focus:outline-none ${
                          dark ? 'text-white placeholder-neutral-600' : 'text-brand-900 placeholder-neutral-400'
                        }`}
                      />
                    </div>
                    <button className={`px-4 text-xs font-semibold uppercase tracking-[0.12em] border-l transition-colors ${
                      dark
                        ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                        : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-brand-900'
                    }`}>
                      Apply
                    </button>
                  </div>
                </div>

                {/* Grand total */}
                <div className={`flex justify-between items-baseline pt-3 border-t ${
                  dark ? 'border-neutral-800' : 'border-neutral-200'
                }`}>
                  <span className={`text-sm font-semibold uppercase tracking-[0.12em] ${
                    dark ? 'text-neutral-300' : 'text-gray-700'
                  }`}>Total</span>
                  <span className={`font-display text-2xl font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout button */}
              <div className="px-6 pb-6">
                <button onClick={() => navigate('/checkout')} className={`
                  w-full flex items-center justify-center gap-2.5
                  py-4 text-sm font-semibold uppercase tracking-[0.15em]
                  transition-colors duration-150
                  ${dark
                    ? 'bg-white text-black hover:bg-neutral-100'
                    : 'bg-brand-900 text-white hover:bg-brand-800'
                  }
                `}>
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Trust signals */}
                <div className={`mt-5 pt-5 border-t space-y-2.5 ${
                  dark ? 'border-neutral-800' : 'border-neutral-100'
                }`}>
                  {[
                    { icon: Shield, text: 'Secure SSL Checkout' },
                    { icon: Truck,  text: 'Island-wide delivery' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${
                        dark ? 'text-neutral-600' : 'text-neutral-400'
                      }`} strokeWidth={1.5} />
                      <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
