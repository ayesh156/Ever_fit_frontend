import React, { useState, useEffect, useRef } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { get } from '../../lib/api';
import { ShoppingBag, Heart, Star, Minus, Plus, MessageSquare, User, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const STANDARD_COLORS: Record<string, string> = {
  'Black': '#000000', 'White': '#FFFFFF', 'Navy': '#001F3F', 'Red': '#E53E3E',
  'Blue': '#3B82F6', 'Grey': '#9CA3AF', 'Brown': '#92400E', 'Cream': '#FFFDD0',
  'Olive': '#6B7821', 'Maroon': '#7F1D1D', 'Pink': '#EC4899', 'Beige': '#D2B48C',
  'Charcoal': '#36454F', 'Forest Green': '#228B22', 'Burgundy': '#800020',
  'Tan': '#D2B48C', 'Sage': '#87AE73', 'Ivory': '#FFFFF0', 'Lavender': '#E6E6FA',
  'Rust': '#B7410E', 'Yellow': '#EAB308', 'Orange': '#F97316', 'Teal': '#14B8A6',
  'Coral': '#FF7F50', 'Purple': '#7C3AED', 'Gold': '#D4AF37', 'Silver': '#C0C0C0',
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const dark = theme === 'dark';

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [zoom, setZoom] = useState({ show: false, x: 0, y: 0 });
  const zoomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await get<any>(`/products/${id}`);
        setProduct(data);
        const sizes = [...new Set((data.variants || []).map((v: any) => v.size as string))] as string[];
        const colors = [...new Set((data.variants || []).map((v: any) => v.color as string))] as string[];
        if (sizes.length > 0) setSelectedSize(sizes[0]);
        if (colors.length > 0) setSelectedColor(colors[0]);
        if (data.categoryId) {
          try {
            const allData = await get<any[]>('/products');
            setRelatedProducts(allData.filter((p: any) => p.categoryId === data.categoryId && p.id !== data.id).slice(0, 4));
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const allImages: string[] = [];
  if (product) {
    const imgSet = new Set<string>();
    if (product.image) imgSet.add(product.image as string);
    if (product.images) product.images.forEach((img: any) => { if (img.imageData) imgSet.add(img.imageData as string); });
    imgSet.forEach(i => allImages.push(i));
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomRef.current) return;
    const rect = zoomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ show: true, x, y });
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center"><div className={`animate-spin w-10 h-10 border-2 rounded-full ${dark ? 'border-white/20 border-t-white' : 'border-gray-200 border-t-brand-900'}`} /></div>;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className={`text-lg ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Product not found</p>
      <NavLink to="/shop" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">Back to Shop</NavLink>
    </div>
  );

  const sizes = [...new Set((product.variants || []).map((v: any) => v.size as string))] as string[];
  const colors = [...new Set((product.variants || []).map((v: any) => v.color as string))] as string[];
  const totalStock = (product.variants || []).reduce((s: number, v: any) => s + (v.stock || 0), 0);
  const reviews: any[] = product.reviews || [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount : 0;
  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews.forEach((r: any) => { const idx = Math.min(Math.max(Math.round(r.rating || 0), 1), 5) - 1; ratingDistribution[idx]++; });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Please select a size'); return; }
    if (!selectedColor) { toast.error('Please select a color'); return; }
    const matchedVariant = (product.variants || []).find((v: any) => v.size === selectedSize && v.color === selectedColor);
    const selectedVarId = matchedVariant?.id || product?.variants?.[0]?.id;
    if (!selectedVarId) { toast.error('Error: Product variants missing from database.'); return; }
    addToCart({
      id: String(product.id), sku: product.variants?.[0]?.sku || '', barcode: '',
      name: product.name, category: product.category?.name || '', brand: 'EverFit',
      sizes: sizes as any[], colors, fabricType: 'Cotton' as any,
      description: product.description || '', costPrice: Math.round(product.price * 0.6),
      sellingPrice: product.price, stock: totalStock, lowStockThreshold: 10,
      status: totalStock > 0 ? 'in-stock' as const : 'out-of-stock' as const,
      image: product.image || undefined, createdAt: product.createdAt || '',
    } as any, selectedSize as any, selectedColor, quantity, selectedVarId);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
      <div className="flex items-center gap-2 text-xs mb-6">
        <NavLink to="/" className={`${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Home</NavLink>
        <span className={dark ? 'text-neutral-600' : 'text-gray-300'}>/</span>
        <NavLink to="/shop" className={`${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Shop</NavLink>
        <span className={dark ? 'text-neutral-600' : 'text-gray-300'}>/</span>
        <span className={dark ? 'text-neutral-300' : 'text-gray-700'}>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Gallery */}
        <div className="space-y-3">
          {/* Main Image with Zoom */}
          <div
            ref={zoomRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoom({ ...zoom, show: false })}
            onClick={() => { setLightboxIdx(selectedImageIdx); setLightboxOpen(true); }}
            className={`relative rounded-2xl overflow-hidden border cursor-crosshair ${dark ? 'bg-neutral-900 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`}
          >
            {allImages.length > 0 ? (
              <>
                <img src={allImages[selectedImageIdx]} alt={product.name} className="w-full aspect-square lg:aspect-[4/5] object-cover" />
                {zoom.show && (
                  <div className="absolute inset-0 pointer-events-none">
                    <img src={allImages[selectedImageIdx]} alt="" className="w-[200%] h-[200%] max-w-none max-h-none" style={{ transform: `translate(-${zoom.x}%, -${zoom.y}%)` }} />
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square lg:aspect-[4/5] flex items-center justify-center"><p className={`text-sm ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>No image</p></div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImageIdx(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${idx === selectedImageIdx ? 'border-brand-600 ring-1 ring-brand-600' : dark ? 'border-neutral-700' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex flex-col">
          <p className={`text-[10px] uppercase tracking-[0.2em] font-semibold mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.category?.name || 'Uncategorized'}</p>
          <h1 className={`font-display text-2xl lg:text-4xl font-bold mb-3 ${dark ? 'text-white' : 'text-brand-900'}`}>{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : dark ? 'text-neutral-700' : 'text-gray-200'}`} />)}
            </div>
            <span className={`text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{reviewCount > 0 ? `${avgRating.toFixed(1)} (${reviewCount} reviews)` : 'No reviews'}</span>
          </div>
          <p className={`text-2xl lg:text-3xl font-bold mb-6 ${dark ? 'text-white' : 'text-brand-900'}`}>{formatPrice(product.price)}</p>
          {product.description && <p className={`text-sm leading-relaxed mb-6 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{product.description}</p>}

          {sizes.length > 0 && <div className="mb-5">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Size: <span className="text-sm font-medium text-brand-600">{selectedSize}</span></p>
            <div className="flex flex-wrap gap-2">{sizes.map(s => (
              <button key={s} onClick={() => setSelectedSize(s)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${selectedSize === s ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900' : dark ? 'border-neutral-700 text-neutral-300' : 'border-gray-200 text-gray-600'}`}>{s}</button>
            ))}</div>
          </div>}

          {colors.length > 0 && <div className="mb-5">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Color: <span className="text-sm font-medium text-brand-600">{selectedColor}</span></p>
            <div className="flex flex-wrap gap-2">{colors.map(c => (
              <button key={c} onClick={() => setSelectedColor(c)} title={c}
                className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === c ? 'border-brand-900 scale-110 shadow-lg' : dark ? 'border-neutral-600' : 'border-gray-300'}`}
                style={{ backgroundColor: STANDARD_COLORS[c] || '#9CA3AF' }} />
            ))}</div>
          </div>}

          <div className="flex items-center gap-4 mt-auto pt-6 border-t">
            <div className={`flex items-center rounded-xl border overflow-hidden ${dark ? 'border-neutral-700' : 'border-gray-200'}`}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={`p-3 ${dark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}><Minus className="w-4 h-4" /></button>
              <span className={`px-4 py-3 text-sm font-semibold min-w-[40px] text-center ${dark ? 'text-white' : 'text-gray-900'}`}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className={`p-3 ${dark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={handleAddToCart} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold shadow-lg ${dark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
              <ShoppingBag className="w-5 h-5" /> Add to Cart — {formatPrice(product.price * quantity)}
            </button>
            <button onClick={() => toggleWishlist({ id: String(product.id), name: product.name, sellingPrice: product.price, category: product.category?.name || '', image: product.image || undefined } as any)}
              className={`p-3.5 rounded-xl border ${isInWishlist(String(product.id)) ? 'bg-red-500/10 border-red-500/20 text-red-500' : dark ? 'border-neutral-700 text-neutral-400' : 'border-gray-200 text-gray-400'}`}>
              <Heart className={`w-5 h-5 ${isInWishlist(String(product.id)) ? 'fill-red-500' : ''}`} />
            </button>
          </div>
          <p className={`text-xs mt-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{totalStock > 0 ? `${totalStock} units in stock` : 'Out of stock'}</p>
        </div>
      </div>

      {/* Ratings & Reviews */}
      <div className={`mt-12 lg:mt-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6"><MessageSquare className="w-5 h-5 text-brand-600" /><h2 className={`text-xl lg:text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Ratings & Reviews</h2></div>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-8 p-4 sm:p-6 rounded-xl ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}">
            <div className="text-center flex-shrink-0">
              <p className={`text-4xl lg:text-5xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{avgRating > 0 ? avgRating.toFixed(1) : '-'}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />)}</div>
              <p className={`text-xs mt-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 space-y-1.5 self-center w-full">
              {[5,4,3,2,1].map(star => { const cnt = ratingDistribution[star-1]||0; const pct = reviewCount > 0 ? (cnt/reviewCount)*100 : 0; return (
                <div key={star} className="flex items-center gap-2">
                  <span className={`text-xs font-medium w-4 text-right ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-neutral-700' : 'bg-gray-200'}`}><div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></div>
                  <span className={`text-xs w-8 text-right ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{cnt}</span>
                </div>
              );})}
            </div>
          </div>
          {reviews.length === 0 ? (
            <div className={`text-center py-10 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="text-sm">No reviews yet.</p></div>
          ) : (
            <div className="space-y-5">{reviews.map((review: any, idx: number) => (
              <div key={review.id || idx} className={`p-4 rounded-xl border ${dark ? 'bg-neutral-800/20 border-neutral-700/50' : 'bg-white border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-neutral-600">
                    {review.reviewerPhoto ? <img src={review.reviewerPhoto} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 m-2.5 text-neutral-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{review.reviewerName || 'Anonymous'}</p>
                      <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= (review.rating||0) ? 'text-amber-400 fill-amber-400' : dark ? 'text-neutral-600' : 'text-gray-200'}`} />)}</div>
                    {review.description && <p className={`text-sm leading-relaxed ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>{review.description}</p>}
                  </div>
                </div>
              </div>
            ))}</div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className={`mt-12 lg:mt-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl lg:text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Related Products</h2>
              <NavLink to="/shop" className={`text-sm font-medium flex items-center gap-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>View All <ChevronRight className="w-4 h-4" /></NavLink>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rp: any) => (
                <NavLink key={rp.id} to={`/product/${rp.id}`} className={`group rounded-xl border overflow-hidden transition-all hover:-translate-y-1 ${dark ? 'bg-brand-900/40 border-neutral-800/60' : 'bg-white border-gray-200 hover:shadow-lg'}`}>
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-800">
                    {rp.image ? <img src={rp.image} alt={rp.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><span className={`text-xs ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>No image</span></div>}
                  </div>
                  <div className="p-3">
                    <p className={`text-[10px] uppercase tracking-wider mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{rp.category?.name || ''}</p>
                    <h3 className={`text-xs font-semibold truncate mb-1 ${dark ? 'text-neutral-200' : 'text-gray-800'}`}>{rp.name}</h3>
                    <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>{formatPrice(rp.price)}</p>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><X className="w-6 h-6" /></button>
          {lightboxIdx > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.max(0, i - 1)); }} className="absolute left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button>
          )}
          {lightboxIdx < allImages.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.min(allImages.length - 1, i + 1)); }} className="absolute right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight className="w-6 h-6" /></button>
          )}
          <div className="max-w-4xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
            {allImages[lightboxIdx] && <img src={allImages[lightboxIdx]} alt="" className="max-w-full max-h-[85vh] object-contain" />}
          </div>
          <div className="absolute bottom-4 text-white/60 text-xs">{lightboxIdx + 1} / {allImages.length}</div>
        </div>
      )}
    </div>
  );
};