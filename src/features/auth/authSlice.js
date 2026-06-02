import { createSlice } from '@reduxjs/toolkit';

// POS login — only cashier role is allowed through LoginPage
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, error: null },
  reducers: {
    loginSuccess(state, { payload }) {
      // payload = { user } from API response
      state.user  = payload.user;
      state.error = null;
    },
    loginFailure(state, { payload }) {
      state.error = payload;
    },
    logout(state) {
      state.user  = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export const selectUser      = (state) => state.auth.user;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
