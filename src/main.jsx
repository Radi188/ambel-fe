import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './app/App';
import './index.css';
import { logout, loginSuccess } from './features/auth/authSlice';
import { clearLocalShift } from './features/shifts/shiftsSlice';
import { tokenService } from './services/tokenService';

// ─── Rehydrate auth on every page load ───────────────────────────
// If a token + user are saved in localStorage (from a previous session),
// restore the Redux auth state so the user stays on their current page.
const savedToken = tokenService.get();
const savedUser  = tokenService.getUser();

if (savedToken && savedUser) {
  store.dispatch(loginSuccess({ user: savedUser }));
}

// ─── Handle token expiry / 401 from the API interceptor ──────────
window.addEventListener('auth:logout', () => {
  tokenService.clear();
  store.dispatch(clearLocalShift());
  store.dispatch(logout());
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
