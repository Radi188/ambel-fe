import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAdminUser } from '../../features/adminAuth/adminAuthSlice';

const ALL_STAFF = [
  { id: 1, name: 'Maya Chen',     email: 'maya@ambel.com',  role: 'Cashier',         branch: 'Downtown Branch',   branchId: 1, status: 'active',   joined: '2025-03-10', shifts: 48 },
  { id: 2, name: 'Leo Martinez',  email: 'leo@ambel.com',   role: 'Cashier',         branch: 'Downtown Branch',   branchId: 1, status: 'active',   joined: '2025-05-22', shifts: 31 },
  { id: 3, name: 'Sam Rivera',    email: 'sam@ambel.com',   role: 'Cashier',         branch: 'Downtown Branch',   branchId: 1, status: 'active',   joined: '2025-07-01', shifts: 20 },
  { id: 4, name: 'Priya Nair',    email: 'priya@ambel.com', role: 'Cashier',         branch: 'North Mall Branch', branchId: 2, status: 'active',   joined: '2025-04-15', shifts: 38 },
  { id: 5, name: 'Tom Baker',     email: 'tom@ambel.com',   role: 'Cashier',         branch: 'North Mall Branch', branchId: 2, status: 'active',   joined: '2025-06-03', shifts: 25 },
  { id: 6, name: 'Jin Park',      email: 'jin@ambel.com',   role: 'Cashier',         branch: 'Airport Branch',    branchId: 3, status: 'active',   joined: '2024-12-01', shifts: 72 },
  { id: 7, name: 'Clara Reyes',   email: 'clara@ambel.com', role: 'Cashier',         branch: 'Airport Branch',    branchId: 3, status: 'on leave', joined: '2025-01-10', shifts: 55 },
  { id: 8, name: 'Alex Johnson',  email: 'downtown@ambel.com', role: 'Branch Manager', branch: 'Downtown Branch', branchId: 1, status: 'active', joined: '2023-03-15', shifts: 120 },
  { id: 9, name: 'Sarah Kim',     email: 'northmall@ambel.com', role: 'Branch Manager', branch: 'North Mall Branch', branchId: 2, status: 'active', joined: '2023-09-01', shifts: 98 },
];

const ROLE_COLORS = {
  'Cashier':         'admin-role--cashier',
  'Branch Manager':  'admin-role--manager',
};

export default function StaffPage() {
  const user         = useSelector(selectAdminUser);
  const isSuperAdmin = user?.role === 'super_admin';
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const staff = ALL_STAFF.filter((s) => {
    const matchBranch = isSuperAdmin || s.branchId === user?.branchId;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || s.role === roleFilter;
    return matchBranch && matchSearch && matchRole;
  });

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Staff</h1>
          <p className="admin-page-sub">{staff.length} members</p>
        </div>
        <button className="admin-primary-btn">+ Add Staff</button>
      </div>

      <div className="admin-content">
        <div className="admin-toolbar">
          <div className="so-filters">
            {['all', 'Cashier', 'Branch Manager'].map((r) => (
              <button
                key={r}
                className={`so-filter-btn ${roleFilter === r ? 'so-filter-btn--active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>
          <div className="so-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search staff…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="so-search"
            />
          </div>
        </div>

        <div className="so-table-wrap">
          <table className="so-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isSuperAdmin && <th>Branch</th>}
                <th>Status</th>
                <th>Joined</th>
                <th>Shifts</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="so-cashier">
                      <span className="so-cashier-avatar">{s.name[0]}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-lt)', fontFamily: 'monospace', fontSize: 12 }}>{s.email}</td>
                  <td><span className={`admin-role-tag ${ROLE_COLORS[s.role] ?? ''}`}>{s.role}</span></td>
                  {isSuperAdmin && <td style={{ color: 'var(--text-lt)' }}>{s.branch}</td>}
                  <td>
                    <span className={`so-status ${s.status === 'active' ? 'so-status--completed' : 'so-status--pending'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-lt)' }}>
                    {new Date(s.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.shifts}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-outline-btn admin-outline-btn--sm">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
