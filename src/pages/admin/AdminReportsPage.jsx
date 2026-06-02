import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  DollarSign, BarChart2, Banknote, CreditCard, Smartphone,
  Package, User, Building2, Receipt,
  AlertTriangle,
} from 'lucide-react';
import { selectUser } from '../../features/auth/authSlice';
import {
  useGetSalesReportQuery,
  useGetOrdersReportQuery,
  useGetProductsReportQuery,
  useGetCashiersReportQuery,
  useGetBranchesReportQuery,
} from '../../store/apis/reportsApi';

// ─── Helpers ──────────────────────────────────────────────────────
function today()        { return new Date().toISOString().split('T')[0]; }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }
function startOfWeek()  { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; }
function daysAgo(n)     { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function fmtDate(iso)   { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmt$(n)        { return `$${Number(n ?? 0).toFixed(2)}`; }

const PRESETS = [
  { label: 'Today',        from: today,             to: today },
  { label: 'This Week',    from: startOfWeek,       to: today },
  { label: 'This Month',   from: startOfMonth,      to: today },
  { label: 'Last 30 Days', from: () => daysAgo(30), to: today },
];

const TABS = [
  { id: 'sales',    label: 'Sales'    },
  { id: 'orders',   label: 'Orders'   },
  { id: 'products', label: 'Products' },
  { id: 'cashiers', label: 'Cashiers' },
  { id: 'branches', label: 'Branches', superAdminOnly: true },
];

const METHOD_ICON  = {
  cash: <Banknote size={14} />,
  card: <CreditCard size={14} />,
  qr:   <Smartphone size={14} />,
};
const STATUS_COLOR = {
  completed: '#16a34a',
  pending:   '#d97706',
  cancelled: '#dc2626',
  preparing: '#2563eb',
  ready:     '#7c3aed',
};

// ─── Shared UI ────────────────────────────────────────────────────
function SectionLoader() {
  return (
    <div className="table-loading">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-row" style={{ height: 36 }} />
      ))}
    </div>
  );
}

function SectionError({ onRetry }) {
  return (
    <div className="api-error" style={{ padding: '30px 0' }}>
      <AlertTriangle size={20} /><p>Failed to load data</p>
      <button className="retry-btn" onClick={onRetry}>Retry</button>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-body">
        <span className="admin-stat-val">{value ?? '—'}</span>
        <span className="admin-stat-label">{label}</span>
        {sub && <span className="admin-stat-note">{sub}</span>}
      </div>
    </div>
  );
}

