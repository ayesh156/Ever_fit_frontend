import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../lib/utils';
import { get } from '../lib/api';
import {
  mockDailySales, mockProducts, mockInvoices, mockSuppliers, mockCustomers,
  categoryRevenue, topSellingProducts,
} from '../data/mockData';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Package, Users, Truck, FileText, AlertTriangle, Star, CreditCard, Clock,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const [webOrders, setWebOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchWebOrders = async () => {
      try {
        const data = await get<any[]>('/orders');
        const bank = data.filter((o: any) => o.paymentMethod === 'bank-transfer' || o.customerName !== 'Walk-in Customer').slice(0, 5);
        setWebOrders(bank);
      } catch {}
    };
    fetchWebOrders();
  }, []);

  // Sales Data
  const salesData = mockDailySales.slice(-14);
  const todayRevenue = salesData[salesData.length - 1]?.revenue || 0;
  const yesterdayRevenue = salesData[salesData.length - 2]?.revenue || 0;
  const revChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;
  const totalRevenue14d = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit14d = salesData.reduce((s, d) => s + d.profit, 0);

  const chartData = salesData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    profit: d.profit,
  }));

  // Inventory
  const inStock = mockProducts.filter(p => p.status === 'in-stock').length;
  const lowStock = mockProducts.filter(p => p.status === 'low-stock').length;
  const outOfStock = mockProducts.filter(p => p.status === 'out-of-stock').length;
  const lowStockProducts = mockProducts.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock').slice(0, 5);

  // Invoices
  const paidInvoices = mockInvoices.filter(i => i.status === 'paid');
  const pendingInvoices = mockInvoices.filter(i => i.status === 'pending' || i.status === 'partial');
  const totalOutstanding = mockInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const recentInvoices = [...mockInvoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Customers
  const activeCustomers = mockCustomers.filter(c => c.status === 'active').length;
  const vipCustomers = mockCustomers.filter(c => c.customerType === 'VIP').length;
  const customerOutstanding = mockCustomers.reduce((s, c) => s + c.outstandingBalance, 0);
  const topCustomersBySpend = [...mockCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 4);

  // Suppliers
  const activeSuppliers = mockSuppliers.filter(s => s.status === 'active').length;
  const supplierOutstanding = mockSuppliers.reduce((s, sup) => s + sup.outstandingBalance, 0);
  const avgRating = mockSuppliers.filter(s => s.status === 'active').reduce((s, sup) => s + sup.rating, 0) / (activeSuppliers || 1);

  const cardClass = `rounded-2xl border p-3 sm:p-5 ${
    theme === 'dark' ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
  }`;

  const tooltipStyle = {
    background: theme === 'dark' ? '#171717' : '#fff',
    border: `1px solid ${theme === 'dark' ? '#262626' : '#e5e5e5'}`,
    borderRadius: '12px',
    color: theme === 'dark' ? '#fff' : '#171717',
    fontSize: 12,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={`mt-1 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
          Welcome back — here's your business at a glance
        </p>
      </div>

      {/* ═══════ KEY METRICS ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Revenue */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Today's Revenue</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(todayRevenue)}</p>
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${revChange >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                {revChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(revChange).toFixed(1)}%</span>
              </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </div>
        </div>

        {/* Total Invoices */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Invoices</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{mockInvoices.length}</p>
              <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-amber-400">
                <Clock className="w-3 h-3" />
                <span>{pendingInvoices.length} pending</span>
              </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Products</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{mockProducts.length}</p>
              {lowStock + outOfStock > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{lowStock + outOfStock} need attention</span>
                </div>
              )}
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Customers</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{mockCustomers.length}</p>
              <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-green-500">
                <Star className="w-3 h-3" />
                <span>{vipCustomers} VIP</span>
              </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ FINANCIALS ROW ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`${cardClass} flex items-center gap-3`}>
          <div className={`p-2.5 rounded-xl bg-green-500/10`}><TrendingUp className="w-5 h-5 text-green-500" /></div>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>14d Revenue</p>
            <p className={`text-sm sm:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalRevenue14d)}</p>
          </div>
        </div>
        <div className={`${cardClass} flex items-center gap-3`}>
          <div className={`p-2.5 rounded-xl bg-blue-500/10`}><BarChart3 className="w-5 h-5 text-blue-400" /></div>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>14d Profit</p>
            <p className={`text-sm sm:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalProfit14d)}</p>
          </div>
        </div>
        <div className={`${cardClass} flex items-center gap-3`}>
          <div className={`p-2.5 rounded-xl bg-red-500/10`}><CreditCard className="w-5 h-5 text-red-400" /></div>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Outstanding</p>
            <p className={`text-sm sm:text-base font-bold text-red-400`}>{formatCurrency(totalOutstanding + customerOutstanding)}</p>
          </div>
        </div>
        <div className={`${cardClass} flex items-center gap-3`}>
          <div className={`p-2.5 rounded-xl bg-amber-500/10`}><Truck className="w-5 h-5 text-amber-400" /></div>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Supplier Payable</p>
            <p className={`text-sm sm:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(supplierOutstanding)}</p>
          </div>
        </div>
      </div>

      {/* ═══════ REVENUE CHART + CATEGORY ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Revenue Chart */}
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Revenue & Profit (14 Days)</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-brand-900'}`} />
                <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-neutral-500' : 'bg-neutral-400'}`} />
                <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Profit</span>
              </div>
            </div>
          </div>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme === 'dark' ? '#fff' : '#171717'} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={theme === 'dark' ? '#fff' : '#171717'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Profit']} />
                <Area type="monotone" dataKey="revenue" stroke={theme === 'dark' ? '#fff' : '#171717'} strokeWidth={2} fill="url(#dashGrad)" />
                <Area type="monotone" dataKey="profit" stroke={theme === 'dark' ? '#737373' : '#a3a3a3'} strokeWidth={2} fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Revenue Bars */}
        <div className={cardClass}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Category Revenue</h3>
          <div className="space-y-3">
            {categoryRevenue.slice(0, 6).map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`}>{c.name}</span>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{c.percentage}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <div className={`h-full rounded-full transition-all duration-500 ${theme === 'dark' ? 'bg-white' : 'bg-brand-900'}`} style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ MIDDLE ROW: INVOICES + PRODUCTS + CUSTOMERS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Invoices */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Invoices</h3>
            <span className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{paidInvoices.length} paid</span>
          </div>
          <div className="space-y-2">
            {recentInvoices.map(inv => (
              <div key={inv.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                theme === 'dark' ? 'hover:bg-neutral-800/40' : 'hover:bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  inv.status === 'paid' ? 'bg-green-500/10 text-green-500'
                  : inv.status === 'partial' ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-red-500/10 text-red-400'
                }`}>
                  {inv.invoiceNumber.replace('INV-', '#')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{inv.customerName}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(inv.total)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    inv.status === 'paid' ? 'bg-green-500/10 text-green-500'
                    : inv.status === 'partial' ? 'bg-amber-500/10 text-amber-500'
                    : inv.status === 'pending' ? 'bg-red-500/10 text-red-400'
                    : 'bg-neutral-500/10 text-neutral-500'
                  }`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className={cardClass}>
          <h3 className={`text-base font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Selling Products</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellingProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} />
                <XAxis type="number" tick={{ fontSize: 9, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 8, fill: theme === 'dark' ? '#a3a3a3' : '#525252' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value)]} />
                <Bar dataKey="revenue" fill={theme === 'dark' ? '#ffffff' : '#171717'} radius={[0, 6, 6, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Customers</h3>
            <span className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{activeCustomers} active</span>
          </div>
          <div className="space-y-2">
            {topCustomersBySpend.map((c, i) => (
              <div key={c.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                theme === 'dark' ? 'hover:bg-neutral-800/40' : 'hover:bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'
                }`}>#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{c.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>
                    {c.customerType}
                    {c.outstandingBalance > 0 && <span className="text-red-400 ml-1.5">Owes {formatCurrency(c.outstandingBalance)}</span>}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(c.totalSpent)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ WEB ORDERS WIDGET ═══════ */}
      {webOrders.length > 0 && (
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Web Orders</h3>
          </div>
          <div className="space-y-2">
            {webOrders.map((o: any) => (
              <div key={o.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-neutral-800/40' : 'hover:bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'}`}>#{o.id}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{o.customerName}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {o.items?.length || 0} items</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(o.totalAmount)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    o.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500'
                    : o.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-500'
                    : o.status === 'PROCESSING' ? 'bg-amber-500/10 text-amber-500'
                    : o.status === 'PAYMENT_REVIEW' || o.status === 'PENDING_RECEIPT' ? 'bg-purple-500/10 text-purple-500'
                    : 'bg-neutral-500/10 text-neutral-500'
                  }`}>{o.status?.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ BOTTOM ROW: STOCK ALERTS + SUPPLIERS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Low Stock Alerts */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Stock Alerts</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className={`text-sm ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>All products are well-stocked.</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map(p => (
                <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                  theme === 'dark' ? 'bg-neutral-800/30' : 'bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.status === 'out-of-stock' ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}>
                    <Package className={`w-4 h-4 ${p.status === 'out-of-stock' ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{p.sku} · Threshold: {p.lowStockThreshold}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${p.stock === 0 ? 'text-red-400' : 'text-amber-400'}`}>{p.stock}</p>
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>units</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className={`mt-4 grid grid-cols-3 gap-2`}>
            <div className={`p-2.5 rounded-lg text-center ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
              <p className="text-green-500 text-lg font-bold">{inStock}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>In Stock</p>
            </div>
            <div className={`p-2.5 rounded-lg text-center ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
              <p className="text-amber-400 text-lg font-bold">{lowStock}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Low</p>
            </div>
            <div className={`p-2.5 rounded-lg text-center ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
              <p className="text-red-400 text-lg font-bold">{outOfStock}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Out</p>
            </div>
          </div>
        </div>

        {/* Suppliers Overview */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4">
            <Truck className={`w-5 h-5 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`} />
            <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Supplier Overview</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Active Suppliers</p>
              <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activeSuppliers}</p>
            </div>
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Avg Rating</p>
              <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <Star className="w-4 h-4 text-amber-400 inline mr-1" />{avgRating.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[...mockSuppliers].sort((a, b) => b.outstandingBalance - a.outstandingBalance).slice(0, 4).map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                theme === 'dark' ? 'hover:bg-neutral-800/40' : 'hover:bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  s.status === 'active' ? theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100' : 'bg-neutral-500/10'
                }`}>
                  <Truck className={`w-4 h-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{s.supplyType} · {s.totalOrders} orders</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${s.outstandingBalance > 0 ? 'text-red-400' : theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {formatCurrency(s.outstandingBalance)}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < s.rating ? 'text-amber-400 fill-amber-400' : theme === 'dark' ? 'text-neutral-700' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {supplierOutstanding > 0 && (
            <div className={`mt-4 p-3 rounded-xl border ${theme === 'dark' ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                Total payable to suppliers: <span className="font-bold">{formatCurrency(supplierOutstanding)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
