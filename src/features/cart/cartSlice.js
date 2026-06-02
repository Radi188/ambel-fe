import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    discount: 0,
    note: '',
  },
  reducers: {
    addItem(state, action) {
      const { qty: initQty = 1, ...payload } = action.payload;
      const existing = state.items.find((i) => i.id === payload.id);
      if (existing) {
        existing.qty += initQty;
      } else {
        state.items.push({ ...payload, qty: initQty });
      }
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    incrementQty(state, action) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.qty += 1;
    },
    decrementQty(state, action) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        if (item.qty <= 1) {
          state.items = state.items.filter((i) => i.id !== action.payload);
        } else {
          item.qty -= 1;
        }
      }
    },
    clearCart(state) {
      state.items = [];
      state.discount = 0;
      state.note = '';
    },
    setDiscount(state, action) {
      state.discount = action.payload;
    },
    setNote(state, action) {
      state.note = action.payload;
    },
  },
});

export const { addItem, removeItem, incrementQty, decrementQty, clearCart, setDiscount, setNote } = cartSlice.actions;

const round2 = (n) => Math.round(n * 100) / 100;

/** Gross line total for a cart item, before any per-item discount. */
export const lineGross = (item) => item.price * item.qty;

/**
 * Per-item discount amount in $ for a cart line.
 * - discountType 'percentage' → discountValue is a percent of the line total
 * - discountType 'fixed'      → discountValue is a $ amount off the line total
 * Always clamped so it never exceeds the line total.
 */
export const lineDiscount = (item) => {
  const gross = lineGross(item);
  const value = Number(item.discountValue) || 0;
  if (value <= 0) return 0;
  const amt = item.discountType === 'fixed' ? value : gross * (value / 100);
  return round2(Math.min(amt, gross));
};

/** Net line total after the per-item discount. */
export const lineNet = (item) => round2(lineGross(item) - lineDiscount(item));

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.qty, 0);
export const selectDiscount = (state) => state.cart.discount;

export default cartSlice.reducer;
