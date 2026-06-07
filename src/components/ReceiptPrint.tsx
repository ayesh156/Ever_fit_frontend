import React from 'react';

const formatPrice = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptInvoice {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: ReceiptItem[];
  dueDate?: string;
}

interface Props {
  invoice: ReceiptInvoice;
}

export const ReceiptPrint: React.FC<Props> = ({ invoice }) => {
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const balanceDue = invoice.total - invoice.paidAmount;

  return (
    <div id="printable-receipt" className="hidden print:block text-black bg-white w-[80mm] mx-auto p-4 font-mono text-xs leading-relaxed">
      {/* Header */}
      <div className="text-center mb-3">
        <h1 className="text-base font-bold tracking-[0.2em] uppercase">EVER FIT</h1>
        <p className="text-[9px] tracking-[0.15em] uppercase text-gray-600">Premium Clothing</p>
        <p className="mt-1 text-[10px]">Ransegoda, Kamburupitiya, Matara</p>
        <p className="text-[10px]">Tel: 071 135 0123</p>
        <div className="border-t border-dashed border-gray-400 my-2" />
      </div>

      {/* Invoice Info */}
      <div className="mb-2">
        <div className="flex justify-between">
          <span>Order:</span>
          <span className="font-bold">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{fmtDate(invoice.createdAt)}</span>
        </div>
        <div className="border-t border-dashed border-gray-400 my-1.5" />
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{invoice.customerName}</span>
        </div>
        {invoice.customerPhone && invoice.customerPhone !== '-' && (
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{invoice.customerPhone}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-1.5" />

      {/* Items Header */}
      <div className="flex items-center font-bold mb-1 text-[10px]">
        <span className="flex-[3]">Item</span>
        <span className="flex-1 text-center">Qty</span>
        <span className="flex-[1.5] text-right">Price</span>
        <span className="flex-[1.5] text-right">Total</span>
      </div>
      <div className="border-t border-dashed border-gray-400 mb-1" />

      {/* Items */}
      {invoice.items.map((item, idx) => (
        <div key={idx} className="flex items-center py-0.5 text-[10px]">
          <span className="flex-[3] truncate">{item.productName}</span>
          <span className="flex-1 text-center">{item.quantity}</span>
          <span className="flex-[1.5] text-right">{formatPrice(item.unitPrice)}</span>
          <span className="flex-[1.5] text-right">{formatPrice(item.total)}</span>
        </div>
      ))}

      <div className="border-t border-dashed border-gray-400 my-1.5" />

      {/* Totals */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatPrice(invoice.subtotal)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{formatPrice(invoice.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-gray-400">
          <span>Total:</span>
          <span>{formatPrice(invoice.total)}</span>
        </div>
        <div className="flex justify-between text-green-700">
          <span>Paid:</span>
          <span>{formatPrice(invoice.paidAmount)}</span>
        </div>
        {balanceDue > 0 && (
          <div className="flex justify-between text-red-600 font-bold">
            <span>Balance Due:</span>
            <span>{formatPrice(balanceDue)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Payment Status */}
      <div className="text-center text-[10px] mb-2">
        <p>Payment Method: <span className="font-bold capitalize">{invoice.paymentMethod.replace('-', ' ')}</span></p>
        <p>
          Status:{' '}
          <span className={`font-bold ${invoice.status === 'paid' ? 'text-green-700' : invoice.status === 'pending' ? 'text-red-600' : 'text-amber-600'}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </p>
        {invoice.dueDate && (
          <p>Due: {fmtDate(invoice.dueDate)}</p>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Footer */}
      <div className="text-center text-[10px]">
        <p className="font-bold text-sm">Thank you for shopping with us!</p>
        <p className="mt-1 text-gray-500">Visit us again at Ever Fit</p>
        <p className="text-gray-500">www.everfit.lk</p>
      </div>
    </div>
  );
};