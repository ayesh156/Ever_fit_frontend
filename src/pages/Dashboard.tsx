import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../lib/utils';
import { get } from '../lib/api';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Package, Users, AlertTriangle, Star, Clock, Loader2,
  BarChart3, ShoppingBag, AlertCircle, Eye,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────
interface DashboardMetrics {
  todayRevenue: number;
  revenueGrowth: number;
  pendingOrdersCount: number;
  lowStockItemsCount: number;
  totalActiveCustomers: number;
  recentOrders: {
    id: number;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    createdAt: string;
  }[];
  lowStockProducts: {
    id: number;
    productId: number;
    productName: string;
    size: string;
    color: string;
    sku: string;
    stock: number;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  PENDING_RECEIPT: 'Pending Receipt',
  PAYMENT_REVIEW: 'Payment Review',
  PAYMENT_VERIFIED: 'Payment Verified',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-500',
  PAID: 'bg-green-500/10 text-green-500',
  CANCELLED: 'bg-red-500/10 text-red-400',
  PENDING_RECEIPT: 'bg-amber-500/10 text-amber-500',
  PAYMENT_REVIEW: 'bg-purple-500/10 text-purple-500',
  PAYMENT_VERIFIED: 'bg-blue-500/10 text-blue-500',
  PROCESSING: 'bg-amber-500/10 text-amber-500',
  SHIPPED: 'bg-blue-500/10 text-blue-500',
  DELIVERED: 'bg-green-500/10 text-green-500',
};

export const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await get<DashboardMetrics>('/dashboard/live-metrics');
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // ── Socket.io live sync ──────────────────────────────────────────────────
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const wsBase = apiBase.replace(/\/api\/?$/, '');
    let socket: any = null;

