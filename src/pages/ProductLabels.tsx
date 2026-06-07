import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../lib/utils';
import { mockProducts, type Product } from '../data/mockData';
import JsBarcode from 'jsbarcode';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, Printer, Settings2,
  X, Barcode, Package, Eye, ShoppingBag,
} from 'lucide-react';

// ─── Label size presets ───
const LABEL_SIZES = {
  small:  { width: 180, height: 90,  name: 'Small (45×22mm)',  nameFont: 9,  priceFont: 9,  barcodeH: 28, barcodeW: 1.1 },
  medium: { width: 240, height: 110, name: 'Medium (60×28mm)', nameFont: 11, priceFont: 11, barcodeH: 36, barcodeW: 1.4 },
  large:  { width: 300, height: 140, name: 'Large (75×35mm)',  nameFont: 13, priceFont: 13, barcodeH: 44, barcodeW: 1.6 },
  xlarge: { width: 380, height: 170, name: 'X-Large (95×42mm)',nameFont: 15, priceFont: 15, barcodeH: 52, barcodeW: 1.8 },
} as const;

type LabelSize = keyof typeof LABEL_SIZES;

interface SelectedProduct {
  product: Product;
  quantity: number;
}

// ─── Sub-component: barcode SVG display ───
const BarcodePreview: React.FC<{ value: string; width: number; height: number; displayValue?: boolean }> = ({ value, width, height, displayValue = true }) => {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: 'CODE128', width, height, displayValue,
          fontSize: 10, margin: 0, background: 'transparent', lineColor: '#1e293b',
        });
      } catch { /* invalid value */ }
    }
  }, [value, width, height, displayValue]);
  return <svg ref={ref} />;
};

