import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { get, post, put, del } from '../lib/api';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { SearchableComboBox, type ComboBoxOption } from '../components/ui/SearchableComboBox';
import { ImageUpload } from '../components/ui/ImageUpload';
import {
  Search, Plus, FolderOpen, Edit, Trash2, Eye, Filter, Calendar,
  Grid3X3, List, X, ChevronLeft, ChevronRight, SortAsc, SortDesc,
  ChevronsLeft, ChevronsRight, Save, ShoppingBag, ToggleRight,
  ToggleLeft, ImagePlus, Hash, FileText, Layers, Tag,
} from 'lucide-react';

// ===== API CATEGORY TYPE =====
interface CategoryDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: string;
  createdAt: string;
}

// ===== INLINE CALENDAR COMPONENT =====
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

export const Categories: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ─── State ───
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const startCalRef = useRef<HTMLDivElement>(null);
  const endCalRef = useRef<HTMLDivElement>(null);

  // Click outside to close calendars
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showStartCal && startCalRef.current && !startCalRef.current.contains(e.target as Node)) setShowStartCal(false);
      if (showEndCal && endCalRef.current && !endCalRef.current.contains(e.target as Node)) setShowEndCal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStartCal, showEndCal]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formImage, setFormImage] = useState<string | undefined>();

  // Items per page options
  const gridPerPageOptions = [6, 9, 12, 18];
  const tablePerPageOptions = [5, 10, 20, 50];
  const perPageOptions = viewMode === 'list' ? tablePerPageOptions : gridPerPageOptions;

  useEffect(() => { setItemsPerPage(viewMode === 'list' ? 10 : 9); }, [viewMode]);

  // ─── Fetch categories from API ───
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await get<CategoryDTO[]>('/categories');
      setCategories(data);
    } catch (err: any) {
      console.error('[Categories] Fetch error:', err);
      setError(err.message || 'Failed to fetch categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ─── Derived data ───
  const totalProducts = 0; // We don't have product count per category from API yet
  const activeCount = useMemo(() => categories.filter(c => c.status === 'active').length, [categories]);
  const inactiveCount = useMemo(() => categories.filter(c => c.status === 'inactive').length, [categories]);

  const activeFilterCount = [
    statusFilter !== 'all' ? 1 : 0,
    (dateFrom || dateTo) ? 1 : 0,
  ].reduce((s, v) => s + v, 0);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchDate = (!dateFrom || new Date(c.createdAt) >= new Date(dateFrom)) && (!dateTo || new Date(c.createdAt) <= new Date(dateTo + 'T23:59:59'));
      return matchSearch && matchStatus && matchDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [categories, searchQuery, statusFilter, dateFrom, dateTo, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, dateFrom, dateTo, viewMode, itemsPerPage]);

  // ─── ComboBox options ───
  const statusOptions: ComboBoxOption[] = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', colorDot: '#22c55e' },
    { value: 'inactive', label: 'Inactive', colorDot: '#9ca3af' },
  ];

  // ─── Form helpers ───
  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const resetForm = useCallback(() => {
    setFormName(''); setFormSlug(''); setFormDescription('');
    setFormStatus('active'); setFormImage(undefined);
  }, []);

  const openAddModal = () => { resetForm(); setShowAddModal(true); };

  const openEditModal = (c: CategoryDTO) => {
    setSelectedCategory(c);
    setFormName(c.name); setFormSlug(c.slug); setFormDescription(c.description || '');
    setFormStatus(c.status as 'active' | 'inactive'); setFormImage(c.image || undefined);
    setShowEditModal(true);
  };

  const openViewModal = (c: CategoryDTO) => {
    setSelectedCategory(c);
    setShowViewModal(true);
  };

  const openDeleteModal = (c: CategoryDTO) => {
    setSelectedCategory(c);
    setShowDeleteModal(true);
  };

  const handleSaveCategory = async (isEdit: boolean) => {
    if (!formName.trim()) { toast.error('Category name is required'); return; }
    if (!formSlug.trim()) { toast.error('Category slug is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
        image: formImage || undefined,
      };

      if (isEdit && selectedCategory) {
        await put(`/categories/${selectedCategory.id}`, payload);
        toast.success('Category updated', { description: formName });
        setShowEditModal(false);
      } else {
        await post('/categories', payload);
        toast.success('Category added', { description: formName });
        setShowAddModal(false);
      }
      setSelectedCategory(null);
      await fetchCategories();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Failed to save category';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      await del(`/categories/${selectedCategory.id}`);
      toast.success('Category deleted', { description: selectedCategory.name });
      setShowDeleteModal(false);
      setSelectedCategory(null);
      await fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  // ─── Pagination helper ───
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...'); pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1); pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1); pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...'); pages.push(totalPages);
    }
    return pages;
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || !!dateFrom || !!dateTo;
  const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); };

  // ─── Shared styles ───
  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm transition-all ${
    dark
      ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-white/30'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'
  }`;
  const labelClass = `block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`;

  // ═══════════════════════════════════════
  //  Category Form Modal (Add / Edit)
  // ═══════════════════════════════════════
  const renderCategoryForm = (isEdit: boolean) => {
    const isOpen = isEdit ? showEditModal : showAddModal;
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} />
        <div className={`relative w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
          dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{isEdit ? 'Edit Category' : 'Add Category'}</h2>
            <button onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {/* Image Upload */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <ImagePlus className="w-4 h-4" /> Category Image
              </h3>
              <ImageUpload value={formImage} onChange={setFormImage} dark={dark} />
            </div>

            {/* Details */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <FileText className="w-4 h-4" /> Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Category Name *</label>
                  <input
                    value={formName}
                    onChange={e => {
                      setFormName(e.target.value);
                      if (!isEdit || formSlug === autoSlug(selectedCategory?.name || '')) {
                        setFormSlug(autoSlug(e.target.value));
                      }
                    }}
                    placeholder="e.g., Men's Wear"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Slug *</label>
                  <div className="relative">
                    <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                    <input
                      value={formSlug}
                      onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="auto-generated-slug"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Brief description of this category..."
                    rows={3}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFormStatus('active')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        formStatus === 'active'
                          ? dark
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-green-50 border-green-200 text-green-700'
                          : dark
                            ? 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <ToggleRight className="w-4 h-4" /> Active
                    </button>
                    <button
                      onClick={() => setFormStatus('inactive')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        formStatus === 'inactive'
                          ? dark
                            ? 'bg-neutral-500/10 border-neutral-500/30 text-neutral-300'
                            : 'bg-gray-100 border-gray-300 text-gray-700'
                          : dark
                            ? 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <ToggleLeft className="w-4 h-4" /> Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
              dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>Cancel</button>
            <button
              onClick={() => handleSaveCategory(isEdit)}
              disabled={saving}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
              } disabled:opacity-50`}
            >
              <Save className="w-4 h-4" />{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Category'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  View Category Modal
  // ═══════════════════════════════════════
  const renderViewModal = () => {
    if (!showViewModal || !selectedCategory) return null;
    const c = selectedCategory;
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
        <div className={`relative w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
          dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Category Details</h2>
            <button onClick={() => setShowViewModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {/* Category Image */}
            {c.image ? (
              <div className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0">
                  <img src={c.image} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-40" />
                </div>
                <div className="relative flex items-center justify-center py-8">
                  <img src={c.image} alt={c.name} className="h-44 w-auto object-contain rounded-lg shadow-lg" />
                </div>
              </div>
            ) : (
              <div className={`h-44 flex items-center justify-center rounded-xl ${dark ? 'bg-neutral-800/50' : 'bg-gray-100'}`}>
                <FolderOpen className={`w-16 h-16 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
              </div>
            )}

            {/* Info Cards */}
            <div className={`rounded-xl border overflow-hidden ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              {[
                { label: 'Name', value: c.name, icon: Tag },
                { label: 'Slug', value: c.slug, icon: Hash },
                { label: 'Description', value: c.description || '—', icon: FileText },
                { label: 'Created', value: new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), icon: Calendar },
              ].map((row, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 ${
                  i > 0 ? (dark ? 'border-t border-neutral-800' : 'border-t border-gray-100') : ''
                }`}>
                  <row.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] uppercase font-semibold tracking-wider ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{row.label}</p>
                    <p className={`text-sm mt-0.5 ${dark ? 'text-neutral-200' : 'text-gray-800'}`}>{row.value}</p>
                  </div>
                </div>
              ))}
              {/* Status row */}
              <div className={`flex items-center gap-3 px-4 py-3 ${dark ? 'border-t border-neutral-800' : 'border-t border-gray-100'}`}>
                <Layers className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <p className={`text-[10px] uppercase font-semibold tracking-wider ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Status</p>
                  <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    c.status === 'active'
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {c.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => setShowViewModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
              dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>Close</button>
            <button
              onClick={() => { setShowViewModal(false); openEditModal(c); }}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium ${
                dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
              }`}
            >
              <Edit className="w-4 h-4" /> Edit Category
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════
  return (
    <div className="space-y-6 pb-8">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Categories</h1>
          <p className={`mt-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Organize your clothing collections — {activeCount} active, {inactiveCount} inactive
          </p>
        </div>
        <button
          onClick={openAddModal}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all ${
            dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
          }`}
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total', value: categories.length, icon: FolderOpen, color: dark ? 'text-blue-400' : 'text-blue-600' },
          { label: 'Active', value: activeCount, icon: ToggleRight, color: 'text-green-500' },
          { label: 'Inactive', value: inactiveCount, icon: ToggleLeft, color: dark ? 'text-neutral-400' : 'text-gray-500' },
          { label: 'Products', value: totalProducts, icon: ShoppingBag, color: dark ? 'text-amber-400' : 'text-amber-600' },
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

      {/* ─── Search & Controls ─── */}
      <div className={`rounded-2xl border p-3 sm:p-4 ${
        dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-gray-50 border-gray-200'}`}>
            <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search categories..."
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

            {/* Sort */}
            <button
              onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
              className={`p-2 rounded-xl border transition-colors ${
                dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-50 text-gray-500'
              }`}
              title={`Sort by date: ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
            >
              {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            </button>

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

        {/* ─── Expandable Filters ─── */}
        {showFilters && (
          <div className={`mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
              {/* Status */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Status</label>
                <SearchableComboBox
                  options={statusOptions}
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v || 'all')}
                  placeholder="All Status"
                  searchPlaceholder="Search..."
                  dark={dark}
                />
              </div>

              {/* Date From */}
              <div className="relative" ref={startCalRef}>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Date From</label>
                <button
                  onClick={() => { setShowStartCal(!showStartCal); setShowEndCal(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${
                    dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'
                  } ${dateFrom ? dark ? 'text-white' : 'text-gray-900' : dark ? 'text-neutral-500' : 'text-gray-400'}`}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {dateFrom ? new Date(dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date'}
                  {dateFrom && <X className="w-3 h-3 ml-auto hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateFrom(''); }} />}
                </button>
                {showStartCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateFrom} onChange={setDateFrom} onClose={() => setShowStartCal(false)} /></div>}
              </div>

              {/* Date To */}
              <div className="relative" ref={endCalRef}>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Date To</label>
                <button
                  onClick={() => { setShowEndCal(!showEndCal); setShowStartCal(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${
                    dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'
                  } ${dateTo ? dark ? 'text-white' : 'text-gray-900' : dark ? 'text-neutral-500' : 'text-gray-400'}`}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {dateTo ? new Date(dateTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date'}
                  {dateTo && <X className="w-3 h-3 ml-auto hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateTo(''); }} />}
                </button>
                {showEndCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateTo} onChange={setDateTo} onClose={() => setShowEndCal(false)} /></div>}
              </div>
          </div>
        )}
      </div>

      {/* ─── Results bar ─── */}
      <div className="flex items-center justify-between">
        <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>
          Showing <strong className={dark ? 'text-neutral-300' : 'text-gray-700'}>{paginatedCategories.length}</strong> of{' '}
          <strong className={dark ? 'text-neutral-300' : 'text-gray-700'}>{filteredCategories.length}</strong> categories
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => setItemsPerPage(Number(e.target.value))}
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

      {/* ─── Loading State ─── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className={`animate-spin w-10 h-10 border-2 rounded-full ${dark ? 'border-white/20 border-t-white' : 'border-gray-200 border-t-brand-900'}`} />
        </div>
      ) : error ? (
        <div className={`text-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => { setLoading(true); setError(null); fetchCategories(); }} className="mt-3 px-4 py-2 rounded-xl text-sm font-medium bg-brand-900 text-white">Retry</button>
        </div>
      ) : /* ═══════════ GRID VIEW ═══════════ */
      viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCategories.map(category => (
            <div key={category.id} className={`group rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${
              dark
                ? 'bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 border-neutral-800/60 hover:border-neutral-700'
                : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
            }`}>
              {/* Image / Placeholder */}
              <div
                className={`relative h-36 overflow-hidden cursor-pointer ${dark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}
                onClick={() => openViewModal(category)}
              >
                {category.image ? (
                  <>
                    <img src={category.image} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" />
                    <img src={category.image} alt={category.name} className="relative w-full h-full object-contain p-3" />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FolderOpen className={`w-12 h-12 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm ${
                    category.status === 'active'
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {category.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Hover overlay with View button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button className="p-2.5 rounded-xl bg-white/90 text-black shadow-lg hover:bg-white transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className={`text-base font-semibold truncate cursor-pointer hover:underline ${dark ? 'text-white' : 'text-gray-900'}`}
                      onClick={() => openViewModal(category)}
                    >
                      {category.name}
                    </h3>
                    <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>/{category.slug}</p>
                  </div>
                </div>
                <p className={`text-sm mt-2 line-clamp-2 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{category.description}</p>

                <div className={`flex items-center justify-between mt-4 pt-3 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                      {new Date(category.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => openViewModal(category)}
                      className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                      title="View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(category)}
                      className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-red-500/10 text-neutral-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ═══════════ LIST / TABLE VIEW ═══════════ */
        <div className={`rounded-2xl border overflow-hidden ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className={dark ? 'bg-neutral-800/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Category</th>
                  <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Slug</th>
                  <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-4 sm:px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider hidden sm:table-cell ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Created</th>
                  <th className={`px-4 sm:px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-neutral-800/60' : 'divide-gray-100'}`}>
                {paginatedCategories.map(category => (
                  <tr key={category.id} className={`transition-colors ${dark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}>
                    {/* Category Name + Image */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex-shrink-0 ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FolderOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${dark ? 'text-neutral-600' : 'text-gray-300'}`} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate cursor-pointer hover:underline ${dark ? 'text-white' : 'text-gray-900'}`}
                            onClick={() => openViewModal(category)}
                          >
                            {category.name}
                          </p>
                          <p className={`text-xs truncate max-w-[140px] sm:max-w-[180px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{category.description}</p>
                          {/* Show slug on mobile (hidden column) */}
                          <p className={`text-[10px] mt-0.5 md:hidden ${dark ? 'text-neutral-600' : 'text-gray-300'}`}>/{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    {/* Slug — hidden on mobile */}
                    <td className={`px-4 sm:px-6 py-3 text-sm hidden md:table-cell ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      <code className={`px-1.5 py-0.5 rounded text-xs ${dark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-600'}`}>
                        {category.slug}
                      </code>
                    </td>
                    {/* Status */}
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        category.status === 'active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {category.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Created — hidden on small mobile */}
                    <td className={`px-4 sm:px-6 py-3 text-xs hidden sm:table-cell ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                      {new Date(category.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          onClick={() => openViewModal(category)}
                          className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(category)}
                          className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(category)}
                          className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-red-500/10 text-neutral-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && !error && filteredCategories.length === 0 && (
        <div className={`text-center py-16 rounded-2xl border ${
          dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
        }`}>
          <FolderOpen className={`w-12 h-12 mx-auto mb-3 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
          <p className={`font-medium ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            {hasActiveFilters ? 'No categories match your filters' : 'No categories yet'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`mt-3 text-sm font-medium ${dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${
                currentPage === 1
                  ? 'opacity-30 cursor-not-allowed'
                  : dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all ${
                currentPage === 1
                  ? 'opacity-30 cursor-not-allowed'
                  : dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((page, i) =>
              typeof page === 'string' ? (
                <span key={`dot-${i}`} className={`px-1.5 text-sm ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page
                      ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                      : dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'opacity-30 cursor-not-allowed'
                  : dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all ${
                currentPage === totalPages
                  ? 'opacity-30 cursor-not-allowed'
                  : dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {renderCategoryForm(false)}
      {renderCategoryForm(true)}
      {renderViewModal()}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedCategory(null); }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        itemName={selectedCategory?.name}
      />
    </div>
  );
};