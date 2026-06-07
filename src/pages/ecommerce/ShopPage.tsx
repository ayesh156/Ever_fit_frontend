import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { FABRIC_TYPES, type Product, type Size } from '../../data/mockData';
import { get } from '../../lib/api';
import {
  Search, SlidersHorizontal, Grid3X3, LayoutList, X,
  ChevronDown, ShoppingBag, Heart, Star, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '../../components/ui/Pagination';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80';
const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = PLACEHOLDER_IMG; };

// Resolve a raw image path (relative /uploads/... or absolute URL) to a renderable URL
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');
const resolveUrl = (raw: string | null | undefined): string => {
  if (!raw || !raw.trim()) return PLACEHOLDER_IMG;
  if (raw.startsWith('blob:') || raw.startsWith('data:') || /^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE}/${raw.replace(/^\/+/, '')}`;
};

const priceRanges = [
  { label: 'Under Rs. 1,000', min: 0, max: 1000 },
  { label: 'Rs. 1,000 - Rs. 3,000', min: 1000, max: 3000 },
  { label: 'Rs. 3,000 - Rs. 5,000', min: 3000, max: 5000 },
  { label: 'Rs. 5,000 - Rs. 10,000', min: 5000, max: 10000 },
  { label: 'Over Rs. 10,000', min: 10000, max: Infinity },
];

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A-Z', value: 'name-asc' },
];

export const ShopPage: React.FC = () => {
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [searchParams] = useSearchParams();
  const dark = theme === 'dark';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: number; name: string; _count: { products: number } }[]>([]);

  // Fetch products AND categories from the live API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodData, catData] = await Promise.all([
          get<any[]>('/products'),
          get<any[]>('/categories'),
        ]);
        
        setCategories(catData);

        const mapped: Product[] = prodData.map((p: any) => {
          const sizes = [...new Set((p.variants || []).map((v: any) => v.size))] as Size[];
          const colors = [...new Set((p.variants || []).map((v: any) => v.color))] as string[];
          const variants = (p.variants || []).map((v: any) => ({ id: v.id, size: v.size, color: v.color, sku: v.sku || '', stock: v.stock || 0 }));
          
          return {
            id: String(p.id),
            sku: p.variants?.[0]?.sku || `SKU-${p.id}`,
            barcode: '',
            name: p.name,
            category: p.category?.name || 'Uncategorized',
            brand: 'EverFit',
            sizes,
            colors,
            variants,
            fabricType: 'Cotton' as any,
            description: p.description || undefined,
            costPrice: Math.round(p.price * 0.6),
            sellingPrice: p.price,
            stock: (p.variants || []).reduce((sum: number, v: any) => sum + (v.stock || 0), 0),
            lowStockThreshold: 10,
            status: 'in-stock' as const,
            image: resolveUrl(p.images?.[0]?.imageUrl || p.image || null),
            createdAt: p.createdAt || new Date().toISOString(),
          };
        });
        
        setProducts(mapped);
      } catch (err) {
        console.error('[ShopPage] Failed to fetch:', err);
        toast.error('Could not load data. Make sure the backend is running on port 5000.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initialCategory = searchParams.get('category') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedFabric, setSelectedFabric] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const resetPage = useCallback(() => setCurrentPage(1), []);
  useEffect(() => { resetPage(); }, [searchQuery, selectedCategory, selectedPriceRange, selectedFabric]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.colors.some(c => c.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (selectedPriceRange !== null) {
      const range = priceRanges[selectedPriceRange];
      filtered = filtered.filter(p => p.sellingPrice >= range.min && p.sellingPrice < range.max);
    }
    if (selectedFabric) {
      filtered = filtered.filter(p => p.fabricType === selectedFabric);
    }

    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.sellingPrice - b.sellingPrice); break;
      case 'price-desc': filtered.sort((a, b) => b.sellingPrice - a.sellingPrice); break;
      case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedPriceRange, selectedFabric, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedPriceRange(null);
    setSelectedFabric('');
    setSortBy('newest');
  };

  const hasFilters = searchQuery || selectedCategory || selectedPriceRange !== null || selectedFabric;

  const quickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = (product as any).variants?.find((v: any) => v.size === product.sizes[0] && v.color === product.colors[0]);
    const selectedVarId = variant?.id || (product as any).variants?.[0]?.id;
    if (!selectedVarId) { toast.error('Error: Product variants missing from database.'); return; }
    addToCart(product, product.sizes[0], product.colors[0], 1, selectedVarId);
    toast.success(`${product.name} added to cart`);
  };

  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`space-y-6 ${mobile ? '' : ''}`}>
      {/* Categories */}
      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Categories
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
              !selectedCategory
                ? dark ? 'bg-white text-black font-medium' : 'bg-brand-900 text-white font-medium'
                : dark ? 'text-neutral-300 hover:bg-neutral-800/50' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between ${
                selectedCategory === cat.name
                  ? dark ? 'bg-white text-black font-medium' : 'bg-brand-900 text-white font-medium'
                  : dark ? 'text-neutral-300 hover:bg-neutral-800/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-xs ${
                selectedCategory === cat.name
                  ? dark ? 'text-black/50' : 'text-white/60'
                  : dark ? 'text-neutral-600' : 'text-gray-400'
              }`}>{cat._count?.products ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Price Range
        </h4>
        <div className="space-y-1.5">
          {priceRanges.map((range, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPriceRange(selectedPriceRange === idx ? null : idx)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                selectedPriceRange === idx
                  ? dark ? 'bg-white text-black font-medium' : 'bg-brand-900 text-white font-medium'
                  : dark ? 'text-neutral-300 hover:bg-neutral-800/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fabric */}
      <div>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Fabric Type
        </h4>
        <div className="flex flex-wrap gap-2">
          {FABRIC_TYPES.slice(0, 8).map(fabric => (
            <button
              key={fabric}
              onClick={() => setSelectedFabric(selectedFabric === fabric ? '' : fabric)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedFabric === fabric
                  ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900'
                  : dark ? 'border-neutral-700 text-neutral-300 hover:border-neutral-500' : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {fabric}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearAllFilters}
          className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            dark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-8 lg:pt-8 lg:pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs mb-3">
          <NavLink to="/" className={`${dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'}`}>Home</NavLink>
          <span className={dark ? 'text-neutral-600' : 'text-gray-300'}>/</span>
          <span className={dark ? 'text-neutral-300' : 'text-gray-700'}>Shop</span>
          {selectedCategory && (
            <>
              <span className={dark ? 'text-neutral-600' : 'text-gray-300'}>/</span>
              <span className={dark ? 'text-neutral-300' : 'text-gray-700'}>{selectedCategory}</span>
            </>
          )}
        </div>
        <h1 className={`font-display text-3xl lg:text-4xl font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>
          {selectedCategory || 'All Products'}
        </h1>
        <p className={`mt-1.5 text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          {loading ? 'Loading...' : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Search & Sort Bar */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 p-4 rounded-2xl border ${
        dark ? 'bg-brand-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${
              dark
                ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-neutral-500/20`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className={`lg:hidden flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              dark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="relative flex-1 min-w-[120px] sm:flex-none">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className={`w-full sm:w-auto appearance-none pl-3 sm:pl-4 pr-10 py-2.5 rounded-xl border text-sm font-medium cursor-pointer ${
                dark
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-300'
                  : 'bg-white border-gray-200 text-gray-600'
              } focus:outline-none`}
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
          </div>

          <div className={`hidden sm:flex items-center rounded-xl border overflow-hidden ${dark ? 'border-neutral-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-all ${
                viewMode === 'grid'
                  ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                  : dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-all ${
                viewMode === 'list'
                  ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                  : dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Active Filters:</span>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory('')} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              dark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-gray-100 border-gray-200 text-gray-700'
            }`}>
              {selectedCategory} <X className="w-3 h-3" />
            </button>
          )}
          {selectedPriceRange !== null && (
            <button onClick={() => setSelectedPriceRange(null)} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              dark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-gray-100 border-gray-200 text-gray-700'
            }`}>
              {priceRanges[selectedPriceRange].label} <X className="w-3 h-3" />
            </button>
          )}
          {selectedFabric && (
            <button onClick={() => setSelectedFabric('')} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              dark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-gray-100 border-gray-200 text-gray-700'
            }`}>
              {selectedFabric} <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className={`sticky top-28 p-5 rounded-2xl border ${
            dark ? 'bg-brand-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
              <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
            </div>
            <FilterSidebar />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={`text-center py-20 rounded-2xl border ${
              dark ? 'bg-brand-900/20 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`animate-spin w-10 h-10 border-2 rounded-full mx-auto mb-4 ${
                dark ? 'border-white/20 border-t-white' : 'border-gray-200 border-t-brand-900'
              }`} />
              <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`text-center py-20 rounded-2xl border ${
              dark ? 'bg-brand-900/20 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
            }`}>
              <ShoppingBag className={`w-16 h-16 mx-auto mb-4 ${dark ? 'text-neutral-700' : 'text-gray-200'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>No products found</h3>
              <p className={`text-sm mb-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Try adjusting your filters or search query.</p>
              <button onClick={clearAllFilters} className={`px-5 py-2 rounded-full text-sm font-medium ${
                dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
              }`}>Clear Filters</button>
            </div>
          ) : viewMode === 'grid' ? (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(product => (
                <NavLink
                  key={product.id}
                  to={`/product/${product.id}`}
                  className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
                    dark
                      ? 'bg-brand-900/40 border-neutral-800/60 hover:border-neutral-600'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={product.image || PLACEHOLDER_IMG}
                      onError={handleImgError}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.status === 'out-of-stock' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-4 py-1.5 bg-black/80 text-white text-xs font-semibold rounded-full">Sold Out</span>
                      </div>
                    )}
                    {product.status === 'low-stock' && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-semibold rounded-full">Few Left</span>
                    )}
                    {/* Hover Actions */}
                    <div className="absolute bottom-3 right-3 flex flex-col gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      {product.status !== 'out-of-stock' && (
                        <button
                          onClick={(e) => quickAddToCart(e, product)}
                          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-black shadow-lg hover:bg-white transition-all"
                          title="Quick Add"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
                        aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        className={`p-2.5 backdrop-blur-sm rounded-full shadow-lg transition-all ${
                          isInWishlist(product.id)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-white/90 text-black hover:bg-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-white' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className={`text-[10px] uppercase tracking-wider mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.category}</p>
                    <h3 className={`font-medium text-sm leading-snug mb-2 line-clamp-2 ${dark ? 'text-neutral-200' : 'text-gray-800'}`}>
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-brand-900'}`}>
                        {formatPrice(product.sellingPrice)}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>4.5</span>
                      </div>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
              dark={dark}
            />
            </>
          ) : (
            <>
            <div className="space-y-4">
              {filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(product => (
                <NavLink
                  key={product.id}
                  to={`/product/${product.id}`}
                  className={`group flex gap-4 sm:gap-6 p-4 rounded-2xl border transition-all duration-300 ${
                    dark
                      ? 'bg-brand-900/30 border-neutral-800/60 hover:border-neutral-600'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="w-28 sm:w-40 aspect-[3/4] rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={product.image || PLACEHOLDER_IMG}
                      onError={handleImgError}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className={`text-[10px] uppercase tracking-wider mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.category}</p>
                    <h3 className={`font-medium text-base mb-1 ${dark ? 'text-neutral-200' : 'text-gray-800'}`}>{product.name}</h3>
                    <p className={`text-xs mb-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{product.fabricType} • {product.brand}</p>
                    <p className={`font-bold text-base mb-3 ${dark ? 'text-white' : 'text-brand-900'}`}>{formatPrice(product.sellingPrice)}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {product.colors.slice(0, 4).map(color => (
                          <span
                            key={color}
                            title={color}
                            className={`w-4 h-4 rounded-full border ${dark ? 'border-neutral-600' : 'border-gray-300'}`}
                            style={{ backgroundColor: color.toLowerCase().replace(/ /g, '') === 'white' ? '#f5f5f5' : color.toLowerCase().split('/')[0].split('&')[0].trim().replace(/ /g, '') }}
                          />
                        ))}
                      </div>
                      <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        Sizes: {product.sizes.join(', ')}
                      </span>
                    </div>
                    {product.status !== 'out-of-stock' && (
                      <button
                        onClick={(e) => quickAddToCart(e, product)}
                        className={`mt-4 self-start inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                          dark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-brand-900 text-white hover:bg-brand-800'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </NavLink>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
              dark={dark}
            />
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <aside className={`absolute inset-y-0 right-0 w-80 max-w-[85vw] shadow-2xl overflow-y-auto ${
            dark ? 'bg-brand-950' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between h-16 px-4 border-b sticky top-0 ${
              dark ? 'border-neutral-800/60 bg-brand-950' : 'border-gray-200 bg-white'
            }`}>
              <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar mobile />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};