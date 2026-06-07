import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../lib/utils';
import {
  mockDailySales, mockProducts, mockInvoices, mockSuppliers, mockCustomers,
  categoryRevenue, topSellingProducts,
} from '../data/mockData';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag, Download, ArrowUpRight,
  ArrowDownRight, Package, Users, Truck, FileText, AlertTriangle, CreditCard,
  Star, Clock, ShoppingCart,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportTab = 'sales' | 'inventory' | 'invoices' | 'customers' | 'suppliers';

const TABS: { key: ReportTab; label: string; icon: React.ElementType }[] = [
  { key: 'sales', label: 'Sales', icon: TrendingUp },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'suppliers', label: 'Suppliers', icon: Truck },
];

export const Reports: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [period, setPeriod] = useState<'7d' | '14d' | '30d'>('14d');

  const daysMap = { '7d': 7, '14d': 14, '30d': 30 };
  const salesData = mockDailySales.slice(-daysMap[period]);
  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = salesData.reduce((s, d) => s + d.profit, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const chartSalesData = salesData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    profit: d.profit,
    orders: d.orders,
  }));

  const pieColors = theme === 'dark'
    ? ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626']
    : ['#171717', '#262626', '#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4'];

  // Inventory stats
  const inStockCount = mockProducts.filter(p => p.status === 'in-stock').length;
  const lowStockCount = mockProducts.filter(p => p.status === 'low-stock').length;
  const outStockCount = mockProducts.filter(p => p.status === 'out-of-stock').length;
  const totalStockValue = mockProducts.reduce((s, p) => s + (p.costPrice * p.stock), 0);
  const totalRetailValue = mockProducts.reduce((s, p) => s + (p.sellingPrice * p.stock), 0);
  const totalStockUnits = mockProducts.reduce((s, p) => s + p.stock, 0);
  const stockStatusData = [
    { name: 'In Stock', value: inStockCount },
    { name: 'Low Stock', value: lowStockCount },
    { name: 'Out of Stock', value: outStockCount },
  ];
  const stockColors = ['#22c55e', '#f59e0b', '#ef4444'];

  // Invoice stats
  const paidInvoices = mockInvoices.filter(i => i.status === 'paid');
  const partialInvoices = mockInvoices.filter(i => i.status === 'partial');
  const pendingInvoices = mockInvoices.filter(i => i.status === 'pending');
  const cancelledInvoices = mockInvoices.filter(i => i.status === 'cancelled');
  const totalInvoiceAmount = mockInvoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = mockInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = totalInvoiceAmount - totalCollected;
  const invoiceStatusData = [
    { name: 'Paid', value: paidInvoices.length, color: '#22c55e' },
    { name: 'Partial', value: partialInvoices.length, color: '#f59e0b' },
    { name: 'Pending', value: pendingInvoices.length, color: '#ef4444' },
    { name: 'Cancelled', value: cancelledInvoices.length, color: '#737373' },
  ];

  // Customer stats
  const activeCustomers = mockCustomers.filter(c => c.status === 'active');
  const vipCustomers = mockCustomers.filter(c => c.customerType === 'VIP');
  const totalCustomerOutstanding = mockCustomers.reduce((s, c) => s + c.outstandingBalance, 0);
  const totalCustomerSpent = mockCustomers.reduce((s, c) => s + c.totalSpent, 0);
  const avgCustomerSpend = activeCustomers.length > 0 ? totalCustomerSpent / activeCustomers.length : 0;
  const customerTypeData = useMemo(() => {
    const map = new Map<string, number>();
    mockCustomers.forEach(c => map.set(c.customerType, (map.get(c.customerType) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, []);

  // Supplier stats
  const activeSuppliers = mockSuppliers.filter(s => s.status === 'active');
  const totalSupplierOutstanding = mockSuppliers.reduce((s, sup) => s + sup.outstandingBalance, 0);
  const totalSupplierOrders = mockSuppliers.reduce((s, sup) => s + sup.totalOrders, 0);
  const avgSupplierRating = activeSuppliers.length > 0 ? activeSuppliers.reduce((s, sup) => s + sup.rating, 0) / activeSuppliers.length : 0;
  const supplierByType = useMemo(() => {
    const map = new Map<string, number>();
    mockSuppliers.forEach(s => map.set(s.supplyType, (map.get(s.supplyType) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, []);

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const map = new Map<string, number>();
    mockInvoices.forEach(inv => {
      const method = inv.paymentMethod === 'bank-transfer' ? 'Bank Transfer' : inv.paymentMethod === 'cash' ? 'Cash' : inv.paymentMethod === 'card' ? 'Card' : 'Credit';
      map.set(method, (map.get(method) || 0) + inv.total);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, []);

  // Category stock breakdown
  const categoryStockData = useMemo(() => {
    const map = new Map<string, number>();
    mockProducts.forEach(p => map.set(p.category, (map.get(p.category) || 0) + p.stock));
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.length > 12 ? name.substring(0, 12) + '...' : name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, []);

  // Top customers by spending
  const topCustomers = [...mockCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  // Top suppliers by orders
  const topSuppliersList = [...mockSuppliers].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);

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

  // ─── PDF EXPORT ───
  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    let y = 15;

    const addHeader = () => {
      doc.setFillColor(23, 23, 23);
      doc.rect(0, 0, pw, 38, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('RELIANCE', 15, 18);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Branded Mens Clothing', 15, 24);
      doc.text('Makandura, Matara  |  071 135 0123  |  ravindrakumarash@gmail.com', 15, 30);
      doc.setFontSize(9);
      doc.text(`Generated: ${dateStr} at ${timeStr}`, pw - 15, 18, { align: 'right' });
      doc.text(`Period: Last ${daysMap[period]} days`, pw - 15, 24, { align: 'right' });
      y = 45;
    };

    const addSectionTitle = (title: string) => {
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(10, y, pw - 20, 9, 2, 2, 'F');
      doc.setTextColor(23, 23, 23);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, y + 6.5);
      y += 14;
    };

    const addKPI = (items: { label: string; value: string }[], cols = 4) => {
      const colW = (pw - 30) / cols;
      items.forEach((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const xPos = 15 + col * colW;
        const yPos = y + row * 16;
        if (yPos > 270) { doc.addPage(); y = 15; }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(item.label, xPos, yPos);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(23, 23, 23);
        doc.text(item.value, xPos, yPos + 6);
      });
      y += Math.ceil(items.length / cols) * 16 + 4;
    };

    const fCur = (n: number) => `Rs. ${n.toLocaleString('en-LK', { minimumFractionDigits: 0 })}`;

    const addFooter = (pageNum: number) => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('RELIANCE - Confidential Business Report', 15, 290);
      doc.text(`Page ${pageNum}`, pw - 15, 290, { align: 'right' });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTableY = () => (doc as any).lastAutoTable.finalY + 8;

    // ===== PAGE 1: SALES OVERVIEW =====
    addHeader();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 23, 23);
    doc.text('Business Report', pw / 2, y, { align: 'center' });
    y += 10;

    addSectionTitle('SALES OVERVIEW');
    addKPI([
      { label: 'Total Revenue', value: fCur(totalRevenue) },
      { label: 'Total Profit', value: fCur(totalProfit) },
      { label: 'Total Orders', value: totalOrders.toString() },
      { label: 'Avg. Order Value', value: fCur(avgOrderValue) },
      { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%` },
      { label: 'Daily Avg Revenue', value: fCur(totalRevenue / daysMap[period]) },
      { label: 'Daily Avg Orders', value: (totalOrders / daysMap[period]).toFixed(1) },
      { label: 'Period', value: `Last ${daysMap[period]} days` },
    ]);

    addSectionTitle('DAILY SALES BREAKDOWN');
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Revenue (Rs.)', 'Profit (Rs.)', 'Orders', 'Margin']],
      body: salesData.map(d => [
        new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        d.revenue.toLocaleString(), d.profit.toLocaleString(), d.orders.toString(),
        `${((d.profit / d.revenue) * 100).toFixed(1)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 15, right: 15 },
      styles: { cellPadding: 2 },
    });
    y = getTableY();

    addSectionTitle('REVENUE BY CATEGORY');
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Revenue (Rs.)', 'Share (%)']],
      body: categoryRevenue.map(c => [c.name, c.revenue.toLocaleString(), `${c.percentage}%`]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 15, right: 15 },
      styles: { cellPadding: 2.5 },
    });
    y = getTableY();

    addSectionTitle('TOP SELLING PRODUCTS');
    autoTable(doc, {
      startY: y,
      head: [['#', 'Product', 'Units Sold', 'Revenue (Rs.)']],
      body: topSellingProducts.map((p, i) => [(i + 1).toString(), p.name, p.unitsSold.toString(), p.revenue.toLocaleString()]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 15, right: 15 },
      styles: { cellPadding: 2.5 },
    });
    y = getTableY();
    addFooter(1);

    // ===== PAGE 2: INVENTORY =====
    doc.addPage(); y = 15;
    addSectionTitle('INVENTORY OVERVIEW');
    addKPI([
      { label: 'Total Products', value: mockProducts.length.toString() },
      { label: 'In Stock', value: inStockCount.toString() },
      { label: 'Low Stock', value: lowStockCount.toString() },
      { label: 'Out of Stock', value: outStockCount.toString() },
      { label: 'Total Stock Units', value: totalStockUnits.toLocaleString() },
      { label: 'Cost Value', value: fCur(totalStockValue) },
      { label: 'Retail Value', value: fCur(totalRetailValue) },
      { label: 'Potential Profit', value: fCur(totalRetailValue - totalStockValue) },
    ]);

    addSectionTitle('PRODUCT INVENTORY');
    autoTable(doc, {
      startY: y,
      head: [['SKU', 'Product', 'Category', 'Stock', 'Cost', 'Selling', 'Status']],
      body: mockProducts.map(p => [
        p.sku, p.name.length > 28 ? p.name.substring(0, 28) + '...' : p.name,
        p.category, p.stock.toString(), p.costPrice.toLocaleString(), p.sellingPrice.toLocaleString(),
        p.status === 'in-stock' ? 'In Stock' : p.status === 'low-stock' ? 'LOW' : 'OUT',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const val = data.cell.text[0];
          if (val === 'LOW') data.cell.styles.textColor = [217, 119, 6];
          if (val === 'OUT') data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    y = getTableY();

    const lowStockProducts = mockProducts.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock');
    if (lowStockProducts.length > 0) {
      addSectionTitle('LOW / OUT OF STOCK ALERTS');
      autoTable(doc, {
        startY: y,
        head: [['SKU', 'Product', 'Current Stock', 'Threshold', 'Status']],
        body: lowStockProducts.map(p => [
          p.sku, p.name, p.stock.toString(), p.lowStockThreshold.toString(),
          p.status === 'low-stock' ? 'LOW STOCK' : 'OUT OF STOCK',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [180, 83, 9], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 },
        styles: { cellPadding: 2.5 },
      });
      y = getTableY();
    }
    addFooter(2);

    // ===== PAGE 3: INVOICES =====
    doc.addPage(); y = 15;
    addSectionTitle('INVOICE OVERVIEW');
    addKPI([
      { label: 'Total Invoices', value: mockInvoices.length.toString() },
      { label: 'Total Amount', value: fCur(totalInvoiceAmount) },
      { label: 'Total Collected', value: fCur(totalCollected) },
      { label: 'Outstanding', value: fCur(totalOutstanding) },
      { label: 'Paid', value: paidInvoices.length.toString() },
      { label: 'Partial', value: partialInvoices.length.toString() },
      { label: 'Pending', value: pendingInvoices.length.toString() },
      { label: 'Collection Rate', value: `${totalInvoiceAmount > 0 ? ((totalCollected / totalInvoiceAmount) * 100).toFixed(1) : 0}%` },
    ]);

    addSectionTitle('ALL INVOICES');
    autoTable(doc, {
      startY: y,
      head: [['Invoice #', 'Customer', 'Total (Rs.)', 'Paid (Rs.)', 'Due (Rs.)', 'Method', 'Status']],
      body: mockInvoices.map(inv => [
        inv.invoiceNumber,
        inv.customerName.length > 18 ? inv.customerName.substring(0, 18) + '...' : inv.customerName,
        inv.total.toLocaleString(), inv.paidAmount.toLocaleString(), (inv.total - inv.paidAmount).toLocaleString(),
        inv.paymentMethod === 'bank-transfer' ? 'Bank' : inv.paymentMethod.charAt(0).toUpperCase() + inv.paymentMethod.slice(1),
        inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const val = data.cell.text[0];
          if (val === 'Paid') data.cell.styles.textColor = [22, 163, 74];
          if (val === 'Partial') data.cell.styles.textColor = [217, 119, 6];
          if (val === 'Pending') data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    y = getTableY();

    addSectionTitle('PAYMENT METHOD BREAKDOWN');
    autoTable(doc, {
      startY: y,
      head: [['Payment Method', 'Total Amount (Rs.)', 'Share (%)']],
      body: paymentMethodData.map(pm => [pm.name, pm.value.toLocaleString(), `${((pm.value / totalInvoiceAmount) * 100).toFixed(1)}%`]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 15, right: 15 },
      styles: { cellPadding: 2.5 },
    });
    y = getTableY();

    const overdueInvoices = mockInvoices.filter(i => (i.status === 'pending' || i.status === 'partial') && new Date(i.dueDate) < new Date());
    if (overdueInvoices.length > 0) {
      addSectionTitle('OVERDUE INVOICES');
      autoTable(doc, {
        startY: y,
        head: [['Invoice #', 'Customer', 'Due Date', 'Outstanding (Rs.)']],
        body: overdueInvoices.map(inv => [
          inv.invoiceNumber, inv.customerName,
          new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          (inv.total - inv.paidAmount).toLocaleString(),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [180, 83, 9], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 },
        styles: { cellPadding: 2.5 },
      });
      y = getTableY();
    }
    addFooter(3);

    // ===== PAGE 4: CUSTOMERS =====
    doc.addPage(); y = 15;
    addSectionTitle('CUSTOMER OVERVIEW');
    addKPI([
      { label: 'Total Customers', value: mockCustomers.length.toString() },
      { label: 'Active Customers', value: activeCustomers.length.toString() },
      { label: 'VIP Customers', value: vipCustomers.length.toString() },
      { label: 'Total Spent', value: fCur(totalCustomerSpent) },
      { label: 'Outstanding Balance', value: fCur(totalCustomerOutstanding) },
      { label: 'Avg. Spend', value: fCur(avgCustomerSpend) },
      { label: 'Total Loyalty Points', value: mockCustomers.reduce((s, c) => s + c.loyaltyPoints, 0).toLocaleString() },
      { label: 'Inactive', value: mockCustomers.filter(c => c.status === 'inactive').length.toString() },
    ]);

    addSectionTitle('ALL CUSTOMERS');
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Type', 'Phone', 'Purchases', 'Total Spent (Rs.)', 'Outstanding (Rs.)', 'Points']],
      body: mockCustomers.map(c => [c.name, c.customerType, c.phone, c.totalPurchases.toString(), c.totalSpent.toLocaleString(), c.outstandingBalance.toLocaleString(), c.loyaltyPoints.toString()]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = parseInt(data.cell.text[0].replace(/,/g, ''));
          if (val > 0) data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    y = getTableY();

    const outstandingCustomers = mockCustomers.filter(c => c.outstandingBalance > 0).sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    if (outstandingCustomers.length > 0) {
      addSectionTitle('CUSTOMERS WITH OUTSTANDING BALANCE');
      autoTable(doc, {
        startY: y,
        head: [['Name', 'Phone', 'Outstanding (Rs.)', 'Last Purchase']],
        body: outstandingCustomers.map(c => [
          c.name, c.phone, c.outstandingBalance.toLocaleString(),
          c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [180, 83, 9], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 },
        styles: { cellPadding: 2.5 },
      });
      y = getTableY();
    }
    addFooter(4);

    // ===== PAGE 5: SUPPLIERS =====
    doc.addPage(); y = 15;
    addSectionTitle('SUPPLIER OVERVIEW');
    addKPI([
      { label: 'Total Suppliers', value: mockSuppliers.length.toString() },
      { label: 'Active Suppliers', value: activeSuppliers.length.toString() },
      { label: 'Total Orders', value: totalSupplierOrders.toString() },
      { label: 'Avg. Rating', value: `${avgSupplierRating.toFixed(1)} / 5.0` },
      { label: 'Outstanding Balance', value: fCur(totalSupplierOutstanding) },
      { label: 'Inactive', value: mockSuppliers.filter(s => s.status === 'inactive').length.toString() },
      { label: 'Supply Categories', value: supplierByType.length.toString() },
      { label: 'Avg. Lead Time', value: `${activeSuppliers.length > 0 ? Math.round(activeSuppliers.reduce((s, sup) => s + (sup.leadTimeDays || 0), 0) / activeSuppliers.length) : 0} days` },
    ]);

    addSectionTitle('ALL SUPPLIERS');
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Contact', 'Supply Type', 'Orders', 'Rating', 'Outstanding (Rs.)', 'Status']],
      body: mockSuppliers.map(s => [
        s.name.length > 22 ? s.name.substring(0, 22) + '...' : s.name, s.contactPerson,
        s.supplyType.length > 16 ? s.supplyType.substring(0, 16) + '...' : s.supplyType,
        s.totalOrders.toString(), `${s.rating}/5`, s.outstandingBalance.toLocaleString(),
        s.status === 'active' ? 'Active' : 'Inactive',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [23, 23, 23], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const val = parseInt(data.cell.text[0].replace(/,/g, ''));
          if (val > 0) data.cell.styles.textColor = [220, 38, 38];
        }
        if (data.column.index === 6 && data.section === 'body') {
          if (data.cell.text[0] === 'Active') data.cell.styles.textColor = [22, 163, 74];
          if (data.cell.text[0] === 'Inactive') data.cell.styles.textColor = [150, 150, 150];
        }
      },
    });
    y = getTableY();

    const outstandingSuppliers = mockSuppliers.filter(s => s.outstandingBalance > 0).sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    if (outstandingSuppliers.length > 0) {
      addSectionTitle('SUPPLIERS WITH OUTSTANDING BALANCE');
      autoTable(doc, {
        startY: y,
        head: [['Supplier', 'Contact Person', 'Phone', 'Outstanding (Rs.)', 'Payment Terms']],
        body: outstandingSuppliers.map(s => [s.name, s.contactPerson, s.phone, s.outstandingBalance.toLocaleString(), s.paymentTerms || '-']),
        theme: 'grid',
        headStyles: { fillColor: [180, 83, 9], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 },
        styles: { cellPadding: 2.5 },
      });
      y = getTableY();
    }
    addFooter(5);

    // ===== PAGE 6: SUMMARY =====
    doc.addPage(); y = 15;
    addSectionTitle('BUSINESS SUMMARY');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const summaryLines = [
      `Total revenue for the last ${daysMap[period]} days: ${fCur(totalRevenue)} with a profit margin of ${profitMargin.toFixed(1)}%.`,
      `${totalOrders} orders processed with an average order value of ${fCur(avgOrderValue)}.`,
      `Inventory holds ${totalStockUnits} units across ${mockProducts.length} products (Retail Value: ${fCur(totalRetailValue)}).`,
      `${lowStockCount} product(s) running low, ${outStockCount} out of stock - restocking recommended.`,
      `${mockInvoices.length} invoices issued: ${paidInvoices.length} paid, ${partialInvoices.length} partial, ${pendingInvoices.length} pending.`,
      `Total outstanding from invoices: ${fCur(totalOutstanding)}.`,
      `${mockCustomers.length} registered customers (${activeCustomers.length} active, ${vipCustomers.length} VIP).`,
      `Customer outstanding balance: ${fCur(totalCustomerOutstanding)}.`,
      `${mockSuppliers.length} suppliers (${activeSuppliers.length} active) with total payable of ${fCur(totalSupplierOutstanding)}.`,
    ];
    summaryLines.forEach(line => { doc.text(`- ${line}`, 15, y, { maxWidth: pw - 30 }); y += 7; });
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, pw - 15, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This report was generated automatically by RELIANCE Management System.', 15, y);
    doc.text('For questions, contact: ravindrakumarash@gmail.com', 15, y + 5);
    addFooter(6);

    doc.save(`RELIANCE_Report_${now.toISOString().split('T')[0]}.pdf`);
  };

  // Stat card helper
  const StatCard = ({ label, value, icon: Icon, change, up = true }: {
    label: string; value: string; icon: React.ElementType; change?: string; up?: boolean;
  }) => (
    <div className={`${cardClass} relative overflow-hidden !p-2.5 sm:!p-5`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-500/5 to-transparent rounded-full blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`p-1 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
            <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`} />
          </div>
          <p className={`text-[11px] sm:text-sm font-medium leading-tight ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{label}</p>
        </div>
        <p className={`text-sm sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-1 text-[10px] sm:text-xs font-medium ${up ? 'text-green-500' : 'text-red-400'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Reports</h1>
          <p className={`mt-0.5 sm:mt-1 text-sm sm:text-base ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
            Comprehensive analytics & business insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className={`flex rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-neutral-700/50' : 'border-gray-200'}`}>
            {(['7d', '14d', '30d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                period === p
                  ? theme === 'dark' ? 'bg-white text-black' : 'bg-brand-900 text-white'
                  : theme === 'dark' ? 'text-neutral-400 hover:bg-neutral-800' : 'text-gray-500 hover:bg-gray-50'
              }`}>
                {p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
          <button onClick={exportPDF} className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r rounded-xl text-sm font-medium shadow-lg transition-all hover:shadow-xl ${theme === 'dark' ? 'from-white to-neutral-200 text-black' : 'from-neutral-800 to-brand-950 text-white'}`}>
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative">
        <div className={`flex gap-1 p-1 rounded-xl border overflow-x-auto scrollbar-hide ${
          theme === 'dark' ? 'bg-neutral-900/50 border-neutral-800/60' : 'bg-gray-50 border-gray-200'
        }`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}>
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Scroll fade for mobile */}
        <div className={`absolute right-0 top-0 bottom-0 w-8 pointer-events-none rounded-r-xl sm:hidden ${
          theme === 'dark' ? 'bg-gradient-to-l from-neutral-950/80 to-transparent' : 'bg-gradient-to-l from-gray-100/80 to-transparent'
        }`} />
      </div>

      {/* ═══════ SALES TAB ═══════ */}
      {activeTab === 'sales' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} change="+18.5%" />
            <StatCard label="Total Profit" value={formatCurrency(totalProfit)} icon={TrendingUp} change="+12.3%" />
            <StatCard label="Total Orders" value={totalOrders.toString()} icon={ShoppingBag} change="+8.1%" />
            <StatCard label="Avg. Order Value" value={formatCurrency(avgOrderValue)} icon={BarChart3} change="+5.2%" />
          </div>

          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className={`text-base sm:text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Revenue & Profit Trend</h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-brand-900'}`} />
                  <span className={`text-[10px] sm:text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${theme === 'dark' ? 'bg-neutral-500' : 'bg-neutral-400'}`} />
                  <span className={`text-[10px] sm:text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Profit</span>
                </div>
              </div>
            </div>
            <div className="h-52 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSalesData}>
                  <defs>
                    <linearGradient id="revGradR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme === 'dark' ? '#fff' : '#171717'} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={theme === 'dark' ? '#fff' : '#171717'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                  <YAxis tick={{ fontSize: 11, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Profit']} />
                  <Area type="monotone" dataKey="revenue" stroke={theme === 'dark' ? '#fff' : '#171717'} strokeWidth={2} fill="url(#revGradR)" />
                  <Area type="monotone" dataKey="profit" stroke={theme === 'dark' ? '#737373' : '#a3a3a3'} strokeWidth={2} fill="none" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sales by Category</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryRevenue} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} strokeWidth={2} stroke={theme === 'dark' ? '#0a0a0a' : '#fff'}>
                      {categoryRevenue.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value)]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {categoryRevenue.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: pieColors[i] }} />
                      <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{c.name}</span>
                    </div>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={2} stroke={theme === 'dark' ? '#0a0a0a' : '#fff'}>
                      {paymentMethodData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value)]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {paymentMethodData.map((pm, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: pieColors[i] }} />
                      <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{pm.name}</span>
                    </div>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{formatCurrency(pm.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Daily Orders</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                    <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="orders" stroke={theme === 'dark' ? '#fff' : '#171717'} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                <div className={`p-2 sm:p-2.5 rounded-lg ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-[10px] sm:text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Total</p>
                  <p className={`text-base sm:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalOrders}</p>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-lg ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-[10px] sm:text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>Avg/Day</p>
                  <p className={`text-base sm:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{(totalOrders / daysMap[period]).toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Selling Products</h3>
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className={theme === 'dark' ? 'border-b border-neutral-800' : 'border-b border-gray-200'}>
                    {['#', 'Product', 'Units Sold', 'Revenue', 'Share'].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topSellingProducts.map((p, i) => {
                    const totalRev = topSellingProducts.reduce((s, x) => s + x.revenue, 0);
                    const share = ((p.revenue / totalRev) * 100).toFixed(1);
                    return (
                      <tr key={i} className={`${theme === 'dark' ? 'border-b border-neutral-800/50 hover:bg-neutral-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                        <td className={`px-4 py-3 text-sm font-medium ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                              <Package className={`w-4 h-4 ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`} />
                            </div>
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.name}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.unitsSold}</td>
                        <td className={`px-4 py-3 text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(p.revenue)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-16 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                              <div className={`h-full rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-brand-900'}`} style={{ width: `${share}%` }} />
                            </div>
                            <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════ INVENTORY TAB ═══════ */}
      {activeTab === 'inventory' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard label="Total Products" value={mockProducts.length.toString()} icon={Package} change={`${inStockCount} in stock`} />
            <StatCard label="Low Stock" value={lowStockCount.toString()} icon={AlertTriangle} change="Needs attention" up={false} />
            <StatCard label="Out of Stock" value={outStockCount.toString()} icon={ShoppingCart} change="Restock needed" up={false} />
            <StatCard label="Stock Value" value={formatCurrency(totalRetailValue)} icon={DollarSign} change={`Cost: ${formatCurrency(totalStockValue)}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Stock Status</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stockStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={2} stroke={theme === 'dark' ? '#0a0a0a' : '#fff'}>
                      {stockStatusData.map((_, i) => <Cell key={i} fill={stockColors[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {stockStatusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: stockColors[i] }} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{s.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Stock by Category</h3>
              <div className="h-52 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStockData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 8, fill: theme === 'dark' ? '#a3a3a3' : '#525252' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill={theme === 'dark' ? '#ffffff' : '#171717'} radius={[0, 6, 6, 0]} name="Units" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>All Products</h3>
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className={theme === 'dark' ? 'border-b border-neutral-800' : 'border-b border-gray-200'}>
                    {['SKU', 'Product', 'Category', 'Stock', 'Cost', 'Price', 'Status'].map(h => (
                      <th key={h} className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockProducts.map(p => (
                    <tr key={p.id} className={`${theme === 'dark' ? 'border-b border-neutral-800/50 hover:bg-neutral-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-3 py-2.5 text-xs font-mono ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{p.sku}</td>
                      <td className={`px-3 py-2.5 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.name}</td>
                      <td className={`px-3 py-2.5 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{p.category}</td>
                      <td className={`px-3 py-2.5 text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.stock}</td>
                      <td className={`px-3 py-2.5 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{formatCurrency(p.costPrice)}</td>
                      <td className={`px-3 py-2.5 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(p.sellingPrice)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          p.status === 'in-stock' ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : p.status === 'low-stock' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {p.status === 'in-stock' ? 'In Stock' : p.status === 'low-stock' ? 'Low' : 'Out'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════ INVOICES TAB ═══════ */}
      {activeTab === 'invoices' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard label="Total Invoices" value={mockInvoices.length.toString()} icon={FileText} />
            <StatCard label="Total Amount" value={formatCurrency(totalInvoiceAmount)} icon={DollarSign} />
            <StatCard label="Collected" value={formatCurrency(totalCollected)} icon={CreditCard} change={`${totalInvoiceAmount > 0 ? ((totalCollected / totalInvoiceAmount) * 100).toFixed(0) : 0}%`} />
            <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon={Clock} change={pendingInvoices.length + ' pending'} up={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Invoice Status</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={invoiceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={2} stroke={theme === 'dark' ? '#0a0a0a' : '#fff'}>
                      {invoiceStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {invoiceStatusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{s.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Revenue by Payment Method</h3>
              <div className="space-y-3 mt-4">
                {paymentMethodData.map((pm, i) => {
                  const pct = totalInvoiceAmount > 0 ? (pm.value / totalInvoiceAmount) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{pm.name}</span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{formatCurrency(pm.value)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                        <div className={`h-full rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-brand-900'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>All Invoices</h3>
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className={theme === 'dark' ? 'border-b border-neutral-800' : 'border-b border-gray-200'}>
                    {['Invoice', 'Customer', 'Total', 'Paid', 'Due', 'Method', 'Status'].map(h => (
                      <th key={h} className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map(inv => (
                    <tr key={inv.id} className={`${theme === 'dark' ? 'border-b border-neutral-800/50 hover:bg-neutral-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-3 py-2.5 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{inv.invoiceNumber}</td>
                      <td className={`px-3 py-2.5 text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{inv.customerName}</td>
                      <td className={`px-3 py-2.5 text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(inv.total)}</td>
                      <td className={`px-3 py-2.5 text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`}>{formatCurrency(inv.paidAmount)}</td>
                      <td className={`px-3 py-2.5 text-sm font-medium ${inv.total - inv.paidAmount > 0 ? 'text-red-400' : theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(inv.total - inv.paidAmount)}</td>
                      <td className={`px-3 py-2.5 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{inv.paymentMethod === 'bank-transfer' ? 'Bank' : inv.paymentMethod.charAt(0).toUpperCase() + inv.paymentMethod.slice(1)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          inv.status === 'paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : inv.status === 'partial' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : inv.status === 'pending' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-neutral-500/10 text-neutral-500 border border-neutral-500/20'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════ CUSTOMERS TAB ═══════ */}
      {activeTab === 'customers' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard label="Total Customers" value={mockCustomers.length.toString()} icon={Users} change={`${activeCustomers.length} active`} />
            <StatCard label="VIP Customers" value={vipCustomers.length.toString()} icon={Star} />
            <StatCard label="Total Spent" value={formatCurrency(totalCustomerSpent)} icon={DollarSign} />
            <StatCard label="Outstanding" value={formatCurrency(totalCustomerOutstanding)} icon={Clock} change={`${mockCustomers.filter(c => c.outstandingBalance > 0).length} customers`} up={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Customer Types</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                    <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill={theme === 'dark' ? '#ffffff' : '#171717'} radius={[6, 6, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Customers by Spend</h3>
              <div className="space-y-3">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    theme === 'dark' ? 'hover:bg-neutral-800/40' : 'hover:bg-gray-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{c.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{c.customerType} · {c.totalPurchases} orders</p>
                    </div>
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(c.totalSpent)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>All Customers</h3>
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className={theme === 'dark' ? 'border-b border-neutral-800' : 'border-b border-gray-200'}>
                    {['Name', 'Type', 'Phone', 'Purchases', 'Total Spent', 'Outstanding', 'Points'].map(h => (
                      <th key={h} className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockCustomers.map(c => (
                    <tr key={c.id} className={`${theme === 'dark' ? 'border-b border-neutral-800/50 hover:bg-neutral-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-3 py-2.5 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{c.name}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          c.customerType === 'VIP' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : c.customerType === 'Wholesale' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : c.customerType === 'Corporate' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : theme === 'dark' ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'
                        }`}>{c.customerType}</span>
                      </td>
                      <td className={`px-3 py-2.5 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{c.phone}</td>
                      <td className={`px-3 py-2.5 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{c.totalPurchases}</td>
                      <td className={`px-3 py-2.5 text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(c.totalSpent)}</td>
                      <td className={`px-3 py-2.5 text-sm font-medium ${c.outstandingBalance > 0 ? 'text-red-400' : theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(c.outstandingBalance)}</td>
                      <td className={`px-3 py-2.5 text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{c.loyaltyPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════ SUPPLIERS TAB ═══════ */}
      {activeTab === 'suppliers' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard label="Total Suppliers" value={mockSuppliers.length.toString()} icon={Truck} change={`${activeSuppliers.length} active`} />
            <StatCard label="Total Orders" value={totalSupplierOrders.toString()} icon={ShoppingBag} />
            <StatCard label="Avg. Rating" value={`${avgSupplierRating.toFixed(1)} / 5`} icon={Star} />
            <StatCard label="Outstanding" value={formatCurrency(totalSupplierOutstanding)} icon={Clock} change={`${mockSuppliers.filter(s => s.outstandingBalance > 0).length} suppliers`} up={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Supply Categories</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplierByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#262626' : '#e5e5e5'} />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: theme === 'dark' ? '#737373' : '#a3a3a3' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill={theme === 'dark' ? '#ffffff' : '#171717'} radius={[6, 6, 0, 0]} name="Suppliers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardClass}>
              <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Suppliers by Orders</h3>
              <div className="space-y-3">
                {topSuppliersList.map((s, i) => (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    theme === 'dark' ? 'hover:bg-neutral-800/40' : 'hover:bg-gray-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>{s.supplyType} · Rating {s.rating}</p>
                    </div>
                    <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.totalOrders} orders</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>All Suppliers</h3>
            <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className={theme === 'dark' ? 'border-b border-neutral-800' : 'border-b border-gray-200'}>
                    {['Name', 'Contact', 'Type', 'Orders', 'Rating', 'Outstanding', 'Status'].map(h => (
                      <th key={h} className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockSuppliers.map(s => (
                    <tr key={s.id} className={`${theme === 'dark' ? 'border-b border-neutral-800/50 hover:bg-neutral-800/30' : 'border-b border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-3 py-2.5 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.name}</td>
                      <td className={`px-3 py-2.5 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{s.contactPerson}</td>
                      <td className={`px-3 py-2.5 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{s.supplyType}</td>
                      <td className={`px-3 py-2.5 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.totalOrders}</td>
                      <td className={`px-3 py-2.5 text-sm ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{s.rating}/5</td>
                      <td className={`px-3 py-2.5 text-sm font-medium ${s.outstandingBalance > 0 ? 'text-red-400' : theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(s.outstandingBalance)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          s.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-neutral-500/10 text-neutral-500 border border-neutral-500/20'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {s.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
