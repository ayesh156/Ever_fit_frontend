import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { post } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Loader } from 'lucide-react';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

export const Checkout: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = totalPrice >= 5000 ? 0 : 350;
  const grandTotal = totalPrice + deliveryFee;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    for (const item of items) {
      const vid = Number(item.variantId) || 0;
      if (!vid || vid <= 0) {
        toast.error(`Invalid variant for ${item.product.name}. Please remove and re-add.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName || 'Guest',
        customerPhone: customerPhone || null,
        paymentMethod: 'bank-transfer',
        paidAmount: 0,
        discount: 0,
        subtotal: totalPrice,
        items: items.map(item => ({
          variantId: Number(item.variantId) || 0,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          discount: 0,
        })),
      };
      await post<any>('/orders', payload);
      clearCart();
      toast.success('Order placed!');
      navigate('/track-order');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${dark ? 'bg-brand-950' : 'bg-[#f9f7f4]'}`}>
      <div className="max-w-2xl mx-auto px-4 py-10 lg:py-14">
        <NavLink to="/cart" className={`inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors ${dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-brand-900'}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </NavLink>

        <h1 className={`text-3xl font-bold mb-8 ${dark ? 'text-white' : 'text-brand-900'}`}>Checkout</h1>

        <div className={`p-6 rounded-xl border mb-6 ${dark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Contact Information</h3>
          <div className="space-y-3">
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your Name"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone Number"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
          </div>
        </div>

        <div className={`p-6 rounded-xl border mb-6 ${dark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Payment Method</h3>
          <div className={`p-3 rounded-xl border ${dark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-blue-50 border-blue-200'}`}>
            <p className={`text-xs font-semibold mb-1 ${dark ? 'text-neutral-300' : 'text-blue-800'}`}>Bank Transfer</p>
            <p className={`text-xs ${dark ? 'text-neutral-400' : 'text-blue-700'}`}>Account: Ever Fit · 1234567890 · Sample Bank</p>
          </div>
        </div>

        <div className={`p-6 rounded-xl border mb-6 ${dark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Order Summary</h3>
          {items.map(item => (
            <div key={`${item.product.id}-${item.size}-${item.color}`} className={`flex justify-between py-2 text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>
              <span>{item.product.name} × {item.quantity}</span>
              <span>{formatPrice(item.product.sellingPrice * item.quantity)}</span>
            </div>
          ))}
          <div className={`border-t pt-3 mt-3 ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <div className={`flex justify-between text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span></div>
            <div className={`flex justify-between text-lg font-bold mt-2 ${dark ? 'text-white' : 'text-gray-900'}`}><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
          </div>
        </div>

        <button onClick={handlePlaceOrder} disabled={submitting || items.length === 0}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
          {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {submitting ? 'Placing Order...' : `Place Order — ${formatPrice(grandTotal)}`}
        </button>
      </div>
    </div>
  );
};