import { useSelector } from 'react-redux';
import { DollarSign, Receipt, Building2, Users, Clock } from 'lucide-react';
import { selectAdminUser } from '../../features/adminAuth/adminAuthSlice';

const BRANCHES = [
  { id: 1, name: 'Downtown Branch',   manager: 'Alex Johnson', status: 'open', todaySales: 1250.50, orders: 87,  staff: 5, activeShift: true },
  { id: 2, name: 'North Mall Branch', manager: 'Sarah Kim',    status: 'open', todaySales: 890.25,  orders: 62,  staff: 4, activeShift: true },
  { id: 3, name: 'Airport Branch',    manager: 'James Wong',   status: 'open', todaySales: 2100.75, orders: 134, staff: 6, activeShift: true },
];

const RECENT_ORDERS = [
  { id: '#0091', branch: 'Airport Branch',    cashier: 'Sam R.', total: 23.50, method: 'Card', time: '10:42' },
  { id: '#0090', branch: 'Downtown Branch',   cashier: 'Maya C.', total: 8.75, method: 'Cash', time: '10:39' },
  { id: '#0089', branch: 'North Mall Branch', cashier: 'Leo M.',  total: 15.00, method: 'GoPay', time: '10:35' },
  { id: '#0088', branch: 'Airport Branch',    cashier: 'Priya N.', total: 31.25, method: 'Card', time: '10:31' },
  { id: '#0087', branch: 'Downtown Branch',   cashier: 'Maya C.', total: 6.50, method: 'Cash', time: '10:28' },
];

export default function AdminDashboard() {
  const user = useSelector(selectAdminUser);
  const isSuperAdmin = user?.role === 'super_admin';

  const totalRevenue = BRANCHES.reduce((s, b) => s + b.todaySales, 0);
  const totalOrders  = BRANCHES.reduce((s, b) => s + b.orders, 0);

  const visibleBranches = isSuperAdmin
    ? BRANCHES
    : BRANCHES.filter((b) => b.id === user?.branchId);

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">
            {isSuperAdmin ? 'Overview of all branches' : `${user?.branch} overview`}
          </p>
        </div>
        <div className="admin-topbar-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="admin-content">
        {isSuperAdmin && (
          <div className="admin-stats-row">
            {[
              { label: 'Total Revenue Today', val: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: <DollarSign size={20} />, note: '↑ 8% vs yesterday' },
              { label: 'Total Orders Today',  val: totalOrders,   icon: <Receipt size={20} />, note: 'All branches combined' },
              { label: 'Active Branches',     val: BRANCHES.length, icon: <Building2 size={20} />, note: 'All branches open' },
              { label: 'Staff On Duty',       val: BRANCHES.reduce((s, b) => s + b.staff, 0), icon: <Users size={20} />, note: 'Across all branches' },
            ].map((s) => (
              <div key={s.label} className="admin-stat-card">
                <div className="admin-stat-icon">{s.icon}</div>
                <div className="admin-stat-body">
                  <span className="admin-stat-val">{s.val}</span>
                  <span className="admin-stat-label">{s.label}</span>
                  <span className="admin-stat-note">{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isSuperAdmin && (() => {
          const branch = BRANCHES.find(b => b.id === user?.branchId) || BRANCHES[0];
          return (
            <div className="admin-stats-row">
              {[
                { label: "Today's Revenue", val: `$${branch.todaySales.toFixed(2)}`, icon: <DollarSign size={20} />, note: '↑ 5% vs yesterday' },
                { label: 'Orders Today',    val: branch.orders,  icon: <Receipt size={20} />, note: 'Completed orders' },
                { label: 'Staff On Duty',   val: branch.staff,   icon: <Users size={20} />, note: 'Active cashiers' },
                { label: 'Active Shift',    val: branch.activeShift ? 'Open' : 'Closed', icon: <Clock size={20} />, note: 'Since 8:00 AM' },
              ].map((s) => (
                <div key={s.label} className="admin-stat-card">
                  <div className="admin-stat-icon">{s.icon}</div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-val">{s.val}</span>
                    <span className="admin-stat-label">{s.label}</span>
                    <span className="admin-stat-note">{s.note}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="admin-two-col">
          <div className="admin-card">
            <h3 className="admin-card-title">
              {isSuperAdmin ? 'Branch Performance' : 'Branch Overview'}
            </h3>
            <div className="admin-branch-list">
              {visibleBranches.map((branch) => (
                <div key={branch.id} className="admin-branch-row">
                  <div className="admin-branch-row-left">
                    <div className="admin-branch-icon"><Building2 size={18} /></div>
                    <div>
                      <span className="admin-branch-name">{branch.name}</span>
                      <span className="admin-branch-manager">Manager: {branch.manager}</span>
                    </div>
                  </div>
                  <div className="admin-branch-row-right">
                    <div className="admin-branch-stat">
                      <span>{branch.orders}</span>
                      <span>orders</span>
                    </div>
                    <div className="admin-branch-stat">
                      <span>${branch.todaySales.toFixed(0)}</span>
                      <span>revenue</span>
                    </div>
                    <span className={`admin-branch-status admin-branch-status--${branch.status}`}>
                      {branch.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Recent Orders</h3>
            <div className="admin-recent-list">
              {RECENT_ORDERS
                .filter(o => isSuperAdmin || o.branch === user?.branch)
                .slice(0, 5)
                .map((order) => (
                  <div key={order.id} className="admin-recent-row">
                    <span className="admin-recent-id">{order.id}</span>
                    <div className="admin-recent-mid">
                      {isSuperAdmin && <span className="admin-recent-branch">{order.branch}</span>}
                      <span className="admin-recent-cashier">{order.cashier}</span>
                    </div>
                    <span className="admin-recent-method">{order.method}</span>
                    <span className="admin-recent-total">${order.total.toFixed(2)}</span>
                    <span className="admin-recent-time">{order.time}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
