import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import logo from '../assets/logo.jpg';
import { selectCartCount } from '../features/cart/cartSlice';
import { selectUser, logout } from '../features/auth/authSlice';
import { canAccess, ROLE_LABELS } from '../config/permissions';

const NAV = [
  { to: '/', label: 'POS', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  )},
  { to: '/dashboard', label: 'Dashboard', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { to: '/orders', label: 'Orders', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  )},
  { to: '/menu', label: 'Menu', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
  )},
  { to: '/reports', label: 'Reports', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  )},
  { to: '/users', label: 'Users', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )},
  { to: '/payment-methods', label: 'Payment Methods', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )},
  { to: '/exchange-rate', label: 'Exchange Rate', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  )},
];

export default function Sidebar() {
  const dispatch   = useDispatch();
  const cartCount  = useSelector(selectCartCount);
  const user       = useSelector(selectUser);
  const role       = user?.role ?? 'cashier';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Ambel Cafe" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => {
          const allowed = canAccess(role, to);
          if (!allowed) {
            return (
              <div
                key={to}
                className="nav-item nav-item--locked"
                title="Requires Manager or higher"
                role="button"
                onClick={() => window.dispatchEvent(new Event('access:denied'))}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
                <span className="nav-lock">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
              </div>
            );
          }
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
              {label === 'POS' && cartCount > 0 && (
                <span className="nav-badge">{cartCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="cashier-avatar">{user?.name?.[0] ?? '?'}</div>
          <div className="cashier-info">
            <span className="cashier-name">{user?.name}</span>
            <span className="cashier-role">{ROLE_LABELS[role] ?? role}</span>
          </div>
          <button
            className="logout-btn"
            title="Sign out"
            onClick={() => dispatch(logout())}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        {user?.branch && (
          <div className="sidebar-branch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>{user.branch?.name ?? user.branch}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
