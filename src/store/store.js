import { configureStore } from '@reduxjs/toolkit';

import cartReducer      from '../features/cart/cartSlice';
import ordersReducer    from '../features/orders/ordersSlice';
import shiftsReducer    from '../features/shifts/shiftsSlice';
import authReducer      from '../features/auth/authSlice';
import adminAuthReducer from '../features/adminAuth/adminAuthSlice';

import { authApi }            from './apis/authApi';
import { menuApi }            from './apis/menuApi';
import { ordersApi }          from './apis/ordersApi';
import { shiftsApi }          from './apis/shiftsApi';
import { staffApi }           from './apis/staffApi';
import { paymentsApi }        from './apis/paymentsApi';
import { branchesApi }        from './apis/branchesApi';
import { reportsApi }         from './apis/reportsApi';
import { paymentMethodsApi }  from './apis/paymentMethodsApi';
import { exchangeRatesApi }   from './apis/exchangeRatesApi';

export const store = configureStore({
  reducer: {
    // Local UI state
    auth:      authReducer,
    adminAuth: adminAuthReducer,
    cart:      cartReducer,
    orders:    ordersReducer,
    shifts:    shiftsReducer,

    // RTK Query API cache
    [authApi.reducerPath]:           authApi.reducer,
    [menuApi.reducerPath]:           menuApi.reducer,
    [ordersApi.reducerPath]:         ordersApi.reducer,
    [shiftsApi.reducerPath]:         shiftsApi.reducer,
    [staffApi.reducerPath]:          staffApi.reducer,
    [paymentsApi.reducerPath]:       paymentsApi.reducer,
    [branchesApi.reducerPath]:       branchesApi.reducer,
    [reportsApi.reducerPath]:        reportsApi.reducer,
    [paymentMethodsApi.reducerPath]: paymentMethodsApi.reducer,
    [exchangeRatesApi.reducerPath]:  exchangeRatesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      menuApi.middleware,
      ordersApi.middleware,
      shiftsApi.middleware,
      staffApi.middleware,
      paymentsApi.middleware,
      branchesApi.middleware,
      reportsApi.middleware,
      paymentMethodsApi.middleware,
      exchangeRatesApi.middleware,
    ),
});
