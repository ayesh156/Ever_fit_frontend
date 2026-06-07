import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { get, post } from '../../lib/api';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { ArrowLeft, Search, Package, Clock, CheckCircle, XCircle, Loader, Upload, Eye } from 'lucide-react';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const statusSteps = ['PENDING_RECEIPT', 'PAYMENT_REVIEW', 'PAYMENT_VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const statusLabels: Record<string, string> = {
  PENDING_RECEIPT: 'Pending Receipt', PAYMENT_REVIEW: 'Payment Review', PAYMENT_VERIFIED: 'Paid',
  PROCESSING: 'Processing', SHIPPED: 'Shipped', DELIVERED: 'Delivered', PAID: 'Paid', PENDING: 'Pending', CANCELLED: 'Cancelled',
};

export const TrackOrder: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const data = await get<any[]>(`/orders/by-phone/${encodeURIComponent(phone)}`);
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const socket = io(baseUrl);
    socket.on('orderStatusUpdated', (data: { orderId: number; status: string }) => {
      setOrders(prev => prev ? prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o) : prev);
    });
    socket.on('orderUpdated', (updatedOrder: any) => {
      console.log("[TrackOrder] orderUpdated received:", updatedOrder?.id);
      setOrders(prev => prev ? prev.map(o => o.id === updatedOrder.id ? updatedOrder : o) : prev);
    });
    return () => { socket.disconnect(); };
  }, []);

  const handleUpload = async (orderId: number) => {
    if (!receiptFile) { toast.error('Select a file first'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('receipt', receiptFile);
      await post<any>(`/orders/${orderId}/upload-receipt`, fd);
      toast.success('Receipt uploaded. Waiting for admin approval.');
      setReceiptFile(null);
      handleSearch();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const currentStep = (status: string) => statusSteps.indexOf(status);
  const needsUpload = (order: any) => !order.paymentReceiptUrl && (order.status === 'PENDING_RECEIPT' || order.status === 'PENDING');

  const getStatusMessage = (status: string, hasReceipt: boolean) => {
    switch (status) {
      case 'PENDING_RECEIPT':   return { text: hasReceipt ? 'Receipt Uploaded - Awaiting Approval' : 'Awaiting Bank Receipt', color: 'text-amber-500' };
      case 'PAYMENT_REVIEW':    return { text: 'Receipt Under Review', color: 'text-amber-500' };
      case 'PAYMENT_VERIFIED':  return { text: 'Payment Verified - Order is being processed', color: 'text-green-500' };
      case 'PAID':              return { text: 'Payment Verified - Order is being processed', color: 'text-green-500' };
      case 'PROCESSING':        return { text: 'Order is Being Processed', color: 'text-cyan-500' };
      case 'SHIPPED':            return { text: 'Order Shipped & On the Way', color: 'text-indigo-500' };
      case 'DELIVERED':          return { text: 'Order Successfully Delivered', color: 'text-emerald-500' };
      case 'CANCELLED':          return { text: 'Order Cancelled', color: 'text-red-500' };
      default:                   return { text: 'Processing Order', color: 'text-gray-500' };
    }
  };

  return (
    <div className={`min-h-screen ${dark ? 'bg-brand-950' : 'bg-[#f9f7f4]'}`}>
      <div className="max-w-2xl mx-auto px-4 py-10 lg:py-14">
        <NavLink to="/" className={`inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors ${dark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-brand-900'}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </NavLink>

        <h1 className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-brand-900'}`}>Track Your Order</h1>
        <p className={`text-sm mb-8 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>Enter your phone number to look up your orders.</p>

        <div className="flex gap-2 mb-8">
          <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Phone number (e.g. 077-1234567)"
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm ${dark ? 'bg-neutral-800/50 border-neutral-700/50 text-white placeholder-neutral-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
          <button onClick={handleSearch} disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {orders && orders.length === 0 && (
          <p className={`text-center py-8 text-sm ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>No orders found for this phone number.</p>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const step = currentStep(order.status);
              const isExpanded = expandedId === order.id;
              const isPaid = order.status === 'PAYMENT_VERIFIED' || order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED' || (order.paidAmount && order.paidAmount >= order.totalAmount);
              return (
                <div key={order.id} className={`p-5 rounded-xl border cursor-pointer transition-all ${isPaid ? 'border-t-4 border-t-green-500 border-green-500/20 bg-gradient-to-b from-green-500/[0.04] to-transparent' : dark ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Order #{order.id}</p>
                      <p className={`text-xs ${dark ? 'text-neutral-500' : 'text-gray-400'}`}>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${order.status === 'DELIVERED' ? dark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200' : order.status === 'PAYMENT_VERIFIED' || order.status === 'PAID' ? dark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200' : order.status === 'CANCELLED' ? dark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200' : dark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  {step >= 0 && (
                    <div className="flex items-center gap-1 mb-4">
                      {statusSteps.map((s, i) => (
                        <React.Fragment key={s}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i <= step ? dark ? 'bg-white text-black' : 'bg-brand-900 text-white' : dark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-200 text-gray-400'}`}>
                            {i < step ? <CheckCircle className="w-3 h-3" /> : i === step ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          </div>
                          {i < statusSteps.length - 1 && <div className={`flex-1 h-px ${i < step ? dark ? 'bg-white' : 'bg-brand-900' : dark ? 'bg-neutral-800' : 'bg-gray-200'}`} />}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  <div className={`p-4 rounded-xl mt-2 ${isPaid ? 'bg-green-500/5 border border-green-500/10' : dark ? 'bg-neutral-900/50 border border-neutral-800/60' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isPaid ? 'text-green-500' : dark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                      <span className={`text-xl font-bold ${isPaid ? 'text-green-500' : dark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(order.totalAmount)}</span>
                    </div>
                    {isPaid && (
                      <p className="text-xs mt-1 flex items-center gap-1 text-green-500 font-semibold">
                        <CheckCircle className="w-3 h-3" /> Fully Paid
                      </p>
                    )}
                    {!isPaid && getStatusMessage(order.status, !!order.paymentReceiptUrl) && (
                      <p className={`${getStatusMessage(order.status, !!order.paymentReceiptUrl).color} text-xs mt-1 flex items-center gap-1`}>
                        <CheckCircle size={12} /> {getStatusMessage(order.status, !!order.paymentReceiptUrl).text}
                      </p>
                    )}
                  </div>

                  {isExpanded && (
                    <div className={`mt-3 pt-3 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`} onClick={e => e.stopPropagation()}>
                      <p className={`text-xs font-semibold mb-2 ${dark ? 'text-neutral-400' : 'text-gray-500'}`}>ITEMS</p>
                      {(order.items || []).map((item: any, idx: number) => (
                        <div key={idx} className={`flex justify-between py-1.5 text-sm ${dark ? 'text-neutral-300' : 'text-gray-700'}`}>
                          <span className="flex-1 truncate">{item.variant?.product?.name || `Product #${item.variantId}`}</span>
                          <span className="flex-shrink-0 ml-2">x{item.quantity} @ {formatPrice(item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && needsUpload(order) && (
                    <div className={`mt-4 pt-4 border-t ${dark ? 'border-neutral-800' : 'border-gray-100'}`} onClick={e => e.stopPropagation()}>
                      <p className={`text-sm font-medium mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Upload Bank Payment Receipt</p>
                      <div className={`border-2 border-dashed rounded-xl p-6 text-center ${dark ? 'border-neutral-700' : 'border-gray-300'}`}>
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${dark ? 'text-neutral-500' : 'text-gray-400'}`} />
                        <input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                          className={`block w-full text-sm mb-3 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:text-sm file:font-medium ${dark ? 'file:bg-neutral-800 file:text-neutral-200 file:border-0 text-neutral-400' : 'file:bg-gray-100 file:text-gray-700 file:border-0 text-gray-500'}`} />
                        <button onClick={() => handleUpload(order.id)} disabled={!receiptFile || uploading}
                          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${dark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-brand-900 text-white hover:bg-brand-800'}`}>
                          {uploading ? <Loader className="w-4 h-4 inline animate-spin mr-1" /> : null}
                          {uploading ? 'Uploading...' : 'Submit Receipt'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};