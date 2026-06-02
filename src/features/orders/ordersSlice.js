import { createSlice } from '@reduxjs/toolkit';

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    list: [
      { id: '#0081', cashier: 'Maya', items: 3, total: 17.25, status: 'completed', time: '09:14', method: 'Card' },
      { id: '#0082', cashier: 'Leo', items: 1, total: 5.5, status: 'completed', time: '09:31', method: 'Cash' },
      { id: '#0083', cashier: 'Maya', items: 5, total: 32.0, status: 'completed', time: '09:47', method: 'Card' },
      { id: '#0084', cashier: 'Sam', items: 2, total: 11.0, status: 'pending', time: '10:02', method: 'Cash' },
    ],
    todaySales: 65.75,
    totalOrders: 4,
  },
  reducers: {
    placeOrder(state, action) {
      const { items, total, cashier, method } = action.payload;
      const count = state.list.length;
      const id = `#${String(count + 81).padStart(4, '0')}`;
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      state.list.unshift({
        id,
        cashier,
        items: items.reduce((s, i) => s + i.qty, 0),
        total,
        status: 'completed',
        time,
        method,
      });
      state.todaySales += total;
      state.totalOrders += 1;
    },
  },
});

export const { placeOrder } = ordersSlice.actions;
export const selectOrders = (state) => state.orders.list;
export const selectTodaySales = (state) => state.orders.todaySales;
export const selectTotalOrders = (state) => state.orders.totalOrders;

export default ordersSlice.reducer;
