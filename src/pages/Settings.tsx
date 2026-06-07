import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import {
  Store, Sun, Moon, Save, FileText, MessageSquare, Bell, Shield,
  Phone, Mail, MapPin, Clock, Palette, Eye,
  CreditCard, User, Lock, Smartphone,
  AlertTriangle, ShoppingBag, BarChart3,
} from 'lucide-react';
import { ImageUpload } from '../components/ui/ImageUpload';
import { TimePicker } from '../components/ui/TimePicker';

type SettingsTab = 'general' | 'appearance' | 'invoice' | 'reminders' | 'notifications' | 'security';

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: 'general', label: 'Business', icon: Store },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'invoice', label: 'Invoice', icon: FileText },
  { key: 'reminders', label: 'Reminders', icon: MessageSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
];

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Business Details
  const [businessDetails, setBusinessDetails] = useState({
    name: 'RELIANCE',
    tagline: 'Branded Mens Clothing',
    phone: '071 135 0123',
    email: 'ravindrakumarash@gmail.com',
    address: 'Makandura, Matara',
    website: '',
    openTime: '09:00',
    closeTime: '21:00',
    closedDays: 'Poya Days',
  });
  const [businessLogo, setBusinessLogo] = useState<string | undefined>(undefined);

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    prefix: 'INV-',
    nextNumber: '0013',
    taxRate: '0',
    taxLabel: 'Tax',
    footerNote: 'Thank you for shopping at RELIANCE!',
    showLogo: true,
    showTaxBreakdown: false,
    termsAndConditions: 'Goods once sold will not be taken back. Exchange within 7 days with receipt.',
    dueDays: '30',
  });

  // Reminder Templates
  const [reminderTemplates, setReminderTemplates] = useState({
    invoicePayment: `Hi {{customerName}},\n\nThis is a reminder that your invoice {{invoiceNumber}} of Rs. {{amount}} is pending payment.\n\nPlease settle at your earliest convenience.\n\nThank you,\nRELIANCE\n071 135 0123`,
    invoiceOverdue: `Dear {{customerName}},\n\nYour invoice {{invoiceNumber}} of Rs. {{amount}} is overdue since {{dueDate}}.\n\nPlease contact us to arrange payment.\n\nRELIANCE\n071 135 0123`,
    supplierPayment: `Dear {{supplierName}},\n\nPlease note our pending payment of Rs. {{amount}} is being processed.\n\nThank you for your continued partnership.\n\nRELIANCE`,
    customerCredit: `Hi {{customerName}},\n\nYour current outstanding balance is Rs. {{amount}}.\n\nPlease settle at your convenience.\n\nThank you,\nRELIANCE`,
  });

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    card: true,
    bankTransfer: true,
    credit: true,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    lowStock: true,
    newOrder: true,
    paymentReceived: true,
    invoiceOverdue: true,
    dailySummary: false,
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  const cardClass = `rounded-2xl border p-4 sm:p-6 ${
    theme === 'dark' ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
  }`;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border transition-all ${
    theme === 'dark'
      ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20'
  }`;

  const textareaClass = `w-full px-4 py-3 rounded-xl border transition-all resize-none ${
    theme === 'dark'
      ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20'
  }`;

  const labelClass = `block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`;

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-all ${
      checked ? theme === 'dark' ? 'bg-white' : 'bg-brand-900' : theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-300'
    }`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all ${
        checked ? `translate-x-5 ${theme === 'dark' ? 'bg-black' : 'bg-white'}` : `${theme === 'dark' ? 'bg-neutral-400' : 'bg-white'}`
      }`} />
    </button>
  );

  return (
    <div className="space-y-6 pb-8 overflow-hidden">
      {/* Header */}
      <div>
        <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
        <p className={`mt-0.5 sm:mt-1 text-sm sm:text-base ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
          Manage your store configuration & preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs — mobile: horizontal scrollable with arrows, desktop: vertical sidebar */}
        <div className={`lg:w-56 flex-shrink-0`}>
          {/* Mobile tab bar */}
          <div className="lg:hidden relative">
            <div className={`flex gap-1 p-1 rounded-xl border overflow-x-auto scrollbar-hide ${
              theme === 'dark' ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
            }`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                    : theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Swipe hint gradient */}
            <div className={`absolute right-0 top-0 bottom-0 w-8 pointer-events-none rounded-r-xl ${
              theme === 'dark' ? 'bg-gradient-to-l from-neutral-950/80 to-transparent' : 'bg-gradient-to-l from-gray-100/80 to-transparent'
            }`} />
          </div>
          {/* Desktop sidebar */}
          <div className={`hidden lg:flex lg:flex-col gap-1 p-1 rounded-xl border ${
            theme === 'dark' ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
          }`}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
                activeTab === tab.key
                  ? theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* ═══════ GENERAL / BUSINESS ═══════ */}
          {activeTab === 'general' && (
            <>
              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <Store className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Business Details</h2>
                </div>
                {/* Business Logo */}
                <div className="mb-6">
                  <label className={labelClass}>Business Logo</label>
                  <p className={`text-xs mb-2 sm:mb-3 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>
                    Upload, drag & drop, or paste (Ctrl+V) your logo. Auto-compressed.
                  </p>
                  <div className="max-w-xs">
                    <ImageUpload
                      value={businessLogo}
                      onChange={setBusinessLogo}
                      dark={theme === 'dark'}
                      maxDimension={512}
                      quality={0.85}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Store Name</label>
                    <input className={inputClass} value={businessDetails.name} onChange={e => setBusinessDetails(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Tagline</label>
                    <input className={inputClass} value={businessDetails.tagline} onChange={e => setBusinessDetails(p => ({ ...p, tagline: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <div className="relative">
                      <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <input className={`${inputClass} pl-10`} value={businessDetails.phone} onChange={e => setBusinessDetails(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <input className={`${inputClass} pl-10`} value={businessDetails.email} onChange={e => setBusinessDetails(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Address</label>
                    <div className="relative">
                      <MapPin className={`absolute left-3 top-3 w-4 h-4 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <input className={`${inputClass} pl-10`} value={businessDetails.address} onChange={e => setBusinessDetails(p => ({ ...p, address: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input className={inputClass} placeholder="https://..." value={businessDetails.website} onChange={e => setBusinessDetails(p => ({ ...p, website: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <Clock className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Business Hours</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Opening Time</label>
                    <TimePicker
                      value={businessDetails.openTime}
                      onChange={v => setBusinessDetails(p => ({ ...p, openTime: v }))}
                      dark={theme === 'dark'}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Closing Time</label>
                    <TimePicker
                      value={businessDetails.closeTime}
                      onChange={v => setBusinessDetails(p => ({ ...p, closeTime: v }))}
                      dark={theme === 'dark'}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Closed Days</label>
                    <input className={inputClass} value={businessDetails.closedDays} onChange={e => setBusinessDetails(p => ({ ...p, closedDays: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h2>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {Object.entries(paymentMethods).map(([key, val]) => (
                    <div key={key} className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl ${
                      theme === 'dark' ? 'bg-neutral-800/30' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>
                        {key === 'bankTransfer' ? 'Bank Transfer' : key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      <Toggle checked={val} onChange={v => setPaymentMethods(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => handleSave('Business')} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          )}

          {/* ═══════ APPEARANCE ═══════ */}
          {activeTab === 'appearance' && (
            <>
              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <Palette className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Theme</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`relative rounded-2xl border p-5 text-left transition-all ${
                      theme === 'light'
                        ? 'border-brand-900 ring-2 ring-brand-900/20 bg-white shadow-md'
                        : theme === 'dark' ? 'border-neutral-700/50 bg-neutral-800/30 hover:bg-neutral-800/50' : 'border-gray-200 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    {theme === 'light' && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-900 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>}
                    <div className={`p-3 rounded-xl mb-3 w-fit ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      <Sun className={`w-6 h-6 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`} />
                    </div>
                    <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Light Mode</h3>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Clean, bright interface for daytime use</p>
                    {/* Light mode preview */}
                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                      <div className="h-2 w-16 bg-gray-200 rounded-full" />
                      <div className="h-2 w-24 bg-gray-100 rounded-full" />
                      <div className="flex gap-1.5">
                        <div className="h-6 w-6 bg-gray-100 rounded" />
                        <div className="flex-1 h-6 bg-gray-50 rounded" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`relative rounded-2xl border p-5 text-left transition-all ${
                      theme === 'dark'
                        ? 'border-white ring-2 ring-white/20 bg-neutral-800/50 shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    {theme === 'dark' && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <span className="text-black text-xs">✓</span>
                    </span>}
                    <div className={`p-3 rounded-xl mb-3 w-fit ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`} />
                    </div>
                    <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dark Mode</h3>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Easy on the eyes, perfect for all-day use</p>
                    {/* Dark mode preview */}
                    <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900 p-3 space-y-2">
                      <div className="h-2 w-16 bg-neutral-700 rounded-full" />
                      <div className="h-2 w-24 bg-neutral-800 rounded-full" />
                      <div className="flex gap-1.5">
                        <div className="h-6 w-6 bg-neutral-800 rounded" />
                        <div className="flex-1 h-6 bg-neutral-800/50 rounded" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <Eye className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Brand Preview</h2>
                </div>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Preview how your brand colours appear in the interface
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {[
                    { name: 'brand-900', bg: '#171717', text: 'white' },
                    { name: 'brand-800', bg: '#262626', text: 'white' },
                    { name: 'brand-700', bg: '#404040', text: 'white' },
                    { name: 'brand-500', bg: '#737373', text: 'white' },
                    { name: 'brand-200', bg: '#e5e5e5', text: 'black' },
                  ].map(c => (
                    <div key={c.name} className="text-center">
                      <div className="h-16 rounded-xl shadow-sm" style={{ background: c.bg }} />
                      <p className={`text-xs mt-1.5 font-mono ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{c.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══════ INVOICE SETTINGS ═══════ */}
          {activeTab === 'invoice' && (
            <>
              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Invoice Configuration</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Invoice Prefix</label>
                    <input className={inputClass} value={invoiceSettings.prefix} onChange={e => setInvoiceSettings(p => ({ ...p, prefix: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Next Invoice Number</label>
                    <input className={inputClass} value={invoiceSettings.nextNumber} onChange={e => setInvoiceSettings(p => ({ ...p, nextNumber: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Tax Rate (%)</label>
                    <input type="number" className={inputClass} value={invoiceSettings.taxRate} onChange={e => setInvoiceSettings(p => ({ ...p, taxRate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Tax Label</label>
                    <input className={inputClass} value={invoiceSettings.taxLabel} onChange={e => setInvoiceSettings(p => ({ ...p, taxLabel: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Payment Due (days)</label>
                    <input type="number" className={inputClass} value={invoiceSettings.dueDays} onChange={e => setInvoiceSettings(p => ({ ...p, dueDays: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h3 className={`text-base font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Invoice Content</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Footer Note</label>
                    <textarea rows={2} className={textareaClass} value={invoiceSettings.footerNote} onChange={e => setInvoiceSettings(p => ({ ...p, footerNote: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Terms & Conditions</label>
                    <textarea rows={3} className={textareaClass} value={invoiceSettings.termsAndConditions} onChange={e => setInvoiceSettings(p => ({ ...p, termsAndConditions: e.target.value }))} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className={`flex items-center justify-between p-3 rounded-xl flex-1 ${
                      theme === 'dark' ? 'bg-neutral-800/30' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>Show Logo on Invoice</span>
                      <Toggle checked={invoiceSettings.showLogo} onChange={v => setInvoiceSettings(p => ({ ...p, showLogo: v }))} />
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-xl flex-1 ${
                      theme === 'dark' ? 'bg-neutral-800/30' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>Tax Breakdown</span>
                      <Toggle checked={invoiceSettings.showTaxBreakdown} onChange={v => setInvoiceSettings(p => ({ ...p, showTaxBreakdown: v }))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Preview */}
              <div className={cardClass}>
                <h3 className={`text-base font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Invoice Preview</h3>
                <div className={`rounded-xl border p-4 sm:p-6 ${theme === 'dark' ? 'bg-neutral-800/30 border-neutral-700/50' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{businessDetails.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{businessDetails.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{invoiceSettings.prefix}{invoiceSettings.nextNumber}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <div className={`border-t py-3 ${theme === 'dark' ? 'border-neutral-700/50' : 'border-gray-200'}`}>
                    <div className="flex justify-between text-xs">
                      <span className={theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}>Sample Product x 2</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rs. 5,000.00</span>
                    </div>
                  </div>
                  <div className={`border-t pt-3 ${theme === 'dark' ? 'border-neutral-700/50' : 'border-gray-200'}`}>
                    <div className="flex justify-between">
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total</span>
                      <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rs. 5,000.00</span>
                    </div>
                  </div>
                  {invoiceSettings.footerNote && (
                    <p className={`text-[10px] mt-3 pt-2 border-t ${theme === 'dark' ? 'text-neutral-500 border-neutral-700/50' : 'text-gray-400 border-gray-200'}`}>
                      {invoiceSettings.footerNote}
                    </p>
                  )}
                </div>
              </div>

              <button onClick={() => handleSave('Invoice')} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black">
                <Save className="w-4 h-4" />
                Save Invoice Settings
              </button>
            </>
          )}

          {/* ═══════ REMINDERS ═══════ */}
          {activeTab === 'reminders' && (
            <>
              <div className={`p-3 sm:p-4 rounded-xl border ${theme === 'dark' ? 'bg-neutral-800/30 border-neutral-700/50' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-blue-700'}`}>
                  <strong>Placeholders:</strong>{' '}
                  <span className="inline-flex flex-wrap gap-1 mt-1">
                    {['{customerName}', '{amount}', '{invoiceNumber}', '{dueDate}', '{supplierName}'].map(p => (
                      <code key={p} className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs whitespace-nowrap ${theme === 'dark' ? 'bg-neutral-700 text-white' : 'bg-blue-100 text-blue-800'}`}>{`{{${p.slice(1, -1)}}}`}</code>
                    ))}
                  </span>
                  <span className="block mt-1 text-[10px] sm:text-xs opacity-70">— replaced with actual values when sending.</span>
                </p>
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-green-500" />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Invoice Payment Reminder</h2>
                </div>
                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>
                  Sent to customers as a friendly payment reminder via WhatsApp
                </p>
                <textarea rows={8} className={`${textareaClass} font-mono text-xs sm:text-sm`} value={reminderTemplates.invoicePayment}
                  onChange={e => setReminderTemplates(p => ({ ...p, invoicePayment: e.target.value }))} />
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-red-400" />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Invoice Overdue Reminder</h2>
                </div>
                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>
                  Sent when an invoice is past its due date
                </p>
                <textarea rows={8} className={`${textareaClass} font-mono text-xs sm:text-sm`} value={reminderTemplates.invoiceOverdue}
                  onChange={e => setReminderTemplates(p => ({ ...p, invoiceOverdue: e.target.value }))} />
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Supplier Payment Reminder</h2>
                </div>
                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>
                  Sent to suppliers regarding pending payments
                </p>
                <textarea rows={6} className={`${textareaClass} font-mono text-xs sm:text-sm`} value={reminderTemplates.supplierPayment}
                  onChange={e => setReminderTemplates(p => ({ ...p, supplierPayment: e.target.value }))} />
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-blue-400" />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Customer Credit Reminder</h2>
                </div>
                <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>
                  Sent to customers with outstanding credit balances
                </p>
                <textarea rows={6} className={`${textareaClass} font-mono text-xs sm:text-sm`} value={reminderTemplates.customerCredit}
                  onChange={e => setReminderTemplates(p => ({ ...p, customerCredit: e.target.value }))} />
              </div>

              <button onClick={() => handleSave('Reminder templates')} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black">
                <Save className="w-4 h-4" />
                Save Reminder Templates
              </button>
            </>
          )}

          {/* ═══════ NOTIFICATIONS ═══════ */}
          {activeTab === 'notifications' && (
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6">
                <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notification Preferences</h2>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { key: 'lowStock' as const, label: 'Low Stock Alerts', desc: 'Get notified when products fall below threshold', icon: AlertTriangle, iconColor: 'text-amber-400' },
                  { key: 'newOrder' as const, label: 'New Orders', desc: 'Notification for each new order placed', icon: ShoppingBag, iconColor: 'text-green-500' },
                  { key: 'paymentReceived' as const, label: 'Payment Received', desc: 'When a customer makes a payment', icon: CreditCard, iconColor: 'text-blue-400' },
                  { key: 'invoiceOverdue' as const, label: 'Invoice Overdue', desc: 'When an invoice passes its due date', icon: Clock, iconColor: 'text-red-400' },
                  { key: 'dailySummary' as const, label: 'Daily Summary', desc: 'End-of-day summary of sales and activity', icon: BarChart3, iconColor: 'text-purple-400' },
                ].map(item => (
                  <div key={item.key} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${
                    theme === 'dark' ? 'bg-neutral-800/30' : 'bg-gray-50'
                  }`}>
                    <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-white'}`}>
                      <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{item.desc}</p>
                    </div>
                    <Toggle checked={notifications[item.key]} onChange={v => setNotifications(p => ({ ...p, [item.key]: v }))} />
                  </div>
                ))}
              </div>
              <button onClick={() => handleSave('Notification')} className="flex items-center gap-2 px-6 py-2.5 mt-6 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black">
                <Save className="w-4 h-4" />
                Save Notification Settings
              </button>
            </div>
          )}

          {/* ═══════ SECURITY ═══════ */}
          {activeTab === 'security' && (
            <>
              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <Lock className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Change Password</h2>
                </div>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input type="password" className={inputClass} placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" className={inputClass} placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input type="password" className={inputClass} placeholder="Confirm new password" />
                  </div>
                  <button onClick={() => handleSave('Password')} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neutral-800 to-brand-950 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all dark:from-white dark:to-neutral-200 dark:text-black">
                    <Save className="w-4 h-4" />
                    Update Password
                  </button>
                </div>
              </div>

              <div className={cardClass}>
                <div className="flex items-center gap-2 mb-6">
                  <Smartphone className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Active Sessions</h2>
                </div>
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border ${
                    theme === 'dark' ? 'bg-neutral-800/30 border-green-500/20' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-green-500/10 flex-shrink-0">
                      <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Current Browser</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Active now · This device</p>
                    </div>
                    <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium flex-shrink-0">Active</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
