import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import { loginSuccess, loginFailure, clearError, selectAuthError } from '../features/auth/authSlice';
import { useLoginMutation } from '../store/apis/authApi';
import { tokenService } from '../services/tokenService';
import { HOME_ROUTE } from '../config/permissions';

export default function LoginPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const error     = useSelector(selectAuthError);
  const [loginApi, { isLoading }] = useLoginMutation();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      const data = await loginApi({ email, password }).unwrap();
      tokenService.save(data);
      dispatch(loginSuccess({ user: data.user }));
      navigate(HOME_ROUTE[data.user.role] ?? '/');
    } catch (err) {
      dispatch(loginFailure(err?.data?.message ?? 'Invalid email or password.'));
    }
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-brand">
          <img src={logo} alt="Ambel Cafe" className="login-logo-img" />
        </div>
        <div className="login-left-body">
          <h2 className="login-left-title">Point of Sale<br />System</h2>
          <p className="login-left-desc">
            Manage orders, shifts, inventory,<br />and reports — all in one place.
          </p>
        </div>
        <div className="login-left-grid">
          {['Orders', 'Shifts', 'Menu', 'Reports', 'Inventory', 'Dashboard'].map((item) => (
            <div key={item} className="login-grid-pill">{item}</div>
          ))}
        </div>
        <p className="login-left-copy">© 2026 Ambel Coffee Co.</p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your account to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
                </svg>
                <input
                  id="email" type="email" autoComplete="email" placeholder="you@ambel.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
                  className={`login-input ${error ? 'login-input--error' : ''}`}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
                  className={`login-input ${error ? 'login-input--error' : ''}`}
                />
                <button type="button" className="login-toggle-pass" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`login-submit ${isLoading ? 'login-submit--loading' : ''}`}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? <span className="login-spinner" /> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
