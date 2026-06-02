import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Coffee, Snowflake, Leaf, GlassWater, Utensils, ShoppingCart, FileText } from 'lucide-react';
import {
  selectCartItems, selectCartTotal, selectDiscount,
  incrementQty, decrementQty, removeItem, clearCart, setDiscount,
  lineDiscount, lineNet,
} from '../features/cart/cartSlice';

const PRODUCT_ICONS = { Coffee, Snowflake, Leaf, GlassWater, Utensils };
function ProductIcon({ name, size = 20 }) {
  const Icon = PRODUCT_ICONS[name] ?? Coffee;
  return <Icon size={size} />;
}
import { placeOrder } from '../features/orders/ordersSlice';
import { recordOrder, selectCurrentShift } from '../features/shifts/shiftsSlice';
import { useKhrRate } from '../hooks/useKhrRate';
import { useCreateOrderMutation } from '../store/apis/ordersApi';
import { useCreatePaymentMutation } from '../store/apis/paymentsApi';
import PaymentMethodPicker, { getMethodMeta } from './PaymentMethodPicker';
import CashPaymentModal from './CashPaymentModal';
import ReceiptModal from './ReceiptModal';
import { selectUser } from '../features/auth/authSlice';

export default function CartPanel() {
  const dispatch      = useDispatch();
  const items         = useSelector(selectCartItems);
  const subtotal      = useSelector(selectCartTotal);
  const discount      = useSelector(selectDiscount);
  const currentShift  = useSelector(selectCurrentShift);
  const user          = useSelector(selectUser);
  const khrRate       = useKhrRate();

  const [createOrder]        = useCreateOrderMutation();
  const [createPayment]      = useCreatePaymentMutation();

  const [payMethod,     setPayMethod]     = useState('');   // method code from API
  const [payMethodName, setPayMethodName] = useState('');   // display name
  const [apiError, setApiError]           = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [receipt, setReceipt]             = useState(null);

  const round2 = (n) => Math.round(n * 100) / 100;

  // Per-item discount: each line stores its own discount % (set in the
  // customization modal). Cart-level discount applies on top of that.
  const itemDiscountAmt  = round2(
    items.reduce((s, i) => s + lineDiscount(i), 0)
  );
  const afterItemDiscount = subtotal - itemDiscountAmt;
  const cartDiscountAmt   = round2(afterItemDiscount * (discount / 100));
  const discountAmt       = round2(itemDiscountAmt + cartDiscountAmt);
  const total             = round2(subtotal - discountAmt);
  const cashier           = currentShift?.cashier ?? 'Unknown';

  const handlePay = async (cashKHR = 0, cashUSD = 0) => {
    if (items.length === 0 || isLoading) return;
    setApiError('');
    setIsLoading(true);

    // Snapshot cart before any clearing
    const itemsSnapshot = [...items];

    try {
      // Build order items
      const orderItems = itemsSnapshot.map((item) => ({
        product:   item._id ?? item.id,
        size:      item.size ?? 'Default',
        quantity:  item.qty,
        unitPrice: item.basePrice ?? item.price,
        ...(item.toppings?.length > 0 && {
          toppings: item.toppings.map((t) => ({
            product: t._id,
            name:    t.name,
            price:   t.price,
          })),
        }),
      }));

      // 1. Create order
      // The backend recomputes subtotal/total from items + an order-level
      // discount, so per-item discounts are aggregated with the cart discount
      // and sent as a single fixed amount.
      const order = await createOrder({
        customerName:  'Walk-in',
        subtotal:      parseFloat(subtotal.toFixed(2)),
        total:         parseFloat(total.toFixed(2)),
        items:         orderItems,
        ...(discountAmt > 0 && {
          discountType:  'fixed',
          discountValue: parseFloat(discountAmt.toFixed(2)),
        }),
      }).unwrap();

      // 2. Create payment linked to the order
      const meta = getMethodMeta(payMethod);
      await createPayment({
        order:  order._id,
        amount: parseFloat(total.toFixed(2)),
        method: meta.backendType,
        ...(meta.isCash && {
          cashReceived: parseFloat(((cashKHR + cashUSD * khrRate) / khrRate).toFixed(2)),
        }),
      }).unwrap();

      // Orders are created with status "completed" by default, so no extra
      // status patch is needed after payment.

      // 3. Update local Redux state
      dispatch(placeOrder({ items: itemsSnapshot, total, cashier, method: payMethodName || payMethod }));
      dispatch(recordOrder({ total, method: payMethodName || payMethod }));
      dispatch(clearCart());

      // 6. Show receipt
      setReceipt({
        orderId:         order.orderNumber ?? order._id,
        timestamp:       new Date().toISOString(),
        items:           itemsSnapshot,
        subtotal,
        discount,            // cart-level discount %
        cartDiscountAmt,
        itemDiscountAmt,
        discountAmt,         // combined discount $ (per-item + cart)
        total,
        payMethod:     payMethodName || payMethod,
        payMethodCode: payMethod,
        cashier,
        branchName:      user?.branch?.name ?? user?.branch ?? null,
        cashReceivedKHR: cashKHR,
        cashReceivedUSD: cashUSD,
      });
    } catch (err) {
      setApiError(err?.data?.message ?? 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="cart-panel">
      <div className="cart-header">
        <span className="cart-title">Current Order</span>
        {items.length > 0 && (
          <button className="cart-clear" onClick={() => dispatch(clearCart())}>Clear all</button>
        )}
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={40} className="cart-empty-icon" />
            <p>Add items from the menu</p>
          </div>
        ) : (
          items.map((item) => {
            const lineDisc  = lineDiscount(item);
            const lineTotal = lineNet(item);
            const netUnit   = lineTotal / item.qty;
            const discLabel = item.discountType === 'fixed'
              ? `−$${(Number(item.discountValue) || 0).toFixed(2)}`
              : `−${Number(item.discountValue) || 0}%`;
            return (
            <div key={item.id} className="cart-item">
              <div className="cart-item-emoji"><ProductIcon name={item.icon} /></div>
              <div className="cart-item-info">
                <span className="cart-item-name">{item.name}</span>
                {/* Size + toppings + discount tags */}
                {(item.size || (item.toppings?.length > 0) || lineDisc > 0) && (
                  <div className="cart-item-tags">
                    {item.size && <span className="cart-tag">{item.size}</span>}
                    {item.toppings?.map((t) => (
                      <span key={t._id ?? t} className="cart-tag">
                        {t.name ?? t}
                      </span>
                    ))}
                    {lineDisc > 0 && (
                      <span className="cart-tag cart-tag--discount">{discLabel}</span>
                    )}
                  </div>
                )}
                {item.note && (
                  <span className="cart-item-note"><FileText size={12} /> {item.note}</span>
                )}
                <span className="cart-item-unit">
                  {lineDisc > 0 ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)', marginRight: 4 }}>
                        ${item.price.toFixed(2)}
                      </span>
                      ${netUnit.toFixed(2)} each
                    </>
                  ) : (
                    `$${item.price.toFixed(2)} each`
                  )}
                </span>
              </div>
              <div className="cart-item-controls">
                <button className="qty-btn" onClick={() => dispatch(decrementQty(item.id))}>−</button>
                <span className="qty-num">{item.qty}</span>
                <button className="qty-btn" onClick={() => dispatch(incrementQty(item.id))}>+</button>
              </div>
              <span className="cart-item-total">${lineTotal.toFixed(2)}</span>
              <button className="cart-item-remove" onClick={() => dispatch(removeItem(item.id))}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            );
          })
        )}
      </div>

      <div className="cart-discount">
        <label>Cart Discount</label>
        <div className="discount-btns">
          {[0, 5, 10, 15].map((d) => (
            <button
              key={d}
              className={`discount-btn ${discount === d ? 'discount-btn--active' : ''}`}
              onClick={() => dispatch(setDiscount(d))}
            >
              {d === 0 ? 'None' : `${d}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="cart-summary">
        {discountAmt > 0 && (
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        )}
        {itemDiscountAmt > 0 && (
          <div className="summary-row summary-row--discount">
            <span>Item discounts</span>
            <span>−${itemDiscountAmt.toFixed(2)}</span>
          </div>
        )}
        {cartDiscountAmt > 0 && (
          <div className="summary-row summary-row--discount">
            <span>Cart discount ({discount}%)</span>
            <span>−${cartDiscountAmt.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-row summary-row--total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <PaymentMethodPicker
        selected={payMethod}
        onChange={(code, name) => { setPayMethod(code); setPayMethodName(name); }}
      />

      {apiError && (
        <div className="login-error" style={{ margin: '0 14px 8px', fontSize: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {apiError}
        </div>
      )}

      <button
        className={`pay-btn ${(items.length === 0 || isLoading) ? 'pay-btn--disabled' : ''}`}
        onClick={() => getMethodMeta(payMethod).isCash ? setShowCashModal(true) : handlePay()}
        disabled={items.length === 0 || isLoading}
      >
        {isLoading ? (
          <>
            <span>Processing…</span>
            <span className="login-spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} />
          </>
        ) : (
          <>
            <span>Pay Now</span>
            <span className="pay-btn-amount">${total.toFixed(2)}</span>
          </>
        )}
      </button>
      {showCashModal && (
        <CashPaymentModal
          total={total}
          onConfirm={(khr, usd) => { setShowCashModal(false); handlePay(khr, usd); }}
          onCancel={() => setShowCashModal(false)}
          isLoading={isLoading}
        />
      )}
    </div>

    {receipt && (
      <ReceiptModal
        data={receipt}
        onClose={() => setReceipt(null)}
      />
    )}
  </>
  );
}
