import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../lib/utils';
import {
  COMMON_COLORS,
  type Product,
  type Size,
  type FabricType,
} from '../data/mockData';
import { get, post, put, del } from '../lib/api';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { ComboBox } from '../components/ui/ComboBox';
import { SearchableComboBox, type ComboBoxOption } from '../components/ui/SearchableComboBox';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Pagination } from '../components/ui/Pagination';
import {
  Plus, Package, Trash2, X, Save, ImagePlus, Layers, MessageSquare, Star,
  Search, Grid3X3, List, Filter, ShoppingBag, CheckCircle, AlertTriangle,
  Calendar, ChevronLeft, ChevronRight, ArrowDownWideNarrow,
} from 'lucide-react';

const COLOR_HEX_MAP: Record<string, string> = {
  'Black': '#000000', 'White': '#FFFFFF', 'Navy': '#001F3F', 'Red': '#E53E3E',
  'Blue': '#3B82F6', 'Grey': '#9CA3AF', 'Brown': '#92400E', 'Cream': '#FFFDD0',
  'Olive': '#6B7821', 'Maroon': '#7F1D1D', 'Pink': '#EC4899', 'Beige': '#D2B48C',
  'Charcoal': '#36454F', 'Forest Green': '#228B22', 'Burgundy': '#800020',
  'Tan': '#D2B48C', 'Sage': '#87AE73', 'Ivory': '#FFFFF0', 'Lavender': '#E6E6FA',
  'Rust': '#B7410E', 'Yellow': '#EAB308', 'Orange': '#F97316', 'Teal': '#14B8A6',
  'Coral': '#FF7F50',
};

