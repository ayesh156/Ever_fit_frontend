import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { get, post } from '../lib/api';
import { toast } from 'sonner';
import {
  Plus, Trash2, Search, ShoppingBag, User,
  CreditCard, ChevronRight, ChevronLeft, Barcode, Package,
  Calendar, ArrowLeft, Printer, X,
} from 'lucide-react';
import { ThermalReceipt } from '../components/ThermalReceipt';

type Step = 'customer' | 'items' | 'review';

// ===== INLINE CALENDAR =====
const InlineCalendar: React.FC<{ value: string; onChange: (d: string) => void; dark: boolean; onClose: () => void }> = ({ value, onChange, dark, onClose }) => {
  const [viewDate, setViewDate] = useState(() => { const d = value ? new Date(value) : new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const sel = value ? new Date(value) : null;
  const prev = () => setViewDate(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  const next = () => setViewDate(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const isS = (d: number) => sel && sel.getFullYear() === viewDate.year && sel.getMonth() === viewDate.month && sel.getDate() === d;
  const isT = (d: number) => { const t = new Date(); return t.getFullYear() === viewDate.year && t.getMonth() === viewDate.month && t.getDate() === d; };
  return (
    <div className={`p-3 rounded-xl border shadow-xl ${dark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className={`p-1 rounded-lg ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-4 h-4" /></button>
        <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{months[viewDate.month]} {viewDate.year}</span>
        <button onClick={next} className={`p-1 rounded-lg ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className={`text-[10px] font-medium py-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{d}</div>)}
        {blanks.map(b => <div key={`bl-${b}`} />)}
        {days.map(day => (
          <button key={day} onClick={() => { const m = (viewDate.month+1).toString().padStart(2,'0'); const dd = day.toString().padStart(2,'0'); onChange(`${viewDate.year}-${m}-${dd}`); onClose(); }}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${isS(day) ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : isT(day) ? dark ? 'bg-neutral-800 text-white ring-1 ring-neutral-600' : 'bg-gray-100 text-gray-900 ring-1 ring-gray-300' : dark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'}`}
          >{day}</button>
        ))}
      </div>
    </div>
  );
};

export const CreateInvoice: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();
  const barcodeRef = useRef<HTMLInputElement>(null);

  type Size = string;
  interface InvoiceItem {
    productId: string; productName: string; sku: string; barcode?: string; variantId?: number;
    size: Size; color: string; quantity: number; unitPrice: number; discount: number; total: number;
  }

  interface ProductWithVariants {
    id: string; sku: string; barcode: string; name: string; category: string; brand: string;
    sizes: Size[]; colors: string[]; description?: string; sellingPrice: number; stock: number;
    status: string; image?: string; createdAt: string;
    rawVariants: { id: number; size: string; color: string; sku: string; stock: number }[];
  }

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch products from API (including raw variants for variantId mapping)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await get<any[]>('/products');
        const mapped: ProductWithVariants[] = data.map((p: any) => ({
          id: String(p.id),
          sku: p.variants?.[0]?.sku || `SKU-${p.id}`,
          barcode: '',
          name: p.name,
          category: p.category?.name || 'Uncategorized',
          brand: 'EverFit',
          sizes: [...new Set((p.variants || []).map((v: any) => v.size))] as Size[],
          colors: [...new Set((p.variants || []).map((v: any) => v.color))] as string[],
          fabricType: 'Cotton' as any,
          description: p.description || undefined,
          costPrice: Math.round(p.price * 0.6),
          sellingPrice: p.price,
          stock: (p.variants || []).reduce((sum: number, v: any) => sum + (v.stock || 0), 0),
          lowStockThreshold: 10,
          status: 'in-stock' as const,
          image: p.image || undefined,
          createdAt: p.createdAt || new Date().toISOString(),
          rawVariants: (p.variants || []).map((v: any) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku, stock: v.stock })),
        }));
        setProducts(mapped);
      } catch (err) {
        console.error('[CreateInvoice] Failed to fetch products:', err);
        toast.error('Could not load products');
      }
    };
    fetchProducts();
  }, []);

  const [step, setStep] = useState<Step>('customer');

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Load customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await get<any[]>('/customers');
        setCustomers(data);
      } catch (err) {
        console.error('[CreateInvoice] Failed to load customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c: any) =>
      c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  const selectCustomer = (customer: any) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setCustomerEmail(customer.email || '');
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank-transfer' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; });
  const [showDueCal, setShowDueCal] = useState(false);

  // Receipt upload state
  const [receiptUpload, setReceiptUpload] = useState<{ orderId: number; uploading: boolean; success: boolean } | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Print state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.filter(p => p.status !== 'out-of-stock');
    const q = productSearch.toLowerCase();
    return products.filter(p => p.status !== 'out-of-stock' && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
  }, [products, productSearch]);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const totalDiscount = items.reduce((s, i) => s + i.discount * i.quantity, 0);
  const total = subtotal;

  const addProduct = (product: ProductWithVariants, size?: Size, color?: string) => {
    const s = size || product.sizes[0];
    const c = color || product.colors[0];

    // Resolve the real variant ID from rawVariants based on size+color match
    const matchedVariant = product.rawVariants.find(v => v.size === s && v.color === c);
    const variantId = matchedVariant?.id || product.rawVariants[0]?.id || parseInt(product.id.replace(/[^0-9]/g, '')) || 1;

    const existing = items.find(i => i.productId === product.id && i.size === s && i.color === c);
    if (existing) {
      setItems(items.map(i => i.productId === product.id && i.size === s && i.color === c ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice - i.discount * (i.quantity + 1) } : i));
    } else {
      setItems([...items, { productId: product.id, productName: product.name, sku: product.sku, variantId, barcode: `890123456${String(parseInt(product.id.replace(/[^0-9]/g, '')) || 0).padStart(4, '0')}`, size: s, color: c, quantity: 1, unitPrice: product.sellingPrice, discount: 0, total: product.sellingPrice }]);
    }
    setShowProductPicker(false);
    setProductSearch('');
  };

  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return;
    const product = products.find(p => p.sku === barcodeInput.trim());
    if (product) { addProduct(product); setBarcodeInput(''); } else { toast.error('Product not found'); }
  };

  const updateItemQuantity = (idx: number, qty: number) => { if (qty < 1) return; setItems(items.map((item, i) => i === idx ? { ...item, quantity: qty, total: qty * item.unitPrice - item.discount * qty } : item)); };
  const updateItemDiscount = (idx: number, discount: number) => { setItems(items.map((item, i) => i === idx ? { ...item, discount, total: item.quantity * item.unitPrice - discount * item.quantity } : item)); };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (saving) return;
    const paid = paidAmount ? parseFloat(paidAmount) : (paymentMethod === 'credit' ? 0 : total);
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);

    try {
      const payload: any = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || null,
        customerId: customerId,
        paymentMethod,
        paidAmount: Math.min(paid, total),
        discount: totalDiscount,
        subtotal: subtotal + totalDiscount,
        dueDate: dueDate || null,
        items: items.map(item => ({
          variantId: (item as any).variantId || parseInt(item.productId.replace(/[^0-9]/g, '')) || 1,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      };
      console.log('[CreateInvoice handleSave] FRONTEND SUBMITTING PAYLOAD:', payload);

      const result = await post<any>('/orders', payload);

      // If bank transfer, show receipt upload instead of print preview
      if (paymentMethod === 'bank-transfer') {
        setReceiptUpload({ orderId: result.id, uploading: false, success: false });
        setReceiptFile(null);
        setSaving(false);
        return;
      }

      // Map response to display format for receipt
      const displayInvoice: any = {
        id: `order-${result.id}`,
        invoiceNumber: `ORD-${String(result.id).padStart(4, '0')}`,
        customerName: result.customerName || 'Walk-in Customer',
        customerPhone: result.customerPhone || '-',
        customerEmail: customerEmail || undefined,
        items: items,
        subtotal: result.subtotal,
        discount: result.discount,
        tax: 0,
        total: result.totalAmount,
        paidAmount: result.paidAmount,
        dueDate: result.dueDate ? new Date(result.dueDate).toISOString().split('T')[0] : dueDate,
        paymentMethod,
        status: result.paidAmount >= result.totalAmount ? 'paid' : result.paidAmount > 0 ? 'partial' : 'pending',
        payments: result.payments || [],
        notes: notes || undefined,
        createdAt: new Date().toISOString(),
      };

      setCreatedInvoice(displayInvoice);
      setShowPrintPreview(true);
      toast.success('Invoice Created', { description: `${displayInvoice.invoiceNumber} — ${formatCurrency(result.totalAmount)}` });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  const buildReceiptHTML = useCallback(() => {
    if (!receiptRef.current) return '';
    let content = receiptRef.current.innerHTML;
    content = content.replace(/@media\s+print\s*\{[^}]*body\s*\*\s*\{[^}]*visibility:\s*hidden[^}]*\}[^}]*\}/gs, '');
    content = content.replace(/position:\s*fixed\s*!important/g, 'position: relative');
    return `<!DOCTYPE html><html><head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Print Invoice</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 80mm; background: white; }
        body { display: flex; justify-content: center; }
      </style>
    </head><body>${content}</body></html>`;
  }, []);

  const handlePrint = useCallback(() => {
    if (!receiptRef.current) return;
    const html = buildReceiptHTML();
    let iframe = printIframeRef.current;
    if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
    iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:80mm;height:auto;border:none;opacity:0;';
    document.body.appendChild(iframe);
    printIframeRef.current = iframe;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = () => {
        setTimeout(() => { if (iframe?.parentNode) iframe.parentNode.removeChild(iframe); printIframeRef.current = null; }, 500);
      };
    }
    setTimeout(() => {
      try { iframe!.contentWindow?.focus(); iframe!.contentWindow?.print(); } catch {}
    }, 800);
  }, [buildReceiptHTML]);

  const canProceedItems = items.length > 0;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const cardClass = `rounded-2xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border transition-all text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-white/30 focus:ring-2 focus:ring-white/10' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200'}`;
  const labelClass = `block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`;

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/system/invoices')} className={`p-2 rounded-xl transition-colors ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Create Invoice</h1>
          <p className={`text-xs sm:text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>New order</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className={`flex items-center gap-2 p-3 rounded-2xl ${dark ? 'bg-neutral-900/30 border border-neutral-800/60' : 'bg-white border border-gray-200 shadow-sm'}`}>
        {(['customer', 'items', 'review'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <button onClick={() => { if (s === 'customer') setStep(s); if (s === 'items') setStep(s); if (s === 'review' && canProceedItems) setStep(s); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${step === s ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? dark ? 'bg-black/20 text-black' : 'bg-white/20 text-white' : dark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
              <span className="hidden sm:inline">{s === 'customer' ? 'Customer' : s === 'items' ? 'Items' : 'Review & Pay'}</span>
            </button>
            {i < 2 && <ChevronRight className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Customer */}
      {step === 'customer' && (
          <div className={`${cardClass} p-4 sm:p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <User className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
              <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Customer Details</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400'}`}>Optional</span>
            </div>
            <div className="relative mb-4" ref={customerDropdownRef}>
              <label className={labelClass}>Search Existing Customer</label>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${dark ? 'bg-neutral-800/50 border-neutral-700/50 focus-within:border-white/30' : 'bg-white border-gray-200 focus-within:border-gray-400'}`}>
                <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                <input
                  value={customerId ? (customers.find((c: any) => c.id === customerId)?.name || customerSearch) : customerSearch}
                  onChange={e => { setCustomerId(null); setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search by name or phone..."
                  className={`bg-transparent border-none outline-none flex-1 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`}
                />
                {(customerId || customerSearch) && (
                  <button onClick={() => { selectCustomer({ id: null, name: '', phone: '', email: '' }); setCustomerId(null); setCustomerName(''); setCustomerPhone(''); setCustomerEmail(''); setCustomerSearch(''); }}
                    className={`p-0.5 rounded ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-200 text-gray-400'}`}><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
              {customerId && (
                <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl ${dark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                  <span className={`text-xs font-medium ${dark ? 'text-green-400' : 'text-green-700'}`}>Selected: {customers.find((c: any) => c.id === customerId)?.name}</span>
                </div>
              )}
              {showCustomerDropdown && !customerId && (
                <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto ${dark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
                  {filteredCustomers.slice(0, 10).map((customer: any) => (
                    <button key={customer.id} onClick={() => selectCustomer(customer)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${dark ? 'hover:bg-neutral-800 text-neutral-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${dark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'}`}>{customer.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</p>
                        <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{customer.phone || 'No phone'}</p>
                      </div>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <p className={`px-3 py-4 text-xs text-center ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No customers found — enter new name below</p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={labelClass}>Customer Name</label><input value={customerName} onChange={e => { setCustomerId(null); setCustomerName(e.target.value); }} placeholder="Walk-in Customer" className={inputClass} /></div>
              <div><label className={labelClass}>Phone Number</label><input value={customerPhone} onChange={e => { setCustomerId(null); setCustomerPhone(e.target.value); }} placeholder="077-XXXXXXX" className={inputClass} /></div>
              <div><label className={labelClass}>Email</label><input value={customerEmail} onChange={e => { setCustomerId(null); setCustomerEmail(e.target.value); }} placeholder="customer@email.com" className={inputClass} /></div>
            </div>
          </div>
      )}

      {/* Step 2: Items */}
      {step === 'items' && (
        <>
          <div className={`${cardClass} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Barcode className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
              <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Scan Barcode / Enter SKU</h3>
            </div>
            <div className="flex gap-2">
              <input ref={barcodeRef} value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBarcodeScan()} placeholder="Scan barcode or enter SKU..." className={`flex-1 ${inputClass}`} autoFocus />
              <button onClick={handleBarcodeScan} className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>Add</button>
            </div>
          </div>

          <div className={`${cardClass} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Package className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} /><h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Add Products</h3></div>
              <button onClick={() => setShowProductPicker(!showProductPicker)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Plus className="w-3.5 h-3.5" /> Browse</button>
            </div>
            {showProductPicker && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-gray-50 border-gray-200'}`}>
                  <Search className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className={`bg-transparent border-none outline-none flex-1 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`} />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredProducts.slice(0, 10).map(product => (
                    <button key={product.id} onClick={() => addProduct(product)} className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${dark ? 'hover:bg-neutral-800/80' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}><ShoppingBag className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /></div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                          <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.sku} · Stock: {product.stock}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(product.sellingPrice)}</span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && <p className={`text-sm text-center py-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No products found</p>}
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className={`${cardClass} overflow-hidden`}>
              <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}><h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Invoice Items ({items.length})</h3></div>
              <div className={`divide-y ${dark ? 'divide-neutral-800/40' : 'divide-gray-100'}`}>
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{item.productName}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.sku}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.size}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.color}</span>
                        </div>
                      </div>
                      <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
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
                        <input type="number" value={item.discount || ''} onChange={e => updateItemDiscount(idx, parseFloat(e.target.value) || 0)} placeholder="0" className={`w-20 px-2 py-1 rounded-lg border text-sm text-right ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                      </div>
                      <span className={`ml-auto text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-sm"><span className={dark ? 'text-neutral-400' : 'text-gray-500'}>Subtotal</span><span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(subtotal + totalDiscount)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-sm mt-1"><span className="text-red-400">Discount</span><span className="text-red-400 font-medium">-{formatCurrency(totalDiscount)}</span></div>}
                <div className={`flex justify-between text-base font-bold mt-2 pt-2 border-t ${dark ? 'border-neutral-700 text-white' : 'border-gray-200 text-gray-900'}`}><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <>
          <div className={`${cardClass} p-4`}>
            <h3 className={`text-sm font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Customer</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Name</p><p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{customerName || 'Walk-in Customer'}</p></div>
              <div><p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Phone</p><p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{customerPhone || '-'}</p></div>
            </div>
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}><h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{items.length} Items</h3></div>
            <div className={`divide-y ${dark ? 'divide-neutral-800/40' : 'divide-gray-100'}`}>
              {items.map((item, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between">
                  <div><p className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{item.productName}</p><p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{item.size} · {item.color} · x{item.quantity}</p></div>
                  <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}>
              <div className={`flex justify-between text-base font-bold ${dark ? 'text-white' : 'text-gray-900'}`}><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>

          <div className={`${cardClass} p-4`}>
            <div className="flex items-center gap-2 mb-3"><CreditCard className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} /><h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Payment</h3></div>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([['cash','Cash'],['card','Card'],['bank-transfer','Bank'],['credit','Credit']] as const).map(([val,lbl]) => (
                    <button key={val} onClick={() => setPaymentMethod(val)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${paymentMethod === val ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900' : dark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelClass}>Amount Paid</label><input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={total.toString()} className={inputClass} /></div>
                <div className="relative">
                  <label className={labelClass}>Due Date</label>
                  <button onClick={() => setShowDueCal(!showDueCal)} className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm text-left ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                    <Calendar className="w-4 h-4 flex-shrink-0" />{dueDate ? fmtDate(dueDate) : 'Select date'}
                  </button>
                  {showDueCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dueDate} onChange={d => { setDueDate(d); setShowDueCal(false); }} onClose={() => setShowDueCal(false)} /></div>}
                </div>
              </div>
                      {paymentMethod === 'bank-transfer' && (
                  <div className={`p-3 rounded-xl border ${dark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-xs font-semibold mb-1 ${dark ? 'text-neutral-300' : 'text-blue-800'}`}>Bank Transfer Details</p>
                    <p className={`text-xs ${dark ? 'text-neutral-400' : 'text-blue-700'}`}>Account Name: Ever Fit</p>
                    <p className={`text-xs ${dark ? 'text-neutral-400' : 'text-blue-700'}`}>Account No: 1234567890</p>
                    <p className={`text-xs ${dark ? 'text-neutral-400' : 'text-blue-700'}`}>Bank: Sample Bank</p>
                  </div>
                )}
                <div><label className={labelClass}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..." rows={2} className={inputClass} /></div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between p-4 rounded-2xl ${dark ? 'bg-neutral-900/30 border border-neutral-800/60' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <button onClick={() => { if (step === 'items') setStep('customer'); else if (step === 'review') setStep('items'); else navigate('/system/invoices'); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          <ChevronLeft className="w-4 h-4" />{step === 'customer' ? 'Cancel' : 'Back'}
        </button>
        {step === 'review' ? (
          <button onClick={handleSave} disabled={!canProceedItems || saving} className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
            {saving ? 'Saving...' : 'Create Invoice'}
          </button>
        ) : (
          <button onClick={() => { if (step === 'customer') setStep('items'); else if (step === 'items') setStep('review'); }} disabled={step === 'items' && !canProceedItems}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── RECEIPT UPLOAD SECTION ─── */}
      {receiptUpload && !receiptUpload.success && (
        <div className={`${cardClass} p-5 text-center`}>
          <h3 className={`text-sm font-semibold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Upload Bank Payment Receipt</h3>
          <p className={`text-xs mb-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Please upload a screenshot or photo of your bank transfer receipt.</p>
          <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files?.[0] || null)}
            className={`block w-full text-sm mb-3 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:text-sm file:font-medium ${dark ? 'file:bg-neutral-800 file:text-neutral-200 file:border-0 text-neutral-400' : 'file:bg-gray-100 file:text-gray-700 file:border-0 text-gray-500'}`} />
          <button onClick={async () => {
            if (!receiptFile) { toast.error('Select a file first'); return; }
            setReceiptUpload(prev => prev ? { ...prev, uploading: true } : null);
            const fd = new FormData();
            fd.append('receipt', receiptFile);
            try {
              await post<any>(`/orders/${receiptUpload.orderId}/upload-receipt`, fd);
              setReceiptUpload(prev => prev ? { ...prev, success: true, uploading: false } : null);
            } catch {
              toast.error('Upload failed');
              setReceiptUpload(prev => prev ? { ...prev, uploading: false } : null);
            }
          }} disabled={!receiptFile || receiptUpload.uploading}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
            {receiptUpload.uploading ? 'Uploading...' : 'Submit Receipt'}
          </button>
        </div>
      )}
      {receiptUpload?.success && (
        <div className={`${cardClass} p-5 text-center`}>
          <p className={`text-sm font-semibold ${dark ? 'text-green-400' : 'text-green-600'}`}>Receipt uploaded. Waiting for admin approval.</p>
          <button onClick={() => { setReceiptUpload(null); navigate('/system/invoices'); }}
            className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Done
          </button>
        </div>
      )}

      {/* ─── PRINT PREVIEW MODAL ─── */}
      {showPrintPreview && createdInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className={`relative w-full max-w-md max-h-[95vh] flex flex-col rounded-2xl overflow-hidden ${dark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200 shadow-2xl'}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Printer className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                <div>
                  <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Invoice Created!</h2>
                  <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{createdInvoice.invoiceNumber}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4" style={{ background: '#f5f5f5' }}>
              <div className="shadow-xl rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '320px' }}>
                <ThermalReceipt ref={receiptRef} invoice={createdInvoice} />
              </div>
            </div>
            <div className={`flex items-center justify-between px-4 py-3 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <button onClick={() => navigate('/system/invoices')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <X className="w-4 h-4" /> Skip
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => { handlePrint(); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => navigate('/system/invoices')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};