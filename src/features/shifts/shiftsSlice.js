import { createSlice } from '@reduxjs/toolkit';

export const KHR_RATE = 4100; // fallback — real rate comes from /exchange-rates/current

export function toUSD(usd, khr, rate = KHR_RATE) {
  return Number(usd || 0) + Number(khr || 0) / rate;
}

const shiftsSlice = createSlice({
  name: 'shifts',
  initialState: {
    current: null,
    history: [
      {
        _id: 'SH-001',
        id: 'SH-001',
        cashier: 'Leo Martinez',
        openedAt: '2026-05-08T07:00:00.000Z',
        closedAt: '2026-05-08T09:00:00.000Z',
        openingCashUSD: 200,
        openingCashKHR: 820000,
        closingCashUSD: 245,
        closingCashKHR: 902000,
        orders: 12,
        revenue: 87.25,
        cashRevenue: 42.5,
        cardRevenue: 44.75,
        gopayRevenue: 0,
      },
    ],
    nextId: 2,
  },
  reducers: {
    // Called after a successful POST /shifts — stores _id from backend response
    openShift(state, action) {
      const { cashier, openingCashUSD, openingCashKHR, _id } = action.payload;
      state.current = {
        _id:            _id ?? `local-${state.nextId}`,
        cashier,
        openedAt:       new Date().toISOString(),
        openingCashUSD: Number(openingCashUSD || 0),
        openingCashKHR: Number(openingCashKHR || 0),
        orders:      0,
        revenue:     0,
        cashRevenue: 0,
        cardRevenue: 0,
        gopayRevenue: 0,
      };
      state.nextId += 1;
    },

    // Called on app load when GET /shifts/active returns an open shift.
    // Maps backend shape → local shape.
    hydrateShift(state, action) {
      const s = action.payload;
      if (!s || s.status === 'closed') return;
      // Only hydrate if no shift is already loaded (prevents overwriting fresh local state)
      if (state.current) return;
      state.current = {
        _id:     s._id,
        // cashier may be a populated object { _id, name } or a plain string/name
        cashier: s.cashier?.name ?? s.cashierName ?? 'Unknown',
        openedAt: s.openedAt,
        // Backend field is startingCash; fall back to openingCash for older records
        openingCashUSD: s.startingCash ?? s.openingCash ?? 0,
        openingCashKHR: 0,
        orders:      0,
        revenue:     0,
        cashRevenue: 0,
        cardRevenue: 0,
        gopayRevenue: 0,
      };
    },

    closeShift(state, action) {
      if (!state.current) return;
      state.history.unshift({
        ...state.current,
        closedAt:       new Date().toISOString(),
        closingCashUSD: Number(action.payload.closingCashUSD || 0),
        closingCashKHR: Number(action.payload.closingCashKHR || 0),
      });
      state.current = null;
    },

    recordOrder(state, action) {
      if (!state.current) return;
      const { total, method } = action.payload;
      state.current.orders  += 1;
      state.current.revenue += total;
      if (method === 'Cash')       state.current.cashRevenue  += total;
      else if (method === 'Card')  state.current.cardRevenue  += total;
      else                         state.current.gopayRevenue += total;
    },

    // Clears local Redux shift WITHOUT touching the backend.
    // Used on logout so the next user gets a fresh hydrateShift from the API.
    clearLocalShift(state) {
      state.current = null;
    },
  },
});

export const { openShift, hydrateShift, closeShift, recordOrder, clearLocalShift } = shiftsSlice.actions;
export const selectCurrentShift = (state) => state.shifts.current;
export const selectShiftHistory  = (state) => state.shifts.history;

export default shiftsSlice.reducer;