function BarChart({ rows, valueKey, labelKey, fmtValue }) {
  const max = Math.max(...rows.map((r) => r[valueKey] ?? 0), 1);
  return (
    <div className="rpt-bar-chart">
      {rows.map((r) => {
        const val = r[valueKey] ?? 0;
        return (
          <div key={r[labelKey]} className="rpt-bar-col">
            <span className="rpt-bar-val">{fmtValue ? fmtValue(val) : val}</span>
            <div className="rpt-bar-track">
              <div className="rpt-bar-fill" style={{ height: `${(val / max) * 100}%` }} />
            </div>
            <span className="rpt-bar-label">{fmtDate(r[labelKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 1: Sales ─────────────────────────────────────────────────
function SalesTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetSalesReportQuery(params);

  if (isLoading) return <SectionLoader />;
  if (isError)   return <SectionError onRetry={refetch} />;

  const ov        = data?.overview  ?? {};
  const byDay     = data?.byDay     ?? [];
  const byMethod  = data?.byMethod  ?? [];
  const refunds   = data?.refunds;
  const methodTotal = byMethod.reduce((s, m) => s + (m.total ?? 0), 0) || 1;

  return (
    <>
      <div className="admin-stats-row">
        <StatCard icon={<DollarSign size={20} />} label="Total Revenue"      value={fmt$(ov.totalRevenue)}      sub={`${ov.totalTransactions ?? 0} transactions`} />
        <StatCard icon={<BarChart2 size={20} />}   label="Avg Transaction"    value={fmt$(ov.averageTransaction)} />
        <StatCard icon={<Banknote size={20} />}    label="Cash Received"      value={fmt$(ov.totalCashReceived)}  sub={`Change: ${fmt$(ov.totalChangeGiven)}`} />
        {refunds?.count > 0 && (
          <StatCard icon="↩️" label="Refunds"          value={`-${fmt$(refunds.total)}`}   sub={`${refunds.count} refunds`} />
        )}
      </div>

      {byDay.length > 0 && (
        <div className="admin-card">
          <h3 className="admin-card-title">Revenue by Day</h3>
          <BarChart rows={byDay} valueKey="revenue" labelKey="date" fmtValue={(v) => `$${v.toFixed(0)}`} />
        </div>
      )}

      <div className="admin-card">
        <h3 className="admin-card-title">Payment Methods</h3>
        {byMethod.length === 0 ? (
          <p style={{ color: 'var(--text-lt)', fontSize: 13 }}>No data for selected period</p>
        ) : (
          <div className="admin-method-list">
            {byMethod.map((m) => {
              const pct  = Math.round((m.total / methodTotal) * 100);
              const name = m.method.charAt(0).toUpperCase() + m.method.slice(1);
              return (
                <div key={m.method} className="admin-method-row">
                  <div className="admin-method-top">
                    <span className="admin-method-name">
                      {METHOD_ICON[m.method] ?? <CreditCard size={14} />} {name}
                    </span>
                    <span className="admin-method-pct">{pct}%</span>
                  </div>
                  <div className="admin-method-track">
                    <div className="admin-method-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span className="admin-method-amt">{fmt$(m.total)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{m.count} txns</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tab 2: Orders ────────────────────────────────────────────────
function OrdersTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetOrdersReportQuery(params);

  if (isLoading) return <SectionLoader />;
  if (isError)   return <SectionError onRetry={refetch} />;

  const ov       = data?.overview ?? {};
  const byStatus = data?.byStatus ?? [];
  const byDay    = data?.byDay    ?? [];
  const total    = ov.totalOrders || 1;

  return (
    <>
      <div className="admin-stats-row">
        <StatCard icon={<Receipt size={20} />}    label="Total Orders"     value={ov.totalOrders ?? '—'} />
        <StatCard icon={<DollarSign size={20} />} label="Total Value"      value={fmt$(ov.totalValue)} />
        <StatCard icon={<BarChart2 size={20} />}  label="Avg Order Value"  value={fmt$(ov.averageOrderValue)} sub={`${ov.avgItemsPerOrder ?? 0} items/order`} />
      </div>

      {byDay.length > 0 && (
        <div className="admin-card">
          <h3 className="admin-card-title">Orders by Day</h3>
          <BarChart rows={byDay} valueKey="orders" labelKey="date" />
        </div>
      )}

      <div className="admin-card">
        <h3 className="admin-card-title">Orders by Status</h3>
        {byStatus.length === 0 ? (
          <p style={{ color: 'var(--text-lt)', fontSize: 13 }}>No data for selected period</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byStatus.map((s) => {
              const color = STATUS_COLOR[s.status] ?? '#aaa';
              const pct   = Math.round((s.count / total) * 100);
              return (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
                    background: color + '18', color, minWidth: 90, textAlign: 'center',
                  }}>
                    {s.status}
                  </span>
                  <div style={{ flex: 1, height: 6, background: 'var(--grey-100)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', minWidth: 28, textAlign: 'right' }}>{s.count}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-lt)', minWidth: 72, textAlign: 'right' }}>{fmt$(s.totalValue)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tab 3: Products ──────────────────────────────────────────────
function ProductsTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetProductsReportQuery(params);

  if (isLoading) return <SectionLoader />;
  if (isError)   return <SectionError onRetry={refetch} />;

  const top        = data?.topProducts    ?? [];
  const bottom     = data?.bottomProducts ?? [];
  const byCategory = data?.byCategory     ?? [];
  const maxQty     = top[0]?.totalQuantity || 1;
  const maxCatRev  = Math.max(...byCategory.map((c) => c.totalRevenue ?? 0), 1);

  return (
    <>
      <div className="admin-card">
        <h3 className="admin-card-title">Top Products by Revenue</h3>
        {top.length === 0 ? (
          <p style={{ color: 'var(--text-lt)', fontSize: 13 }}>No data for selected period</p>
        ) : (
          <div className="so-table-wrap" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
            <table className="so-table">
              <thead>
                <tr><th>#</th><th>Product</th><th>Category</th><th>Sold</th><th>Orders</th><th>Avg Price</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {top.map((p, i) => (
                  <tr key={String(p.productId)}>
                    <td style={{ color: 'var(--text-faint)', fontWeight: 700, fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: 3 }}>{p.productName}</div>
                      <div style={{ height: 4, background: 'var(--grey-100)', borderRadius: 2, width: 120, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${(p.totalQuantity / maxQty) * 100}%` }} />
                      </div>
                    </td>
                    <td><span className="cat-pill">{p.categoryName}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.totalQuantity}</td>
                    <td style={{ color: 'var(--text-lt)' }}>{p.totalOrders}</td>
                    <td style={{ color: 'var(--text-lt)' }}>{fmt$(p.averageUnitPrice)}</td>
                    <td className="so-total">{fmt$(p.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-two-col">
        <div className="admin-card">
          <h3 className="admin-card-title">Revenue by Category</h3>
          {byCategory.length === 0 ? (
            <p style={{ color: 'var(--text-lt)', fontSize: 13 }}>No data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byCategory.map((c) => (
                <div key={String(c.categoryId)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>{c.categoryName}</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-lt)' }}>{c.totalQuantity} sold</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>{fmt$(c.totalRevenue)}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--grey-100)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--grey-800)', borderRadius: 3, width: `${(c.totalRevenue / maxCatRev) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Slow-Moving Products</h3>
          {bottom.length === 0 ? (
            <p style={{ color: 'var(--text-lt)', fontSize: 13 }}>No data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bottom.map((p) => (
                <div key={String(p.productId)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--grey-100)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>{p.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-lt)' }}>{p.categoryName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>{p.totalQuantity} sold</div>
                    <div style={{ fontSize: 11, color: 'var(--text-lt)' }}>{fmt$(p.totalRevenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tab 4: Cashiers ──────────────────────────────────────────────
function CashiersTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetCashiersReportQuery(params);

  if (isLoading) return <SectionLoader />;
  if (isError)   return <SectionError onRetry={refetch} />;

  const cashiers = data?.cashiers ?? [];

  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
        <h3 className="admin-card-title" style={{ marginBottom: 0 }}>Cashier Summary</h3>
      </div>
      {cashiers.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <User size={32} /><p>No cashier data for selected period</p>
        </div>
      ) : (
        <table className="so-table">
          <thead>
            <tr>
              <th>Cashier</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Avg Order</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.map((c, i) => (
              <tr key={i}>
                <td>
                  <div className="so-cashier">
                    <span className="so-cashier-avatar">{c.cashierName?.[0]}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{c.cashierName}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{c.totalOrders}</td>
                <td className="so-total">{fmt$(c.totalRevenue)}</td>
                <td style={{ color: 'var(--text-lt)' }}>{fmt$(c.averageOrderValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Tab 5: Branches (super_admin only) ───────────────────────────
function BranchesTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetBranchesReportQuery(params);

  if (isLoading) return <SectionLoader />;
  if (isError)   return <SectionError onRetry={refetch} />;

  const branches = data?.branches ?? [];
  const maxRev   = Math.max(...branches.map((b) => b.revenue ?? 0), 1);

  if (branches.length === 0) {
    return <div className="empty-state"><Building2 size={32} /><p>No branch data for selected period</p></div>;
  }

  return (
    <>
      <div className="admin-card">
        <h3 className="admin-card-title">Revenue by Branch</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 160, paddingTop: 24 }}>
          {branches.map((b) => {
            const pct = (b.revenue / maxRev) * 100;
            return (
              <div key={String(b.branchId)} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-lt)' }}>{fmt$(b.revenue)}</span>
                <div style={{ width: '100%', height: `${pct}%`, background: 'var(--grey-900)', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                <span style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.3 }}>{b.branchName}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="so-table-wrap">
        <table className="so-table">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Orders</th>
              <th>Completed</th>
              <th>Cancelled</th>
              <th>Transactions</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={String(b.branchId)}>
                <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{b.branchName}</td>
                <td>{b.totalOrders}</td>
                <td><span className="so-status so-status--completed">{b.completedOrders}</span></td>
                <td>
                  {b.cancelledOrders > 0
                    ? <span className="so-status so-status--pending">{b.cancelledOrders}</span>
                    : <span style={{ color: 'var(--text-faint)' }}>—</span>
                  }
                </td>
                <td style={{ color: 'var(--text-lt)' }}>{b.transactions}</td>
                <td className="so-total">{fmt$(b.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const user         = useSelector(selectUser);
  const isSuperAdmin = user?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState('sales');
  const [preset,    setPreset]    = useState('This Month');
  const [dateFrom,  setDateFrom]  = useState(startOfMonth());
  const [dateTo,    setDateTo]    = useState(today());

  const handlePreset = (p) => {
    setPreset(p.label);
    setDateFrom(p.from());
    setDateTo(p.to());
  };

  const handleCustomDate = (field, val) => {
    setPreset('Custom');
    if (field === 'from') setDateFrom(val);
    else setDateTo(val);
  };

  // Manager is pinned to their own branch; super-admin sees all branches.
  const branchId = user?.branchId ?? user?.branch?._id ?? user?.branch ?? null;
  const params = useMemo(() => ({
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo   }),
    // Super-admin has no fixed branch — show cross-branch (global) figures by
    // opting out of the x-branch-id scoping. A manager is explicitly scoped to
    // their own branch so the report only ever shows that branch.
    ...(isSuperAdmin
      ? { headers: { 'x-skip-branch': '1' } }
      : branchId ? { headers: { 'x-branch-id': branchId } } : {}),
  }), [dateFrom, dateTo, isSuperAdmin, branchId]);

  const visibleTabs = TABS.filter((t) => !t.superAdminOnly || isSuperAdmin);

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1 className="admin-page-title">Reports</h1>
          <p className="admin-page-sub">
            {isSuperAdmin ? 'All branches' : user?.branch?.name ?? user?.branch ?? 'Your branch'}
            {dateFrom && dateTo ? ` · ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}` : ''}
          </p>
        </div>
      </div>

      <div className="admin-content">
        {/* Date range filter */}
        <div className="rpt-filter-bar">
          <div className="rpt-presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`so-filter-btn ${preset === p.label ? 'so-filter-btn--active' : ''}`}
                onClick={() => handlePreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="rpt-date-range">
            <div className="rpt-date-field">
              <label>From</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => handleCustomDate('from', e.target.value)}
                className="rpt-date-input"
              />
            </div>
            <span className="rpt-date-sep">→</span>
            <div className="rpt-date-field">
              <label>To</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={today()}
                onChange={(e) => handleCustomDate('to', e.target.value)}
                className="rpt-date-input"
              />
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="rpt-tabs">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              className={`rpt-tab ${activeTab === t.id ? 'rpt-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'sales'    && <SalesTab    params={params} />}
        {activeTab === 'orders'   && <OrdersTab   params={params} />}
        {activeTab === 'products' && <ProductsTab params={params} />}
        {activeTab === 'cashiers' && <CashiersTab params={params} />}
        {activeTab === 'branches' && isSuperAdmin && <BranchesTab params={params} />}
      </div>
    </div>
  );
}
