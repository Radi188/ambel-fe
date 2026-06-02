// Unified auth — both POS and Admin portal share a single auth state.
// This file re-exports from authSlice so existing imports continue to work.
export {
  loginSuccess  as adminLoginSuccess,
  loginFailure  as adminLoginFailure,
  logout        as adminLogout,
  clearError    as clearAdminError,
  selectUser    as selectAdminUser,
  selectAuthError as selectAdminError,
} from '../auth/authSlice';

export { default } from '../auth/authSlice';
