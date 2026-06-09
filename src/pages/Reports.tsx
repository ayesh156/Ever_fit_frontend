import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../lib/utils';
import { get } from '../lib/api';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag, Download, ArrowUpRight,
  ArrowDownRight, Package, Users, FileText, AlertTriangle, CreditCard,
  Star, Clock, ShoppingCart, Loader2, Layers, ChevronDown, Calendar, X,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ── Types ───────────────────────────────────────────────────────────────────
interface ApiProduct { id: number; name: string; }
interface ApiVariant { id: number; product: ApiProduct; }
interface ApiOrderItem { id: number; variant: ApiVariant; quantity: number; unitPrice: number; price: number; }
interface ApiOrder {
  id: number; customerName: string | null; customerPhone: string | null;
  customerId: number | null; totalAmount: number; paidAmount: number;
  status: string; paymentMethod: string | null; createdAt: string; items: ApiOrderItem[];
}
interface ApiCustomer { id: number; name: string; phone: string; totalOrders: number; createdAt: string; }
interface TopProduct { name: string; unitsSold: number; revenue: number; }

// ── Helpers ─────────────────────────────────────────────────────────────────
type RangeKey = 'today' | '7d' | '30d' | 'month' | 'all' | 'custom';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const RANGE_LABEL_MAP: Record<string, string> = {
  today: 'Today', '7d': 'Last 7 Days', '30d': 'Last 30 Days',
  month: 'This Month', all: 'All Time', custom: 'Custom Range',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', PAID: '#22c55e', CANCELLED: '#ef4444',
  PENDING_RECEIPT: '#f59e0b', PAYMENT_REVIEW: '#a855f7',
  PAYMENT_VERIFIED: '#3b82f6', PROCESSING: '#6366f1',
  SHIPPED: '#0ea5e9', DELIVERED: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending', PAID: 'Paid', CANCELLED: 'Cancelled',
  PENDING_RECEIPT: 'Pending Receipt', PAYMENT_REVIEW: 'Payment Review',
  PAYMENT_VERIFIED: 'Payment Verified', PROCESSING: 'Processing',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Filter Logic ────────────────────────────────────────────────────────────
function filterByRange(
  orders: ApiOrder[], range: RangeKey, selectedMonth: number,
  selectedYear: number, customStart: string, customEnd: string,
): ApiOrder[] {
  const now = new Date();
  let filtered = orders;
  if (selectedMonth > 0 || selectedYear > 0) {
    filtered = orders.filter(o => {
      const d = new Date(o.createdAt);
      if (selectedYear > 0 && d.getFullYear() !== selectedYear) return false;
      if (selectedMonth > 0 && d.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });
  }
  if (range === 'all' && selectedMonth === 0 && selectedYear === 0) return orders;
  if (range === 'custom') {
    if (customStart || customEnd) {
      return filtered.filter(o => {
        const d = new Date(o.createdAt);
        if (customStart && d < new Date(customStart)) return false;
        if (customEnd) { const e = new Date(customEnd); e.setHours(23,59,59,999); if (d > e) return false; }
        return true;
      });
    }
    return filtered;
  }
  let start: Date | null = null;
  switch (range) {
    case 'today': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case '7d': start = new Date(now.getTime() - 7*24*60*60*1000); break;
    case '30d': start = new Date(now.getTime() - 30*24*60*60*1000); break;
    case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
  }
  return start ? filtered.filter(o => new Date(o.createdAt) >= start) : filtered;
}

function groupByMonth(data: { date: string; revenue: number; orders: number }[]) {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const d of data) {
    const date = new Date(d.date);
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    const e = map.get(key) || { revenue:0, orders:0 };
    e.revenue += d.revenue; e.orders += d.orders;
    map.set(key, e);
  }
  return Array.from(map.entries()).map(([m,v]) => ({ month:m, ...v })).sort((a,b) => a.month.localeCompare(b.month));
}

// ── PDF Export ────────────────────────────────────────────────────────────────
function buildPdfHtml(
  range: RangeKey, selectedMonth: number, selectedYear: number,
  customStart: string, customEnd: string,
  metrics: { totalRevenue: number; totalOrders: number; pendingOrders: number; deliveredOrders: number; fulfillmentRate: number },
  statusDistribution: { name: string; value: number; color: string; percentage: number }[],
  topProducts: TopProduct[], topProductTotalRev: number,
  totalCustomersInSystem: number, allTimeOrderCustomers: number,
  filteredOrdersLen: number, ordersLen: number, fmt: (n: number) => string,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  let timeframe = RANGE_LABEL_MAP[range] || 'Selected Period';
  if (selectedMonth > 0) timeframe += ` · ${MONTHS[selectedMonth-1]}`;
  if (selectedYear > 0) timeframe += ` ${selectedYear}`;
  if (range === 'custom' && customStart && customEnd) {
    timeframe = `${formatDateForDisplay(customStart)} — ${formatDateForDisplay(customEnd)}`;
  }

  const sr = statusDistribution.map(s =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.color};margin-right:8px;"></span>${s.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;font-weight:600;">${s.value}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600;">${s.percentage}%</td></tr>`
  ).join('');
  const pr = topProducts.map((p,i) => {
    const share = topProductTotalRev > 0 ? ((p.revenue/topProductTotalRev)*100).toFixed(1) : '0';
    return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;color:#6b7280;">${i+1}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:500;">${p.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;font-weight:600;">${p.unitsSold}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600;">${fmt(p.revenue)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;">${share}%</td></tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>EverFit Report</title><style>
    @page{margin:20mm 15mm} body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:0;background:#fff}
    .report{max-width:1000px;margin:0 auto;padding:40px;background:#fff}
    .header{border-bottom:3px solid #059669;padding-bottom:20px;margin-bottom:30px}
    .header h1{font-size:24px;font-weight:700;color:#059669;margin:0 0 4px 0}
    .header .sub{font-size:13px;color:#6b7280}
    .header .meta{display:flex;justify-content:space-between;margin-top:10px}
    .header .meta span{font-size:12px;color:#9ca3af}
    .section-title{font-size:16px;font-weight:700;color:#111827;margin:30px 0 15px 0;padding-bottom:8px;border-bottom:2px solid #059669}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:25px}
    .kpi-card{padding:16px;border-radius:10px;border:1px solid #e5e7eb;text-align:center;background:#f9fafb}
    .kpi-card .label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:6px}
    .kpi-card .value{font-size:22px;font-weight:700;color:#111827}
    .kpi-card .subtext{font-size:11px;color:#9ca3af;margin-top:4px}
    table{width:100%;border-collapse:collapse} th{padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;text-align:left;border-bottom:2px solid #d1d5db}
    td{color:#111827} .footer{margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
  </style></head><body><div class="report">
    <div class="header"><h1>EVER FIT FASHION SYSTEM</h1><div class="sub">Executive Performance Report</div><div class="meta"><span>Generated: ${dateStr} at ${timeStr}</span><span>Reporting Period: ${timeframe} &middot; ${ordersLen} total orders</span></div></div>
    <div class="section-title">Financial Summary</div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="label">Total Revenue</div><div class="value">${fmt(metrics.totalRevenue)}</div><div class="subtext">${filteredOrdersLen} verified payments</div></div>
      <div class="kpi-card"><div class="label">Total Orders</div><div class="value">${metrics.totalOrders}</div><div class="subtext">${metrics.pendingOrders} pending &middot; ${metrics.deliveredOrders} delivered</div></div>
      <div class="kpi-card"><div class="label">Active Customers</div><div class="value">${totalCustomersInSystem}</div><div class="subtext">${allTimeOrderCustomers} have placed orders</div></div>
      <div class="kpi-card"><div class="label">Fulfillment Rate</div><div class="value">${metrics.fulfillmentRate.toFixed(1)}%</div><div class="subtext">${metrics.deliveredOrders} of ${metrics.totalOrders} delivered</div></div>
    </div>
    <div class="section-title">Order Status Distribution</div>
    <table><thead><tr><th style="width:40%">Status</th><th style="width:30%;text-align:center">Count</th><th style="width:30%;text-align:right">Percentage</th></tr></thead><tbody>${sr||'<tr><td colspan="3" style="padding:16px;text-align:center;color:#9ca3af">No orders</td></tr>'}</tbody></table>
    <div class="section-title">Top 5 Best Selling Products</div>
    <table><thead><tr><th style="width:8%;text-align:center">#</th><th>Product Name</th><th style="width:15%;text-align:center">Units Sold</th><th style="width:20%;text-align:right">Revenue</th><th style="width:12%;text-align:right">Share</th></tr></thead><tbody>${pr||'<tr><td colspan="5" style="padding:16px;text-align:center;color:#9ca3af">No data</td></tr>'}</tbody></table>
    <div class="footer">Ever Fit Fashion System &mdash; Executive Analytics &middot; Confidential<br>Report generated automatically &middot; Data from live API</div>
  </div></body></html>`;
}

function extractYears(orders: ApiOrder[]): number[] {
  const set = new Set<number>();
  orders.forEach(o => { const y = new Date(o.createdAt).getFullYear(); if (!isNaN(y)) set.add(y); });
  return Array.from(set).sort((a,b) => b-a);
}

// ── Calendar Grid ────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getMonthStartDay(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ── Custom Dropdown Component ──────────────────────────────────────────────
interface CustomSelectProps {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  placeholder: string;
  dark: boolean;
}
const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder, dark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
          dark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-zinc-500' : 'text-gray-400'}`} />
      </button>
      {open && (
        <div className={`absolute z-50 mt-1 min-w-[140px] rounded-xl border shadow-2xl overflow-hidden ${
          dark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
        }`}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-all ${
                opt.value === value
                  ? dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  : dark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Reports: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const contentRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('30d');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().getMonth());
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [od, cd] = await Promise.all([
          get<ApiOrder[]>('/orders'),
          get<ApiCustomer[]>('/customers').catch(() => [] as ApiCustomer[]),
        ]);
        if (!cancelled) { setOrders(od || []); setCustomers(cd || []); }
      } catch (err) { console.error('[Reports] Fetch error:', err);
      } finally { if (!cancelled) setLoading(false); }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const availableYears = useMemo(() => extractYears(orders), [orders]);

  const filteredOrders = useMemo(
    () => filterByRange(orders, range, selectedMonth, selectedYear, customStart, customEnd),
    [orders, range, selectedMonth, selectedYear, customStart, customEnd],
  );

  const totalCustomersInSystem = customers.length;

  const allTimeOrderCustomers = useMemo(() => {
    const s = new Set<string>();
    orders.forEach(o => {
      if (o.customerId) s.add(`id:${o.customerId}`);
      else if (o.customerPhone) s.add(`phone:${o.customerPhone}`);
      else if (o.customerName) s.add(`name:${o.customerName}`);
    });
    return s.size;
  }, [orders]);

  const metrics = useMemo(() => {
    const vs = ['PAID','PAYMENT_VERIFIED','PROCESSING','SHIPPED','DELIVERED'];
    const vo = filteredOrders.filter(o => vs.includes(o.status));
    return {
      totalRevenue: vo.reduce((s,o) => s + o.paidAmount, 0),
      totalOrders: filteredOrders.length,
      pendingOrders: filteredOrders.filter(o => ['PENDING','PENDING_RECEIPT','PAYMENT_REVIEW'].includes(o.status)).length,
      deliveredOrders: filteredOrders.filter(o => o.status === 'DELIVERED').length,
      fulfillmentRate: filteredOrders.length > 0 ? (filteredOrders.filter(o => o.status === 'DELIVERED').length / filteredOrders.length) * 100 : 0,
    };
  }, [filteredOrders]);

  const revenueTrend = useMemo(() => {
    const vs = ['PAID','PAYMENT_VERIFIED','PROCESSING','SHIPPED','DELIVERED'];
    const dm = new Map<string, { revenue:number; orders:number }>();
    filteredOrders.forEach(o => {
      if (!vs.includes(o.status)) return;
      const dk = o.createdAt.split('T')[0];
      const e = dm.get(dk) || { revenue:0, orders:0 };
      e.revenue += o.paidAmount; e.orders += 1;
      dm.set(dk, e);
    });
    const d = Array.from(dm.entries()).map(([date,vals]) => ({ date, ...vals })).sort((a,b) => a.date.localeCompare(b.date));
    return d.length > 15 ? groupByMonth(d) : d.map(x => ({ month: new Date(x.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}), revenue: x.revenue, orders: x.orders }));
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    const c: Record<string,number> = { PENDING:0, PAID:0, CANCELLED:0, PENDING_RECEIPT:0, PAYMENT_REVIEW:0, PAYMENT_VERIFIED:0, PROCESSING:0, SHIPPED:0, DELIVERED:0 };
    filteredOrders.forEach(o => { const s = o.status||'UNKNOWN'; if (c[s]!==undefined) c[s]++; });
    const t = filteredOrders.length||1;
    return Object.keys(c).map(s => ({ name: STATUS_LABELS[s]||s, value: c[s], color: STATUS_COLORS[s]||'#737373', percentage: Math.round((c[s]/t)*100) })).filter(i => i.value>0).sort((a,b) => b.value-a.value);
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const vs = ['PAID','PAYMENT_VERIFIED','PROCESSING','SHIPPED','DELIVERED'];
    const vo = filteredOrders.filter(o => vs.includes(o.status));
    const pm = new Map<string, TopProduct>();
    vo.forEach(o => (o.items||[]).forEach(item => {
      const n = item.variant?.product?.name || `Product #${item.variant?.product?.id||item.variant.id}`;
      const e = pm.get(n) || { name:n, unitsSold:0, revenue:0 };
      e.unitsSold += item.quantity; e.revenue += item.price;
      pm.set(n, e);
    }));
    return Array.from(pm.values()).sort((a,b) => b.revenue-a.revenue).slice(0,5);
  }, [filteredOrders]);
  const topProductTotalRev = topProducts.reduce((s,p) => s+p.revenue, 0);

  // ── Calendar day click handler ─────────────────────────────────────────
  const handleDayClick = (day: number) => {
    const dateStr = `${calendarViewYear}-${String(calendarViewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (!customStart || (customStart && customEnd)) {
      setCustomStart(dateStr);
      setCustomEnd('');
    } else if (customStart && !customEnd) {
      if (dateStr < customStart) {
        setCustomStart(dateStr);
        setCustomEnd(customStart);
      } else {
        setCustomEnd(dateStr);
      }
      setCalendarOpen(false);
    }
  };

  // ── Download PDF from backend API ────────────────────────────────────
  const getApiBase = useCallback(() => {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }, []);

  const handleDownloadPDF = useCallback(() => {
    const apiBase = getApiBase();
    const params = new URLSearchParams();

    params.set('rangeType', range);
    if (range === 'custom') {
      if (customStart) params.set('startDate', customStart);
      if (customEnd) params.set('endDate', customEnd);
    }
    if (selectedMonth > 0) params.set('month', String(selectedMonth));
    if (selectedYear > 0) params.set('year', String(selectedYear));

    // Create a temporary anchor link to trigger the download
    const url = `${apiBase}/reports/download-pdf?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `EverFit_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [range, customStart, customEnd, selectedMonth, selectedYear, getApiBase]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const today = new Date();
  const daysInMonth = getDaysInMonth(calendarViewYear, calendarViewMonth);
  const startDay = getMonthStartDay(calendarViewYear, calendarViewMonth);
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // ═══════ Styles ═══════
  const cardClass = `rounded-2xl border p-3 sm:p-5 ${dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'}`;
  const tooltipStyle = { background: dark ? '#171717' : '#fff', border: `1px solid ${dark ? '#262626' : '#e5e5e5'}`, borderRadius: '12px', color: dark ? '#fff' : '#171717', fontSize: 12 };

  const StatCard = ({ label, value, icon: Icon, change, up = true }: { label: string; value: string; icon: React.ElementType; change?: string; up?: boolean; }) => (
    <div className={`${cardClass} relative overflow-hidden !p-2.5 sm:!p-5`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-full blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`p-1 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
            <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
          </div>
          <p className={`text-[11px] sm:text-sm font-medium leading-tight ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{label}</p>
        </div>
        <p className={`text-sm sm:text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-1 text-[10px] sm:text-xs font-medium ${up ? 'text-green-500' : 'text-red-400'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );

  // ── Month/Year pill options for custom selects ──────────────────────────
  const monthOptions = [{ value: 0, label: 'All Months' }, ...MONTHS.map((n,i) => ({ value: i+1, label: n }))];
  const yearOptions = [{ value: 0, label: 'All Years' }, ...availableYears.map(y => ({ value: y, label: String(y) }))];

  if (loading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-4`}>
        <Loader2 className={`w-10 h-10 animate-spin ${dark ? 'text-neutral-400' : 'text-gray-400'}`} />
        <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>Loading analytics data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 overflow-hidden" ref={contentRef} id="analytics-dashboard-content">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Analytics Dashboard</h1>
          <p className={`mt-0.5 sm:mt-1 text-sm sm:text-base ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Enterprise analytics powered by live data &middot; {orders.length} orders processed
          </p>
        </div>

        {/* ═══ Premium Action Bar ═══ */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Range Buttons */}
          <div className={`flex rounded-xl border overflow-hidden ${dark ? 'border-zinc-800' : 'border-gray-200'}`}>
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => { setRange(opt.key); if (opt.key !== 'custom') setCalendarOpen(false); }}
                className={`px-2 sm:px-3 py-2 text-[11px] sm:text-sm font-medium transition-all ${
                  range === opt.key
                    ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white'
                    : dark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >{opt.label}</button>
            ))}
          </div>

          {/* Unified Premium Date Range Trigger */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => { setRange('custom'); setCalendarOpen(!calendarOpen); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                range === 'custom'
                  ? dark ? 'bg-zinc-900 border-emerald-500/50 text-zinc-200' : 'bg-white border-emerald-400 text-gray-800'
                  : dark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Calendar size={16} className={range === 'custom' ? 'text-emerald-500' : dark ? 'text-zinc-500' : 'text-gray-400'} />
              <span>
                {customStart && customEnd
                  ? `${formatDateForDisplay(customStart)} — ${formatDateForDisplay(customEnd)}`
                  : 'Select Range'}
              </span>
              <ChevronDown size={14} className={`${dark ? 'text-zinc-500' : 'text-gray-400'} transition-transform ${calendarOpen ? 'rotate-180' : ''}`} />
              {(customStart || customEnd) && (
                <button
                  onClick={e => { e.stopPropagation(); setCustomStart(''); setCustomEnd(''); setRange('30d'); }}
                  className={`p-0.5 rounded ${dark ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'}`}
                ><X size={12} /></button>
              )}
            </button>

            {/* Floating Calendar Panel */}
            {calendarOpen && (
              <div className={`absolute z-50 right-0 mt-2 w-[320px] rounded-2xl border shadow-2xl p-4 ${
                dark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
              }`}>
                {/* Calendar Nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => { if (calendarViewMonth === 0) { setCalendarViewMonth(11); setCalendarViewYear(y => y-1); } else setCalendarViewMonth(m => m-1); }}
                    className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  ><ChevronDown size={16} className="rotate-90" /></button>
                  <span className={`text-sm font-semibold ${dark ? 'text-zinc-200' : 'text-gray-800'}`}>
                    {MONTHS[calendarViewMonth]} {calendarViewYear}
                  </span>
                  <button
                    onClick={() => { if (calendarViewMonth === 11) { setCalendarViewMonth(0); setCalendarViewYear(y => y+1); } else setCalendarViewMonth(m => m+1); }}
                    className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  ><ChevronDown size={16} className="-rotate-90" /></button>
                </div>
                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(d => (
                    <div key={d} className={`text-[10px] font-medium text-center ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>{d}</div>
                  ))}
                </div>
                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calendarViewYear}-${String(calendarViewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const isStart = dateStr === customStart;
                    const isEnd = dateStr === customEnd;
                    const inRange = customStart && customEnd && dateStr >= customStart && dateStr <= customEnd;
                    const isToday = calendarViewYear === today.getFullYear() && calendarViewMonth === today.getMonth() && day === today.getDate();
                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={`w-full aspect-square rounded-lg text-xs font-medium transition-all ${
                          isStart || isEnd
                            ? 'bg-emerald-500 text-white'
                            : inRange
                              ? dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                              : dark
                                ? 'text-zinc-300 hover:bg-zinc-800'
                                : 'text-gray-700 hover:bg-gray-100'
                        } ${isToday && !isStart && !isEnd ? dark ? 'ring-1 ring-zinc-600' : 'ring-1 ring-gray-300' : ''}`}
                      >{day}</button>
                    );
                  })}
                </div>
                {/* Quick Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t ${dark ? 'border-zinc-800' : 'border-gray-200'}">
                  <button
                    onClick={() => { setCustomStart(''); setCustomEnd(''); }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                      dark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >Clear</button>
                  <button
                    onClick={() => setCalendarOpen(false)}
                    className="text-xs font-medium px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                  >Apply</button>
                </div>
              </div>
            )}
          </div>

          {/* Custom Month + Year Selectors */}
          <CustomSelect value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} placeholder="All Months" dark={dark} />
          <CustomSelect value={selectedYear} onChange={setSelectedYear} options={yearOptions} placeholder="All Years" dark={dark} />

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download PDF Report</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* ═══ Active Filter Indicators ═══ */}
      {(selectedMonth > 0 || selectedYear > 0) && (
        <div className={`flex flex-wrap items-center gap-2 ${cardClass} !py-3 !px-4`}>
          <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Active Filters:</span>
          {selectedMonth > 0 && (
            <button onClick={() => setSelectedMonth(0)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${dark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
              {MONTHS[selectedMonth-1]} <span className="ml-1">&times;</span>
            </button>
          )}
          {selectedYear > 0 && (
            <button onClick={() => setSelectedYear(0)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${dark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
              {selectedYear} <span className="ml-1">&times;</span>
            </button>
          )}
        </div>
      )}

      {/* ═══ KPI Metric Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(metrics.totalRevenue)} icon={DollarSign} change={`${filteredOrders.length} verified payments`} />
        <StatCard label="Total Orders" value={metrics.totalOrders.toString()} icon={ShoppingBag} change={`${metrics.pendingOrders} pending · ${metrics.deliveredOrders} delivered`} />
        <StatCard label="Active Customers" value={totalCustomersInSystem.toString()} icon={Users} change={`${allTimeOrderCustomers} have placed orders`} />
        <StatCard label="Fulfillment Rate" value={`${metrics.fulfillmentRate.toFixed(1)}%`} icon={BarChart3} change={`${metrics.deliveredOrders} of ${metrics.totalOrders} delivered`} up={metrics.fulfillmentRate >= 50} />
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Revenue Trend */}
        <div className={cardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className={`text-base sm:text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Revenue & Sales Trend</h3>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" /><span className={`text-[10px] sm:text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Revenue</span></div>
              <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dark ? 'bg-neutral-500' : 'bg-neutral-400'}`} /><span className={`text-[10px] sm:text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Orders</span></div>
            </div>
          </div>
          <div className="h-52 sm:h-64">
            {revenueTrend.length === 0 ? (
              <div className={`h-full flex items-center justify-center text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No revenue data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs><linearGradient id="revG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#262626' : '#e5e5e5'} />
                  <XAxis dataKey="month" tick={{ fontSize:10, fill: dark ? '#737373' : '#a3a3a3' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize:10, fill: dark ? '#737373' : '#a3a3a3' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value:number, name:string) => [name==='revenue' ? formatCurrency(value) : value, name==='revenue' ? 'Revenue' : 'Orders']} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revG)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="orders" stroke={dark ? '#737373' : '#a3a3a3'} strokeWidth={2} fill="none" strokeDasharray="4 4" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className={cardClass}>
          <h3 className={`text-base sm:text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Order Status Distribution</h3>
          {statusDistribution.length === 0 ? (
            <div className={`h-52 flex items-center justify-center text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No orders for this period</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="h-48 w-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={2} stroke={dark ? '#0a0a0a' : '#fff'} isAnimationActive={false}>
                      {statusDistribution.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {statusDistribution.map((s,i) => {
                  const pct = (s.value / filteredOrders.length) * 100;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:s.color }} /><span className={`text-xs sm:text-sm truncate ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{s.name}</span></div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`w-16 sm:w-20 h-1.5 rounded-full overflow-hidden ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}><div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:s.color }} /></div>
                        <span className={`text-xs font-medium w-12 text-right ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Top Products ═══ */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Layers className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
          <h3 className={`text-base sm:text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Top 5 Best Selling Products</h3>
          {topProducts.length > 0 && <span className={`text-xs ml-auto ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>From {filteredOrders.filter(o => ['PAID','PAYMENT_VERIFIED','PROCESSING','SHIPPED','DELIVERED'].includes(o.status)).length} paid orders</span>}
        </div>
        {topProducts.length === 0 ? (
          <p className={`text-sm py-8 text-center ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No product sales data available for this period.</p>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
            <table className="w-full min-w-[450px]">
              <thead><tr className={dark ? 'border-b border-zinc-800' : 'border-b border-gray-200'}>
                {['#','Product Name','Units Sold','Revenue','Share'].map(h => <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-gray-600'}`}>{h}</th>)}
              </tr></thead>
              <tbody>{topProducts.map((p,i) => {
                const share = topProductTotalRev > 0 ? ((p.revenue/topProductTotalRev)*100).toFixed(1) : '0';
                return (
                  <tr key={p.name} className={`${dark ? 'border-b border-zinc-800/50 hover:bg-zinc-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                    <td className={`px-4 py-3 text-sm font-medium ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{i+1}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-zinc-800' : 'bg-gray-100'}`}><Package className={`w-4 h-4 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} /></div><span className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</span></div></td>
                    <td className={`px-4 py-3 text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{p.unitsSold}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className={`w-16 h-1.5 rounded-full overflow-hidden ${dark ? 'bg-zinc-800' : 'bg-gray-100'}`}><div className="h-full rounded-full bg-emerald-500" style={{ width:`${share}%` }} /></div><span className={`text-xs ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{share}%</span></div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ Footer ═══ */}
      <div className={`${cardClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2"><Clock className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} /><span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Data powered by live API &middot; {orders.length} total orders in system</span></div>
        <div className="flex items-center gap-3 text-xs">
          <span className={`${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Revenue: <strong className={dark ? 'text-white' : 'text-gray-900'}>{formatCurrency(metrics.totalRevenue)}</strong></span>
          <span className={`${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Orders: <strong className={dark ? 'text-white' : 'text-gray-900'}>{metrics.totalOrders}</strong></span>
          <span className={`${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Fulfillment: <strong className="text-emerald-500">{metrics.fulfillmentRate.toFixed(1)}%</strong></span>
        </div>
      </div>
    </div>
  );
};