import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  mockCustomers as initialCustomers,
  CUSTOMER_TYPES,
  type Customer,
  type CustomerType,
  type CustomerPayment,
  type CustomerReminder,
} from '../data/mockData';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { SearchableComboBox, type ComboBoxOption } from '../components/ui/SearchableComboBox';
import { ImageUpload } from '../components/ui/ImageUpload';
import {
  Search, Plus, Users, Phone, Mail, MapPin, Edit, Trash2,
  Eye, Filter, Calendar, Grid3X3, List, X, ChevronLeft, ChevronRight,
  SortAsc, SortDesc, ChevronsLeft, ChevronsRight, Save,
  DollarSign, FileText, User, ImagePlus,
  CreditCard, Hash, Banknote, History, MessageSquare, Send, CheckCircle,
  AlertTriangle, ArrowDownLeft, ShoppingBag, Award,
} from 'lucide-react';

// ===== INLINE CALENDAR =====
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

export const Customers: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ─── State ───
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const startCalRef = useRef<HTMLDivElement>(null);
  const endCalRef = useRef<HTMLDivElement>(null);
  const [balanceFilter, setBalanceFilter] = useState('all');

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank-transfer' | 'cheque'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Reminder modal state
  const [showReminderHistory, setShowReminderHistory] = useState(false);
  const [, setSendingReminder] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCustomerType, setFormCustomerType] = useState<CustomerType>('Regular');
  const [formOutstandingBalance, setFormOutstandingBalance] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formImage, setFormImage] = useState<string | undefined>();
  const [formNotes, setFormNotes] = useState('');
  const [formNic, setFormNic] = useState('');
  const [formLoyaltyPoints, setFormLoyaltyPoints] = useState('');

  const gridPerPageOptions = [6, 9, 12, 18];
  const tablePerPageOptions = [5, 10, 20, 50];
  const perPageOptions = viewMode === 'list' ? tablePerPageOptions : gridPerPageOptions;

  useEffect(() => { setItemsPerPage(viewMode === 'list' ? 10 : 6); }, [viewMode]);

  // ─── Derived data ───
  const cities = useMemo(() => [...new Set(customers.map(c => c.city))].sort(), [customers]);

  const activeFilterCount = [
    statusFilter !== 'all' ? 1 : 0,
    typeFilter !== 'all' ? 1 : 0,
    balanceFilter !== 'all' ? 1 : 0,
    (dateFrom || dateTo) ? 1 : 0,
  ].reduce((s, v) => s + v, 0);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.phone.includes(q) || (c.nic && c.nic.includes(q));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchType = typeFilter === 'all' || c.customerType === typeFilter;
      const matchBalance = balanceFilter === 'all' || (balanceFilter === 'outstanding' && c.outstandingBalance > 0) || (balanceFilter === 'clear' && c.outstandingBalance === 0);
      const matchDate = (!dateFrom || new Date(c.joinedDate) >= new Date(dateFrom)) && (!dateTo || new Date(c.joinedDate) <= new Date(dateTo + 'T23:59:59'));
      return matchSearch && matchStatus && matchType && matchBalance && matchDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.joinedDate).getTime();
      const dateB = new Date(b.joinedDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [customers, searchQuery, statusFilter, typeFilter, balanceFilter, dateFrom, dateTo, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, typeFilter, balanceFilter, dateFrom, dateTo, viewMode, itemsPerPage]);

  // ─── Stats ───
  const totalOutstanding = customers.reduce((s, c) => s + c.outstandingBalance, 0);
  const activeCount = customers.filter(c => c.status === 'active').length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);

  // ─── ComboBox options ───
  const typeOptions: ComboBoxOption[] = useMemo(() => [
    { value: 'all', label: 'All Types' },
    ...CUSTOMER_TYPES.map(t => ({
      value: t,
      label: t,
      count: customers.filter(c => c.customerType === t).length,
    })),
  ], [customers]);

  const statusOptions: ComboBoxOption[] = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', colorDot: '#22c55e' },
    { value: 'inactive', label: 'Inactive', colorDot: '#ef4444' },
  ];

  const balanceOptions: ComboBoxOption[] = [
    { value: 'all', label: 'All Balance' },
    { value: 'outstanding', label: 'Has Outstanding', colorDot: '#f59e0b' },
    { value: 'clear', label: 'Cleared', colorDot: '#22c55e' },
  ];

  const formTypeOptions: ComboBoxOption[] = CUSTOMER_TYPES.map(t => ({ value: t, label: t }));

  const formStatusOptions: ComboBoxOption[] = [
    { value: 'active', label: 'Active', colorDot: '#22c55e' },
    { value: 'inactive', label: 'Inactive', colorDot: '#ef4444' },
  ];

  const cityOptions: ComboBoxOption[] = useMemo(() =>
    cities.map(c => ({ value: c, label: c })), [cities]);

  // ─── Form helpers ───
  const resetForm = useCallback(() => {
    setFormName(''); setFormPhone(''); setFormEmail('');
    setFormAddress(''); setFormCity(''); setFormCustomerType('Regular');
    setFormOutstandingBalance(''); setFormStatus('active');
    setFormImage(undefined); setFormNotes(''); setFormNic('');
    setFormLoyaltyPoints('');
  }, []);

  const openAddModal = () => { resetForm(); setShowAddModal(true); };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setFormName(c.name); setFormPhone(c.phone);
    setFormEmail(c.email); setFormAddress(c.address); setFormCity(c.city);
    setFormCustomerType(c.customerType);
    setFormOutstandingBalance(c.outstandingBalance.toString()); setFormStatus(c.status);
    setFormImage(c.image); setFormNotes(c.notes || ''); setFormNic(c.nic || '');
    setFormLoyaltyPoints(c.loyaltyPoints.toString());
    setShowEditModal(true);
  };

  const handleSaveCustomer = (isEdit: boolean) => {
    if (!formName.trim()) { toast.error('Customer name required'); return; }
    if (!formPhone.trim()) { toast.error('Phone number required'); return; }

    if (isEdit && selectedCustomer) {
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? {
        ...c,
        name: formName, phone: formPhone,
        email: formEmail, address: formAddress, city: formCity || 'Unknown',
        customerType: formCustomerType,
        outstandingBalance: parseFloat(formOutstandingBalance) || 0,
        status: formStatus, image: formImage, notes: formNotes || undefined,
        nic: formNic || undefined,
        loyaltyPoints: parseInt(formLoyaltyPoints) || 0,
      } : c));
      setShowEditModal(false);
      toast.success('Customer updated', { description: formName });
    } else {
      const newCustomer: Customer = {
        id: `c-${Date.now()}`,
        name: formName, phone: formPhone,
        email: formEmail, address: formAddress, city: formCity || 'Unknown',
        customerType: formCustomerType,
        totalPurchases: 0, totalSpent: 0,
        outstandingBalance: parseFloat(formOutstandingBalance) || 0,
        loyaltyPoints: parseInt(formLoyaltyPoints) || 0,
        status: formStatus, image: formImage, notes: formNotes || undefined,
        nic: formNic || undefined,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      setCustomers(prev => [newCustomer, ...prev]);
      setShowAddModal(false);
      toast.success('Customer added', { description: formName });
    }
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
    toast.success('Customer removed', { description: selectedCustomer.name });
    setSelectedCustomer(null);
  };

  // ─── Payment helpers ───
  const openPaymentModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > selectedCustomer.outstandingBalance) { toast.error('Amount exceeds outstanding balance'); return; }

    const newPayment: CustomerPayment = {
      id: `cp-${Date.now()}`,
      customerId: selectedCustomer.id,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      reference: paymentReference || undefined,
      notes: paymentNotes || undefined,
    };

    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? {
      ...c,
      outstandingBalance: c.outstandingBalance - amount,
      payments: [...(c.payments || []), newPayment],
    } : c));

    const remaining = selectedCustomer.outstandingBalance - amount;
    setShowPaymentModal(false);
    toast.success(`Payment of ${formatCurrency(amount)} recorded`, {
      description: remaining > 0
        ? `Remaining: ${formatCurrency(remaining)}`
        : `${selectedCustomer.name} — Balance cleared! 🎉`,
    });
    setSelectedCustomer(null);
  };

  const getTotalPaid = (customer: Customer) =>
    (customer.payments || []).reduce((sum, p) => sum + p.amount, 0);

  // ─── Reminder helpers ───
  const formatPhoneForWhatsApp = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '94' + cleaned.substring(1);
    else if (!cleaned.startsWith('94')) cleaned = '94' + cleaned;
    return cleaned;
  };

  const sendWhatsAppReminder = (customer: Customer, type: 'payment' | 'overdue') => {
    if (customer.outstandingBalance <= 0) { toast.error('No outstanding balance'); return; }

    setSendingReminder(customer.id);

    const message = type === 'overdue'
      ? `Dear ${customer.name},\n\n⚠️ OVERDUE PAYMENT REMINDER\n\nYour outstanding balance of *${formatCurrency(customer.outstandingBalance)}* is overdue.\n\nPlease settle this amount urgently.\n\nThank you,\n*Reliance Clothing*`
      : `Dear ${customer.name},\n\n💰 PAYMENT REMINDER\n\nThis is a friendly reminder that you have an outstanding balance of *${formatCurrency(customer.outstandingBalance)}*.\n\nPlease arrange payment at your earliest convenience.\n\nThank you,\n*Reliance Clothing*`;

    const newReminder: CustomerReminder = {
      id: `cr-${Date.now()}`,
      customerId: customer.id,
      type,
      channel: 'whatsapp',
      sentAt: new Date().toISOString(),
      message,
      customerPhone: customer.phone,
      customerName: customer.name,
    };

    setCustomers(prev => prev.map(c => c.id === customer.id ? {
      ...c,
      reminders: [...(c.reminders || []), newReminder],
      reminderCount: (c.reminderCount || 0) + 1,
    } : c));

    const phone = formatPhoneForWhatsApp(customer.phone);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    const count = (customer.reminderCount || 0) + 1;
    toast.success(`Reminder #${count} sent via WhatsApp`, {
      description: `${type === 'overdue' ? '⚠️ Overdue' : '💰 Payment'} reminder to ${customer.name}`,
    });
    setSendingReminder(null);
  };

  // ─── Status badge ───
  const statusBadge = (status: Customer['status']) => (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      status === 'active'
        ? 'bg-green-500/10 text-green-500 border-green-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
    }`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );

  // ─── Customer type badge ───
  const typeBadge = (type: CustomerType) => {
    const colors: Record<CustomerType, string> = {
      'Regular': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'VIP': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Wholesale': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Walk-in': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      'Corporate': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'Online': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      'Referral': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      'Other': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[type]}`}>
        {type}
      </span>
    );
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || balanceFilter !== 'all' || !!dateFrom || !!dateTo;
  const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); setBalanceFilter('all'); setDateFrom(''); setDateTo(''); };

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

  // ─── Shared styles ───
  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm transition-all ${
    dark
      ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-white/30'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'
  }`;
  const labelClass = `block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`;

  // ═══════════════════════════════════════
  //  Customer Form Modal (Add / Edit)
  // ═══════════════════════════════════════
  const renderCustomerForm = (isEdit: boolean) => {
    const isOpen = isEdit ? showEditModal : showAddModal;
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} />
        <div className={`relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
          dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
            <button onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {/* Image Upload */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <ImagePlus className="w-4 h-4" /> Customer Photo
              </h3>
              <ImageUpload value={formImage} onChange={setFormImage} dark={dark} />
            </div>

            {/* Basic Info */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <User className="w-4 h-4" /> Customer Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Customer Name *</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Kamal Gunawardena" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Customer Type</label>
                  <SearchableComboBox
                    options={formTypeOptions}
                    value={formCustomerType}
                    onValueChange={(v) => setFormCustomerType(v as CustomerType)}
                    placeholder="Select type…"
                    searchPlaceholder="Search types…"
                    dark={dark}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <SearchableComboBox
                    options={formStatusOptions}
                    value={formStatus}
                    onValueChange={(v) => setFormStatus(v as 'active' | 'inactive')}
                    placeholder="Select status…"
                    dark={dark}
                  />
                </div>
                <div>
                  <label className={labelClass}>NIC (National ID)</label>
                  <input value={formNic} onChange={e => setFormNic(e.target.value)} placeholder="e.g., 199012345678" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Loyalty Points</label>
                  <input type="number" value={formLoyaltyPoints} onChange={e => setFormLoyaltyPoints(e.target.value)} placeholder="0" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <Phone className="w-4 h-4" /> Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="077-1234567" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@example.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <SearchableComboBox
                    options={cityOptions}
                    value={formCity}
                    onValueChange={setFormCity}
                    placeholder="Select or type city…"
                    searchPlaceholder="Search cities…"
                    dark={dark}
                    allowCustom
                  />
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="Full address" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <CreditCard className="w-4 h-4" /> Financial
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Outstanding Balance (LKR)</label>
                  <input type="number" value={formOutstandingBalance} onChange={e => setFormOutstandingBalance(e.target.value)} placeholder="0.00" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className={`p-4 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                <FileText className="w-4 h-4" /> Additional Notes
              </h3>
              <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Any additional notes about this customer…" rows={3} className={inputClass} />
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
              dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>Cancel</button>
            <button onClick={() => handleSaveCustomer(isEdit)} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium ${
              dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
            }`}>
              <Save className="w-4 h-4" />{isEdit ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  View Customer Modal
  // ═══════════════════════════════════════
  const renderViewModal = () => {
    if (!showViewModal || !selectedCustomer) return null;
    const c = selectedCustomer;
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
        <div className={`relative w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
          dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Customer Details</h2>
            <button onClick={() => setShowViewModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
            {/* Hero section */}
            <div className={`rounded-xl overflow-hidden relative ${dark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
              {c.image ? (
                <div className="h-36 sm:h-44 relative">
                  <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30 pointer-events-none" aria-hidden="true" />
                  <img src={c.image} alt={c.name} className="relative w-full h-full object-contain p-4 z-[1]" />
                </div>
              ) : (
                <div className="h-36 sm:h-44 flex flex-col items-center justify-center gap-2">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold ${dark ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {c.name.charAt(0)}
                  </div>
                </div>
              )}
            </div>

            {/* Name and status */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{c.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {typeBadge(c.customerType)}
                </div>
              </div>
              {statusBadge(c.status)}
            </div>

            {/* Key details grid */}
            <div className="grid grid-cols-2 gap-3">
              {([
                ['City', c.city],
                ['Purchases', c.totalPurchases.toString()],
                ['Total Spent', formatCurrency(c.totalSpent)],
                ['Loyalty Points', c.loyaltyPoints.toString()],
                ['NIC', c.nic || 'N/A'],
                ['Joined', formatDate(c.joinedDate)],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label} className={`p-2.5 rounded-lg ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-[10px] uppercase tracking-wider ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{label}</p>
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{val}</p>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className={`space-y-2 p-3 rounded-xl ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
              <div className={`flex items-center gap-2 text-sm ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
                <Phone className="w-4 h-4 flex-shrink-0" /> {c.phone}
              </div>
              {c.email && (
                <div className={`flex items-center gap-2 text-sm ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
                  <Mail className="w-4 h-4 flex-shrink-0" /> {c.email}
                </div>
              )}
              {c.address && (
                <div className={`flex items-center gap-2 text-sm ${dark ? 'text-neutral-300' : 'text-gray-600'}`}>
                  <MapPin className="w-4 h-4 flex-shrink-0" /> {c.address}
                </div>
              )}
            </div>

            {/* Financial */}
            {c.outstandingBalance > 0 && (
              <div className={`p-3 rounded-xl ${
                dark ? 'bg-amber-950/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${dark ? 'text-amber-400' : 'text-amber-700'}`}>Outstanding Balance</span>
                  <span className={`text-sm font-bold ${dark ? 'text-amber-300' : 'text-amber-800'}`}>{formatCurrency(c.outstandingBalance)}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <button onClick={() => { setShowViewModal(false); openPaymentModal(c); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    dark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}>
                    <Banknote className="w-3 h-3" /> Record Payment
                  </button>
                  <button onClick={() => { setShowViewModal(false); setSelectedCustomer(c); setShowPaymentHistory(true); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    dark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}>
                    <History className="w-3 h-3" /> Payment History
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <button onClick={() => { setShowViewModal(false); sendWhatsAppReminder(c, 'payment'); }} className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      dark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                    }`}>
                      <Send className="w-3 h-3" /> Send Reminder
                    </button>
                    {(c.reminderCount || 0) > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowViewModal(false); setSelectedCustomer(c); setShowReminderHistory(true); }}
                        className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-10"
                        title={`${c.reminderCount} reminders sent — click to view history`}
                      >
                        {c.reminderCount}
                      </button>
                    )}
                  </div>
                  <button onClick={() => { setShowViewModal(false); setSelectedCustomer(c); setShowReminderHistory(true); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    dark ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}>
                    <MessageSquare className="w-3 h-3" /> Reminder History
                  </button>
                </div>
              </div>
            )}

            {/* Reminder history link when balance is cleared */}
            {c.outstandingBalance === 0 && (c.reminderCount || 0) > 0 && (
              <button onClick={() => { setShowViewModal(false); setSelectedCustomer(c); setShowReminderHistory(true); }} className={`w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium ${
                dark ? 'bg-neutral-900/50 border border-neutral-800/60 text-neutral-400 hover:bg-neutral-800' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}>
                <MessageSquare className="w-3.5 h-3.5" /> View {c.reminderCount} Reminders Sent
              </button>
            )}

            {/* Notes */}
            {c.notes && (
              <div className={`p-3 rounded-xl text-sm ${dark ? 'bg-neutral-800/30 text-neutral-400 border border-neutral-800/60' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Notes</p>
                {c.notes}
              </div>
            )}

            {c.lastPurchaseDate && (
              <div className={`text-xs text-center ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>
                Last purchase: {formatDate(c.lastPurchaseDate)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex gap-2 px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => { setShowViewModal(false); openEditModal(c); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium ${
              dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => { setShowViewModal(false); setShowDeleteModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  Record Payment Modal
  // ═══════════════════════════════════════
  const renderPaymentModal = () => {
    if (!showPaymentModal || !selectedCustomer) return null;
    const c = selectedCustomer;
    const totalPaid = getTotalPaid(c);
    const payMethodOptions: ComboBoxOption[] = [
      { value: 'cash', label: 'Cash' },
      { value: 'bank-transfer', label: 'Bank Transfer' },
      { value: 'card', label: 'Card' },
      { value: 'cheque', label: 'Cheque' },
    ];
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
        <div className={`relative w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
          dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${dark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                <ArrowDownLeft className="w-5 h-5 text-green-500" />
              </div>
              <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Record Payment</h2>
            </div>
            <button onClick={() => setShowPaymentModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 sm:px-5 pt-4">
            <div className={`p-3 rounded-xl ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-100 border border-gray-200'}`}>
              <p className={`text-xs font-semibold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{c.name}</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className={`text-[10px] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Total Paid</p>
                  <p className="text-xs font-bold text-green-500">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <p className={`text-[10px] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Outstanding</p>
                  <p className={`text-xs font-bold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>{formatCurrency(c.outstandingBalance)}</p>
                </div>
                <div>
                  <p className={`text-[10px] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Payments</p>
                  <p className={`text-xs font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{(c.payments || []).length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
            <div>
              <label className={labelClass}>Payment Amount (LKR) *</label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Rs.</span>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" max={c.outstandingBalance} className={`${inputClass} pl-10`} autoFocus />
              </div>
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <p className={`text-[10px] mt-1 ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  After payment: {formatCurrency(Math.max(0, c.outstandingBalance - (parseFloat(paymentAmount) || 0)))} remaining
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: 'Full', value: c.outstandingBalance },
                  { label: 'Half', value: Math.round(c.outstandingBalance / 2) },
                  { label: '25%', value: Math.round(c.outstandingBalance * 0.25) },
                ].map(q => (
                  <button key={q.label} onClick={() => setPaymentAmount(q.value.toString())} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    parseFloat(paymentAmount) === q.value
                      ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900'
                      : dark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                    {q.label} ({formatCurrency(q.value)})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Payment Method</label>
              <SearchableComboBox options={payMethodOptions} value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)} placeholder="Select method…" dark={dark} />
            </div>
            <div>
              <label className={labelClass}>Reference / Transaction No.</label>
              <input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="e.g., TXN-12345" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Any notes…" rows={2} className={inputClass} />
            </div>
          </div>

          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => setShowPaymentModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
            <button onClick={handleRecordPayment} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 shadow-lg transition-all">
              <CheckCircle className="w-4 h-4" /> Record Payment
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  Payment History Modal
  // ═══════════════════════════════════════
  const renderPaymentHistoryModal = () => {
    if (!showPaymentHistory || !selectedCustomer) return null;
    const c = selectedCustomer;
    const payments = [...(c.payments || [])].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    const totalPaid = getTotalPaid(c);

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentHistory(false)} />
        <div className={`relative w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
          dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${dark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <History className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Payment History</h2>
                <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{c.name}</p>
              </div>
            </div>
            <button onClick={() => setShowPaymentHistory(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}><X className="w-5 h-5" /></button>
          </div>

          <div className="px-4 sm:px-5 pt-4">
            <div className={`p-3 rounded-xl grid grid-cols-3 gap-3 ${dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-100 border border-gray-200'}`}>
              <div className="text-center">
                <p className={`text-[10px] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Total Paid</p>
                <p className="text-sm font-bold text-green-500">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="text-center">
                <p className={`text-[10px] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Outstanding</p>
                <p className={`text-sm font-bold ${c.outstandingBalance > 0 ? dark ? 'text-amber-400' : 'text-amber-600' : 'text-green-500'}`}>
                  {c.outstandingBalance > 0 ? formatCurrency(c.outstandingBalance) : 'Cleared ✓'}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-[10px] uppercase ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Payments</p>
                <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{payments.length}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
            {payments.length === 0 ? (
              <div className={`text-center py-8 ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>
                <Banknote className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, idx) => (
                  <div key={payment.id} className={`p-3 rounded-xl border transition-all ${dark ? 'bg-neutral-900/50 border-neutral-800/60 hover:border-neutral-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>#{payments.length - idx}</div>
                        <div>
                          <p className="text-sm font-bold text-green-500">{formatCurrency(payment.amount)}</p>
                          <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{formatDate(payment.paymentDate)}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        payment.paymentMethod === 'bank-transfer' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : payment.paymentMethod === 'cash' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : payment.paymentMethod === 'cheque' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {payment.paymentMethod === 'bank-transfer' ? 'Bank Transfer' : payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
                      </span>
                    </div>
                    {(payment.reference || payment.notes) && (
                      <div className={`mt-1.5 pt-1.5 border-t text-[10px] space-y-0.5 ${dark ? 'border-neutral-800 text-neutral-500' : 'border-gray-100 text-gray-400'}`}>
                        {payment.reference && <p>Ref: {payment.reference}</p>}
                        {payment.notes && <p>{payment.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`flex gap-2 px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => setShowPaymentHistory(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Close</button>
            {c.outstandingBalance > 0 && (
              <button onClick={() => { setShowPaymentHistory(false); openPaymentModal(c); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700">
                <Banknote className="w-4 h-4" /> Record Payment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  Reminder History Modal
  // ═══════════════════════════════════════
  const renderReminderHistoryModal = () => {
    if (!showReminderHistory || !selectedCustomer) return null;
    const c = selectedCustomer;
    const reminders = [...(c.reminders || [])].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReminderHistory(false)} />
        <div className={`relative w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden ${
          dark ? 'bg-neutral-950 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`flex items-center justify-between px-4 sm:px-5 py-4 border-b ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${dark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                <MessageSquare className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Reminder History</h2>
                <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{c.name} — {reminders.length} reminders sent</p>
              </div>
            </div>
            <button onClick={() => setShowReminderHistory(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-200 text-gray-500'}`}><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
            {reminders.length === 0 ? (
              <div className={`text-center py-8 ${dark ? 'text-neutral-600' : 'text-gray-400'}`}>
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No reminders sent yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className={`p-3 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          reminder.type === 'overdue' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                        }`}>
                          {reminder.type === 'overdue' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                            {reminder.type === 'overdue' ? 'Overdue Reminder' : 'Payment Reminder'}
                          </p>
                          <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                            {new Date(reminder.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(reminder.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                        WhatsApp
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${dark ? 'bg-neutral-800/50 text-neutral-400' : 'bg-gray-50 text-gray-600'}`} style={{ maxHeight: '100px', overflow: 'hidden' }}>
                      {reminder.message.substring(0, 200)}{reminder.message.length > 200 ? '…' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`flex gap-2 px-4 sm:px-5 py-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <button onClick={() => setShowReminderHistory(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${dark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Close</button>
            {c.outstandingBalance > 0 && (
              <button onClick={() => { setShowReminderHistory(false); sendWhatsAppReminder(c, 'payment'); }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700">
                <Send className="w-4 h-4" /> Send Reminder
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════
  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Customers</h1>
          <p className={`mt-0.5 text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Manage your customers — {filteredCustomers.length} customers
          </p>
        </div>
        <button onClick={openAddModal} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg transition-all ${
          dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'
        }`}>
          <Plus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers', value: customers.length, icon: Users, color: dark ? 'text-blue-400' : 'text-blue-500' },
          { label: 'Active', value: activeCount, icon: User, color: 'text-green-500' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: ShoppingBag, color: dark ? 'text-purple-400' : 'text-purple-500' },
          { label: 'Outstanding', value: formatCurrency(totalOutstanding), icon: DollarSign, color: totalOutstanding > 0 ? 'text-amber-500' : 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl border p-3 sm:p-4 transition-all ${
            dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 sm:p-2.5 rounded-xl ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm sm:text-lg font-bold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                <p className={`text-[10px] sm:text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search + Filters Bar ─── */}
      <div className={`p-3 sm:p-4 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-0 ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-gray-50 border-gray-200'}`}>
            <Search className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <input type="text" placeholder="Search customers, email, phone, city, NIC…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`bg-transparent border-none outline-none flex-1 min-w-0 text-sm ${dark ? 'text-white placeholder-neutral-500' : 'text-gray-900 placeholder-gray-400'}`} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={`p-0.5 rounded ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-200 text-gray-400'}`}><X className="w-3.5 h-3.5" /></button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <SearchableComboBox options={typeOptions} value={typeFilter} onValueChange={(v) => setTypeFilter(v || 'all')} placeholder="Type" searchPlaceholder="Search types…" dark={dark} triggerClassName="min-w-[140px]" />
            <SearchableComboBox options={statusOptions} value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')} placeholder="Status" searchPlaceholder="Search…" dark={dark} triggerClassName="min-w-[120px]" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? dark ? 'bg-white text-black border-white' : 'bg-brand-900 text-white border-brand-900'
                : dark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && <span className={`ml-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${dark ? 'bg-black/20' : 'bg-white/30'}`}>{activeFilterCount}</span>}
            </button>
            <div className={`flex rounded-xl border overflow-hidden ${dark ? 'border-neutral-700' : 'border-gray-200'}`}>
              <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><List className="w-4 h-4" /></button>
            </div>
            <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
              className={`p-2 rounded-xl border transition-colors ${dark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs ${dark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}><X className="w-3 h-3" /> Clear</button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className={`mt-3 pt-3 border-t ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:hidden">
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Customer Type</label>
                <SearchableComboBox options={typeOptions} value={typeFilter} onValueChange={(v) => setTypeFilter(v || 'all')} placeholder="All Types" searchPlaceholder="Search types…" dark={dark} />
              </div>
              <div className="lg:hidden">
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Status</label>
                <SearchableComboBox options={statusOptions} value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')} placeholder="All Status" searchPlaceholder="Search…" dark={dark} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Balance</label>
                <SearchableComboBox options={balanceOptions} value={balanceFilter} onValueChange={(v) => setBalanceFilter(v || 'all')} placeholder="All Balance" dark={dark} />
              </div>
              <div className="relative" ref={startCalRef}>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Joined From</label>
                <button onClick={() => { setShowStartCal(!showStartCal); setShowEndCal(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'} ${dateFrom ? dark ? 'text-white' : 'text-gray-900' : dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {dateFrom ? new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                  {dateFrom && <X className="w-3 h-3 ml-auto hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateFrom(''); }} />}
                </button>
                {showStartCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateFrom} onChange={setDateFrom} onClose={() => setShowStartCal(false)} /></div>}
              </div>
              <div className="relative" ref={endCalRef}>
                <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Joined To</label>
                <button onClick={() => { setShowEndCal(!showEndCal); setShowStartCal(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left ${dark ? 'bg-neutral-800/50 border-neutral-700/50' : 'bg-white border-gray-200'} ${dateTo ? dark ? 'text-white' : 'text-gray-900' : dark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {dateTo ? new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                  {dateTo && <X className="w-3 h-3 ml-auto hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDateTo(''); }} />}
                </button>
                {showEndCal && <div className="absolute top-full left-0 mt-1 z-50"><InlineCalendar dark={dark} value={dateTo} onChange={setDateTo} onClose={() => setShowEndCal(false)} /></div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      {filteredCustomers.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${dark ? 'bg-neutral-900/30 border-neutral-800/60' : 'bg-white border-gray-200'}`}>
          <Users className={`w-12 h-12 mb-3 ${dark ? 'text-neutral-700' : 'text-gray-300'}`} />
          <p className={`text-sm font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>No customers found</p>
          <button onClick={openAddModal} className={`mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${dark ? 'bg-white text-black' : 'bg-brand-900 text-white'}`}>
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ═══ GRID VIEW ═══ */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {paginatedCustomers.map(customer => (
            <div key={customer.id} className={`group rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${
              dark ? 'bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 border-neutral-800/60 hover:border-neutral-700' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
            }`}>
              {/* Image / Avatar header */}
              <div className={`relative h-28 sm:h-32 overflow-hidden ${dark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                {customer.image ? (
                  <>
                    <img src={customer.image} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40 pointer-events-none" aria-hidden="true" />
                    <img src={customer.image} alt={customer.name} className="relative w-full h-full object-contain p-3 z-[1]"
                      onError={(e) => { e.currentTarget.style.display = 'none'; const fb = e.currentTarget.nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex'; }}
                    />
                    <div style={{ display: 'none' }} className="absolute inset-0 flex items-center justify-center z-[1]">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${dark ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-700'}`}>{customer.name.charAt(0)}</div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${dark ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-700'}`}>{customer.name.charAt(0)}</div>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 z-[2]">{statusBadge(customer.status)}</div>
                <div className="absolute top-2.5 left-2.5 z-[2]">{typeBadge(customer.customerType)}</div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm sm:text-base truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</h3>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-3">
                  <div className={`flex items-center gap-2 text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    <Phone className="w-3 h-3 flex-shrink-0" /> {customer.phone}
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{customer.email || '—'}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{customer.city}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className={`flex items-center gap-3 py-2 px-3 rounded-lg text-xs ${dark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-1">
                    <Hash className={`w-3 h-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.totalPurchases}</span>
                    <span className={dark ? 'text-neutral-500' : 'text-gray-400'}>orders</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className={`w-3 h-3 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.loyaltyPoints}</span>
                    <span className={dark ? 'text-neutral-500' : 'text-gray-400'}>pts</span>
                  </div>
                </div>

                {/* Outstanding balance + Payment/Reminder */}
                {customer.outstandingBalance > 0 && (
                  <div className={`mt-2 p-2.5 rounded-lg ${dark ? 'bg-amber-950/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-medium uppercase ${dark ? 'text-amber-400' : 'text-amber-700'}`}>Outstanding</span>
                      <span className={`text-xs font-bold ${dark ? 'text-amber-300' : 'text-amber-800'}`}>{formatCurrency(customer.outstandingBalance)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button onClick={() => openPaymentModal(customer)} className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        <Banknote className="w-3 h-3" /> Pay
                      </button>
                      <button onClick={() => { setSelectedCustomer(customer); setShowPaymentHistory(true); }} className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                        <History className="w-3 h-3" /> History
                      </button>
                      <div className="relative">
                        <button onClick={() => sendWhatsAppReminder(customer, 'payment')} className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${dark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          <Send className="w-3 h-3" /> Remind
                        </button>
                        {(customer.reminderCount || 0) > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setShowReminderHistory(true); }}
                            className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-10"
                            title={`${customer.reminderCount} reminders sent — click to view history`}
                          >
                            {customer.reminderCount}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {customer.outstandingBalance === 0 && (customer.reminderCount || 0) > 0 && (
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => { setSelectedCustomer(customer); setShowReminderHistory(true); }} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${dark ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      <MessageSquare className="w-3 h-3" /> {customer.reminderCount} reminders
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className={`flex items-center gap-1 mt-3 pt-3 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
                  <button onClick={() => { setSelectedCustomer(customer); setShowViewModal(true); }} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${dark ? 'hover:bg-blue-500/10 text-neutral-400 hover:text-blue-400' : 'hover:bg-blue-50 text-gray-500 hover:text-blue-600'}`}><Eye className="w-3.5 h-3.5" /> View</button>
                  <button onClick={() => openEditModal(customer)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${dark ? 'hover:bg-amber-500/10 text-neutral-400 hover:text-amber-400' : 'hover:bg-amber-50 text-gray-500 hover:text-amber-600'}`}><Edit className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true); }} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${dark ? 'hover:bg-red-500/10 text-neutral-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'}`}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ═══ TABLE / LIST VIEW ═══ */
        <>
          <div className={`hidden md:block rounded-2xl border overflow-hidden ${dark ? 'border-neutral-800/60' : 'border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={dark ? 'bg-neutral-900/50' : 'bg-gray-50'}>
                  <tr>
                    {['Customer', 'Type', 'Contact', 'Purchases', 'Spent', 'Balance', 'Status', 'Actions'].map(col => (
                      <th key={col} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? 'divide-neutral-800/60' : 'divide-gray-100'}`}>
                  {paginatedCustomers.map(customer => (
                    <tr key={customer.id} className={`transition-colors ${dark ? 'hover:bg-neutral-900/30' : 'hover:bg-gray-50/80'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border ${dark ? 'border-neutral-700/50 bg-neutral-800' : 'border-gray-200 bg-gray-50'}`}>
                            {customer.image ? (
                              <img src={customer.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
                            ) : null}
                            <span style={{ display: customer.image ? 'none' : 'flex' }} className={`text-xs font-bold ${dark ? 'text-white' : 'text-gray-700'}`}>{customer.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</p>
                            <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{customer.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{typeBadge(customer.customerType)}</td>
                      <td className="px-4 py-3">
                        <p className={`text-xs font-medium ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{customer.phone}</p>
                        <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{customer.email || '—'}</p>
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.totalPurchases}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-4 py-3">
                        {customer.outstandingBalance > 0 ? (
                          <span className={`text-xs font-semibold ${dark ? 'text-amber-400' : 'text-amber-600'}`}>{formatCurrency(customer.outstandingBalance)}</span>
                        ) : (
                          <span className={`text-xs ${dark ? 'text-green-500' : 'text-green-600'}`}>Cleared</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{statusBadge(customer.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedCustomer(customer); setShowViewModal(true); }} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-400'}`} title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(customer)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-gray-100 text-gray-400'}`} title="Edit"><Edit className="w-4 h-4" /></button>
                          {customer.outstandingBalance > 0 && (
                            <>
                              <button onClick={() => openPaymentModal(customer)} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-green-500/10 text-green-400' : 'hover:bg-green-50 text-green-500'}`} title="Record Payment"><Banknote className="w-4 h-4" /></button>
                              <button onClick={() => sendWhatsAppReminder(customer, 'payment')} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-emerald-500/10 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'}`} title="WhatsApp Reminder"><Send className="w-4 h-4" /></button>
                              {(customer.reminderCount || 0) > 0 && (
                                <button onClick={() => { setSelectedCustomer(customer); setShowReminderHistory(true); }}
                                  className="bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                  title={`${customer.reminderCount} reminders sent — click to view history`}>{customer.reminderCount}</button>
                              )}
                            </>
                          )}
                          <button onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true); }} className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-400'}`} title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards for List Mode */}
          <div className="md:hidden space-y-2">
            {paginatedCustomers.map(customer => (
              <div key={customer.id} className={`rounded-xl border p-3 ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-10 h-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center border ${dark ? 'border-neutral-700/50 bg-neutral-800' : 'border-gray-200 bg-gray-50'}`}>
                    {customer.image ? (
                      <img src={customer.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-700'}`}>{customer.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-bold leading-tight truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</p>
                        <p className={`text-[10px] ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{customer.customerType} · {customer.city}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {(customer.reminderCount || 0) > 0 && (
                          <button onClick={() => { setSelectedCustomer(customer); setShowReminderHistory(true); }}
                            className="bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                            title={`${customer.reminderCount} reminders sent`}>{customer.reminderCount}</button>
                        )}
                        {statusBadge(customer.status)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <span className={dark ? 'text-neutral-500' : 'text-gray-400'}>Purchases</span>
                    <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{customer.totalPurchases}</p>
                  </div>
                  <div>
                    <span className={dark ? 'text-neutral-500' : 'text-gray-400'}>Spent</span>
                    <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(customer.totalSpent)}</p>
                  </div>
                  <div>
                    <span className={dark ? 'text-neutral-500' : 'text-gray-400'}>Balance</span>
                    <p className={`font-medium ${customer.outstandingBalance > 0 ? dark ? 'text-amber-400' : 'text-amber-600' : 'text-green-500'}`}>
                      {customer.outstandingBalance > 0 ? formatCurrency(customer.outstandingBalance) : 'Clear'}
                    </p>
                  </div>
                </div>
                <div className={`flex flex-wrap gap-1 pt-2 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`}>
                  <button onClick={() => { setSelectedCustomer(customer); setShowViewModal(true); }} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>View</button>
                  <button onClick={() => openEditModal(customer)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>Edit</button>
                  {customer.outstandingBalance > 0 && (
                    <button onClick={() => openPaymentModal(customer)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>Pay</button>
                  )}
                  {customer.outstandingBalance > 0 && (
                    <div className="relative flex-1">
                      <button onClick={() => sendWhatsAppReminder(customer, 'payment')} className={`w-full py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Remind</button>
                      {(customer.reminderCount || 0) > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setShowReminderHistory(true); }}
                          className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-10"
                          title={`${customer.reminderCount} reminders sent — click to view history`}>{customer.reminderCount}</button>
                      )}
                    </div>
                  )}
                  <button onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true); }} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── Pagination ─── */}
      {filteredCustomers.length > 0 && (
        <div className="flex flex-col items-center gap-3 px-1 sm:flex-row sm:justify-between">
          <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={`p-1.5 rounded-lg disabled:opacity-30 ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronsLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className={`p-1.5 rounded-lg disabled:opacity-30 ${dark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-4 h-4" /></button>
            <span className={`sm:hidden px-2 text-xs font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{currentPage} / {totalPages}</span>
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((pg, i) => typeof pg === 'number' ? (
                <button key={i} onClick={() => setCurrentPage(pg)} className={`w-8 h-8 rounded-lg text-xs font-medium ${currentPage === pg ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-100'}`}>{pg}</button>
              ) : (
                <span key={i} className={`px-1 ${dark ? 'text-neutral-600' : 'text-gray-300'}`}>&hellip;</span>
              ))}
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

      {/* ─── Modals ─── */}
      {renderCustomerForm(false)}
      {renderCustomerForm(true)}
      {renderViewModal()}
      {renderPaymentModal()}
      {renderPaymentHistoryModal()}
      {renderReminderHistoryModal()}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCustomer}
        title="Remove Customer"
        itemName={selectedCustomer?.name}
        message={`Are you sure you want to remove "${selectedCustomer?.name}" from your customers? This action cannot be undone.`}
      />
    </div>
  );
};
