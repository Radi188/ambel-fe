import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Lock, Settings } from 'lucide-react';
import { selectUser } from '../features/auth/authSlice';
import { canAccess } from '../config/permissions';
import AdminLoginPage   from '../pages/admin/AdminLoginPage';
import AdminSidebar     from '../components/admin/AdminSidebar';
import AdminDashboard   from '../pages/admin/AdminDashboard';
import BranchesPage     from '../pages/admin/BranchesPage';
import StaffPage        from '../pages/admin/StaffPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminMenuPage   from '../pages/admin/AdminMenuPage';
import AdminPlaceholder from '../pages/admin/AdminPlaceholder';

function Guard({ path, element }) {
  const user = useSelector(selectUser);
  if (!canAccess(user?.role, path)) {
    return <AdminPlaceholder title="Access Restricted" Icon={Lock} />;
  }
  return element;
}

export default function AdminApp() {
  const user = useSelector(selectUser);

  if (!user) return <AdminLoginPage />;

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="app-content">
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="branches"  element={<Guard path="/admin/branches"  element={<BranchesPage />} />} />
          <Route path="staff"     element={<Guard path="/admin/staff"     element={<StaffPage />} />} />
          <Route path="reports"   element={<Guard path="/admin/reports"   element={<AdminReportsPage />} />} />
          <Route path="menu"      element={<Guard path="/admin/menu"      element={<AdminMenuPage />} />} />
          <Route path="settings"  element={<Guard path="/admin/settings"  element={<AdminPlaceholder title="Settings" Icon={Settings} />} />} />
          <Route path="*"         element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
