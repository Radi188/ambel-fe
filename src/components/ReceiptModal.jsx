import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { useKhrRate } from '../hooks/useKhrRate';
import { getMethodMeta } from './PaymentMethodPicker';
import { lineDiscount } from '../features/cart/cartSlice';

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function khrFmt(n) {
  return `${Math.round(n).toLocaleString()} ៛`;
}

export default function ReceiptModal({ data, onClose }) {
  const printRef = useRef(null);
  const khrRate  = useKhrRate();

  const {
    orderId,
    timestamp,
    items,
    subtotal,
    discount,
    cartDiscountAmt = 0,
    itemDiscountAmt = 0,
    discountAmt,
    total,
    payMethod,
    payMethodCode,
    cashier,
    branchName,
    cashReceivedKHR,
    cashReceivedUSD,
  } = data;

  const totalKHR         = Math.round(total * khrRate);
  const receivedKHRTotal = (cashReceivedKHR ?? 0) + Math.round((cashReceivedUSD ?? 0) * khrRate);
  const changeKHR        = receivedKHRTotal > 0 ? Math.max(0, receivedKHRTotal - totalKHR) : 0;
  const isCash           = getMethodMeta(payMethodCode ?? payMethod).isCash;

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = '__receipt_print_style__';
    style.textContent = `
      @media print {
        @page { size: A5 portrait; margin: 10mm; }
        body > *:not(#receipt-print-root) { display: none !important; }
        #receipt-print-root { display: block !important; position: static !important; background: transparent !important; }
        .receipt-modal-overlay { position: static !important; background: transparent !important; padding: 0 !important; }
        .receipt-no-print { display: none !important; }
        .receipt-card {
          box-shadow: none !important;
          border-radius: 0 !important;
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);

    const root = document.getElementById('receipt-print-root');
    if (root) root.style.display = 'block';

    window.print();

    document.head.removeChild(style);
  };

  return (
    <div id="receipt-print-root" style={{ display: 'block' }}>
      <div className="receipt-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {/* Action bar — hidden when printing */}
        <div className="receipt-no-print receipt-action-bar">
          <button className="receipt-print-btn" onClick={handlePrint}>
            <Printer size={16} /> Print Receipt
          </button>
          <button className="receipt-close-btn" onClick={onClose}>
            <X size={16} /> New Order
          </button>
        </div>

        {/* ── Receipt card (A5 proportions) ── */}
        <div className="receipt-card">

          {/* Header */}
          <div className="receipt-header">
            <img src={logo} alt="Ambel Cafe" className="receipt-logo" />
            <h1 className="receipt-store-name">Ambel Cafe</h1>
            {branchName && <p className="receipt-branch">{branchName}</p>}
            <div className="receipt-divider receipt-divider--dashed" />
          </div>

          {/* Order meta */}
          <div className="receipt-meta">
            <div className="receipt-meta-row">
              <span>Order</span>
              <span className="receipt-mono">#{orderId.includes('-') ? orderId : orderId.slice(-8).toUpperCase()}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Date</span>
              <span>{fmtDate(timestamp)}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Time</span>
              <span>{fmtTime(timestamp)}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Cashier</span>
              <span>{cashier ?? '—'}</span>
            </div>
          </div>

          <div className="receipt-divider receipt-divider--dashed" />

          {/* Items */}
          <div className="receipt-items">
            <div className="receipt-items-head">
              <span>Item</span>
              <span>Qty</span>
              <span className="receipt-align-right">Amount</span>
            </div>
            <div className="receipt-divider" />
            {items.map((item) => {
              const basePerUnit = item.basePrice ?? item.price ?? 0;
              const itemDiscAmt = lineDiscount(item);
              const discLabel   = item.discountType === 'fixed'
                ? 'Discount'
                : `Discount (${Number(item.discountValue) || 0}%)`;
              return (
                <div key={item.id} className="receipt-item">
                  {/* Main item row: name + size tag | qty | base price only */}
                  <div className="receipt-item-name-col">
                    <span className="receipt-item-name">{item.name}</span>
                    {item.size && (
                      <span className="receipt-item-size">{item.size}</span>
                    )}
                  </div>
                  <span className="receipt-item-qty">{item.qty}</span>
                  <span className="receipt-item-total receipt-align-right">
                    ${(basePerUnit * item.qty).toFixed(2)}
                  </span>

                  {/* Topping rows: name on left, price on right, span all columns */}
                  {item.toppings?.filter((t) => t.price > 0).map((t) => (
                    <div key={t._id ?? t.name ?? t} className="receipt-topping-row">
                      <span className="receipt-topping-name">+ {t.name ?? t}</span>
                      <span className="receipt-topping-price">
                        +${(t.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  {/* Per-item discount */}
                  {itemDiscAmt > 0 && (
                    <div className="receipt-topping-row">
                      <span className="receipt-topping-name">{discLabel}</span>
                      <span className="receipt-topping-price">
                        −${itemDiscAmt.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="receipt-divider receipt-divider--dashed" />

          {/* Totals */}
          <div className="receipt-totals">
            {discountAmt > 0 && (
              <>
                <div className="receipt-total-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {itemDiscountAmt > 0 && (
                  <div className="receipt-total-row receipt-total-row--discount">
                    <span>Item discounts</span>
                    <span>−${itemDiscountAmt.toFixed(2)}</span>
                  </div>
                )}
                {cartDiscountAmt > 0 && (
                  <div className="receipt-total-row receipt-total-row--discount">
                    <span>Cart discount ({discount}%)</span>
                    <span>−${cartDiscountAmt.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="receipt-total-row receipt-total-row--grand">
              <span>TOTAL</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="receipt-total-row receipt-total-row--khr">
              <span></span>
              <span>{khrFmt(totalKHR)}</span>
            </div>
          </div>

          <div className="receipt-divider receipt-divider--dashed" />

          {/* Payment */}
          <div className="receipt-payment">
            <div className="receipt-total-row">
              <span>Payment</span>
              <span>{payMethod}</span>
            </div>
            {isCash && receivedKHRTotal > 0 && (
              <>
                <div className="receipt-total-row">
                  <span>Received</span>
                  <span>{khrFmt(receivedKHRTotal)}</span>
                </div>
                <div className="receipt-total-row">
                  <span>Change</span>
                  <span>{khrFmt(changeKHR)}</span>
                </div>
              </>
            )}
          </div>

          <div className="receipt-divider receipt-divider--dashed" />

          {/* Footer */}
          <div className="receipt-footer">
            <p>Thank you for your visit!</p>
            <p>Please come again ☕</p>
          </div>

        </div>
      </div>
    </div>
  );
}
