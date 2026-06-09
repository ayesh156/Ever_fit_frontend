import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Store, Sun, Moon, Save, FileText, MessageSquare, Bell, Shield,
  Phone, Mail, MapPin, Clock, Palette, Eye,
  CreditCard, User, Lock, Smartphone, Users, Plus, X, Loader2, Edit2,
  AlertTriangle, ShoppingBag, BarChart3,
} from 'lucide-react';
import { ImageUpload } from '../components/ui/ImageUpload';
import { TimePicker } from '../components/ui/TimePicker';

type SettingsTab = 'general' | 'appearance' | 'invoice' | 'reminders' | 'notifications' | 'staff' | 'security';

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: 'general', label: 'Business', icon: Store },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'invoice', label: 'Invoice', icon: FileText },
  { key: 'reminders', label: 'Reminders', icon: MessageSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'security', label: 'Security', icon: Shield },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const RolePill: React.FC<{ role: string; value: string; onChange?: (val: string) => void; theme: string }> = ({ role, value, onChange, theme }) => {
  const dark = theme === 'dark';
  if (!onChange) {
    const colors: Record<string, string> = { ADMIN: 'bg-purple-500/10 text-purple-500', CASHIER: 'bg-blue-500/10 text-blue-400', STAFF: 'bg-neutral-500/10 text-neutral-500' };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[role] || 'bg-neutral-500/10 text-neutral-500'}`}>{role}</span>;
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer appearance-none ${
        dark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-gray-200 text-gray-700'
      } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
    >
      <option value="ADMIN">Admin</option>
      <option value="CASHIER">Cashier</option>
      <option value="STAFF">Staff</option>
    </select>
  );
};

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { token, isAdmin } = useAuth();
  const dark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('CASHIER');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'CASHIER' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!token) return;
    setStaffLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStaffUsers(await res.json());
    } catch {} finally { setStaffLoading(false); }
  }, [token]);

  useEffect(() => { if (activeTab === 'staff') fetchStaff(); }, [activeTab, fetchStaff]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newStaff),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Staff member created');
      setShowAddModal(false);
      setNewStaff({ name: '', email: '', password: '', role: 'CASHIER' });
      fetchStaff();
    } catch (err: any) { toast.error(err.message || 'Failed to create staff');
    } finally { setAddLoading(false); }
  };

  const handleToggleActive = async (user: StaffUser) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !user.active }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${user.name} ${user.active ? 'deactivated' : 'activated'}`);
      fetchStaff();
    } catch { toast.error('Failed to update'); }
  };

  const handleChangeRole = async (user: StaffUser, role: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${user.name} role set to ${role}`);
      fetchStaff();
    } catch { toast.error('Failed to update role'); }
  };

  const openEditModal = (user: StaffUser) => {
    setEditUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editUser) return;
    setEditLoading(true);
    try {
      const body: any = { name: editName, role: editRole };
      if (editPassword.trim()) body.password = editPassword;
      const res = await fetch(`${API_BASE}/auth/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Staff updated');
      setShowEditModal(false);
      fetchStaff();
    } catch (err: any) { toast.error(err.message || 'Failed to update');
    } finally { setEditLoading(false); }
  };

  const [businessDetails, setBusinessDetails] = useState({ name: 'RELIANCE', tagline: 'Branded Mens Clothing', phone: '071 135 0123', email: 'ravindrakumarash@gmail.com', address: 'Makandura, Matara', website: '', openTime: '09:00', closeTime: '21:00', closedDays: 'Poya Days' });
  const [businessLogo, setBusinessLogo] = useState<string | undefined>(undefined);
  const [invoiceSettings, setInvoiceSettings] = useState({ prefix: 'INV-', nextNumber: '0013', taxRate: '0', taxLabel: 'Tax', footerNote: 'Thank you for shopping at RELIANCE!', showLogo: true, showTaxBreakdown: false, termsAndConditions: 'Goods once sold will not be taken back. Exchange within 7 days with receipt.', dueDays: '30' });
  const [reminderTemplates, setReminderTemplates] = useState({ invoicePayment: `Hi {{customerName}},\n\nThis is a reminder that your invoice {{invoiceNumber}} of Rs. {{amount}} is pending payment.\n\nPlease settle at your earliest convenience.\n\nThank you,\nRELIANCE\n071 135 0123`, invoiceOverdue: `Dear {{customerName}},\n\nYour invoice {{invoiceNumber}} of Rs. {{amount}} is overdue since {{dueDate}}.\n\nPlease contact us to arrange payment.\n\nRELIANCE\n071 135 0123`, supplierPayment: `Dear {{supplierName}},\n\nPlease note our pending payment of Rs. {{amount}} is being processed.\n\nThank you for your continued partnership.\n\nRELIANCE`, customerCredit: `Hi {{customerName}},\n\nYour current outstanding balance is Rs. {{amount}}.\n\nPlease settle at your convenience.\n\nThank you,\nRELIANCE` });
  const [paymentMethods, setPaymentMethods] = useState({ cash: true, card: true, bankTransfer: true, credit: true });
  const [notifications, setNotifications] = useState({ lowStock: true, newOrder: true, paymentReceived: true, invoiceOverdue: true, dailySummary: false });

  const handleSave = (section: string) => { toast.success(`${section} settings saved`); };

  const cardClass = `rounded-2xl border p-4 sm:p-6 ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border transition-all ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20'}`;
  const textareaClass = `w-full px-4 py-3 rounded-xl border transition-all resize-none ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20'}`;
  const labelClass = `block text-sm font-medium mb-1.5 ${dark ? 'text-neutral-300' : 'text-gray-700'}`;

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-all ${checked ? dark ? 'bg-white' : 'bg-brand-900' : dark ? 'bg-neutral-700' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all ${checked ? `translate-x-5 ${dark ? 'bg-black' : 'bg-white'}` : `${dark ? 'bg-neutral-400' : 'bg-white'}`}`} />
    </button>
  );

  const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full max-w-md rounded-2xl border shadow-2xl p-6 ${dark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}><X className="w-5 h-5" /></button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8 overflow-hidden">
      <div>
        <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
        <p className={`mt-0.5 sm:mt-1 text-sm sm:text-base ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Manage your store configuration & preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <div className="lg:hidden relative">
            <div className={`flex gap-1 p-1 rounded-xl border overflow-x-auto scrollbar-hide ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? dark ? 'bg-white text-black shadow-sm' : 'bg-white text-gray-900 shadow-sm' : dark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>
            <div className={`absolute right-0 top-0 bottom-0 w-8 pointer-events-none rounded-r-xl ${dark ? 'bg-gradient-to-l from-neutral-950/80 to-transparent' : 'bg-gradient-to-l from-gray-100/80 to-transparent'}`} />
          </div>
          <div className={`hidden lg:flex lg:flex-col gap-1 p-1 rounded-xl border ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-gray-50 border-gray-200'}`}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${activeTab === tab.key ? dark ? 'bg-white text-black shadow-sm' : 'bg-white text-gray-900 shadow-sm' : dark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'general' && (
            <>
              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6"><Store className={`w-5 h-5 ${dark ? 'text-white' : 'text-gray-700'}`} /><h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Business Details</h2></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Store Name</label><input className={inputClass} value={businessDetails.name} onChange={e => setBusinessDetails(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className={labelClass}>Tagline</label><input className={inputClass} value={businessDetails.tagline} onChange={e => setBusinessDetails(p => ({ ...p, tagline: e.target.value }))} /></div>
                  <div><label className={labelClass}>Phone</label><div className="relative"><Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><input className={`${inputClass} pl-10`} value={businessDetails.phone} onChange={e => setBusinessDetails(p => ({ ...p, phone: e.target.value }))} /></div></div>
                  <div><label className={labelClass}>Email</label><div className="relative"><Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><input className={`${inputClass} pl-10`} value={businessDetails.email} onChange={e => setBusinessDetails(p => ({ ...p, email: e.target.value }))} /></div></div>
                  <div className="sm:col-span-2"><label className={labelClass}>Address</label><div className="relative"><MapPin className={`absolute left-3 top-3 w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><input className={`${inputClass} pl-10`} value={businessDetails.address} onChange={e => setBusinessDetails(p => ({ ...p, address: e.target.value }))} /></div></div>
                </div>
              </div>
              <button onClick={() => handleSave('Business')} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black"><Save className="w-4 h-4" />Save Changes</button>
            </>
          )}

          {activeTab === 'appearance' && (
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6"><Palette className={`w-5 h-5 ${dark ? 'text-white' : 'text-gray-700'}`} /><h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Theme</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setTheme('light')} className={`relative rounded-2xl border p-5 text-left transition-all ${theme === 'light' ? 'border-brand-900 ring-2 ring-brand-900/20 bg-white shadow-md' : dark ? 'border-neutral-700/50 bg-neutral-800/30 hover:bg-neutral-800/50' : 'border-gray-200 bg-gray-50 hover:bg-white'}`}>
                  {theme === 'light' && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-900 flex items-center justify-center"><span className="text-white text-xs">✓</span></span>}
                  <div className={`p-3 rounded-xl mb-3 w-fit ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}><Sun className={`w-6 h-6 ${dark ? 'text-neutral-400' : 'text-gray-600'}`} /></div>
                  <h3 className={`text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Light Mode</h3>
                </button>
                <button onClick={() => setTheme('dark')} className={`relative rounded-2xl border p-5 text-left transition-all ${theme === 'dark' ? 'border-white ring-2 ring-white/20 bg-neutral-800/50 shadow-md' : 'border-gray-200 bg-gray-50 hover:bg-white'}`}>
                  {theme === 'dark' && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center"><span className="text-black text-xs">✓</span></span>}
                  <div className={`p-3 rounded-xl mb-3 w-fit ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}><Moon className={`w-6 h-6 ${dark ? 'text-neutral-400' : 'text-gray-600'}`} /></div>
                  <h3 className={`text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</h3>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <>
              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6"><FileText className={`w-5 h-5 ${dark ? 'text-white' : 'text-gray-700'}`} /><h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Invoice Settings</h2></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Prefix</label><input className={inputClass} value={invoiceSettings.prefix} onChange={e => setInvoiceSettings(p => ({ ...p, prefix: e.target.value }))} /></div>
                  <div><label className={labelClass}>Next Number</label><input className={inputClass} value={invoiceSettings.nextNumber} onChange={e => setInvoiceSettings(p => ({ ...p, nextNumber: e.target.value }))} /></div>
                </div>
              </div>
              <button onClick={() => handleSave('Invoice')} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black"><Save className="w-4 h-4" />Save</button>
            </>
          )}

          {activeTab === 'reminders' && (
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6"><MessageSquare className={`w-5 h-5 ${dark ? 'text-white' : 'text-gray-700'}`} /><h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Reminder Templates</h2></div>
              <textarea rows={4} className={textareaClass} value={reminderTemplates.invoicePayment} onChange={e => setReminderTemplates(p => ({ ...p, invoicePayment: e.target.value }))} />
              <button onClick={() => handleSave('Reminders')} className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black"><Save className="w-4 h-4" />Save</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6"><Bell className={`w-5 h-5 ${dark ? 'text-white' : 'text-gray-700'}`} /><h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Notifications</h2></div>
              {[{ key: 'lowStock', label: 'Low Stock' }, { key: 'newOrder', label: 'New Orders' }].map((item: any) => (
                <div key={item.key} className="flex items-center justify-between py-2"><span className={`text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{item.label}</span><Toggle checked={(notifications as any)[item.key]} onChange={v => setNotifications(p => ({ ...p, [item.key]: v }))} /></div>
              ))}
              <button onClick={() => handleSave('Notifications')} className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black"><Save className="w-4 h-4" />Save</button>
            </div>
          )}

          {/* ═══════ STAFF MANAGEMENT ═══════ */}
          {activeTab === 'staff' && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2"><Users className={`w-5 h-5 ${dark ? 'text-white' : 'text-gray-700'}`} /><h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Staff Management</h2></div>
                {isAdmin && <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm"><Plus className="w-4 h-4" />Add Staff</button>}
              </div>
              {staffLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
              ) : staffUsers.length === 0 ? (
                <p className={`text-sm py-8 text-center ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No staff found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[550px]">
                    <thead>
                      <tr className={dark ? 'border-b border-neutral-800' : 'border-b border-gray-200'}>
                        {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staffUsers.map(user => (
                        <tr key={user.id} className={`${dark ? 'border-b border-neutral-800/50 hover:bg-neutral-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                          <td className={`px-4 py-3 text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{user.name}</td>
                          <td className={`px-4 py-3 text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{user.email}</td>
                          <td className="px-4 py-3">
                            <RolePill role={user.role} value={user.role} onChange={isAdmin ? (v) => handleChangeRole(user, v) : undefined} theme={theme} />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${user.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                              <span className="w-1 h-1 rounded-full bg-current" />{user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {isAdmin && (
                                <button onClick={() => openEditModal(user)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                              )}
                              {isAdmin && (
                                <button onClick={() => handleToggleActive(user)} className={`p-1.5 rounded-lg transition-all ${user.active ? 'text-red-400 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'}`} title={user.active ? 'Disable' : 'Enable'}>
                                  {user.active ? <X className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold px-0.5">✓</span>}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add Staff Modal */}
          <Modal show={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Staff">
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div><label className={labelClass}>Name</label><input className={inputClass} value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} required /></div>
              <div><label className={labelClass}>Password</label><input type="password" className={inputClass} value={newStaff.password} onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))} required minLength={8} /></div>
              <div><label className={labelClass}>Role</label>
                <RolePill role={newStaff.role} value={newStaff.role} onChange={(v) => setNewStaff(p => ({ ...p, role: v }))} theme={theme} />
              </div>
              <button type="submit" disabled={addLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{addLoading ? 'Creating...' : 'Create Staff'}
              </button>
            </form>
          </Modal>

          {/* Edit Staff Modal */}
          <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Staff">
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div><label className={labelClass}>Name</label><input className={inputClass} value={editName} onChange={e => setEditName(e.target.value)} required /></div>
              <div><label className={labelClass}>Email</label><input className={inputClass} value={editUser?.email || ''} disabled /></div>
              <div><label className={labelClass}>New Password</label><input type="password" className={inputClass} value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Leave blank to keep current" /></div>
              <p className="text-xs text-zinc-500 -mt-2">Leave blank to keep current password</p>
              <div><label className={labelClass}>Role</label>
                <RolePill role={editRole} value={editRole} onChange={setEditRole} theme={theme} />
              </div>
              <button type="submit" disabled={editLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </Modal>

          {activeTab === 'security' && (
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6"><Lock className={`w-5 h-5 ${dark ? 'text-white' : 'text-gray-700'}`} /><h2 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Security</h2></div>
              <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Password management available in profile settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};