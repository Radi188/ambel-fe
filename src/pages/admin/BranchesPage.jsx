import { Building2 } from 'lucide-react';

const BRANCHES = [
  { id: 1, name: 'Downtown Branch',   address: '12 Main St, City Center', manager: 'Alex Johnson', managerEmail: 'downtown@ambel.com', status: 'open', staff: 5, todaySales: 1250.50, orders: 87,  phone: '+1 555-0101', opened: '2023-03-15' },
  { id: 2, name: 'North Mall Branch', address: 'North Mall, Level 2, Unit 45', manager: 'Sarah Kim', managerEmail: 'northmall@ambel.com', status: 'open', staff: 4, todaySales: 890.25,  orders: 62,  phone: '+1 555-0102', opened: '2023-09-01' },
  { id: 3, name: 'Airport Branch',    address: 'Terminal 2, Departure Hall', manager: 'James Wong', managerEmail: 'airport@ambel.com', status: 'open', staff: 6, todaySales: 2100.75, orders: 134, phone: '+1 555-0103', opened: '2024-01-20' },
];

export default function BranchesPage() {
  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Branches</h1>
          <p className="admin-page-sub">{BRANCHES.length} locations</p>
        </div>
        <button className="admin-primary-btn">+ Add Branch</button>
      </div>

      <div className="admin-content">
        <div className="admin-branches-grid">
          {BRANCHES.map((branch) => (
            <div key={branch.id} className="admin-branch-card">
              <div className="admin-branch-card-header">
                <div className="admin-branch-card-icon"><Building2 size={20} /></div>
                <div className="admin-branch-card-title-wrap">
                  <span className="admin-branch-card-name">{branch.name}</span>
                  <span className={`admin-branch-status admin-branch-status--${branch.status}`}>{branch.status}</span>
                </div>
              </div>

              <div className="admin-branch-card-meta">
                <div className="admin-branch-meta-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {branch.address}
                </div>
                <div className="admin-branch-meta-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5 19.79 19.79 0 01.22 4.82 2 2 0 012.2 2.62h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.36 6.36l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  {branch.phone}
                </div>
                <div className="admin-branch-meta-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  {branch.manager} · {branch.staff} staff
                </div>
              </div>

              <div className="admin-branch-card-stats">
                <div className="admin-branch-card-stat">
                  <span>${branch.todaySales.toFixed(2)}</span>
                  <span>Today's Sales</span>
                </div>
                <div className="admin-branch-card-stat">
                  <span>{branch.orders}</span>
                  <span>Orders</span>
                </div>
                <div className="admin-branch-card-stat">
                  <span>{new Date(branch.opened).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  <span>Opened</span>
                </div>
              </div>

              <div className="admin-branch-card-actions">
                <button className="admin-outline-btn">Edit</button>
                <button className="admin-outline-btn">View Reports</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
