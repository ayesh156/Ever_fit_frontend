import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../lib/utils';
import { get, patch } from '../lib/api';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Plus, Eye, Edit, Trash2,
  CheckCircle, List, SortAsc, SortDesc, LayoutGrid,
  User, XCircle, CircleDollarSign,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, X, Barcode, Package,
  CreditCard, Phone, Mail, Filter, Calendar,
  Printer, MessageCircle, History, Send, Download,
} from 'lucide-react';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { ThermalReceipt } from '../components/ThermalReceipt';
import { SearchableComboBox } from '../components/ui/SearchableComboBox';
import { ReceiptPrint } from '../components/ReceiptPrint';

type ViewMode = 'grid' | 'table';

interface InvoiceItem {
  productId: string; productName: string; sku: string; barcode?: string; variantId?: number;
  size: string; color: string; quantity: number; unitPrice: number; discount: number; total: number;
}
interface InvoicePayment { id: string; invoiceId: string; amount: number; paymentDate: string; paymentMethod: string; notes?: string; }
interface InvoiceReminder { id: string; invoiceId: string; type: string; channel: string; sentAt: string; message: string; customerPhone: string; customerName: string; }
interface Customer { id: string; name: string; phone: string; email: string; address: string; city: string; customerType: string; totalPurchases: number; totalSpent: number; outstandingBalance: number; loyaltyPoints: number; status: string; image?: string; notes?: string; joinedDate: string; lastPurchaseDate?: string; }
interface Invoice {
  id: string; invoiceNumber: string; customerName: string; customerPhone: string; customerEmail?: string;
  items: InvoiceItem[]; subtotal: number; discount: number; tax: number; total: number; paidAmount: number;
  dueDate: string; paymentMethod: string; paymentReceiptUrl?: string; status: string; rawStatus: string;
  payments: InvoicePayment[]; notes?: string; createdAt: string;
  reminders?: InvoiceReminder[]; reminderCount?: number;
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
              const d = day.toString().padStart(2, '0');
              onChange(`${viewDate.year}-${m}-${d}`);
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

export const Invoices: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();

