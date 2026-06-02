import { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Lock } from 'lucide-react';

import AdminApp            from './AdminApp';
import Sidebar             from '../components/Sidebar';
import LoginPage           from '../pages/LoginPage';
import POSPage             from '../pages/POSPage';
import DashboardPage       from '../pages/DashboardPage';
import OrdersPage          from '../pages/OrdersPage';
import MenuPage            from '../pages/MenuPage';
import ReportsPage         from '../pages/ReportsPage';
import UsersPage           from '../pages/UsersPage';
import PaymentMethodsPage  from '../pages/PaymentMethodsPage';
import ExchangeRatePage    from '../pages/ExchangeRatePage';

import { selectUser } from '../features/auth/authSlice';
import { canAccess } from '../config/permissions';
import { hydrateShift } from '../features/shifts/shiftsSlice';
import { useGetActiveShiftQuery } from '../store/apis/shiftsApi';
import { tokenService } from '../services/tokenService';

// Blocks a route the current role can't access (even when typed directly in
// the URL) and sends them back to the POS register with a "denied" flag so a
// toast can explain why.
function RequireAccess({ path, element }) {
  const user = useSelector(selectUser);
  if (!canAccess(user?.role, path)) {
    return <Navigate to="/" replace state={{ denied: true }} />;
  }
  return element;
}

// Shows a toast only when a user actively tries to reach a page they can't
// access — either by typing a restricted URL (redirected via RequireAccess) or
// by clicking a locked sidebar item (which fires the `access:denied` event).
function AccessToast() {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = useCallback(() => {
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 3500);
  }, []);

  // Typed a restricted URL → redirected here with the "denied" flag.
  useEffect(() => {
    if (!location.state?.denied) return;
    show();
    // Clear the flag so it doesn't re-fire on refresh or back navigation.
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, show]);

  // Clicked a locked sidebar item.
  useEffect(() => {
    const onDenied = () => show();
    window.addEventListener('access:denied', onDenied);
    return () => window.removeEventListener('access:denied', onDenied);
  }, [show]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={`pos-toast ${visible ? 'pos-toast--visible' : ''}`}>
      <Lock size={15} />
      <span>You don't have permission to access that page</span>
    </div>
  );
}

// Runs once after login — fetches the branch's open shift and restores Redux state.
// This ensures a page refresh never loses the active shift.
function ShiftHydrator() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { data, isSuccess } = useGetActiveShiftQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!isSuccess) return;

    // Super-admin has no fixed branch — after a fresh login their persisted
    // branch is gone, so restore it from the open shift's branch. This keeps
    // x-branch-id flowing so they can create orders again.
    if (user?.role === 'super_admin' && data?.branch) {
      const branchId = data.branch._id ?? data.branch;
      if (branchId) tokenService.setBranchId(branchId);
    }

    // data is null/undefined when no open shift exists — hydrateShift handles that gracefully
    dispatch(hydrateShift(data ?? null));
  }, [isSuccess, data, dispatch, user]);

  return null;
}

function POSShell() {
  const user = useSelector(selectUser);

  if (!user) return <LoginPage />;

  return (
    <div className="app-shell">
      <ShiftHydrator />
      <AccessToast />
      <Sidebar />
      <div className="app-content">
        <Routes>
          <Route path="/"                element={<POSPage />} />
          <Route path="/dashboard"       element={<RequireAccess path="/dashboard"       element={<DashboardPage />} />} />
          <Route path="/orders"          element={<RequireAccess path="/orders"          element={<OrdersPage />} />} />
          <Route path="/menu"            element={<RequireAccess path="/menu"            element={<MenuPage />} />} />
          <Route path="/reports"         element={<RequireAccess path="/reports"         element={<ReportsPage />} />} />
          <Route path="/users"           element={<RequireAccess path="/users"           element={<UsersPage />} />} />
          <Route path="/payment-methods" element={<RequireAccess path="/payment-methods" element={<PaymentMethodsPage />} />} />
          <Route path="/exchange-rate"   element={<RequireAccess path="/exchange-rate"   element={<ExchangeRatePage />} />} />
          <Route path="*"                element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*"       element={<POSShell />} />
      </Routes>
    </BrowserRouter>
  );
}
