import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../lib/utils';
import type { Invoice, InvoiceItem, Product, Size } from '../../data/mockData';
import {
  X, Plus, Trash2, Search, ShoppingBag, User,
  CreditCard, ChevronRight, ChevronLeft, Barcode, Package,
} from 'lucide-react';

interface InvoiceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  products: Product[];
  nextInvoiceNumber: string;
}

type Step = 'customer' | 'items' | 'review';

export const InvoiceWizardModal: React.FC<InvoiceWizardModalProps> = ({
  isOpen, onClose, onSave, products, nextInvoiceNumber,
}) => {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>('customer');
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank-transfer' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('customer');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setItems([]);
      setProductSearch('');
      setBarcodeInput('');
      setPaymentMethod('cash');
      setPaidAmount('');
      setNotes('');
      const d = new Date(); d.setDate(d.getDate() + 30);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.filter(p => p.status !== 'out-of-stock');
    const q = productSearch.toLowerCase();
    return products.filter(p =>
      p.status !== 'out-of-stock' &&
      (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const totalDiscount = items.reduce((s, i) => s + i.discount * i.quantity, 0);
  const total = subtotal;

  const addProduct = (product: Product, size?: Size, color?: string) => {
    const s = size || product.sizes[0];
    const c = color || product.colors[0];
    const existing = items.find(i => i.productId === product.id && i.size === s && i.color === c);
    if (existing) {
      setItems(items.map(i =>
        i.productId === product.id && i.size === s && i.color === c
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice - i.discount * (i.quantity + 1) }
          : i
      ));
    } else {
      const barcode = `890123456${product.id.replace('p-', '').padStart(4, '0')}`;
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode,
        size: s,
        color: c,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        total: product.sellingPrice,
      }]);
    }
    setShowProductPicker(false);
    setProductSearch('');
  };

  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return;
    const product = products.find(p => {
      const barcode = `890123456${p.id.replace('p-', '').padStart(4, '0')}`;
      return barcode === barcodeInput.trim() || p.sku === barcodeInput.trim();
    });
    if (product) {
      addProduct(product);
      setBarcodeInput('');
    }
  };

  const updateItemQuantity = (idx: number, qty: number) => {
    if (qty < 1) return;
    setItems(items.map((item, i) =>
      i === idx ? { ...item, quantity: qty, total: qty * item.unitPrice - item.discount * qty } : item
    ));
  };

  const updateItemDiscount = (idx: number, discount: number) => {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, discount, total: item.quantity * item.unitPrice - discount * item.quantity } : item
    ));
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSave = () => {
    const paid = paidAmount ? parseFloat(paidAmount) : (paymentMethod === 'credit' ? 0 : total);
    let status: Invoice['status'] = 'paid';
    if (paid <= 0) status = 'pending';
    else if (paid < total) status = 'partial';

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: nextInvoiceNumber,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '-',
      customerEmail: customerEmail || undefined,
      items,
      subtotal,
      discount: totalDiscount,
      tax: 0,
      total,
      paidAmount: Math.min(paid, total),
      dueDate,
      paymentMethod,
      status,
      payments: paid > 0 ? [{
        id: `pay-${Date.now()}`,
        invoiceId: `inv-${Date.now()}`,
        amount: Math.min(paid, total),
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentMethod === 'credit' ? 'cash' : paymentMethod as any,
      }] : [],
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };
    onSave(invoice);
    onClose();
  };

  const canProceedCustomer = true; // Walk-in allowed
  const canProceedItems = items.length > 0;

  const dark = theme === 'dark';
  const cardClass = `rounded-2xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${
    dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-white/30 focus:ring-2 focus:ring-white/10'
         : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200'
  }`;
  const labelClass = `block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
        dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Create Invoice</h2>
            <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{nextInvoiceNumber}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className={`flex items-center gap-2 px-5 py-3 ${dark ? 'bg-neutral-900/50' : 'bg-white'}`}>
          {(['customer', 'items', 'review'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => {
                  if (s === 'customer') setStep(s);
                  if (s === 'items' && canProceedCustomer) setStep(s);
                  if (s === 'review' && canProceedItems) setStep(s);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step === s
                    ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                    : dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s ? dark ? 'bg-black/20 text-black' : 'bg-white/20 text-white' : dark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400'
                }`}>{i + 1}</span>
                <span className="hidden sm:inline">{s === 'customer' ? 'Customer' : s === 'items' ? 'Items' : 'Review'}</span>
              </button>
              {i < 2 && <ChevronRight className={`w-4 h-4 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Step 1: Customer */}
          {step === 'customer' && (
            <div className={`${cardClass} p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <User className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Customer Details</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400'}`}>Optional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Customer Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in Customer" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="077-XXXXXXX" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Items */}
          {step === 'items' && (
            <>
              {/* Barcode Scanner */}
              <div className={`${cardClass} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Barcode className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                  <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Scan Barcode / Enter SKU</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={barcodeRef}
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBarcodeScan()}
                    placeholder="Scan barcode or enter SKU..."
                    className={`flex-1 ${inputClass}`}
                    autoFocus
                  />
                  <button onClick={handleBarcodeScan} className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
                  }`}>
                    Add
                  </button>
                </div>
              </div>

              {/* Product Picker */}
              <div className={`${cardClass} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                    <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Add Products</h3>
                  </div>
                  <button
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Browse
                  </button>
                </div>

                {showProductPicker && (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                      dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <Search className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <input
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className={`bg-transparent border-none outline-none flex-1 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredProducts.slice(0, 8).map(product => (
                        <button
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            dark ? 'hover:bg-neutral-800/80' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              dark ? 'bg-neutral-800' : 'bg-gray-100'
                            }`}>
                              <ShoppingBag className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                              <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.sku} · Stock: {product.stock}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(product.sellingPrice)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Item List */}
              {items.length > 0 && (
                <div className={`${cardClass} overflow-hidden`}>
                  <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}>
                    <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Invoice Items ({items.length})</h3>
                  </div>
                  <div className="divide-y divide-neutral-800/40">
                    {items.map((item, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{item.productName}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.sku}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.size}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.color}</span>
                              {item.barcode && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>
                                  <Barcode className="w-3 h-3 inline mr-1" />{item.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <div className="flex items-center gap-1">
                            <label className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Qty:</label>
                            <div className={`flex items-center rounded-lg border ${dark ? 'border-neutral-700' : 'border-gray-200'}`}>
                              <button onClick={() => updateItemQuantity(idx, item.quantity - 1)} className={`px-2 py-1 text-sm ${dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-100'} rounded-l-lg`}>-</button>
                              <span className={`px-3 py-1 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
                              <button onClick={() => updateItemQuantity(idx, item.quantity + 1)} className={`px-2 py-1 text-sm ${dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-100'} rounded-r-lg`}>+</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <label className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Disc:</label>
                            <input
                              type="number"
                              value={item.discount || ''}
                              onChange={e => updateItemDiscount(idx, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className={`w-20 px-2 py-1 rounded-lg border text-sm text-right ${
                                dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'
                              }`}
                            />
                          </div>
                          <span className={`ml-auto text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Totals */}
                  <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}>
                    <div className="flex justify-between text-sm">
                      <span className={dark ? 'text-neutral-400' : 'text-gray-500'}>Subtotal</span>
                      <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(subtotal + totalDiscount)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-red-400">Discount</span>
                        <span className="text-red-400 font-medium">-{formatCurrency(totalDiscount)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between text-base font-bold mt-2 pt-2 border-t ${dark ? 'border-neutral-700 text-white' : 'border-gray-200 text-gray-900'}`}>
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <>
              {/* Customer Summary */}
              <div className={`${cardClass} p-4`}>
                <h3 className={`text-sm font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Customer</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Name</p>
                    <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{customerName || 'Walk-in Customer'}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Phone</p>
                    <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{customerPhone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className={`${cardClass} overflow-hidden`}>
                <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}>
                  <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{items.length} Items</h3>
                </div>
                <div className="divide-y divide-neutral-800/40">
                  {items.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{item.productName}</p>
                        <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{item.size} · {item.color} · x{item.quantity}</p>
                      </div>
                      <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}>
                  <div className={`flex justify-between text-base font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className={`${cardClass} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                  <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Payment</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {([['cash', 'Cash'], ['card', 'Card'], ['bank-transfer', 'Bank'], ['credit', 'Credit']] as const).map(([val, lbl]) => (
                        <button
                          key={val}
                          onClick={() => setPaymentMethod(val)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                            paymentMethod === val
                              ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900'
                              : dark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Amount Paid</label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        placeholder={total.toString()}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Due Date</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..." rows={2} className={inputClass} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
          <button
            onClick={() => {
              if (step === 'items') setStep('customer');
              else if (step === 'review') setStep('items');
              else onClose();
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 'customer' ? 'Cancel' : 'Back'}
          </button>

          {step === 'review' ? (
            <button
              onClick={handleSave}
              disabled={!canProceedItems}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
              } disabled:opacity-50`}
            >
              Create Invoice
            </button>
          ) : (
            <button
              onClick={() => {
                if (step === 'customer') setStep('items');
                else if (step === 'items') setStep('review');
              }}
              disabled={step === 'items' && !canProceedItems}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
              } disabled:opacity-50`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