    import('socket.io-client').then(({ io }) => {
      socket = io(wsBase, { transports: ['websocket', 'polling'] });

      socket.on('connect', () => {
        console.log('[Dashboard] Socket connected');
      });

      socket.on('newOrder', (order: any) => {
        setMetrics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pendingOrdersCount: prev.pendingOrdersCount + 1,
            recentOrders: [
              {
                id: order.id,
                customerName: order.customerName || 'Walk-in Customer',
                totalAmount: order.totalAmount,
                paidAmount: order.paidAmount,
                status: order.status,
                createdAt: order.createdAt,
              },
              ...prev.recentOrders,
            ].slice(0, 5),
          };
        });
      });

      socket.on('orderUpdated', (order: any) => {
        setMetrics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            recentOrders: prev.recentOrders.map(o =>
              o.id === order.id
                ? { ...o, status: order.status, totalAmount: order.totalAmount, paidAmount: order.paidAmount }
                : o
            ),
          };
        });
      });
    });

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // ── Styles ───────────────────────────────────────────────────────────────
  const cardClass = `rounded-2xl border p-3 sm:p-5 ${
    dark ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-white border-gray-200 shadow-sm'
  }`;

  if (loading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-4`}>
        <Loader2 className={`w-10 h-10 animate-spin ${dark ? 'text-neutral-400' : 'text-gray-400'}`} />
        <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>Loading operational dashboard…</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-4`}>
        <AlertCircle className={`w-12 h-12 ${dark ? 'text-neutral-600' : 'text-gray-300'}`} />
        <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>{error || 'No data available'}</p>
        <button
          onClick={() => { setLoading(true); fetchMetrics(); }}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
        >Retry</button>
      </div>
    );
  }

  const {
    todayRevenue,
    revenueGrowth,
    pendingOrdersCount,
    lowStockItemsCount,
    totalActiveCustomers,
    recentOrders,
    lowStockProducts,
  } = metrics;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={`mt-1 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Real-time operational command center &middot; Live data from {import.meta.env.VITE_API_URL || 'backend'}
        </p>
      </div>

      {/* ═══════ TOP KPI ROW ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Revenue */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Today's Revenue</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(todayRevenue)}</p>
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${revenueGrowth >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(revenueGrowth).toFixed(1)}% vs yesterday</span>
              </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Pending Orders</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                {pendingOrdersCount}
                {pendingOrdersCount > 0 && (
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </p>
              <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-amber-400">
                <Clock className="w-3 h-3" />
                <span>Requires attention</span>
              </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <ShoppingBag className={`w-4 h-4 sm:w-5 sm:h-5 ${dark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Low Stock Alerts</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${lowStockItemsCount > 0 ? 'text-red-400' : dark ? 'text-white' : 'text-gray-900'}`}>
                {lowStockItemsCount}
              </p>
              {lowStockItemsCount > 0 ? (
                <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Needs restocking</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-emerald-500">
                  <Star className="w-3 h-3" />
                  <span>Well-stocked</span>
                </div>
              )}
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${lowStockItemsCount > 0 ? 'text-red-400' : dark ? 'text-neutral-400' : 'text-gray-500'}`} />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Active Customers</p>
              <p className={`text-lg sm:text-xl font-bold mt-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{totalActiveCustomers}</p>
              <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-emerald-500">
                <Users className="w-3 h-3" />
                <span>Registered in system</span>
              </div>
            </div>
            <div className={`p-2 sm:p-2.5 rounded-xl ${dark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
              <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ MAIN GRID: Recent Orders + Inventory Alerts ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left: Recent Orders Quick-View */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className={`w-5 h-5 ${dark ? 'text-neutral-400' : 'text-gray-500'}`} />
              <h3 className={`text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Recent Orders</h3>
            </div>
            <NavLink
              to="/system/orders"
              className={`text-xs font-medium flex items-center gap-1 transition-all ${
                dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              View All <Eye className="w-3 h-3" />
            </NavLink>
          </div>
          {recentOrders.length === 0 ? (
            <p className={`text-sm py-6 text-center ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No recent orders</p>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className={dark ? 'border-b border-neutral-800' : 'border-b border-gray-200'}>
                    {['Order ID', 'Customer', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-neutral-500' : 'text-gray-500'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className={`${dark ? 'border-b border-neutral-800/50 hover:bg-neutral-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-3 py-2.5 text-sm font-mono font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>#{order.id}</td>
                      <td className={`px-3 py-2.5 text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>{order.customerName}</td>
                      <td className={`px-3 py-2.5 text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.totalAmount)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          STATUS_COLORS[order.status] || 'bg-neutral-500/10 text-neutral-500'
                        } ${dark ? 'border-transparent' : ''}`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {STATUS_LABELS[order.status] || order.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <NavLink
                          to={`/system/invoices`}
                          className={`text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                            dark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Inventory Alerts */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${lowStockItemsCount > 0 ? 'text-red-400' : dark ? 'text-neutral-400' : 'text-gray-500'}`} />
              <h3 className={`text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Inventory Alerts</h3>
            </div>
            <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
              {lowStockItemsCount > 0 ? `${lowStockItemsCount} items low` : 'All stocked'}
            </span>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Package className={`w-10 h-10 ${dark ? 'text-neutral-700' : 'text-gray-200'}`} />
              <p className={`text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>All products are well-stocked</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map(p => (
                <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  dark ? 'bg-neutral-800/30 hover:bg-neutral-800/50' : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    p.stock === 0 ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}>
                    <Package className={`w-4 h-4 ${p.stock === 0 ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{p.productName}</p>
                    <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{p.color} · {p.size} · {p.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      p.stock === 0
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {p.stock === 0 ? 'OUT' : `Only ${p.stock}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Quick Stats Row */}
          <div className={`mt-4 grid grid-cols-2 gap-3`}>
            <div className={`p-3 rounded-xl ${dark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Pending Orders</p>
              <p className={`text-xl font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                {pendingOrdersCount}
                {pendingOrdersCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${dark ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>Revenue Today</p>
              <p className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(todayRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ SUMMARY FOOTER ═══════ */}
      <div className={`${cardClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <BarChart3 className={`w-4 h-4 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
          <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Data refreshes on page load &middot; Real-time via Socket.io
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {revenueGrowth >= 0 ? (
            <span className="text-emerald-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {revenueGrowth.toFixed(1)}% growth
            </span>
          ) : (
            <span className="text-red-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {Math.abs(revenueGrowth).toFixed(1)}% decline
            </span>
          )}
          <span className={`${dark ? 'text-neutral-500' : 'text-gray-400'}`}>
            {pendingOrdersCount} pending / {lowStockItemsCount} low stock
          </span>
        </div>
      </div>
    </div>
  );
};