export const ProductLabels: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // ─── State ───
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedProduct[]>([]);
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState<'products' | 'preview'>('products');

  const dim = LABEL_SIZES[labelSize];

  // ─── Product list filtering ───
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return mockProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [search]);

  // ─── Selection helpers ───
  const addProduct = (p: Product) => {
    setSelected(prev => {
      const existing = prev.find(s => s.product.id === p.id);
      if (existing) return prev.map(s => s.product.id === p.id ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const removeProduct = (id: string) => setSelected(prev => prev.filter(s => s.product.id !== id));

  const updateQty = (id: string, delta: number) => {
    setSelected(prev => prev.map(s => {
      if (s.product.id !== id) return s;
      const q = Math.max(1, s.quantity + delta);
      return { ...s, quantity: q };
    }));
  };

  const totalLabels = selected.reduce((a, s) => a + s.quantity, 0);

  // ─── Build print HTML (shared between print methods) ───
  const buildPrintHTML = useCallback(() => {
    if (!printRef.current) return '';
    const html = printRef.current.innerHTML;
    return `<!DOCTYPE html><html><head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reliance — Product Labels</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        @page { size: A4; margin: 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .labels-grid { display: grid; gap: 6px; grid-template-columns: repeat(auto-fill, minmax(${Math.min(dim.width, 170)}px, 1fr)); padding: 2mm; }
        .label { border: 1px dashed #d1d5db; border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; page-break-inside: avoid; overflow: hidden; background: #fff; }
        .product-name { font-family: 'Inter', -apple-system, sans-serif; font-weight: 600; text-align: center; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; color: #1e293b; }
        .label-category { font-family: 'Inter', -apple-system, sans-serif; }
        .price-tag { font-family: 'Inter', -apple-system, sans-serif; }
        .barcode-wrap svg { max-width: 100%; height: auto; }
        @media print {
          body { margin: 0; }
          .labels-grid { gap: 4px; }
        }
      </style>
    </head><body>${html}</body></html>`;
  }, [dim.width]);

  // ─── Print via hidden iframe (works on both desktop & mobile) ───
  const printViaIframe = useCallback((html: string) => {
    let iframe = iframeRef.current;
    if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);

    iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:210mm;height:297mm;border:none;opacity:0;';
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    // Wait for fonts + SVG rendering, then trigger print
    const tryPrint = () => {
      try {
        iframe!.contentWindow?.focus();
        iframe!.contentWindow?.print();
      } catch { /* cross-origin or closed */ }
    };
    // Use onload if supported, with a timeout safety net
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = () => {
        setTimeout(() => { if (iframe?.parentNode) iframe.parentNode.removeChild(iframe); iframeRef.current = null; }, 500);
      };
    }
    setTimeout(tryPrint, 1000);
  }, []);

  // ─── Print handler (mobile-compatible) ───
  const handlePrint = useCallback(() => {
    if (!printRef.current || selected.length === 0) return;
    const printHTML = buildPrintHTML();

    // Detect mobile: use iframe directly (window.open unreliable on mobile)
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobile) {
      printViaIframe(printHTML);
      return;
    }

    // Desktop: try window.open for better UX
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printHTML);
      win.document.close();
      // Use setTimeout — onload is unreliable after document.write
      setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 800);
      return;
    }

    // Fallback to iframe if popup blocked
    printViaIframe(printHTML);
  }, [selected, buildPrintHTML, printViaIframe]);

  // Cleanup iframe on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current?.parentNode) {
        iframeRef.current.parentNode.removeChild(iframeRef.current);
      }
    };
  }, []);

  // ─── Shared styles ───
  const cardBg = dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200';

  // ═══════════ Toggle switch ═══════════
  const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <span className={`text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-green-500' : dark ? 'bg-neutral-700' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-3 sm:space-y-4 pb-24 lg:pb-8">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => navigate('/system/products')} className={`p-2 rounded-xl transition-all flex-shrink-0 ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className={`text-lg sm:text-2xl font-bold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>Print Labels</h1>
            <p className={`text-xs sm:text-sm hidden sm:block ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Select products & print barcodes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowSettings(v => !v)} className={`p-2 sm:px-3 sm:py-2 rounded-xl text-sm font-medium transition-all ${
            dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700/50' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`} title="Settings">
            <Settings2 className="w-4 h-4" />
          </button>
          {/* Desktop print button */}
          <button onClick={handlePrint} disabled={selected.length === 0} className={`hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selected.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-lg'
          } ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
            <Printer className="w-4 h-4" /> Print {totalLabels > 0 && `(${totalLabels})`}
          </button>
        </div>
      </div>

      {/* ─── Settings Panel ─── */}
      {showSettings && (
        <div className={`p-3 sm:p-4 rounded-2xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Label Settings</h3>
            <button onClick={() => setShowSettings(false)} className={`p-1 rounded-lg ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Label Size</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(LABEL_SIZES) as LabelSize[]).map(key => (
                <button key={key} onClick={() => setLabelSize(key)} className={`px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-medium border transition-all ${
                  labelSize === key
                    ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900'
                    : dark ? 'bg-neutral-800/50 text-neutral-300 border-neutral-700/50 hover:bg-neutral-700/50' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}>{LABEL_SIZES[key].name}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <Toggle label="Name" checked={showName} onChange={setShowName} />
            <Toggle label="Price" checked={showPrice} onChange={setShowPrice} />
            <Toggle label="Barcode" checked={showBarcode} onChange={setShowBarcode} />
            <Toggle label="Category" checked={showCategory} onChange={setShowCategory} />
          </div>
        </div>
      )}

      {/* ─── Mobile Tab Switcher ─── */}
      <div className={`flex lg:hidden rounded-xl overflow-hidden border divide-x ${dark ? 'border-neutral-700/50 divide-neutral-700/50' : 'border-gray-200 divide-gray-200'}`}>
        {(['products', 'preview'] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
            mobileTab === tab
              ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
              : dark ? 'bg-neutral-900 text-neutral-400' : 'bg-gray-50 text-gray-500'
          }`}>
            {tab === 'products'
              ? <><ShoppingBag className="w-3.5 h-3.5" /> Products ({mockProducts.length})</>
              : <><Eye className="w-3.5 h-3.5" /> Preview ({totalLabels})</>
            }
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4" style={{ minHeight: 'min(calc(100vh - 16rem), 600px)' }}>
        {/* ═══════ LEFT: Product Selection ═══════ */}
        <div className={`w-full lg:w-[380px] lg:flex-shrink-0 flex flex-col rounded-2xl border overflow-hidden ${cardBg} ${mobileTab !== 'products' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search */}
          <div className={`p-2.5 sm:p-3 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-gray-50 border-gray-200'}`}>
              <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
              <input
                type="text" placeholder="Search products, SKU, barcode…"
                value={search} onChange={e => setSearch(e.target.value)}
                className={`bg-transparent border-none outline-none flex-1 min-w-0 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`}
              />
              {search && <button onClick={() => setSearch('')} className={`p-0.5 rounded flex-shrink-0 ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-200 text-gray-400'}`}><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>

          {/* Product list */}
          <div className={`flex-1 overflow-y-auto divide-y ${dark ? 'divide-neutral-800/50' : 'divide-gray-100'}`}>
            {filteredProducts.map(p => {
              const sel = selected.find(s => s.product.id === p.id);
              return (
                <div key={p.id} className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 transition-colors ${dark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}>
                  {/* Thumbnail */}
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${dark ? 'text-neutral-600' : 'text-gray-400'}`} />}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                    <p className={`text-[10px] sm:text-xs truncate ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{p.sku} · {p.barcode}</p>
                  </div>
                  {/* Action */}
                  {sel ? (
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                      <button onClick={() => updateQty(p.id, -1)} className={`p-1 rounded-lg ${dark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}><Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                      <span className={`text-xs sm:text-sm font-semibold w-5 sm:w-6 text-center ${dark ? 'text-white' : 'text-gray-900'}`}>{sel.quantity}</span>
                      <button onClick={() => updateQty(p.id, 1)} className={`p-1 rounded-lg ${dark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}><Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                      <button onClick={() => removeProduct(p.id)} className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => addProduct(p)} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${dark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}><Plus className="w-4 h-4" /></button>
                  )}
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className={`flex flex-col items-center justify-center py-12 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No products found</p>
              </div>
            )}
          </div>

          {/* Selected summary */}
          {selected.length > 0 && (
            <div className={`p-2 sm:p-3 border-t ${dark ? 'border-neutral-800 bg-neutral-900/80' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {selected.map(s => (
                  <span key={s.product.id} className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-200 text-gray-600'}`}>
                    {s.product.name.length > 12 ? s.product.name.slice(0, 12) + '…' : s.product.name} ×{s.quantity}
                    <button onClick={() => removeProduct(s.product.id)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════ RIGHT: Label Preview ═══════ */}
        <div className={`flex-1 flex flex-col rounded-2xl border overflow-hidden ${cardBg} ${mobileTab !== 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Preview header */}
          <div className={`flex items-center justify-between px-3 sm:px-4 py-3 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Barcode className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Label Preview</span>
              {totalLabels > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-600'}`}>{totalLabels} labels</span>
              )}
            </div>
          </div>

          {/* Labels area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {selected.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full py-12 sm:py-16 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                <Barcode className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium mb-1">No products selected</p>
                <p className="text-xs">Add products from the list to generate labels</p>
                <button onClick={() => setMobileTab('products')} className={`mt-4 lg:hidden px-4 py-2 rounded-xl text-sm font-medium ${
                  dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'
                }`}>Browse Products</button>
              </div>
            ) : (
              <div ref={printRef}>
                <div className="labels-grid" style={{ display: 'grid', gap: '6px', gridTemplateColumns: `repeat(auto-fill, minmax(${Math.min(dim.width, 150)}px, 1fr))` }}>
                  {selected.flatMap(sp =>
                    Array.from({ length: sp.quantity }).map((_, idx) => (
                      <div
                        key={`${sp.product.id}-${idx}`}
                        className="label"
                        style={{
                          width: '100%',
                          maxWidth: dim.width,
                          height: dim.height,
                          border: '1px dashed #d1d5db',
                          borderRadius: 8,
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          background: '#fff',
                          overflow: 'hidden',
                        }}
                      >
                        {showName && (
                          <div className="product-name" style={{
                            fontFamily: "'Inter', -apple-system, sans-serif",
                            fontSize: dim.nameFont,
                            fontWeight: 600,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            color: '#1e293b',
                            maxWidth: '100%',
                          }}>{sp.product.name}</div>
                        )}
                        {showCategory && (
                          <div className="label-category" style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 8, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{sp.product.category}</div>
                        )}
                        {showPrice && (
                          <div className="price-tag" style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: dim.priceFont, fontWeight: 700, color: '#059669' }}>
                            {formatCurrency(sp.product.sellingPrice)}
                          </div>
                        )}
                        {showBarcode && sp.product.barcode && (
                          <div className="barcode-wrap" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                            <BarcodePreview
                              value={sp.product.barcode}
                              width={dim.barcodeW}
                              height={dim.barcodeH}
                              displayValue={true}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Mobile Sticky Print Bar ═══════ */}
      {selected.length > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden p-3 border-t backdrop-blur-xl safe-bottom ${
          dark ? 'bg-neutral-950/90 border-neutral-800' : 'bg-white/90 border-gray-200'
        }`} style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{selected.length} product{selected.length > 1 ? 's' : ''}</p>
              <p className={`text-[11px] ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{totalLabels} label{totalLabels > 1 ? 's' : ''} ready</p>
            </div>
            {mobileTab === 'products' && (
              <button onClick={() => setMobileTab('preview')} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex-shrink-0 ${
                dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'
              }`}>
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            )}
            <button onClick={handlePrint} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg flex-shrink-0 ${
              dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
            }`}>
              <Printer className="w-4 h-4" /> Print ({totalLabels})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