// ===== INLINE CALENDAR COMPONENT (matching Categories.tsx) =====
const InlineCalendar: React.FC<{
  value: string;
  onChange: (date: string) => void;
  dark: boolean;
  onClose: () => void;
}> = ({ value, onChange, dark, onClose }) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewDate.year, viewDate.month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const selectedDate = value ? new Date(value) : null;

  const prevMonth = () => setViewDate(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 });
  const nextMonth = () => setViewDate(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isSelected = (day: number) => selectedDate && selectedDate.getFullYear() === viewDate.year && selectedDate.getMonth() === viewDate.month && selectedDate.getDate() === day;
  const isToday = (day: number) => { const t = new Date(); return t.getFullYear() === viewDate.year && t.getMonth() === viewDate.month && t.getDate() === day; };

  return (
    <div className={`p-3 rounded-xl border shadow-xl ${dark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className={`p-1 rounded-lg ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-4 h-4" /></button>
        <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{monthNames[viewDate.month]} {viewDate.year}</span>
        <button onClick={nextMonth} className={`p-1 rounded-lg ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className={`text-[10px] font-medium py-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{d}</div>
        ))}
        {blanks.map(b => <div key={`bl-${b}`} />)}
        {days.map(day => (
          <button
            key={day}
            onClick={() => {
              const m = (viewDate.month + 1).toString().padStart(2, '0');
              const dd = day.toString().padStart(2, '0');
              onChange(`${viewDate.year}-${m}-${dd}`);
              onClose();
            }}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              isSelected(day)
                ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                : isToday(day)
                ? dark ? 'bg-neutral-800 text-white ring-1 ring-neutral-600' : 'bg-gray-100 text-gray-900 ring-1 ring-gray-300'
                : dark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
};

// ===== VARIANT ROW INTERFACE =====
interface VariantRow {
  key: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
}

// ===== REVIEW ROW INTERFACE =====
interface ReviewRow {
  key: string;
  reviewerName: string;
  reviewerPhoto: string;
  description: string;
  rating: number;
}

interface ProductImageState {
  id?: number;
  imageUrl: string;       // blob: data: https: or server relative path
}

const inputClass = (dark: boolean) => `w-full px-3 py-2 rounded-xl border text-sm transition-all ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'}`;
const labelClass = (dark: boolean) => `block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`;

export const Products: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ─── STATE ───
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [showAllImages, setShowAllImages] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState<number>(1);
  const [formVariants, setFormVariants] = useState<VariantRow[]>([]);
  const [formReviews, setFormReviews] = useState<ReviewRow[]>([]);

  // ─── Search & View State ───
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ─── Calendar popup state and refs (matching Categories.tsx) ───
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const startCalRef = useRef<HTMLDivElement>(null);
  const endCalRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // ─── Filters state (matching Categories.tsx) ───
  const [showFilters, setShowFilters] = useState(false);
  const gridPerPageOptions = [8, 12, 16, 24];
  const tablePerPageOptions = [5, 10, 20, 50];
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const perPageOptions = viewMode === 'list' ? tablePerPageOptions : gridPerPageOptions;

  useEffect(() => { setItemsPerPage(viewMode === 'list' ? 10 : 8); }, [viewMode]);

  // Modern filter states (SearchableComboBox + date pickers)
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name-asc'>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Click outside to close calendars and sort dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showStartCal && startCalRef.current && !startCalRef.current.contains(e.target as Node)) setShowStartCal(false);
      if (showEndCal && endCalRef.current && !endCalRef.current.contains(e.target as Node)) setShowEndCal(false);
      if (isSortOpen && sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStartCal, showEndCal, isSortOpen]);

  const categoryOptions: ComboBoxOption[] = useMemo(() => [
    ...categories.map(c => ({ value: c.name, label: c.name })),
  ], [categories]);

  const stockOptions: ComboBoxOption[] = [
    { value: 'in-stock', label: 'In Stock', colorDot: '#22c55e' },
    { value: 'low-stock', label: 'Low Stock', colorDot: '#f59e0b' },
    { value: 'out-of-stock', label: 'Out of Stock', colorDot: '#ef4444' },
  ];

  const activeFilterCount = [
    categoryFilter ? 1 : 0,
    stockFilter ? 1 : 0,
    dateFrom ? 1 : 0,
    dateTo ? 1 : 0,
  ].reduce((s, v) => s + v, 0);

  const hasActiveFilters = !!categoryFilter || !!stockFilter || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setCategoryFilter('');
    setStockFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }
    if (stockFilter) {
      if (stockFilter === 'in-stock') result = result.filter(p => p.stock > 10);
      else if (stockFilter === 'low-stock') result = result.filter(p => p.stock > 0 && p.stock <= 10);
      else if (stockFilter === 'out-of-stock') result = result.filter(p => p.stock === 0);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(p => new Date(p.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      result = result.filter(p => new Date(p.createdAt) <= to);
    }
    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, categoryFilter, stockFilter, dateFrom, dateTo, sortBy]);

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchAll = useCallback(async () => {
    try {
      const [prodData, catData] = await Promise.all([
        get<any[]>('/products'),
        get<any[]>('/categories'),
      ]);
      setCategories(catData.map((c: any) => ({ id: c.id, name: c.name })));
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '').replace(/\/+$/, '');
      const resolveImage = (rawPath: string | null | undefined): string | undefined => {
        if (!rawPath || !rawPath.trim()) return undefined;
        if (rawPath.startsWith('blob:') || rawPath.startsWith('data:') || /^https?:\/\//i.test(rawPath)) return rawPath;
        const cleanPath = rawPath.replace(/^\/+/, '');
        return `${apiBase}/${cleanPath}`;
      };
      const mapped: Product[] = prodData.map((p: any) => ({
        id: String(p.id),
        sku: p.variants?.[0]?.sku || `SKU-${p.id}`,
        barcode: '',
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        brand: 'EverFit',
        sizes: [...new Set((p.variants || []).map((v: any) => v.size))] as Size[],
        colors: [...new Set((p.variants || []).map((v: any) => v.color))] as string[],
        fabricType: 'Cotton' as FabricType,
        description: p.description || undefined,
        costPrice: Math.round(p.price * 0.6),
        sellingPrice: p.price,
        stock: (p.variants || []).reduce((sum: number, v: any) => sum + (v.stock || 0), 0),
        lowStockThreshold: 10,
        status: 'in-stock' as Product['status'],
        image: resolveImage(p.images?.[0]?.imageUrl || p.image),
        createdAt: p.createdAt || new Date().toISOString(),
      }));
      setProducts(mapped);
      setError(null);
    } catch (err: any) {
      console.error('[Products] Fetch error:', err);
      setError(err.message || 'Failed to fetch');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setCurrentPage(1); }, [itemsPerPage]);

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const getRenderUrl = (rawPath: string | null | undefined): string => {
    if (!rawPath || !rawPath.trim()) return '/placeholder.png';
    // Pass-through: blob previews, base64 data URIs, and absolute web URLs
    if (rawPath.startsWith('blob:') || rawPath.startsWith('data:') || /^https?:\/\//i.test(rawPath)) return rawPath;
    // Strip any leading slashes so we never produce a double-slash when joining
    const cleanPath = rawPath.replace(/^\/+/, '');
    return `${apiBase}/${cleanPath}`;
  };
  const addImage = (img: string) => {
    // If it's a File object (from drag/drop), create an Object URL for live preview
    setFormImages(prev => [...prev, img]);
  };
  const removeImage = (idx: number) => {
    const removed = formImages[idx];
    // Revoke blob URLs to prevent memory leaks
    if (removed?.startsWith('blob:')) URL.revokeObjectURL(removed);
    setFormImages(prev => prev.filter((_, i) => i !== idx));
  };
  const deleteImageApi = async (imgUrl: string, productId: string) => {
    // Unsaved images (data:, blob:) — remove from local state only, no API call
    if (imgUrl.startsWith('data:') || imgUrl.startsWith('blob:')) {
      removeImageByUrl(imgUrl);
      return;
    }
    try {
      const dbId = productId.replace(/[^0-9]/g, '');
      const productData = await get<any>(`/products/${dbId}`);
      const matched = (productData.images || []).find((i: any) => i.imageUrl === imgUrl);
      if (matched) {
        await del(`/products/${dbId}/images/${matched.id}`);
        toast.success('Image deleted');
        if (selectedProduct) openEditModal(selectedProduct);
      } else {
        removeImageByUrl(imgUrl);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete image');
    }
  };
  const removeImageByUrl = (imgUrl: string) => {
    if (imgUrl?.startsWith('blob:')) URL.revokeObjectURL(imgUrl);
    setFormImages(prev => prev.filter(i => i !== imgUrl));
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormImages([]);
    setFormCategoryId(categories[0]?.id || 1);
    setFormVariants([]);
    setFormReviews([]);
  };

  const addVariantRow = () => setFormVariants(prev => [...prev, { key: `v-${Date.now()}`, size: '', color: '', sku: '', stock: 0 }]);
  const removeVariantRow = (key: string) => setFormVariants(prev => prev.filter(v => v.key !== key));
  const updateVariant = (key: string, field: keyof VariantRow, value: string | number) => setFormVariants(prev => prev.map(v => v.key === key ? { ...v, [field]: value } : v));

  const addReviewRow = () => setFormReviews(prev => [...prev, { key: `r-${Date.now()}`, reviewerName: '', reviewerPhoto: '', description: '', rating: 5 }]);
  const removeReviewRow = (key: string) => setFormReviews(prev => prev.filter(r => r.key !== key));
  const updateReview = (key: string, field: keyof ReviewRow, value: string | number) => setFormReviews(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));

  const openAddModal = () => { resetForm(); setShowAddModal(true); };

  const openEditModal = async (p: Product) => {
    setSelectedProduct(p);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormPrice(String(p.sellingPrice));
    const cat = categories.find(c => c.name === p.category);
    setFormCategoryId(cat?.id || 1);
    const dbId = p.id.replace(/[^0-9]/g, '');
    try {
      const productData = await get<any>(`/products/${dbId}`);
      const dbVariants = productData.variants || [];
      setFormVariants(dbVariants.map((v: any) => ({ key: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, size: v.size, color: v.color, sku: v.sku, stock: Number(v.stock || 0) })));
      const dbReviews = productData.reviews || [];
      setFormReviews(dbReviews.map((r: any) => ({ key: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, reviewerName: r.reviewerName, reviewerPhoto: r.reviewerPhoto || '', description: r.description || '', rating: r.rating || 5 })));
      // Load images — map imageUrl field (from ProductImage model), preserve sort order
      const legacyImg = productData.image as string | null;
      const imgArr: string[] = (productData.images || [])
        .map((img: any) => img.imageUrl as string)
        .filter(Boolean);
      if (legacyImg && !imgArr.includes(legacyImg)) { imgArr.unshift(legacyImg); }
      setFormImages([...new Set(imgArr)]);
      setShowAllImages(false);
    } catch {
      setFormVariants(p.sizes.flatMap(s => p.colors.map(c => ({ key: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, size: s, color: c, sku: `EVF-${p.name.slice(0, 3).toUpperCase()}-${s.toUpperCase()}-${c.toUpperCase()}`, stock: 0 }))));
      setFormReviews([]);
    }
    setShowEditModal(true);
  };

  const dataUrlToBlob = (dataUrl: string): Blob | null => {
    try {
      const parts = dataUrl.split(',');
      if (parts.length < 2) return null;
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      return new Blob([ab], { type: mime });
    } catch { return null; }
  };

  const handleSaveProduct = async (isEdit: boolean) => {
    if (!formName.trim()) { toast.error('Product name required'); return; }
    if (!formPrice || parseFloat(formPrice) <= 0) { toast.error('Valid price required'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('description', formDescription || '');
      formData.append('price', String(Number(parseFloat(formPrice))));
      formData.append('categoryId', String(Number(formCategoryId)));
      formData.append('variants', JSON.stringify(formVariants.map((v, idx) => ({
        size: v.size || 'FREE', color: v.color || 'Default',
        sku: v.sku || `EVF-${(formName || 'PROD').slice(0, 3).toUpperCase()}-${(v.size || 'XX').toUpperCase()}-${(v.color || 'XX').toUpperCase()}-${Date.now()}-${idx}`,
        stock: Number(v.stock || 0),
      }))));
      formData.append('reviews', JSON.stringify(formReviews.map(r => ({
        reviewerName: r.reviewerName || 'Anonymous',
        reviewerPhoto: r.reviewerPhoto || null,
        description: r.description || null,
        rating: Number(r.rating) || 5,
      }))));
      // --- Images ---
      // 1. data: URLs → convert to Blob and append as multipart files under 'imageFiles'
      // 2. http(s):// or /uploads/... URLs → send as JSON array under 'imageUrls'
      // 3. blob: URLs are temp previews — skip (they haven't been persisted yet and
      //    the ImageUpload component always produces data: URLs)
      const newFileImages: string[] = [];
      const existingUrlImages: string[] = [];
      for (const img of formImages) {
        if (img.startsWith('data:')) {
          newFileImages.push(img);
        } else if (img.startsWith('blob:')) {
          // skip — ephemeral, not persistable
        } else {
          existingUrlImages.push(img);
        }
      }
      for (let i = 0; i < newFileImages.length; i++) {
        const blob = dataUrlToBlob(newFileImages[i]);
        if (blob) formData.append('imageFiles', blob, `prod-img-${Date.now()}-${i}.jpg`);
      }
      formData.append('imageUrls', JSON.stringify(existingUrlImages));

      if (isEdit && selectedProduct) {
        const dbId = selectedProduct.id.replace(/[^0-9]/g, '');
        await put(`/products/${dbId}`, formData);
        toast.success('Product updated');
        setShowEditModal(false);
      } else {
        await post('/products', formData);
        toast.success('Product created');
        setShowAddModal(false);
      }
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
      setSelectedProduct(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await del(`/products/${selectedProduct.id.replace(/[^0-9]/g, '')}`);
      toast.success('Product deleted');
      setShowDeleteModal(false);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setSaving(false);
      setSelectedProduct(null);
    }
  };

  const statusBadge = (status: Product['status']) => {
    const s = { 'in-stock': 'bg-green-500/10 text-green-500', 'low-stock': 'bg-amber-500/10 text-amber-500', 'out-of-stock': 'bg-red-500/10 text-red-400' };
    const l = { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s[status]} border-current/20`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{l[status]}</span>;
  };

  const renderProductForm = (isEdit: boolean) => {
    const isOpen = isEdit ? showEditModal : showAddModal;
    if (!isOpen) return null;
    const cls = inputClass(dark);
    const lbl = labelClass(dark);
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}>
        <div className={`relative w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`} onClick={e => e.stopPropagation()}>
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{isEdit ? 'Edit Product' : 'Add Product'}</h2>
            <button onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {/* Product Images */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}><ImagePlus className="w-4 h-4" /> Product Images ({formImages.length})</h3>
              
              <div className="grid grid-cols-4 gap-2">
                {/* Collapsed: show first 3 images, 4th slot = "+X more" overlay */}
                {!showAllImages && formImages.length >= 4 ? (
                  <>
                    {formImages.slice(0, 3).map((img, idx) => (
                      <div key={`img-collapse-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border group">
                        <img src={getRenderUrl(img)} alt="" className="w-full h-full object-cover rounded-md" />
                        {showEditModal && selectedProduct && (
                          <button onClick={() => deleteImageApi(img, selectedProduct.id)} className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Delete image from server"><Trash2 className="w-3 h-3" /></button>
                        )}
                        <button onClick={() => removeImage(idx)} className={`absolute top-1 ${showEditModal ? 'left-1' : 'right-1'} p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity`}><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <div className="relative aspect-square rounded-lg overflow-hidden border group cursor-pointer" onClick={() => setShowAllImages(true)}>
                      <img src={getRenderUrl(formImages[3])} alt="" className="w-full h-full object-cover rounded-md" />
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">+{formImages.length - 3} more</span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Expanded OR fewer than 4 images: show all + upload at end */
                  <>
                    {formImages.map((img, idx) => (
                      <div key={`img-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border group">
                        <img src={getRenderUrl(img)} alt="" className="w-full h-full object-cover rounded-md" />
                        {showEditModal && selectedProduct && (
                          <button onClick={() => deleteImageApi(img, selectedProduct.id)} className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Delete image from server"><Trash2 className="w-3 h-3" /></button>
                        )}
                        <button onClick={() => removeImage(idx)} className={`absolute top-1 ${showEditModal ? 'left-1' : 'right-1'} p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity`}><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <ImageUpload value={undefined} onChange={val => { if (val) addImage(val); }} dark={dark} className="aspect-square rounded-lg border-2 border-dashed overflow-hidden cursor-pointer w-full h-full [&>div]:h-full [&>div]:py-0 [&>div]:gap-1 [&>div]:border-0 [&_svg]:w-5 [&_svg]:h-5 [&_p]:text-[10px] [&_p]:leading-tight" />
                  </>
                )}
              </div>
              
              {showAllImages && (
                <button onClick={() => setShowAllImages(false)} className={`mt-2 text-xs font-medium ${dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Show less</button>
              )}
            </div>

            {/* Basic Info */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}><Package className="w-4 h-4" /> Basic Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><label className={lbl}>Product Name *</label><input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Classic Denim Jeans" className={cls} /></div>
                <div><label className={lbl}>Price (LKR) *</label><input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="0.00" className={cls} /></div>
                <div><label className={lbl}>Category</label>
                  <ComboBox options={categories.map(c => ({ value: String(c.id), label: c.name }))} value={String(formCategoryId)} onChange={val => setFormCategoryId(Number(val))} placeholder="Select" dark={dark} className="w-full" />
                </div>
                <div className="sm:col-span-2"><label className={lbl}>Description</label><textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} className={cls} /></div>
              </div>
            </div>

            {/* Variants */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}><Layers className="w-4 h-4" /> Variants ({formVariants.length})</h3>
                <button onClick={addVariantRow} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}><Plus className="w-3.5 h-3.5" /> Add Variant</button>
              </div>
              {formVariants.length === 0 ? (
                <div className={`text-center py-4 border-2 border-dashed rounded-xl text-xs ${dark ? 'border-neutral-700 text-neutral-500' : 'border-gray-200 text-gray-400'}`}>No variants yet.</div>
              ) : (
                <div className="space-y-2">
                  {formVariants.map(v => (
                    <div key={v.key} className={`grid grid-cols-[100px_120px_1fr_80px_36px] gap-2 p-2 rounded-lg border items-center ${dark ? 'bg-neutral-800/30 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                      <ComboBox options={['XS','S','M','L','XL','XXL','28','30','32','34','36','38','FREE'].map(s => ({ value: s, label: s }))} value={v.size} onChange={val => updateVariant(v.key, 'size', val)} placeholder="Size" dark={dark} />
                      <ComboBox options={COMMON_COLORS.map(c => ({ value: c, label: c, colorDot: COLOR_HEX_MAP[c] || '#999' }))} value={v.color} onChange={val => updateVariant(v.key, 'color', val)} placeholder="Color" dark={dark} />
                      <input value={v.sku} onChange={e => updateVariant(v.key, 'sku', e.target.value)} placeholder="SKU" className={`${cls} w-full`} />
                      <input type="number" value={v.stock} onChange={e => updateVariant(v.key, 'stock', parseInt(e.target.value) || 0)} placeholder="Stock" className={`${cls} w-full`} />
                      <button onClick={() => removeVariantRow(v.key)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg justify-self-center"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}><MessageSquare className="w-4 h-4" /> Customer Reviews ({formReviews.length})</h3>
                <button onClick={addReviewRow} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}><Plus className="w-3.5 h-3.5" /> Add Review</button>
              </div>
              {formReviews.length === 0 ? (
                <div className={`text-center py-4 border-2 border-dashed rounded-xl text-xs ${dark ? 'border-neutral-700 text-neutral-500' : 'border-gray-200 text-gray-400'}`}>No reviews yet.</div>
              ) : (
                <div className="space-y-3">
                  {formReviews.map(r => (
                    <div key={r.key} className={`p-3 rounded-lg border ${dark ? 'bg-neutral-800/30 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
                            {r.reviewerPhoto ? <img src={r.reviewerPhoto} alt="" className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{(r.reviewerName || '?')[0]}</div>}
                          </div>
                          <input value={r.reviewerName} onChange={e => updateReview(r.key, 'reviewerName', e.target.value)} placeholder="Reviewer Name" className={`${cls} flex-1`} />
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <button key={i} type="button" onClick={() => updateReview(r.key, 'rating', i)}>
                              <Star className={`w-4 h-4 ${i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-500'}`} />
                            </button>
                          ))}
                        </div>
                        <button onClick={() => removeReviewRow(r.key)} className="p-1.5 ml-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="mb-2">
                        <label className={`text-[10px] font-medium ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Reviewer Photo</label>
                        <ImageUpload value={r.reviewerPhoto} onChange={val => updateReview(r.key, 'reviewerPhoto', val || '')} dark={dark} />
                      </div>
                      <textarea value={r.description} onChange={e => updateReview(r.key, 'description', e.target.value)} placeholder="Review description..." rows={2} className={cls} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
            <button onClick={() => handleSaveProduct(isEdit)} disabled={saving} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'} disabled:opacity-50`}>
              <Save className="w-4 h-4" />{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!showViewModal || !selectedProduct) return null;
    const p = selectedProduct;
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={() => setShowViewModal(false)}>
        <div className={`relative w-full max-w-lg max-h-[95vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`} onClick={e => e.stopPropagation()}>
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</h2>
            <button onClick={() => setShowViewModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            <p className={`text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{p.category} • Rs. {p.sellingPrice?.toLocaleString()}</p>
            {p.description && <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{p.description}</p>}
            <div className={`flex gap-2 pt-2 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <button onClick={() => { setShowViewModal(false); openEditModal(p); }} className={`flex-1 py-2 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>Edit</button>
              <button onClick={() => { setShowViewModal(false); setShowDeleteModal(true); }} className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400">Delete</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Derived Stats ───
  const inStockCount = useMemo(() => products.filter(p => p.stock > 10).length, [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= 10).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.stock === 0).length, [products]);

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Products</h1>
          <p className={`mt-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Manage your inventory — {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all ${
            dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
          }`}
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* ─── Stats Cards ─── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total', value: products.length, icon: ShoppingBag, color: dark ? 'text-blue-400' : 'text-blue-600' },
            { label: 'In Stock', value: inStockCount, icon: CheckCircle, color: 'text-green-500' },
            { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'Out of Stock', value: outOfStockCount, icon: X, color: 'text-red-400' },
          ].map((stat, i) => (
            <div key={i} className={`rounded-2xl border p-3 sm:p-4 ${
              dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-lg sm:text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Search & Controls ─── */}
      {!loading && (
        <div className={`rounded-2xl border p-3 sm:p-4 ${
          dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-gray-50 border-gray-200'}`}>
              <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`bg-transparent border-none outline-none flex-1 min-w-0 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  showFilters || activeFilterCount > 0
                    ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900'
                    : dark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" /> Filters
                {activeFilterCount > 0 && (
                  <span className={`ml-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${dark ? 'bg-black/20 text-black' : 'bg-white/30 text-white'}`}>{activeFilterCount}</span>
                )}
              </button>

              {/* Sort button with dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={`flex items-center justify-center p-2.5 border rounded-xl transition-colors ${dark ? 'border-gray-800 text-gray-300 hover:bg-gray-800/50 hover:text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                  title="Sort products"
                >
                  <ArrowDownWideNarrow className="w-4 h-4" />
                </button>
                {isSortOpen && (
                  <div className={`absolute left-0 sm:right-0 sm:left-auto origin-top-left sm:origin-top-right top-full mt-2 w-48 rounded-xl shadow-2xl z-50 overflow-hidden py-1 ${dark ? 'bg-[#1a1a1a] border border-gray-800' : 'bg-white border border-gray-200'}`}>
                    {[{ value: 'newest', label: 'Newest First' }, { value: 'price-asc', label: 'Price: Low to High' }, { value: 'price-desc', label: 'Price: High to Low' }, { value: 'name-asc', label: 'Name: A to Z' }].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value as "newest" | "price-asc" | "price-desc" | "name-asc"); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all ${
                          sortBy === opt.value
                            ? dark ? 'bg-gray-700/50 text-white' : 'bg-brand-900 text-white'
                            : dark ? 'text-gray-300 hover:bg-gray-800/70 hover:text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div className={`flex items-center rounded-xl overflow-hidden border ${
                dark ? 'border-neutral-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                      : dark ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                      : dark ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs ${dark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* ─── Expandable Filter Panel ─── */}
          {showFilters && (
            <div className={`mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
              {/* Category Filter — using SearchableComboBox like Categories.tsx */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Category</label>
                <SearchableComboBox
                  options={categoryOptions}
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  placeholder="All Categories"
                  searchPlaceholder="Search..."
                  dark={dark}
                />
              </div>

              {/* Stock Status Filter */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Stock Status</label>
                <SearchableComboBox
                  options={stockOptions}
                  value={stockFilter}
                  onValueChange={setStockFilter}
                  placeholder="All Status"
                  searchPlaceholder="Search..."
                  dark={dark}
                />
              </div>

              {/* Date From — using InlineCalendar popup like Categories.tsx */}
              <div className="relative" ref={startCalRef}>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Date From</label>
                <button
                  onClick={() => { setShowStartCal(!showStartCal); setShowEndCal(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${
                    dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'
                  } ${dateFrom ? (dark ? 'text-white' : 'text-gray-900') : (dark ? 'text-neutral-500' : 'text-gray-400')}`}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{dateFrom ? new Date(dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date'}</span>
                  {dateFrom && <X className="w-3 h-3 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateFrom(''); }} />}
                </button>
                {showStartCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateFrom} onChange={setDateFrom} onClose={() => setShowStartCal(false)} /></div>}
              </div>

              {/* Date To — using InlineCalendar popup like Categories.tsx */}
              <div className="relative" ref={endCalRef}>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Date To</label>
                <button
                  onClick={() => { setShowEndCal(!showEndCal); setShowStartCal(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${
                    dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'
                  } ${dateTo ? (dark ? 'text-white' : 'text-gray-900') : (dark ? 'text-neutral-500' : 'text-gray-400')}`}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{dateTo ? new Date(dateTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date'}</span>
                  {dateTo && <X className="w-3 h-3 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateTo(''); }} />}
                </button>
                {showEndCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateTo} onChange={setDateTo} onClose={() => setShowEndCal(false)} /></div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Results bar ─── */}
      {!loading && !error && (
        <div className="flex items-center justify-between">
          <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>
            Showing <strong className={dark ? 'text-neutral-300' : 'text-gray-700'}>{paginatedProducts.length}</strong> of{' '}
            <strong className={dark ? 'text-neutral-300' : 'text-gray-700'}>{filteredProducts.length}</strong> products
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Per page:</span>
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className={`text-xs px-2 py-1 rounded-lg border ${
                dark
                  ? 'bg-neutral-800/50 border-neutral-700/50 text-neutral-300'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ─── Loading / Error / Empty / Grid ─── */}
      {loading ? (
        <div className="flex justify-center py-20"><div className={`animate-spin w-10 h-10 border-2 rounded-full ${dark ? 'border-white/20 border-t-white' : 'border-gray-200 border-t-brand-900'}`} /></div>
      ) : error ? (
        <div className={`text-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => { setLoading(true); setError(null); fetchAll(); }} className="mt-3 px-4 py-2 rounded-xl text-sm font-medium bg-brand-900 text-white">Retry</button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={`flex flex-col items-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <Package className={`w-12 h-12 mb-3 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
          <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>No products</p>
          <button onClick={openAddModal} className="mt-3 px-4 py-2 rounded-xl text-sm font-medium bg-brand-900 text-white">Add Product</button>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {paginatedProducts.map(product => (
              <div key={product.id} className={`group rounded-xl sm:rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${dark ? 'bg-neutral-900/80 border-neutral-800/60 hover:border-neutral-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <div className={`h-36 sm:h-40 lg:h-48 overflow-hidden relative ${dark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Package className="w-10 h-10 text-neutral-500" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">{statusBadge(product.status)}</div>
                </div>
                <div className="p-2.5 sm:p-3 lg:p-4 space-y-1.5">
                  <p className={`text-xs sm:text-sm font-semibold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                  <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.sku}</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(product.sellingPrice)}</p>
                    <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Stock: {product.stock}</p>
                  </div>
                  <div className={`flex gap-1 pt-2 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
                    <button onClick={() => { setSelectedProduct(product); setShowViewModal(true); }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium ${dark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>View</button>
                    <button onClick={() => openEditModal(product)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium ${dark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>Edit</button>
                    <button onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20`}>Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              dark={dark}
            />
          )}
        </>
      ) : (
        <>
          <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className={dark ? 'bg-neutral-800/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Product</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>SKU</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Price</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Stock</th>
                    <th className={`px-4 sm:px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? 'divide-neutral-800/60' : 'divide-gray-100'}`}>
                  {paginatedProducts.map(product => (
                    <tr key={product.id} className={`transition-colors ${dark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex-shrink-0 ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${dark ? 'text-neutral-600' : 'text-gray-300'}`} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                            <p className={`text-xs truncate max-w-[200px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 sm:px-6 py-3 text-sm hidden md:table-cell ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        <code className={`px-1.5 py-0.5 rounded text-xs ${dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-600'}`}>{product.sku}</code>
                      </td>
                      <td className={`px-4 sm:px-6 py-3 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(product.sellingPrice)}</td>
                      <td className="px-4 sm:px-6 py-3">{statusBadge(product.status)}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedProduct(product); setShowViewModal(true); }} className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`} title="View"><Package className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(product)} className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`} title="Edit"><Save className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }} className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-red-500/10 text-neutral-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`} title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {filteredProducts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              dark={dark}
            />
          )}
        </>
      )}

      {/* ─── Modals ─── */}
      {renderProductForm(false)}
      {renderProductForm(true)}
      {renderViewModal()}
      <DeleteConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteProduct} title="Delete Product" itemName={selectedProduct?.name} />
    </div>
  );
};