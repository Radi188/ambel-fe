import { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { addItem } from '../features/cart/cartSlice';
import { normaliseProduct, getProductIconName, getBasePrice, formatPrice } from '../utils/productHelpers';
import { Coffee, Snowflake, Leaf, GlassWater, Utensils } from 'lucide-react';
const PRODUCT_ICONS = { Coffee, Snowflake, Leaf, GlassWater, Utensils };
function ProductIcon({ name, size = 32 }) {
  const Icon = PRODUCT_ICONS[name] ?? Coffee;
  return <Icon size={size} />;
}
import { useGetToppingsQuery } from '../store/apis/menuApi';

// Group an array by a key function
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item) || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default function ProductCustomizationModal({ product, onClose }) {
  const dispatch = useDispatch();

  const categoryName = product.category?.name ?? product.category ?? '';

  // ── Sizes from product API ────────────────────────────────────
  const availableSizes = useMemo(
    () => (product.sizes ?? []).filter((s) => s.isAvailable !== false),
    [product.sizes]
  );
  const hasSizes = availableSizes.length > 0;
  const [selectedSizeName, setSelectedSizeName] = useState(
    hasSizes ? availableSizes[0].name : null
  );
  const selectedSize = availableSizes.find((s) => s.name === selectedSizeName);
  const basePrice    = selectedSize?.price ?? product.price ?? 0;

  // ── Toppings from API (type=topping products) ─────────────────
  const { data: toppingProducts = [], isLoading: toppingsLoading } = useGetToppingsQuery();

  // Group toppings by their category name
  const toppingGroups = useMemo(() => {
    const available = toppingProducts.filter((t) => t.isAvailable !== false);
    const grouped   = groupBy(available, (t) => t.category?.name);
    return Object.entries(grouped); // [['Milk', [...]],  ['Extras', [...]]]
  }, [toppingProducts]);

  // Selected toppings stored as objects { _id, name, price }
  const [selectedToppings, setSelectedToppings] = useState([]);

  const toggleTopping = useCallback((topping) => {
    const price = getBasePrice(topping);
    setSelectedToppings((prev) =>
      prev.some((t) => t._id === topping._id)
        ? prev.filter((t) => t._id !== topping._id)
        : [...prev, { _id: topping._id, name: topping.name, price }]
    );
  }, []);

  // ── Qty, discount & note ──────────────────────────────────────
  const [qty,           setQty]           = useState(1);
  const [discountType,  setDiscountType]  = useState('percentage'); // 'percentage' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [note,          setNote]          = useState('');

  const setType = (type) => {
    if (type === discountType) return;
    setDiscountType(type);
    setDiscountValue(0); // reset so e.g. 50% doesn't become $50
  };

  // ── Price ─────────────────────────────────────────────────────
  const topExtra   = selectedToppings.reduce((s, t) => s + t.price, 0);
  const unitPrice  = basePrice + topExtra;     // gross unit price
  const lineGross  = unitPrice * qty;          // gross line total (all qty)
  const discountAmt = (() => {
    const v = Number(discountValue) || 0;
    if (v <= 0) return 0;
    const amt = discountType === 'fixed' ? v : lineGross * (v / 100);
    return Math.min(amt, lineGross);
  })();
  const totalPrice = lineGross - discountAmt;

  // ── Add to cart ───────────────────────────────────────────────
  const handleAddToCart = () => {
    const norm   = normaliseProduct(product);
    // Discount is part of the identity so the same drink at a different
    // discount stays a separate cart line instead of merging.
    const cartId = `${norm._id}-${selectedSizeName ?? 'default'}-${selectedToppings.map((t) => t._id).sort().join('|')}-d${discountType}${discountValue}`;

    dispatch(addItem({
      ...norm,
      id:        cartId,
      price:     unitPrice,          // gross unit price (base + toppings)
      basePrice,
      size:      selectedSizeName,
      toppings:  selectedToppings,   // array of { _id, name, price }
      discountType,                  // 'percentage' | 'fixed'
      discountValue: Number(discountValue) || 0,
      note:      note.trim() || null,
      qty,
    }));
    onClose();
  };

  const canAdd = !hasSizes || selectedSizeName != null;
  const iconName = product.imageUrl ? null : getProductIconName(product.name, categoryName);

  return (
    <div className="custom-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="custom-modal">

        {/* ── Header ── */}
        <div className="custom-header">
          <div className="custom-product-info">
            <div className="custom-emoji-wrap">
              {product.imageUrl
                ? <img src={product.imageUrl} alt={product.name} className="custom-img" />
                : <span className="custom-emoji"><ProductIcon name={iconName} /></span>
              }
            </div>
            <div>
              <h2 className="custom-product-name">{product.name}</h2>
              {product.description && (
                <p className="custom-product-desc">{product.description}</p>
              )}
              {hasSizes && (
                <p className="custom-base-price">
                  from {formatPrice(availableSizes[0].price)}
                </p>
              )}
            </div>
          </div>
          <button className="custom-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="custom-body">

          {/* Sizes */}
          {hasSizes && (
            <div className="custom-section">
              <h3 className="custom-section-title">
                Size
                <span className="custom-required">required</span>
              </h3>
              <div
                className="custom-size-row"
                style={{ gridTemplateColumns: `repeat(${availableSizes.length}, 1fr)` }}
              >
                {availableSizes.map((s) => (
                  <button
                    key={s.name}
                    className={`custom-size-btn ${selectedSizeName === s.name ? 'custom-size-btn--active' : ''}`}
                    onClick={() => setSelectedSizeName(s.name)}
                  >
                    <span className="custom-size-key">{s.name}</span>
                    <span className="custom-size-price">{formatPrice(s.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toppings from API */}
          {toppingsLoading && (
            <div className="custom-section">
              <h3 className="custom-section-title">Toppings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 40, borderRadius: 6 }} />
                ))}
              </div>
            </div>
          )}

          {!toppingsLoading && toppingGroups.length === 0 && (
            <div className="custom-section">
              <h3 className="custom-section-title">
                Toppings
                <span className="custom-optional">optional</span>
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-faint)', padding: '4px 0' }}>
                No toppings available
              </p>
            </div>
          )}

          {!toppingsLoading && toppingGroups.map(([groupName, items]) => (
            <div key={groupName} className="custom-section">
              <h3 className="custom-section-title">
                {groupName}
                <span className="custom-optional">optional</span>
              </h3>
              <div className="custom-topping-grid">
                {items.map((topping) => {
                  const toppingPrice = getBasePrice(topping);
                  const checked      = selectedToppings.some((t) => t._id === topping._id);
                  return (
                    <button
                      key={topping._id}
                      className={`custom-topping-btn ${checked ? 'custom-topping-btn--active' : ''}`}
                      onClick={() => toggleTopping(topping)}
                    >
                      <span className="custom-topping-check">
                        {checked && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </span>
                      <span className="custom-topping-name">{topping.name}</span>
                      <span className="custom-topping-price">
                        {toppingPrice > 0 ? `+${formatPrice(toppingPrice)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Discount */}
          <div className="custom-section">
            <h3 className="custom-section-title">
              Discount
              <span className="custom-optional">optional</span>
            </h3>

            {/* Percentage / amount toggle */}
            <div className="discount-type-toggle">
              <button
                type="button"
                className={`discount-type-btn ${discountType === 'percentage' ? 'discount-type-btn--active' : ''}`}
                onClick={() => setType('percentage')}
              >
                Percent (%)
              </button>
              <button
                type="button"
                className={`discount-type-btn ${discountType === 'fixed' ? 'discount-type-btn--active' : ''}`}
                onClick={() => setType('fixed')}
              >
                Amount ($)
              </button>
            </div>

            {/* Percentage presets */}
            {discountType === 'percentage' && (
              <div className="discount-btns">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`discount-btn ${Number(discountValue) === d ? 'discount-btn--active' : ''}`}
                    onClick={() => setDiscountValue(d)}
                  >
                    {d === 0 ? 'None' : `${d}%`}
                  </button>
                ))}
              </div>
            )}

            {/* Custom value input */}
            <div className={`custom-discount-input ${discountType === 'fixed' ? 'custom-discount-input--prefixed' : ''}`}>
              {discountType === 'fixed' && <span className="custom-discount-prefix">$</span>}
              <input
                type="number"
                min="0"
                max={discountType === 'fixed' ? lineGross : 100}
                step={discountType === 'fixed' ? '0.01' : '1'}
                inputMode="decimal"
                placeholder={discountType === 'fixed' ? 'Amount off' : 'Custom %'}
                value={Number(discountValue) === 0 ? '' : discountValue}
                onChange={(e) => {
                  const max = discountType === 'fixed' ? lineGross : 100;
                  const v = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                  setDiscountValue(v);
                }}
              />
              {discountType === 'percentage' && <span className="custom-discount-suffix">%</span>}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="custom-section">
            <h3 className="custom-section-title">
              Special Instructions
              <span className="custom-optional">optional</span>
            </h3>
            <textarea
              className="custom-note"
              placeholder="e.g. extra hot, no lid, allergy info…"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="custom-footer">
          <div className="custom-qty">
            <button className="custom-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
            <span className="custom-qty-num">{qty}</span>
            <button className="custom-qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>

          <div className="custom-price-breakdown">
            {topExtra > 0 && (
              <span className="custom-price-detail">
                {formatPrice(basePrice)} +{formatPrice(topExtra)}
              </span>
            )}
            {discountAmt > 0 && (
              <span className="custom-price-detail">
                −{discountType === 'fixed'
                  ? formatPrice(discountAmt)
                  : `${discountValue}%`} discount
              </span>
            )}
          </div>

          <button
            className={`custom-add-btn ${!canAdd ? 'custom-add-btn--disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={!canAdd}
          >
            Add to Cart
            <span className="custom-add-total">{formatPrice(totalPrice)}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
