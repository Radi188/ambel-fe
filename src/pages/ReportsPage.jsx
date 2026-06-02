import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  DollarSign, BarChart2, Banknote, CreditCard, Smartphone,
  Package, User, Building2, Receipt, TrendingUp,
  AlertTriangle, Calendar, ChevronRight, RefreshCw,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import { selectUser } from '../features/auth/authSlice';
import {
  useGetSalesReportQuery,
  useGetOrdersReportQuery,
  useGetProductsReportQuery,
  useGetCashiersReportQuery,
  useGetBranchesReportQuery,
} from '../store/apis/reportsApi';

// ─── Helpers ──────────────────────────────────────────────────────
function today()        { return new Date().toISOString().split('T')[0]; }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }
function startOfWeek()  { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; }
function daysAgo(n)     { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function fmtDate(iso)   { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmt$(n)        { return `$${Number(n ?? 0).toFixed(2)}`; }
function fmtNum(n)      { return Number(n ?? 0).toLocaleString(); }

const PRESETS = [
  { label: 'Today',      from: today,             to: today },
  { label: 'This Week',  from: startOfWeek,       to: today },
  { label: 'This Month', from: startOfMonth,      to: today },
  { label: 'Last 30d',   from: () => daysAgo(30), to: today },
];

const TABS = [
  { id: 'sales',    label: 'Sales',    Icon: DollarSign },
  { id: 'orders',   label: 'Orders',   Icon: Receipt    },
  { id: 'products', label: 'Products', Icon: Package    },
  { id: 'cashiers', label: 'Cashiers', Icon: User       },
  { id: 'branches', label: 'Branches', Icon: Building2, superAdminOnly: true },
];

const GR = { bg: 'var(--grey-100)', color: 'var(--grey-700)' };

const METHOD_META = {
  cash: { icon: <Banknote   size={13} />, color: 'var(--grey-700)', bg: 'var(--grey-100)', label: 'Cash'       },
  card: { icon: <CreditCard size={13} />, color: 'var(--grey-700)', bg: 'var(--grey-100)', label: 'Card'       },
  qr:   { icon: <Smartphone size={13} />, color: 'var(--grey-700)', bg: 'var(--grey-100)', label: 'QR / GoPay' },
};

const STATUS_STYLES = {
  completed: { color: '#15803d', bg: '#dcfce7' },
  pending:   { color: '#b45309', bg: '#fef3c7' },
  cancelled: { color: '#b91c1c', bg: '#fee2e2' },
  preparing: { color: '#1d4ed8', bg: '#dbeafe' },
  ready:     { color: '#6d28d9', bg: '#ede9fe' },
};

// ─── Primitives ───────────────────────────────────────────────────
function Loader() {
  return (
    <div className="rp-loader">
      <div className="rp-loader-kpi-row">
        <div className="rp-sk rp-sk--kpi" />
        <div className="rp-sk rp-sk--kpi" style={{ animationDelay: '.07s' }} />
        <div className="rp-sk rp-sk--kpi" style={{ animationDelay: '.14s' }} />
      </div>
      <div className="rp-sk rp-sk--chart" style={{ animationDelay: '.21s' }} />
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="rp-error-state">
      <AlertTriangle size={18} />
      <span>Failed to load data</span>
      <button onClick={onRetry} className="rp-retry-btn">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );
}

function RpCard({ title, children, noPad, className = '' }) {
  return (
    <div className={`rp-card ${className}`}>
      {title && <div className="rp-card-head"><h3 className="rp-card-title">{title}</h3></div>}
      <div className={noPad ? '' : 'rp-card-body'}>{children}</div>
    </div>
  );
}

function KpiGrid({ items }) {
  return (
    <div className="rp-kpi-row">
      {items.map(({ icon, label, value, note, accent }) => (
        <div key={label} className="rp-kpi-card">
          <div className="rp-kpi-icon-wrap" style={{ background: accent?.bg, color: accent?.color }}>
            {icon}
          </div>
          <div className="rp-kpi-body">
            <span className="rp-kpi-label">{label}</span>
            <span className="rp-kpi-value">{value ?? '—'}</span>
            {note && <span className="rp-kpi-note">{note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BarChart({ rows, valueKey, labelKey, fmtValue, accentColor }) {
  const max = Math.max(...rows.map((r) => r[valueKey] ?? 0), 1);
  return (
    <div className="rp-bar-wrap">
      {rows.map((r) => {
        const val = r[valueKey] ?? 0;
        const pct = (val / max) * 100;
        return (
          <div key={r[labelKey]} className="rp-bar-col">
            <span className="rp-bar-val">{fmtValue ? fmtValue(val) : val}</span>
            <div className="rp-bar-track">
              <div
                className="rp-bar-fill"
                style={{ height: `${Math.max(pct, 2)}%`, '--bar-color': accentColor ?? 'var(--accent)' }}
              />
            </div>
            <span className="rp-bar-lbl">{fmtDate(r[labelKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Sales ───────────────────────────────────────────────────
function SalesTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetSalesReportQuery(params);
  if (isLoading) return <Loader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  const ov          = data?.overview ?? {};
  const byDay       = data?.byDay    ?? [];
  const byMethod    = data?.byMethod ?? [];
  const refunds     = data?.refunds;
  const methodTotal = byMethod.reduce((s, m) => s + (m.total ?? 0), 0) || 1;

  return (
    <div className="rp-section-stack">
      <KpiGrid items={[
        { icon: <DollarSign size={17} />, label: 'Total Revenue',   value: fmt$(ov.totalRevenue),      note: `${fmtNum(ov.totalTransactions)} transactions`, accent: GR },
        { icon: <BarChart2  size={17} />, label: 'Avg Transaction', value: fmt$(ov.averageTransaction),                                                       accent: GR },
        { icon: <Banknote   size={17} />, label: 'Cash Received',   value: fmt$(ov.totalCashReceived),  note: `Change: ${fmt$(ov.totalChangeGiven)}`,           accent: GR },
        ...(refunds?.count > 0 ? [{ icon: <TrendingUp size={17} />, label: 'Refunds', value: `-${fmt$(refunds.total)}`, note: `${refunds.count} refunds`, accent: GR }] : []),
      ]} />

      {byDay.length > 0 && (
        <RpCard title="Revenue by Day">
          <BarChart rows={byDay} valueKey="revenue" labelKey="date" fmtValue={(v) => `$${v.toFixed(0)}`} />
        </RpCard>
      )}

      <RpCard title="Payment Methods">
        {byMethod.length === 0 ? (
          <p className="rp-empty-msg">No data for selected period</p>
        ) : (
          <div className="rp-method-list">
            {byMethod.map((m) => {
              const pct  = Math.round((m.total / methodTotal) * 100);
              const meta = METHOD_META[m.method] ?? { icon: <CreditCard size={13} />, color: '#52525b', bg: '#f4f4f5', label: m.method };
              return (
                <div key={m.method} className="rp-method-row">
                  <div className="rp-method-badge" style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                    <span>{meta.label}</span>
                  </div>
                  <div className="rp-method-bar-track">
                    <div className="rp-method-bar-fill" style={{ width: `${pct}%`, background: meta.color }} />
                  </div>
                  <div className="rp-method-nums">
                    <span className="rp-method-amount">{fmt$(m.total)}</span>
                    <span className="rp-method-meta">{pct}% · {m.count} txns</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RpCard>
    </div>
  );
}

// ─── Tab: Orders ──────────────────────────────────────────────────
function OrdersTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetOrdersReportQuery(params);
  if (isLoading) return <Loader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  const ov       = data?.overview ?? {};
  const byStatus = data?.byStatus ?? [];
  const byDay    = data?.byDay    ?? [];
  const total    = ov.totalOrders || 1;

  return (
    <div className="rp-section-stack">
      <KpiGrid items={[
        { icon: <Receipt    size={17} />, label: 'Total Orders',    value: fmtNum(ov.totalOrders),                                                       accent: GR },
        { icon: <DollarSign size={17} />, label: 'Total Value',     value: fmt$(ov.totalValue),                                                          accent: GR },
        { icon: <BarChart2  size={17} />, label: 'Avg Order Value', value: fmt$(ov.averageOrderValue), note: `${ov.avgItemsPerOrder ?? 0} items/order`,   accent: GR },
      ]} />

      {byDay.length > 0 && (
        <RpCard title="Orders by Day">
          <BarChart rows={byDay} valueKey="orders" labelKey="date" />
        </RpCard>
      )}

      <RpCard title="Orders by Status">
        {byStatus.length === 0 ? (
          <p className="rp-empty-msg">No data for selected period</p>
        ) : (
          <div className="rp-status-list">
            {byStatus.map((s) => {
              const st  = STATUS_STYLES[s.status] ?? { color: '#71717a', bg: '#f4f4f5' };
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.status} className="rp-status-row">
                  <span className="rp-status-pill" style={{ background: st.bg, color: st.color }}>
                    {s.status}
                  </span>
                  <div className="rp-status-bar-track">
                    <div className="rp-status-bar-fill" style={{ width: `${pct}%`, background: st.color }} />
                  </div>
                  <span className="rp-status-count">{s.count}</span>
                  <span className="rp-status-val">{fmt$(s.totalValue)}</span>
                </div>
              );
            })}
          </div>
        )}
      </RpCard>
    </div>
  );
}

// ─── Tab: Products ────────────────────────────────────────────────
function ProductsTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetProductsReportQuery(params);
  if (isLoading) return <Loader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  const top        = data?.topProducts    ?? [];
  const bottom     = data?.bottomProducts ?? [];
  const byCategory = data?.byCategory     ?? [];
  const maxQty     = top[0]?.totalQuantity || 1;
  const maxCatRev  = Math.max(...byCategory.map((c) => c.totalRevenue ?? 0), 1);

  return (
    <div className="rp-section-stack">
      <RpCard title="Top Products by Revenue" noPad>
        {top.length === 0 ? (
          <div className="rp-empty-block"><Package size={26} /><p>No data for selected period</p></div>
        ) : (
          <table className="rp-table">
            <thead>
              <tr>
                <th className="rp-th-rank">#</th>
                <th>Product</th>
                <th>Category</th>
                <th className="rp-th-r">Sold</th>
                <th className="rp-th-r">Avg Price</th>
                <th className="rp-th-r">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top.map((p, i) => (
                <tr key={String(p.productId)}>
                  <td><span className="rp-rank">{i + 1}</span></td>
                  <td>
                    <div className="rp-prod-name">{p.productName}</div>
                    <div className="rp-prod-bar">
                      <div style={{ width: `${(p.totalQuantity / maxQty) * 100}%` }} />
                    </div>
                  </td>
                  <td><span className="rp-cat-pill">{p.categoryName}</span></td>
                  <td className="rp-td-r rp-td-bold">{p.totalQuantity}</td>
                  <td className="rp-td-r rp-td-muted">{fmt$(p.averageUnitPrice)}</td>
                  <td className="rp-td-r rp-td-money">{fmt$(p.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RpCard>

      <div className="rp-two-col">
        <RpCard title="Revenue by Category">
          {byCategory.length === 0 ? (
            <p className="rp-empty-msg">No data</p>
          ) : (
            <div className="rp-cat-list">
              {byCategory.map((c) => (
                <div key={String(c.categoryId)} className="rp-cat-row">
                  <div className="rp-cat-head">
                    <span className="rp-cat-name">{c.categoryName}</span>
                    <div className="rp-cat-stats">
                      <span className="rp-cat-qty">{c.totalQuantity} sold</span>
                      <span className="rp-cat-rev">{fmt$(c.totalRevenue)}</span>
                    </div>
                  </div>
                  <div className="rp-cat-bar">
                    <div style={{ width: `${(c.totalRevenue / maxCatRev) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </RpCard>

        <RpCard title="Slow-Moving Products">
          {bottom.length === 0 ? (
            <p className="rp-empty-msg">No data</p>
          ) : (
            <div className="rp-slow-list">
              {bottom.map((p) => (
                <div key={String(p.productId)} className="rp-slow-row">
                  <div>
                    <div className="rp-slow-name">{p.productName}</div>
                    <div className="rp-slow-cat">{p.categoryName}</div>
                  </div>
                  <div className="rp-slow-stats">
                    <span className="rp-slow-qty">{p.totalQuantity} sold</span>
                    <span className="rp-slow-rev">{fmt$(p.totalRevenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RpCard>
      </div>
    </div>
  );
}

// ─── Tab: Cashiers ────────────────────────────────────────────────
function CashiersTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetCashiersReportQuery(params);
  if (isLoading) return <Loader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  const cashiers = data?.cashiers ?? [];

  return (
    <RpCard title="Cashier Performance" noPad>
      {cashiers.length === 0 ? (
        <div className="rp-empty-block"><User size={26} /><p>No cashier data for selected period</p></div>
      ) : (
        <table className="rp-table">
          <thead>
            <tr>
              <th>Cashier</th>
              <th className="rp-th-r">Orders</th>
              <th className="rp-th-r">Revenue</th>
              <th className="rp-th-r">Avg Order</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.map((c, i) => (
              <tr key={i}>
                <td>
                  <div className="rp-cashier-cell">
                    <span className="rp-avatar">{c.cashierName?.[0]?.toUpperCase()}</span>
                    <span className="rp-cashier-name">{c.cashierName}</span>
                  </div>
                </td>
                <td className="rp-td-r rp-td-bold">{c.totalOrders}</td>
                <td className="rp-td-r rp-td-money">{fmt$(c.totalRevenue)}</td>
                <td className="rp-td-r rp-td-muted">{fmt$(c.averageOrderValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </RpCard>
  );
}

// ─── Tab: Branches ────────────────────────────────────────────────
function BranchesTab({ params }) {
  const { data, isLoading, isError, refetch } = useGetBranchesReportQuery(params);
  if (isLoading) return <Loader />;
  if (isError)   return <ErrorState onRetry={refetch} />;

  const branches    = data?.branches ?? [];
  const maxRev      = Math.max(...branches.map((b) => b.revenue ?? 0), 1);
  const totalRev    = branches.reduce((s, b) => s + (b.revenue ?? 0), 0);
  const totalOrders = branches.reduce((s, b) => s + (b.totalOrders ?? 0), 0);
  const totalTxns   = branches.reduce((s, b) => s + (b.transactions ?? 0), 0);

  if (branches.length === 0) {
    return <div className="rp-empty-block"><Building2 size={26} /><p>No branch data for selected period</p></div>;
  }

  return (
    <div className="rp-section-stack">

      {/* KPI summary */}
      <KpiGrid items={[
        { icon: <DollarSign size={17} />, label: 'Total Revenue',   value: fmt$(totalRev),       note: `Across ${branches.length} ${branches.length === 1 ? 'branch' : 'branches'}`, accent: GR },
        { icon: <Receipt    size={17} />, label: 'Total Orders',   value: fmtNum(totalOrders),                                              accent: GR },
        { icon: <Building2  size={17} />, label: 'Active Branches',value: branches.length,                                                  accent: GR },
        { icon: <BarChart2  size={17} />, label: 'Transactions',   value: fmtNum(totalTxns),                                               accent: GR },
      ]} />

      {/* Horizontal bar chart — all branches with names clearly visible */}
      <RpCard title="Revenue by Branch">
        <div className="rp-hbar-list">
          {branches.map((b, i) => {
            const pct = (b.revenue / maxRev) * 100;
            const COLORS = ['#18181b', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8'];
            const color  = COLORS[i % COLORS.length];
            return (
              <div key={String(b.branchId)} className="rp-hbar-row">
                <div className="rp-hbar-label">
                  <Building2 size={13} />
                  <span>{b.branchName}</span>
                </div>
                <div className="rp-hbar-track">
                  <div
                    className="rp-hbar-fill"
                    style={{ width: `${Math.max(pct, 1)}%`, background: color }}
                  />
                </div>
                <div className="rp-hbar-meta">
                  <span className="rp-hbar-value">{fmt$(b.revenue)}</span>
                  <span className="rp-hbar-orders">{b.totalOrders} orders</span>
                </div>
              </div>
            );
          })}
        </div>
      </RpCard>

      {/* Data table */}
      <RpCard title="Branch Breakdown" noPad>
        <div className="rp-table-scroll">
          <table className="rp-table rp-branch-table">
            <colgroup>
              <col style={{ minWidth: 200 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th>Branch</th>
                <th className="rp-th-r">Orders</th>
                <th className="rp-th-r">Completed</th>
                <th className="rp-th-r">Cancelled</th>
                <th className="rp-th-r">Transactions</th>
                <th className="rp-th-r">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b, i) => {
                const INITIALS_BG = ['#18181b','#3f3f46','#52525b'];
                const ibg = INITIALS_BG[i % INITIALS_BG.length];
                return (
                  <tr key={String(b.branchId)}>
                    <td>
                      <div className="rp-branch-cell">
                        <span className="rp-branch-avatar" style={{ background: ibg }}>
                          {b.branchName?.[0]?.toUpperCase()}
                        </span>
                        <span className="rp-td-bold">{b.branchName}</span>
                      </div>
                    </td>
                    <td className="rp-td-r rp-td-bold">{b.totalOrders}</td>
                    <td className="rp-td-r">
                      <span className="rp-num-badge rp-num-badge--ok">{b.completedOrders}</span>
                    </td>
                    <td className="rp-td-r">
                      {b.cancelledOrders > 0
                        ? <span className="rp-num-badge rp-num-badge--off">{b.cancelledOrders}</span>
                        : <span className="rp-td-muted">—</span>}
                    </td>
                    <td className="rp-td-r rp-td-muted">{b.transactions}</td>
                    <td className="rp-td-r rp-td-money">{fmt$(b.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </RpCard>

    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function ReportsPage() {
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

  // Manager/cashier are pinned to their own branch; super-admin sees all branches.
  const branchId = user?.branchId ?? user?.branch?._id ?? user?.branch ?? null;
  const params = useMemo(() => ({
    ...(dateFrom && { dateFrom }),
    ...(dateTo   && { dateTo   }),
    // Super-admin has no fixed branch — show cross-branch (global) figures by
    // opting out of the x-branch-id scoping. Everyone else is explicitly scoped
    // to their own branch so the report only ever shows that branch.
    ...(isSuperAdmin
      ? { headers: { 'x-skip-branch': '1' } }
      : branchId ? { headers: { 'x-branch-id': branchId } } : {}),
  }), [dateFrom, dateTo, isSuperAdmin, branchId]);

  const visibleTabs = TABS.filter((t) => !t.superAdminOnly || isSuperAdmin);

  return (
    <div className="page-layout">
      <TopBar title="Reports" />
      <div className="rp-page">

        {/* Controls */}
        <div className="rp-controls-row">
          <div className="rp-presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`rp-preset ${preset === p.label ? 'rp-preset--on' : ''}`}
                onClick={() => handlePreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="rp-daterange">
            <Calendar size={13} className="rp-cal-icon" />
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => handleCustomDate('from', e.target.value)}
              className="rp-date-inp"
            />
            <ChevronRight size={12} className="rp-arrow-sep" />
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today()}
              onChange={(e) => handleCustomDate('to', e.target.value)}
              className="rp-date-inp"
            />
          </div>
        </div>

        {/* Tab bar */}
        <div className="rp-tabs">
          {visibleTabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`rp-tab ${activeTab === id ? 'rp-tab--on' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rp-content">
          {activeTab === 'sales'    && <SalesTab    params={params} />}
          {activeTab === 'orders'   && <OrdersTab   params={params} />}
          {activeTab === 'products' && <ProductsTab params={params} />}
          {activeTab === 'cashiers' && <CashiersTab params={params} />}
          {activeTab === 'branches' && isSuperAdmin && <BranchesTab params={params} />}
        </div>

      </div>
    </div>
  );
}
