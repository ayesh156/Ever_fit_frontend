import { forwardRef } from 'react';
import type { Invoice } from '../data/mockData';

// 80mm thermal receipt = ~58mm printable width ≈ 302px at 203 DPI
// Using monospace-friendly formatting for receipt alignment

interface ThermalReceiptProps {
  invoice: Invoice;
}

const formatCurrency = (amount: number): string => `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ invoice }, ref) => {
    const balanceDue = invoice.total - invoice.paidAmount;

    return (
      <div ref={ref} className="thermal-receipt-wrapper">
        {/* Print-only styles */}
        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 80mm !important;
              background: white !important;
            }
            body * {
              visibility: hidden;
            }
            .thermal-receipt-wrapper,
            .thermal-receipt-wrapper * {
              visibility: visible !important;
            }
            .thermal-receipt-wrapper {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              z-index: 99999 !important;
            }
            .thermal-receipt {
              width: 80mm !important;
              max-width: 80mm !important;
              padding: 3mm 4mm !important;
              margin: 0 !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
          
          .thermal-receipt {
            width: 302px;
            max-width: 302px;
            padding: 12px 16px;
            margin: 0 auto;
            background: white;
            color: #000;
            font-family: 'Courier New', 'Lucida Console', monospace;
            font-size: 11px;
            line-height: 1.4;
          }
          .thermal-receipt * {
            color: #000 !important;
            background: white !important;
          }
          .receipt-header {
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px dashed #000;
            margin-bottom: 8px;
          }
          .receipt-header-top {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 4px;
          }
          .receipt-logo {
            width: 44px;
            height: 44px;
            border-radius: 4px;
            flex-shrink: 0;
          }
          .receipt-header-text {
            text-align: left;
          }
          .receipt-brand {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.2;
          }
          .receipt-tagline {
            font-size: 8px;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #333 !important;
            margin-top: 2px;
          }
          .receipt-contact {
            font-size: 9px;
            margin-top: 4px;
            line-height: 1.5;
          }
          .receipt-divider {
            border: none;
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .receipt-divider-double {
            border: none;
            border-top: 2px solid #000;
            margin: 6px 0;
          }
          .receipt-title {
            text-align: center;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 4px 0;
          }
          .receipt-info-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            line-height: 1.6;
          }
          .receipt-info-label {
            color: #444 !important;
          }
          .receipt-info-value {
            font-weight: 700;
            text-align: right;
          }
          .receipt-items-header {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4px 0 2px;
            border-bottom: 1px solid #000;
          }
          .receipt-item {
            padding: 4px 0 2px;
            border-bottom: 1px dotted #ccc;
          }
          .receipt-item:last-child {
            border-bottom: none;
          }
          .receipt-item-name {
            font-size: 10px;
            font-weight: 700;
            word-wrap: break-word;
          }
          .receipt-item-details {
            font-size: 9px;
            color: #555 !important;
            margin: 1px 0;
          }
          .receipt-item-line {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
          }
          .receipt-item-qty {
            color: #555 !important;
          }
          .receipt-item-total {
            font-weight: 700;
          }
          .receipt-totals {
            padding: 4px 0;
          }
          .receipt-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            line-height: 1.8;
          }
          .receipt-grand-total {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 900;
            padding: 6px 0;
          }
          .receipt-balance-due {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 900;
            padding: 4px 6px;
            border: 2px solid #000;
            margin: 4px 0;
          }
          .receipt-payment-info {
            padding: 4px 0;
          }
          .receipt-footer {
            text-align: center;
            padding-top: 8px;
            border-top: 1px dashed #000;
            margin-top: 8px;
          }
          .receipt-footer-text {
            font-size: 10px;
            font-weight: 700;
            margin: 2px 0;
          }
          .receipt-footer-sub {
            font-size: 8px;
            color: #555 !important;
            line-height: 1.5;
          }
          .receipt-barcode {
            text-align: center;
            font-size: 14px;
            letter-spacing: 3px;
            font-weight: 700;
            padding: 6px 0;
            font-family: 'Libre Barcode 39', monospace;
          }
          .receipt-qr-text {
            text-align: center;
            font-size: 8px;
            color: #777 !important;
            margin-top: 4px;
          }
        `}</style>

        <div className="thermal-receipt">
          {/* ─── HEADER ─── */}
          <div className="receipt-header">
            <div className="receipt-header-top">
              <img src="/images/logo.jpeg" alt="Ever Fit" className="receipt-logo" />
              <div className="receipt-header-text">
                <div className="receipt-brand">EVER FIT</div>
                <div className="receipt-tagline">Premium Clothing Collection</div>
              </div>
            </div>
            <div className="receipt-contact">
              123, Fashion Street, Colombo 03<br />
              Phone: 011-2345678<br />
              Email: info@everfit.lk<br />
              Web: www.everfit.lk
            </div>
          </div>

          {/* ─── INVOICE TITLE ─── */}
          <div className="receipt-title">INVOICE</div>
          <hr className="receipt-divider" />

          {/* ─── INVOICE INFO ─── */}
          <div style={{ padding: '2px 0 4px' }}>
            <div className="receipt-info-row">
              <span className="receipt-info-label">Invoice No:</span>
              <span className="receipt-info-value">{invoice.invoiceNumber}</span>
            </div>
            <div className="receipt-info-row">
              <span className="receipt-info-label">Date:</span>
              <span className="receipt-info-value">{fmtDateTime(invoice.createdAt)}</span>
            </div>
            <div className="receipt-info-row">
              <span className="receipt-info-label">Due Date:</span>
              <span className="receipt-info-value">{fmtDate(invoice.dueDate)}</span>
            </div>
          </div>
          <hr className="receipt-divider" />

          {/* ─── CUSTOMER ─── */}
          <div style={{ padding: '2px 0 4px' }}>
            <div className="receipt-info-row">
              <span className="receipt-info-label">Customer:</span>
              <span className="receipt-info-value">{invoice.customerName}</span>
            </div>
            {invoice.customerPhone && invoice.customerPhone !== '-' && (
              <div className="receipt-info-row">
                <span className="receipt-info-label">Phone:</span>
                <span className="receipt-info-value">{invoice.customerPhone}</span>
              </div>
            )}
          </div>
          <hr className="receipt-divider" />

          {/* ─── ITEMS ─── */}
          <div className="receipt-items-header">
            <span style={{ flex: 1 }}>Item</span>
            <span style={{ width: '40px', textAlign: 'center' }}>Qty</span>
            <span style={{ width: '65px', textAlign: 'right' }}>Price</span>
            <span style={{ width: '65px', textAlign: 'right' }}>Total</span>
          </div>

          {invoice.items.map((item, idx) => (
            <div key={idx} className="receipt-item">
              <div className="receipt-item-name">{item.productName}</div>
              <div className="receipt-item-details">
                {item.sku} | {item.size} | {item.color}
              </div>
              <div className="receipt-item-line">
                <span className="receipt-item-qty" style={{ width: '40px', textAlign: 'center', marginLeft: 'auto' }}>
                  ×{item.quantity}
                </span>
                <span style={{ width: '65px', textAlign: 'right' }}>
                  {formatCurrency(item.unitPrice)}
                </span>
                <span className="receipt-item-total" style={{ width: '65px', textAlign: 'right' }}>
                  {formatCurrency(item.total)}
                </span>
              </div>
              {item.discount > 0 && (
                <div className="receipt-item-line" style={{ fontSize: '9px' }}>
                  <span style={{ color: '#777' }}>Discount: -{formatCurrency(item.discount * item.quantity)}</span>
                </div>
              )}
            </div>
          ))}

          <hr className="receipt-divider-double" />

          {/* ─── TOTALS ─── */}
          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span>Subtotal ({invoice.items.length} items)</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(invoice.subtotal + invoice.discount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="receipt-total-row">
                <span>Discount</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="receipt-total-row">
                <span>Tax</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(invoice.tax)}</span>
              </div>
            )}
          </div>

          <hr className="receipt-divider" />

          <div className="receipt-grand-total">
            <span>TOTAL</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>

          <hr className="receipt-divider" />

          {/* ─── PAYMENT INFO ─── */}
          <div className="receipt-payment-info">
            <div className="receipt-total-row">
              <span>Payment Method</span>
              <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{invoice.paymentMethod.replace('-', ' ')}</span>
            </div>
            <div className="receipt-total-row">
              <span>Paid Amount</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            {balanceDue > 0 && (
              <>
                <hr className="receipt-divider" />
                <div className="receipt-balance-due">
                  <span>BALANCE DUE</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </>
            )}
            {invoice.paidAmount >= invoice.total && (
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 900, padding: '4px 0', letterSpacing: '2px' }}>
                ✓ PAID IN FULL ✓
              </div>
            )}
          </div>

          {/* ─── NOTES ─── */}
          {invoice.notes && (
            <>
              <hr className="receipt-divider" />
              <div style={{ fontSize: '9px', padding: '2px 0' }}>
                <span style={{ fontWeight: 700 }}>Note:</span> {invoice.notes}
              </div>
            </>
          )}

          {/* ─── PAYMENT HISTORY ─── */}
          {invoice.payments.length > 1 && (
            <>
              <hr className="receipt-divider" />
              <div style={{ fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>PAYMENT HISTORY</div>
              {invoice.payments.map((pay, idx) => (
                <div key={idx} className="receipt-info-row" style={{ fontSize: '9px' }}>
                  <span>{fmtDate(pay.paymentDate)} ({pay.paymentMethod})</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(pay.amount)}</span>
                </div>
              ))}
            </>
          )}

          {/* ─── FOOTER ─── */}
          <div className="receipt-footer">
            <div className="receipt-footer-text">Thank you for shopping with us!</div>
            <div className="receipt-footer-sub">
              Returns/Exchanges accepted within 7 days
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';