  // Data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stable mapOrder — defined once with useCallback so socket handlers never go stale
  const mapOrder = useCallback((o: any): Invoice => ({
    id: `order-${o.id}`,
    invoiceNumber: `ORD-${String(o.id).padStart(4, '0')}`,
    customerName: o.customerName || 'Walk-in Customer',
    customerPhone: o.customerPhone || '-',
    customerEmail: undefined,
    items: (o.items || []).map((item: any) => ({
      productId: String(item.variant?.product?.id || item.variantId),
      productName: item.variant?.product?.name || `Product #${item.variantId}`,
      sku: item.variant?.sku || '',
      barcode: item.variant?.barcode || '',
      size: item.variant?.size || 'FREE',
      color: item.variant?.color || 'Default',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: item.price,
    })),
    subtotal: o.subtotal || o.totalAmount,
    discount: o.discount || 0,
    tax: 0,
    total: o.totalAmount,
    paidAmount: o.paidAmount,
    dueDate: o.dueDate ? new Date(o.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentMethod: o.paymentMethod || 'cash',
    status: o.status === 'PAID' ? 'paid'
      : o.status === 'PAYMENT_VERIFIED' ? 'payment-verified'
      : o.status === 'PENDING_RECEIPT' || o.status === 'PAYMENT_REVIEW' ? 'pending-receipt'
      : o.status === 'CANCELLED' ? 'cancelled'
      : o.status === 'PROCESSING' ? 'processing'
      : o.status === 'SHIPPED' ? 'shipped'
      : o.status === 'DELIVERED' ? 'delivered'
      : o.status === 'PENDING' ? 'pending'
      : o.paidAmount > 0 ? 'partial' : 'pending',
    payments: (o.payments || []).map((p: any) => ({
      id: `pay-${p.id}`,
      invoiceId: `order-${o.id}`,
      amount: p.amount,
      paymentDate: p.createdAt,
      paymentMethod: p.method,
    })),
    notes: o.notes || undefined,
    reminders: [],
    reminderCount: 0,
    createdAt: o.createdAt,
    paymentReceiptUrl: o.paymentReceiptUrl,
    rawStatus: o.status,
  }), []);

  // Stable refetch function — can be called after createOrder to force a reload
  const fetchOrders = useCallback(async () => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders`;
    console.log('[Invoices] Fetching from URL:', url);
    try {
      setIsLoadingInvoices(true);
      setFetchError(false);
      const data = await get<any[]>('/orders');
      console.log('[Invoices] Fetched Orders Data:', data);
      console.log('[Invoices] Order count from API:', Array.isArray(data) ? data.length : 'not an array — got:', typeof data, data);
      setInvoices(Array.isArray(data) ? data.map(mapOrder) : []);
    } catch (err) {
      console.error('[Invoices] Failed to fetch:', err);
      setFetchError(true);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [mapOrder]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket.io for real-time updates
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:5000';
    const socket = io(apiBase);

    socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
    socket.on('connect_error', (e) => console.warn('[Socket] Connect error:', e.message));

    socket.on('newOrder', (order: any) => {
      console.log('[Socket] newOrder received:', order?.id);
      setInvoices(prev => {
        // Avoid duplicates if the order was already added optimistically
        const exists = prev.some(inv => inv.id === `order-${order.id}`);
        if (exists) return prev.map(inv => inv.id === `order-${order.id}` ? mapOrder(order) : inv);
        return [mapOrder(order), ...prev];
      });
      toast.success(`New order ORD-${String(order.id).padStart(4, '0')}`);
    });

    socket.on('orderUpdated', (updatedOrder: any) => {
      console.log('[Socket] orderUpdated received:', updatedOrder?.id);
      setInvoices(prev => prev.map(inv =>
        inv.id === `order-${updatedOrder.id}` ? mapOrder(updatedOrder) : inv
      ));
    });

    return () => { socket.disconnect(); };
  }, [mapOrder]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const startCalRef = useRef<HTMLDivElement>(null);
  const endCalRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Print & Reminder state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [showReminderHistory, setShowReminderHistory] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Edit form state
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<Invoice['paymentMethod']>('cash');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('pending');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [showEditDueCal, setShowEditDueCal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [downloadOrderId, setDownloadOrderId] = useState('');
  const [editCustomerSearch, setEditCustomerSearch] = useState('');
  const [showEditCustomerDropdown, setShowEditCustomerDropdown] = useState(false);
  const [editSelectedCustomer, setEditSelectedCustomer] = useState<Customer | null>(null);
  const editCustomerDropdownRef = useRef<HTMLDivElement>(null);

  // Items per page options
  const gridPerPageOptions = [6, 9, 12, 18];
  const tablePerPageOptions = [5, 10, 20, 50];

  useEffect(() => {
    setItemsPerPage(viewMode === 'table' ? 10 : 9);
  }, [viewMode]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (startCalRef.current && !startCalRef.current.contains(e.target as Node)) setShowStartCal(false);
      if (endCalRef.current && !endCalRef.current.contains(e.target as Node)) setShowEndCal(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeFilterCount = [dateFrom, dateTo, priceMin, priceMax].filter(Boolean).length + (statusFilter !== 'all' ? 1 : 0);

  const filteredEditCustomers = useMemo(() => {
    return [] as Customer[];
  }, []);

  // Click outside to close edit customer dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showEditCustomerDropdown && editCustomerDropdownRef.current && !editCustomerDropdownRef.current.contains(e.target as Node)) {
        setShowEditCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEditCustomerDropdown]);

  const selectEditCustomer = (customer: Customer | null) => {
    setEditSelectedCustomer(customer);
    if (customer) {
      setEditCustomerName(customer.name);
      setEditCustomerPhone(customer.phone);
      setEditCustomerSearch('');
    }
    setShowEditCustomerDropdown(false);
  };

  // Filter
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q) || inv.customerPhone.includes(q);
        const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
        const matchDateFrom = !dateFrom || new Date(inv.createdAt) >= new Date(dateFrom);
        const matchDateTo = !dateTo || new Date(inv.createdAt) <= new Date(dateTo + 'T23:59:59');
        const matchPriceMin = !priceMin || inv.total >= parseFloat(priceMin);
        const matchPriceMax = !priceMax || inv.total <= parseFloat(priceMax);
        return matchSearch && matchStatus && matchDateFrom && matchDateTo && matchPriceMin && matchPriceMax;
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? da - db : db - da;
      });
  }, [invoices, searchQuery, statusFilter, sortOrder, dateFrom, dateTo, priceMin, priceMax]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, viewMode, itemsPerPage, dateFrom, dateTo, priceMin, priceMax]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const partialAmt = invoices.filter(i => i.status === 'partial').reduce((s, i) => s + (i.paidAmount || 0), 0);
    const pendingAmt = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0);
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    const partialCount = invoices.filter(i => i.status === 'partial').length;
    const pendingCount = invoices.filter(i => i.status === 'pending').length;
    return { total, paidTotal, partialAmt, pendingAmt, paidCount, partialCount, pendingCount };
  }, [invoices]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo || priceMin || priceMax;

  // Handlers
  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditCustomerName(invoice.customerName);
    setEditCustomerPhone(invoice.customerPhone);
    setEditPaymentMethod(invoice.paymentMethod);
    setEditPaidAmount(invoice.paidAmount.toString());
    setEditDueDate(invoice.dueDate);
    // Use rawStatus so the combobox shows the real backend value (e.g. PAYMENT_VERIFIED, not 'payment-verified')
    setEditStatus(invoice.rawStatus || 'PENDING');
    setEditNotes(invoice.notes || '');
    setEditItems([...invoice.items]);
    setShowEditModal(true);
    setEditSelectedCustomer(null);
    setEditCustomerSearch('');
  };

  const handleSaveEdit = async () => {
    if (!selectedInvoice || isSaving) return;
    const numericId = selectedInvoice.id.replace('order-', '');

    // Use stored total as fallback in case items array is empty (e.g. older orders with no items loaded)
    const subtotal = editItems.length > 0
      ? editItems.reduce((s, i) => s + i.total, 0)
      : selectedInvoice.total;

    // When admin sets PAYMENT_VERIFIED, auto-set paidAmount = total
    const isVerified = editStatus === 'PAYMENT_VERIFIED';
    const paid = isVerified ? subtotal : Math.min(parseFloat(editPaidAmount) || 0, subtotal);

    setIsSaving(true);
    try {
      const updated = await patch<any>(`/orders/${numericId}`, {
        status:        editStatus,
        paidAmount:    paid,
        customerName:  editCustomerName,
        customerPhone: editCustomerPhone,
        paymentMethod: editPaymentMethod,
        dueDate:       editDueDate,
        notes:         editNotes || null,
      });

      // Re-map directly from the API response — single source of truth
      setInvoices(prev => prev.map(inv =>
        inv.id === selectedInvoice.id ? mapOrder(updated) : inv
      ));
      setShowEditModal(false);
      setSelectedInvoice(null);
      toast.success('Invoice updated', { description: `${selectedInvoice.invoiceNumber} saved` });
    } catch (err) {
      console.error('[handleSaveEdit] error:', err);
      toast.error('Failed to save changes', {
        description: err instanceof Error ? err.message : 'Server error — check backend logs',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInvoice = () => {
    if (!selectedInvoice) return;
    setInvoices(prev => prev.filter(i => i.id !== selectedInvoice.id));
    toast.success('Invoice deleted', { description: `${selectedInvoice.invoiceNumber} deleted` });
    setSelectedInvoice(null);
    if (showDetailDrawer) setShowDetailDrawer(false);
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const numericId = invoiceId.replace('order-', '');
      await patch<any>(`/orders/${numericId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDownload = async (orderId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/orders/${orderId}/download-receipt`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Derive file extension from content-type
      const contentType = response.headers.get('content-type') || '';
      const ext = contentType.includes('pdf') ? '.pdf' : contentType.includes('png') ? '.png' : '.jpg';
      a.download = `Receipt-${orderId}${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download Error:", e);
      toast.error("Failed to download receipt");
    }
  };

  const openDetailDrawer = (invoice: Invoice) => { setSelectedInvoice(invoice); setShowDetailDrawer(true); };
  const clearAllFilters = () => { setSearchQuery(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPriceMin(''); setPriceMax(''); };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':             return dark ? 'bg-green-500/10 text-green-400 border-green-500/20'   : 'bg-green-50 text-green-600 border-green-200';
      case 'payment-verified': return dark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'     : 'bg-blue-50 text-blue-600 border-blue-200';
      case 'partial':          return dark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'  : 'bg-amber-50 text-amber-600 border-amber-200';
      case 'pending':          return dark ? 'bg-red-500/10 text-red-400 border-red-500/20'        : 'bg-red-50 text-red-600 border-red-200';
      case 'pending-receipt':  return dark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200';
      case 'processing':       return dark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'     : 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'shipped':          return dark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'delivered':        return dark ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'     : 'bg-teal-50 text-teal-600 border-teal-200';
      case 'cancelled':        return dark ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' : 'bg-gray-50 text-gray-500 border-gray-200';
      default:                 return dark ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' : 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':             return <CheckCircle className="w-3.5 h-3.5" />;
      case 'payment-verified': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'partial':          return <CircleDollarSign className="w-3.5 h-3.5" />;
      case 'pending':          return <Clock className="w-3.5 h-3.5" />;
      case 'pending-receipt':  return <Clock className="w-3.5 h-3.5" />;
      case 'processing':       return <Package className="w-3.5 h-3.5" />;
      case 'cancelled':        return <XCircle className="w-3.5 h-3.5" />;
      default:                 return null;
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':             return 'Paid';
      case 'payment-verified': return 'Payment Verified';
      case 'partial':          return 'Partial';
      case 'pending':          return 'Pending';
      case 'pending-receipt':  return 'Pending Receipt';
      case 'processing':       return 'Processing';
      case 'shipped':          return 'Shipped';
      case 'delivered':        return 'Delivered';
      case 'cancelled':        return 'Cancelled';
      default:                 return status;
    }
  };
  const isOverdue = (inv: Invoice) => new Date(inv.dueDate) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled';
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const updateEditItemQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty, total: qty * item.unitPrice - item.discount * qty } : item));
  };
  const removeEditItem = (idx: number) => setEditItems(prev => prev.filter((_, i) => i !== idx));

  // ─── Print helpers ───
  const openPrintPreview = (inv: Invoice) => {
    setPrintInvoice(inv);
    setShowPrintPreview(true);
  };

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  const buildReceiptHTML = useCallback(() => {
    if (!receiptRef.current) return '';
    // Get receipt HTML but strip @media print styles that hide body content
    // (those styles are designed for same-page print, not iframe/popup)
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

    // Always use iframe — reliable on both desktop & mobile
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

  // ─── WhatsApp Reminder helpers ───
  const formatPhoneForWhatsApp = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '94' + cleaned.substring(1);
    else if (!cleaned.startsWith('94')) cleaned = '94' + cleaned;
    return cleaned;
  };

  const sendWhatsAppReminder = (inv: Invoice, type: 'payment' | 'overdue') => {
    const balanceDue = inv.total - inv.paidAmount;
    if (balanceDue <= 0) { toast.error('No outstanding balance'); return; }
    if (!inv.customerPhone || inv.customerPhone === '-') { toast.error('No customer phone number'); return; }

    const message = type === 'overdue'
      ? `Dear ${inv.customerName},\n\n⚠️ OVERDUE PAYMENT REMINDER\n\nYour invoice *${inv.invoiceNumber}* has an outstanding balance of *${formatCurrency(balanceDue)}* which is now overdue.\n\nPlease settle this amount at your earliest convenience.\n\nThank you,\n*Reliance Clothing*\nMakandura, Matara\n071 135 0123`
      : `Dear ${inv.customerName},\n\n💰 PAYMENT REMINDER\n\nThis is a friendly reminder regarding your invoice *${inv.invoiceNumber}* with an outstanding balance of *${formatCurrency(balanceDue)}*.\n\nDue Date: ${fmtDate(inv.dueDate)}\nTotal: ${formatCurrency(inv.total)}\nPaid: ${formatCurrency(inv.paidAmount)}\nBalance: ${formatCurrency(balanceDue)}\n\nPlease arrange payment at your convenience.\n\nThank you,\n*Reliance Clothing*\nMakandura, Matara\n071 135 0123`;

    const newReminder: InvoiceReminder = {
      id: `ir-${Date.now()}`,
      invoiceId: inv.id,
      type,
      channel: 'whatsapp',
      sentAt: new Date().toISOString(),
      message,
      customerPhone: inv.customerPhone,
      customerName: inv.customerName,
    };

    setInvoices(prev => prev.map(i => i.id === inv.id ? {
      ...i,
      reminders: [...(i.reminders || []), newReminder],
      reminderCount: (i.reminderCount || 0) + 1,
    } : i));

    // Update selectedInvoice if open
    if (selectedInvoice?.id === inv.id) {
      setSelectedInvoice(prev => prev ? {
        ...prev,
        reminders: [...(prev.reminders || []), newReminder],
        reminderCount: (prev.reminderCount || 0) + 1,
      } : prev);
    }

    const phone = formatPhoneForWhatsApp(inv.customerPhone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    const count = (inv.reminderCount || 0) + 1;
    toast.success(`Reminder #${count} sent via WhatsApp`, {
      description: `${type === 'overdue' ? '⚠️ Overdue' : '💰 Payment'} reminder to ${inv.customerName}`,
    });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...'); pages.push(totalPages); }
    else if (currentPage >= totalPages - 2) { pages.push(1); pages.push('...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1); pages.push('...'); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  const perPageOptions = viewMode === 'table' ? tablePerPageOptions : gridPerPageOptions;

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Invoices</h1>
          <p className={`mt-0.5 text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Manage and track all your invoices</p>
        </div>
        <button onClick={() => navigate('/system/invoices/create')} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg transition-all ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
          <Plus className="w-5 h-5" /><span>Create Invoice</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total', value: stats.total.toString(), icon: FileText, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', sub: `${filteredInvoices.length} shown` },
          { label: 'Paid Revenue', value: formatCurrency(stats.paidTotal), icon: CheckCircle, colorClass: 'text-green-400', bgClass: 'bg-green-500/10', sub: `${stats.paidCount} invoices` },
          { label: 'Partial', value: formatCurrency(stats.partialAmt), icon: CircleDollarSign, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', sub: `${stats.partialCount} invoices` },
          { label: 'Pending', value: formatCurrency(stats.pendingAmt), icon: XCircle, colorClass: 'text-red-400', bgClass: 'bg-red-500/10', sub: `${stats.pendingCount} invoices` },
        ].map((stat, i) => (
          <div key={i} className={`p-3 sm:p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${stat.bgClass}`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.colorClass}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm sm:text-lg font-bold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                <p className={`text-[10px] sm:text-xs truncate ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Controls */}
      <div className={`p-3 sm:p-4 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-gray-50 border-gray-200'}`}>
            <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <input type="text" placeholder="Search by invoice no., customer, phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`bg-transparent border-none outline-none flex-1 min-w-0 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              showFilters || activeFilterCount > 0 ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900' : dark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
            }`}>
              <Filter className="w-3.5 h-3.5" /> Filters
              {activeFilterCount > 0 && <span className={`ml-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${dark ? 'bg-black/20 text-black' : 'bg-white/30 text-white'}`}>{activeFilterCount}</span>}
            </button>
            <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className={`p-2 rounded-xl border transition-colors ${dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
            <div className={`flex items-center rounded-xl overflow-hidden border ${dark ? 'border-neutral-700' : 'border-gray-200'}`}>
              <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('table')} className={`p-2 transition-colors ${viewMode === 'table' ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><List className="w-4 h-4" /></button>
            </div>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs ${dark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className={`mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm appearance-none ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                <option value="all">All Status</option>
                <option value="paid">Paid</option><option value="partial">Partial</option><option value="pending">Pending</option><option value="pending-receipt">Pending Receipt</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="relative" ref={startCalRef}>
              <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Date From</label>
              <button onClick={() => { setShowStartCal(!showStartCal); setShowEndCal(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'} ${dateFrom ? dark ? 'text-white' : 'text-gray-900' : dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {dateFrom ? fmtDate(dateFrom) : 'Select date'}
                {dateFrom && <X className="w-3 h-3 ml-auto hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateFrom(''); }} />}
              </button>
              {showStartCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateFrom} onChange={setDateFrom} onClose={() => setShowStartCal(false)} /></div>}
            </div>
            <div className="relative" ref={endCalRef}>
              <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Date To</label>
              <button onClick={() => { setShowEndCal(!showEndCal); setShowStartCal(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'} ${dateTo ? dark ? 'text-white' : 'text-gray-900' : dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {dateTo ? fmtDate(dateTo) : 'Select date'}
                {dateTo && <X className="w-3 h-3 ml-auto hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateTo(''); }} />}
              </button>
              {showEndCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateTo} onChange={setDateTo} onClose={() => setShowEndCal(false)} /></div>}
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Price Range (LKR)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} className={`w-full px-2.5 py-2 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>—</span>
                <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} className={`w-full px-2.5 py-2 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoadingInvoices ? (
        <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <span className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-3 ${dark ? 'border-neutral-600' : 'border-gray-300'}`} />
          <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Loading invoices…</p>
        </div>
      ) : fetchError ? (
        <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <XCircle className={`w-10 h-10 mb-3 ${dark ? 'text-red-500' : 'text-red-400'}`} />
          <p className={`text-sm font-medium mb-3 ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>Failed to load invoices</p>
          <button onClick={fetchOrders} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${dark ? 'bg-white text-black' : 'bg-brand-900 text-white'}`}>
            Retry
          </button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 mb-3 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
          <p className={`text-sm font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>No invoices found</p>
          <button onClick={() => navigate('/system/invoices/create')} className={`mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${dark ? 'bg-white text-black' : 'bg-brand-900 text-white'}`}>
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginatedInvoices.map(inv => (
            <div key={inv.id} className={`group rounded-2xl border overflow-hidden transition-all duration-200 ${
              inv.paidAmount >= inv.total
                ? dark ? 'border-green-500/40 bg-green-500/[0.03]' : 'border-green-300 bg-green-50/60'
                : inv.status === 'pending-receipt' ? dark ? 'bg-purple-900/10 border-purple-700/40' : 'bg-purple-50/60 border-purple-200'
                : dark ? 'bg-neutral-900/50 border-neutral-800/60 hover:border-neutral-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
            }`}>
              <div className={`h-1 ${inv.paidAmount >= inv.total ? 'bg-gradient-to-r from-green-500 to-emerald-400' : inv.status === 'partial' ? 'bg-gradient-to-r from-amber-500 to-orange-400' : inv.status === 'cancelled' ? 'bg-gradient-to-r from-neutral-500 to-neutral-400' : inv.status === 'pending-receipt' ? 'bg-gradient-to-r from-purple-500 to-violet-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`} />
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold cursor-pointer hover:underline ${dark ? 'text-white' : 'text-gray-900'}`}
                      onClick={() => { setSelectedOrder(inv); setIsModalOpen(true); }}
                    >{inv.invoiceNumber}</p>
                    <div className={`flex items-center gap-1.5 mt-1 text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      <User className="w-3 h-3 flex-shrink-0" /><span className="truncate">{inv.customerName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(inv.status)}`}>{getStatusIcon(inv.status)}{getStatusLabel(inv.status)}</span>
                    {isOverdue(inv) && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${dark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>OVERDUE</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${dark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                    <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Created</p>
                    <p className={`text-xs font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{fmtDate(inv.createdAt)}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${dark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                    <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Due</p>
                    <p className={`text-xs font-medium ${isOverdue(inv) ? 'text-red-400' : dark ? 'text-white' : 'text-gray-900'}`}>{fmtDate(inv.dueDate)}</p>
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl ${
                  inv.paidAmount >= inv.total
                    ? dark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                    : inv.status === 'partial'
                    ? dark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
                    : inv.status === 'cancelled'
                    ? dark ? 'bg-neutral-800/50 border border-neutral-700/50' : 'bg-gray-50 border border-gray-200'
                    : dark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>Total</span>
                    <span className={`text-base font-bold ${
                      inv.paidAmount >= inv.total ? 'text-green-500'
                      : inv.status === 'partial' ? 'text-amber-500'
                      : inv.status === 'cancelled' ? dark ? 'text-neutral-400' : 'text-gray-500'
                      : 'text-red-500'
                    }`}>{formatCurrency(inv.total)}</span>
                  </div>
                  {inv.paidAmount >= inv.total && inv.total > 0 ? (
                    <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Fully Paid: {formatCurrency(inv.total)}
                    </p>
                  ) : inv.status !== 'cancelled' ? (
                    <>
                      <div className="flex items-center justify-between text-[10px] mt-1">
                        <span className={dark ? 'text-green-400' : 'text-green-600'}>
                          Paid: {formatCurrency(inv.paidAmount)}
                        </span>
                        {inv.paidAmount < inv.total && (
                          <span className={dark ? 'text-amber-400' : 'text-amber-600'}>Due: {formatCurrency(inv.total - inv.paidAmount)}</span>
                        )}
                      </div>
                      <div className={`h-1 rounded-full mt-1.5 ${dark ? 'bg-neutral-700' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            inv.status === 'partial' ? 'from-amber-400 to-orange-400'
                            : 'from-red-400 to-rose-400'
                          }`}
                          style={{ width: `${Math.min((inv.paidAmount / inv.total) * 100, 100)}%` }}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
                <div className={`flex items-center gap-1.5 mt-2 text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  <Package className="w-3 h-3" /><span>{inv.items.length} item{inv.items.length > 1 ? 's' : ''} &middot; {inv.items.reduce((s, i) => s + i.quantity, 0)} units</span>
                </div>
                {/* Row 1: Primary actions grid — Print + (View Receipt or Remind) */}
                <div className={`grid ${inv.paymentReceiptUrl || (!(inv.paidAmount >= inv.total) && inv.total > 0 && inv.status !== 'cancelled' && inv.customerPhone && inv.customerPhone !== '-') ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-2`}>
                  <button onClick={() => { setSelectedOrder(inv); setIsModalOpen(true); setTimeout(() => window.print(), 300); }} className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all w-full ${dark ? 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    <Printer className="w-3 h-3" /> Print
                  </button>
                  {inv.paymentReceiptUrl ? (
                    <button onClick={() => { setPreviewUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${inv.paymentReceiptUrl}`); setDownloadOrderId(inv.id.replace('order-', '')); setShowReceiptPreview(true); }}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all w-full ${dark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                      <Eye className="w-3 h-3" /> View Receipt
                    </button>
                  ) : !(inv.paidAmount >= inv.total) && inv.total > 0 && inv.status !== 'cancelled' && inv.customerPhone && inv.customerPhone !== '-' ? (
                    <div className="relative">
                      <button onClick={() => sendWhatsAppReminder(inv, isOverdue(inv) ? 'overdue' : 'payment')} className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        <MessageCircle className="w-3 h-3" /> Remind
                      </button>
                      {(inv.reminderCount || 0) > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); setShowReminderHistory(true); }}
                          className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-10"
                          title={`${inv.reminderCount} reminders sent — click to view history`}
                        >
                          {inv.reminderCount}
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
                {/* Row 2: Approve / Reject (for pending receipt orders) */}
                {(inv.status === 'PAYMENT_REVIEW' || inv.status === 'pending-receipt') && (
                  <div className={`flex gap-1.5 mt-2`}>
                    <button onClick={() => handleStatusChange(inv.id, 'PROCESSING')} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}><CheckCircle className="w-3 h-3" /> Approve</button>
                    <button onClick={() => handleStatusChange(inv.id, 'PENDING_RECEIPT')} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}><XCircle className="w-3 h-3" /> Reject</button>
                  </div>
                )}
                {inv.status === 'PROCESSING' && (
                  <div className={`flex gap-1.5 mb-1`}>
                    <button onClick={() => handleStatusChange(inv.id, 'SHIPPED')} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}><Package className="w-3 h-3" /> Mark as Shipped</button>
                  </div>
                )}
                {inv.status === 'SHIPPED' && (
                  <div className={`flex gap-1.5 mb-1`}>
                    <button onClick={() => handleStatusChange(inv.id, 'DELIVERED')} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}><CheckCircle className="w-3 h-3" /> Mark as Delivered</button>
                  </div>
                )}
                <div className={`flex gap-1.5 mt-2 pt-3 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
                  <button onClick={() => openDetailDrawer(inv)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${dark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}><Eye className="w-3.5 h-3.5" /> View</button>
                  <button onClick={() => openEditModal(inv)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${dark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}><Edit className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => { setSelectedInvoice(inv); setShowDeleteModal(true); }} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${dark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className={`hidden sm:block rounded-2xl border overflow-hidden ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={dark ? 'bg-neutral-800/50' : 'bg-gray-50'}>
                  <tr>
                    {['Invoice', 'Customer', 'Date', 'Due Date', 'Total', 'Paid', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? 'divide-neutral-800/50' : 'divide-gray-100'}`}>
                  {paginatedInvoices.map(inv => (
                    <tr key={inv.id} className={`transition-colors ${inv.status === 'pending-receipt' ? dark ? 'bg-purple-900/10' : 'bg-purple-50/60' : ''} ${dark ? 'hover:bg-neutral-800/20' : 'hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{inv.invoiceNumber}</td>
                      <td className="px-4 py-3"><p className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{inv.customerName}</p><p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{inv.customerPhone}</p></td>
                      <td className={`px-4 py-3 text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{fmtDate(inv.createdAt)}</td>
                      <td className={`px-4 py-3 text-xs ${isOverdue(inv) ? 'text-red-400 font-medium' : dark ? 'text-neutral-400' : 'text-gray-500'}`}>{fmtDate(inv.dueDate)}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(inv.total)}</td>
                      <td className={`px-4 py-3 text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{formatCurrency(inv.paidAmount)}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(inv.status)}`}>{getStatusIcon(inv.status)}{getStatusLabel(inv.status)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetailDrawer(inv)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-400'}`}><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(inv)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-400'}`}><Edit className="w-4 h-4" /></button>
                          <button onClick={() => openPrintPreview(inv)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-400'}`} title="Print"><Printer className="w-4 h-4" /></button>
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && inv.customerPhone && inv.customerPhone !== '-' && (
                            <>
                              <button onClick={() => sendWhatsAppReminder(inv, isOverdue(inv) ? 'overdue' : 'payment')} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-green-500/10 text-green-400' : 'hover:bg-green-50 text-green-500'}`} title="WhatsApp Reminder">
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              {(inv.reminderCount || 0) > 0 && (
                                <button
                                  onClick={() => { setSelectedInvoice(inv); setShowReminderHistory(true); }}
                                  className="bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                  title={`${inv.reminderCount} reminders sent — click to view history`}
                                >
                                  {inv.reminderCount}
                                </button>
                              )}
                            </>
                          )}
                          {inv.paymentReceiptUrl && (
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${inv.paymentReceiptUrl}`} target="_blank" rel="noopener noreferrer"
                              className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-blue-500/10 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`} title="View Receipt">
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          {(inv.status === 'PAYMENT_REVIEW' || inv.status === 'pending-receipt') && (
                            <>
                              <button onClick={() => handleStatusChange(inv.id, 'PROCESSING')} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-green-500/10 text-green-400' : 'hover:bg-green-50 text-green-500'}`} title="Approve"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleStatusChange(inv.id, 'PENDING_RECEIPT')} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-500'}`} title="Reject"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                          {inv.status === 'PROCESSING' && (
                            <button onClick={() => handleStatusChange(inv.id, 'SHIPPED')} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-blue-500/10 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`} title="Mark as Shipped"><Package className="w-4 h-4" /></button>
                          )}
                          {inv.status === 'SHIPPED' && (
                            <button onClick={() => handleStatusChange(inv.id, 'DELIVERED')} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-green-500/10 text-green-400' : 'hover:bg-green-50 text-green-500'}`} title="Mark as Delivered"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => { setSelectedInvoice(inv); setShowDeleteModal(true); }} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-400'}`}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile Cards for Table Mode */}
          <div className="sm:hidden space-y-2">
            {paginatedInvoices.map(inv => (
              <div key={inv.id} className={`rounded-xl border p-3 ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div><p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{inv.invoiceNumber}</p><p className={`text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{inv.customerName}</p></div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(inv.status)}`}>{getStatusIcon(inv.status)}{getStatusLabel(inv.status)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                  <div className="flex justify-between"><span className={dark ? 'text-neutral-500' : 'text-gray-400'}>Date</span><span className={dark ? 'text-neutral-300' : 'text-gray-700'}>{fmtDate(inv.createdAt)}</span></div>
                  <div className="flex justify-between"><span className={dark ? 'text-neutral-500' : 'text-gray-400'}>Due</span><span className={isOverdue(inv) ? 'text-red-400' : dark ? 'text-neutral-300' : 'text-gray-700'}>{fmtDate(inv.dueDate)}</span></div>
                  <div className="flex justify-between"><span className={dark ? 'text-neutral-500' : 'text-gray-400'}>Total</span><span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(inv.total)}</span></div>
                  <div className="flex justify-between"><span className={dark ? 'text-neutral-500' : 'text-gray-400'}>Paid</span><span className={dark ? 'text-neutral-300' : 'text-gray-700'}>{formatCurrency(inv.paidAmount)}</span></div>
                </div>
                <div className={`flex gap-1 pt-2 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
                  <button onClick={() => openDetailDrawer(inv)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>View</button>
                  <button onClick={() => openEditModal(inv)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>Edit</button>
                  <button onClick={() => openPrintPreview(inv)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-neutral-800/50 text-neutral-400' : 'bg-gray-50 text-gray-500'}`}>Print</button>
                  <button onClick={() => { setSelectedInvoice(inv); setShowDeleteModal(true); }} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Showing {filteredInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={`p-1.5 rounded-lg disabled:opacity-30 ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronsLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className={`p-1.5 rounded-lg disabled:opacity-30 ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-4 h-4" /></button>
            <span className={`sm:hidden px-2 text-xs font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{currentPage} / {totalPages}</span>
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((pg, i) => typeof pg === 'number' ? (
                <button key={i} onClick={() => setCurrentPage(pg)} className={`w-8 h-8 rounded-lg text-xs font-medium ${currentPage === pg ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-100'}`}>{pg}</button>
              ) : <span key={i} className={`px-1 ${dark ? 'text-neutral-600' : 'text-gray-300'}`}>&hellip;</span>)}
            </div>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className={`p-1.5 rounded-lg disabled:opacity-30 ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={`p-1.5 rounded-lg disabled:opacity-30 ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronsRight className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Show:</span>
            <div className={`flex items-center rounded-lg border overflow-hidden ${dark ? 'border-neutral-700' : 'border-gray-200'}`}>
              {perPageOptions.map(opt => (
                <button key={opt} onClick={() => setItemsPerPage(opt)} className={`px-2.5 py-1 text-xs font-medium transition-all ${itemsPerPage === opt ? dark ? 'bg-white text-black shadow-md' : 'bg-brand-900 text-white shadow-md' : dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-50'}`}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {showDetailDrawer && selectedInvoice && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]" onClick={() => setShowDetailDrawer(false)} />
          <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] z-[91] overflow-y-auto ${dark ? 'bg-neutral-950 border-l border-neutral-800' : 'bg-white border-l border-gray-200 shadow-2xl'}`}>
            <div className={`sticky top-0 z-10 flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <div>
                <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{selectedInvoice.invoiceNumber}</h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border mt-1 ${getStatusStyle(selectedInvoice.status)}`}>{getStatusIcon(selectedInvoice.status)}{getStatusLabel(selectedInvoice.status)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { openEditModal(selectedInvoice); setShowDetailDrawer(false); }} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><Edit className="w-4 h-4" /></button>
                <button onClick={() => setShowDetailDrawer(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-5">
              <div className={`p-4 rounded-xl ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Customer</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><User className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><span className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{selectedInvoice.customerName}</span></div>
                  {selectedInvoice.customerPhone !== '-' && <div className="flex items-center gap-2"><Phone className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><span className={`text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{selectedInvoice.customerPhone}</span></div>}
                  {selectedInvoice.customerEmail && <div className="flex items-center gap-2"><Mail className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><span className={`text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{selectedInvoice.customerEmail}</span></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Created</p>
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedInvoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={`p-3 rounded-xl ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Due Date</p>
                  <p className={`text-sm font-medium ${isOverdue(selectedInvoice) ? 'text-red-400' : dark ? 'text-white' : 'text-gray-900'}`}>{fmtDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Items ({selectedInvoice.items.length})</h3>
                <div className={`rounded-xl border overflow-hidden ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className={`p-3 ${idx > 0 ? `border-t ${dark ? 'border-neutral-800/50' : 'border-gray-100'}` : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{item.productName}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.sku}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.size}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}>{item.color}</span>
                            {item.barcode && <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'}`}><Barcode className="w-2.5 h-2.5" />{item.barcode}</span>}
                          </div>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.total)}</p>
                          <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>x{item.quantity} @ {formatCurrency(item.unitPrice)}</p>
                          {item.discount > 0 && <p className="text-[10px] text-red-400">-{formatCurrency(item.discount)} disc</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-4 rounded-xl ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className={dark ? 'text-neutral-400' : 'text-gray-500'}>Subtotal</span><span className={dark ? 'text-neutral-300' : 'text-gray-700'}>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                  {selectedInvoice.discount > 0 && <div className="flex justify-between text-sm"><span className="text-red-400">Discount</span><span className="text-red-400">-{formatCurrency(selectedInvoice.discount)}</span></div>}
                  <div className={`flex justify-between text-base font-bold pt-2 border-t ${dark ? 'border-neutral-700 text-white' : 'border-gray-200 text-gray-900'}`}><span>Total</span><span>{formatCurrency(selectedInvoice.total)}</span></div>
                  {selectedInvoice.status !== 'paid' && (<><div className="flex justify-between text-sm text-green-500"><span>Paid</span><span>{formatCurrency(selectedInvoice.paidAmount)}</span></div><div className="flex justify-between text-sm font-semibold text-amber-500"><span>Balance Due</span><span>{formatCurrency(selectedInvoice.total - selectedInvoice.paidAmount)}</span></div></>)}
                </div>
              </div>
              {selectedInvoice.payments.length > 0 && (
                <div>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Payment History</h3>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((pay, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-center gap-2"><CreditCard className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><div><p className={`text-xs font-medium capitalize ${dark ? 'text-white' : 'text-gray-900'}`}>{pay.paymentMethod.replace('-', ' ')}</p><p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{fmtDate(pay.paymentDate)}</p></div></div>
                        <span className="text-sm font-semibold text-green-500">{formatCurrency(pay.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedInvoice.notes && (<div className={`p-3 rounded-xl ${dark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}><p className={`text-xs font-medium ${dark ? 'text-amber-400' : 'text-amber-700'}`}>Notes</p><p className={`text-sm mt-1 ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{selectedInvoice.notes}</p></div>)}

              {/* Reminder section */}
              {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && selectedInvoice.customerPhone && selectedInvoice.customerPhone !== '-' && (
                <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>WhatsApp Reminders</h3>
                    {(selectedInvoice.reminderCount || 0) > 0 && (
                      <button onClick={() => setShowReminderHistory(true)} className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-all ${dark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        <History className="w-3 h-3" /> {selectedInvoice.reminderCount} sent
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => sendWhatsAppReminder(selectedInvoice, 'payment')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${dark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}>
                      <Send className="w-3.5 h-3.5" /> Payment Reminder
                    </button>
                    {isOverdue(selectedInvoice) && (
                      <button onClick={() => sendWhatsAppReminder(selectedInvoice, 'overdue')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${dark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}>
                        <Send className="w-3.5 h-3.5" /> Overdue Reminder
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => openPrintPreview(selectedInvoice)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Printer className="w-4 h-4" /> Print</button>
                <button onClick={() => { openEditModal(selectedInvoice); setShowDetailDrawer(false); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Edit className="w-4 h-4" /> Edit</button>
                <button onClick={() => { setShowDeleteModal(true); setShowDetailDrawer(false); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedInvoice && (() => {
        // Null guard — if selectedInvoice disappears mid-render, bail cleanly
        if (!selectedInvoice) return null;
        return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className={`relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'}`}>
            <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <div><h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Edit Invoice</h2><p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{selectedInvoice.invoiceNumber}</p></div>
              <button onClick={() => setShowEditModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 max-h-[80vh] pr-2">
              <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Customer</h3>

                {/* Customer Search / Select */}
                <div className="mb-3" ref={editCustomerDropdownRef}>
                  <label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Search or Select Customer</label>
                  <div className="relative">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${dark ? 'bg-neutral-800/50 border-neutral-700/50 focus-within:border-white/30' : 'bg-white border-gray-200 focus-within:border-gray-400'}`}>
                      <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <input
                        value={editSelectedCustomer ? editSelectedCustomer.name : editCustomerSearch}
                        onChange={e => {
                          if (editSelectedCustomer) {
                            setEditSelectedCustomer(null);
                          }
                          setEditCustomerSearch(e.target.value);
                          setShowEditCustomerDropdown(true);
                        }}
                        onFocus={() => setShowEditCustomerDropdown(true)}
                        placeholder="Search by name, phone, NIC..."
                        className={`bg-transparent border-none outline-none flex-1 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`}
                      />
                      {(editSelectedCustomer || editCustomerSearch) && (
                        <button onClick={() => { selectEditCustomer(null); setEditCustomerSearch(''); setEditCustomerName('Walk-in Customer'); setEditCustomerPhone(''); }} className={`p-0.5 rounded ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-200 text-gray-400'}`}><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>

                    {/* Selected customer badge */}
                    {editSelectedCustomer && (
                      <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl ${dark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${dark ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-700'}`}>{editSelectedCustomer.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${dark ? 'text-green-400' : 'text-green-700'}`}>{editSelectedCustomer.name}</p>
                          <p className={`text-[10px] ${dark ? 'text-green-500/60' : 'text-green-600/60'}`}>{editSelectedCustomer.customerType} · {editSelectedCustomer.phone}</p>
                        </div>
                        <button onClick={() => { selectEditCustomer(null); setEditCustomerSearch(''); setEditCustomerName('Walk-in Customer'); setEditCustomerPhone(''); }} className={`p-1 rounded-lg ${dark ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-green-100 text-green-600'}`}><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}

                    {/* Customer dropdown */}
                    {showEditCustomerDropdown && !editSelectedCustomer && (
                      <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto ${dark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
                        <button onClick={() => { setEditCustomerName('Walk-in Customer'); setEditCustomerPhone(''); setEditSelectedCustomer(null); setEditCustomerSearch(''); setShowEditCustomerDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${dark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}><User className={`w-3.5 h-3.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} /></div>
                          <div><p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>Walk-in Customer</p><p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No customer record</p></div>
                        </button>
                        {filteredEditCustomers.length > 0 && (
                          <div className={`border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
                            <p className={`px-3 py-1 text-[10px] uppercase font-semibold tracking-wider ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>Registered Customers</p>
                            {filteredEditCustomers.slice(0, 8).map(c => (
                              <button key={c.id} onClick={() => selectEditCustomer(c)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${dark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'}`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${dark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'}`}>{c.name.charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{c.name}</p>
                                  <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{c.phone} · {c.customerType}</p>
                                </div>
                                {c.outstandingBalance > 0 && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${dark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>{formatCurrency(c.outstandingBalance)} due</span>}
                              </button>
                            ))}
                          </div>
                        )}
                        {filteredEditCustomers.length === 0 && editCustomerSearch.trim() && (
                          <div className={`px-3 py-3 text-center text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No customers found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Name</label><input value={editCustomerName} onChange={e => setEditCustomerName(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`} /></div>
                  <div><label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Phone</label><input value={editCustomerPhone} onChange={e => setEditCustomerPhone(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`} /></div>
                </div>
              </div>
              <div className={`rounded-xl border overflow-hidden ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
                <div className={`px-4 py-3 ${dark ? 'bg-neutral-800/30' : 'bg-gray-50'}`}><h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Items ({editItems.length})</h3></div>
                <div className={`divide-y ${dark ? 'divide-neutral-800/50' : 'divide-gray-100'}`}>
                  {editItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1"><p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{item.productName}</p><p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{item.sku} &middot; {item.size} &middot; {item.color}</p></div>
                      <div className={`flex items-center rounded-lg border ${dark ? 'border-neutral-700' : 'border-gray-200'}`}>
                        <button onClick={() => updateEditItemQty(idx, item.quantity - 1)} className={`px-2 py-1 text-sm ${dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-100'} rounded-l-lg`}>-</button>
                        <span className={`px-2 py-1 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{item.quantity}</span>
                        <button onClick={() => updateEditItemQty(idx, item.quantity + 1)} className={`px-2 py-1 text-sm ${dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-100'} rounded-r-lg`}>+</button>
                      </div>
                      <span className={`text-sm font-medium w-20 text-right ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.total)}</span>
                      <button onClick={() => removeEditItem(idx)} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                <div className={`px-4 py-3 flex justify-between text-sm font-bold ${dark ? 'bg-neutral-800/30 text-white' : 'bg-gray-50 text-gray-900'}`}><span>Total</span><span>{formatCurrency(editItems.reduce((s, i) => s + i.total, 0))}</span></div>
              </div>
              <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Payment</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {([['cash', 'Cash'], ['card', 'Card'], ['bank-transfer', 'Bank'], ['credit', 'Credit']] as const).map(([val, lbl]) => (
                    <button key={val} onClick={() => setEditPaymentMethod(val)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${editPaymentMethod === val ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900' : dark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{lbl}</button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Paid Amount</label><input type="number" value={editPaidAmount} onChange={e => setEditPaidAmount(e.target.value)} className={`w-full px-3 py-2 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`} /></div>
                  <div className="relative">
                    <label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Due Date</label>
                    <button onClick={() => setShowEditDueCal(!showEditDueCal)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                      <Calendar className="w-4 h-4 flex-shrink-0" />{editDueDate ? fmtDate(editDueDate) : 'Select date'}
                    </button>
                    {showEditDueCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={editDueDate} onChange={(d) => { setEditDueDate(d); setShowEditDueCal(false); }} onClose={() => setShowEditDueCal(false)} /></div>}
                  </div>
                  <div><label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Status</label>
                    <SearchableComboBox
                      dark={dark}
                      value={editStatus}
                      onValueChange={(val) => setEditStatus(val as any)}
                      options={[
                        { value: 'PENDING_RECEIPT', label: 'Pending Receipt' },
                        { value: 'PAYMENT_REVIEW', label: 'Payment Review' },
                        { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
                        { value: 'PROCESSING', label: 'Processing' },
                        { value: 'SHIPPED', label: 'Shipped' },
                        { value: 'DELIVERED', label: 'Delivered' },
                        { value: 'CANCELLED', label: 'Cancelled' },
                      ]}
                    />
                  </div>
                </div>
                {selectedInvoice?.paymentReceiptUrl && (
                  <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl border ${dark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                    <Eye className={`w-4 h-4 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-xs flex-1 ${dark ? 'text-blue-300' : 'text-blue-700'}`}>Receipt uploaded</span>
                    <button onClick={() => { setPreviewUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedInvoice?.paymentReceiptUrl}`); setDownloadOrderId((selectedInvoice?.id || '').replace('order-', '')); setShowReceiptPreview(true); }}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${dark ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                      <Eye className="w-3 h-3 inline mr-1" />View Receipt
                    </button>
                  </div>
                )}
                <div className="mt-3"><label className={`block text-xs font-medium mb-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Notes</label><textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className={`w-full px-3 py-2 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`} /></div>
              </div>
            </div>
            <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <button onClick={() => setShowEditModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (selectedInvoice) openPrintPreview(selectedInvoice); }} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Printer className="w-4 h-4" /> Print</button>
                <button onClick={handleSaveEdit} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
                  {isSaving && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      <DeleteConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteInvoice} title="Delete Invoice" itemName={selectedInvoice?.invoiceNumber} />

      {/* ─── PRINT PREVIEW MODAL ─── */}
      {showPrintPreview && printInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPrintPreview(false)} />
          <div className={`relative w-full max-w-md max-h-[95vh] flex flex-col rounded-2xl overflow-hidden ${dark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200 shadow-2xl'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Printer className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Print Preview</h2>
              </div>
              <button onClick={() => setShowPrintPreview(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-5 h-5" /></button>
            </div>
            {/* Receipt preview */}
            <div className="flex-1 overflow-y-auto p-4" style={{ background: '#f5f5f5' }}>
              <div className="shadow-xl rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '320px' }}>
                <ThermalReceipt ref={receiptRef} invoice={printInvoice as any} />
              </div>
            </div>
            {/* Footer */}
            <div className={`flex items-center justify-between px-4 py-3 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>80mm Thermal Receipt</p>
              <button onClick={handlePrint} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RECEIPT PREVIEW MODAL ─── */}
      {showReceiptPreview && previewUrl && (() => {
        const isPdf = previewUrl.toLowerCase().endsWith('.pdf');
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowReceiptPreview(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => handleDownload(downloadOrderId)}
                  disabled={!downloadOrderId}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${!downloadOrderId ? 'opacity-50 pointer-events-none cursor-default' : ''} ${dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}>
                  <Download className="w-3.5 h-3.5" />
                  Download Receipt
                </button>
                <button onClick={() => setShowReceiptPreview(false)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {isPdf ? (
                <iframe src={previewUrl} className="w-full h-[80vh] rounded-2xl shadow-2xl bg-white" title="Receipt PDF" />
              ) : (
                <img src={previewUrl} alt="Receipt" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-white" />
              )}
            </div>
          </div>
        );
      })()}

      {/* ─── ORDER DETAILS MODAL ─── */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-lg mx-4 max-h-[85vh] flex flex-col rounded-2xl overflow-hidden ${dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-white border border-gray-200 shadow-2xl'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <div>
                <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.invoiceNumber}</h2>
                <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  {selectedOrder.customerName} · {fmtDate(selectedOrder.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}{getStatusLabel(selectedOrder.status)}
                </span>
                <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Customer Info */}
              <div className={`flex items-center gap-3 p-3 rounded-xl ${dark ? 'bg-neutral-900/60' : 'bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${dark ? 'bg-neutral-800' : 'bg-gray-200'}`}>
                  <User className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customerName}</p>
                  <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{selectedOrder.customerPhone}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Items</p>
                <div className={`rounded-xl border overflow-hidden ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-4 py-3 ${idx !== selectedOrder.items.length - 1 ? dark ? 'border-b border-neutral-800/60' : 'border-b border-gray-100' : ''} ${dark ? 'bg-neutral-900/40' : 'bg-white'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{item.productName}</p>
                        <p className={`text-xs mt-0.5 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          {item.size} · {item.color} · SKU: {item.sku || '—'}
                        </p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.total)}</p>
                        <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          x{item.quantity} @ {formatCurrency(item.unitPrice)}
                          {item.discount > 0 && <span className="text-amber-500 ml-1">−{formatCurrency(item.discount * item.quantity)}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className={`rounded-xl border p-4 space-y-2 ${dark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`flex justify-between text-sm ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  <span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className={`flex justify-between text-sm ${dark ? 'text-amber-400' : 'text-amber-600'}`}>
                    <span>Discount</span><span>−{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className={`flex justify-between text-base font-bold pt-2 border-t ${dark ? 'border-neutral-800 text-white' : 'border-gray-200 text-gray-900'}`}>
                  <span>Total</span><span>{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className={`flex justify-between text-sm ${dark ? 'text-green-400' : 'text-green-600'}`}>
                  <span>Paid</span><span>{formatCurrency(selectedOrder.paidAmount)}</span>
                </div>
                {selectedOrder.total - selectedOrder.paidAmount > 0 && (
                  <div className={`flex justify-between text-sm font-semibold ${dark ? 'text-red-400' : 'text-red-600'}`}>
                    <span>Balance Due</span><span>{formatCurrency(selectedOrder.total - selectedOrder.paidAmount)}</span>
                  </div>
                )}
              </div>

              {/* Payment method */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${dark ? 'bg-neutral-900/60' : 'bg-gray-50'}`}>
                <CreditCard className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Payment Method</p>
                  <p className={`text-sm font-medium capitalize ${dark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.paymentMethod.replace('-', ' ')}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className={`px-4 py-3 rounded-xl ${dark ? 'bg-neutral-900/60' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>NOTES</p>
                  <p className={`text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`px-5 py-3 border-t flex gap-2 ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <button
                onClick={() => { setIsModalOpen(false); openPrintPreview(selectedOrder); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => { setIsModalOpen(false); openEditModal(selectedOrder); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}
              >
                <Edit className="w-4 h-4" /> Edit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE RECEIPT (hidden on screen, visible during print) ─── */}
      {(selectedOrder || selectedInvoice) && (
        <ReceiptPrint invoice={(selectedOrder || selectedInvoice) as any} />
      )}

      {/* ─── REMINDER HISTORY MODAL ─── */}
      {showReminderHistory && selectedInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReminderHistory(false)} />
          <div className={`relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden ${dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-white border border-gray-200 shadow-2xl'}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
              <div>
                <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Reminder History</h2>
                <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{selectedInvoice.invoiceNumber} • {selectedInvoice.customerName}</p>
              </div>
              <button onClick={() => setShowReminderHistory(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(selectedInvoice.reminders || []).length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className={`w-10 h-10 mx-auto mb-2 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No reminders sent yet</p>
                </div>
              ) : (
                (selectedInvoice.reminders || []).slice().reverse().map((rem, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        rem.type === 'overdue'
                          ? dark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'
                          : dark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        {rem.type === 'overdue' ? '⚠️ Overdue' : '💰 Payment'}
                      </span>
                      <span className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        {new Date(rem.sentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs whitespace-pre-line ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>{rem.message}</p>
                    <div className={`flex items-center gap-2 mt-2 text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                      <MessageCircle className="w-3 h-3" /> WhatsApp • {rem.customerPhone}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
