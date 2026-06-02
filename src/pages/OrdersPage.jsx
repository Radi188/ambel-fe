import { useState, useMemo } from 'react';
import { Receipt, DollarSign, Package, CheckCircle, Clock, AlertTriangle, RefreshCw, Calendar, ChevronRight } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useGetOrdersQuery } from '../store/apis/ordersApi';

const STATUS_FILTERS = ['all', 'pending', 'completed', 'cancelled'];

function todayStr()     { return new Date().toISOString().split('T')[0]; }
function last7Days()    { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]; }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }

const PRESETS = [
  { label: 'Today',      from: todayStr,     to: todayStr     },
  { label: 'Last 7 Days', from: last7Days,   to: todayStr     },
  { label: 'This Month', from: startOfMonth, to: todayStr     },
  { label: 'All Time',   from: () => '',     to: () => ''     },
];

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function itemCount(items) {
  return (items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0);
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [preset,       setPreset]       = useState('Last 7 Days');
  const [dateFrom,     setDateFrom]     = useState(last7Days);
  const [dateTo,       setDateTo]       = useState(todayStr);

  const queryParams = useMemo(() => {
    const p = {};
    if (statusFilter !== 'all') p.status   = statusFilter;
    if (dateFrom)               p.dateFrom = dateFrom;
    if (dateTo)                 p.dateTo   = dateTo;
    return p;
  }, [statusFilter, dateFrom, dateTo]);

  const { data: orders = [], isLoading, isError, refetch } = useGetOrdersQuery(
    queryParams,
    { refetchOnMountOrArgChange: true },
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      (o.orderNumber ?? o._id.slice(-6)).toLowerCase().includes(q) ||
      (o.cashierName  ?? '').toLowerCase().includes(q) ||
      (o.customerName ?? '').toLowerCase().includes(q),
    );
  }, [orders, search]);

  const totalRevenue = filtered.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalItems   = filtered.reduce((s, o) => s + itemCount(o.items), 0);
  const completed    = filtered.filter((o) => o.status === 'completed').length;
  const pending      = filtered.filter((o) => o.status === 'pending').length;

  function handlePreset(p) {
    setPreset(p.label);
    setDateFrom(p.from());
    setDateTo(p.to());
  }

  function handleCustomDate(field, val) {
    setPreset('Custom');
    if (field === 'from') setDateFrom(val);
    else                  setDateTo(val);
  }

  return (
    <div className="page-layout">
      <TopBar title="Sales Orders" />
      <div className="page-content">

        {isError && (
          <div className="so-error-banner">
            <AlertTriangle size={15} />
            <span>Failed to load orders</span>
            <button className="so-retry-btn" onClick={refetch}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="so-stats">
          <div className="so-stat">
            <Receipt size={20} className="so-stat-icon" />
            <div>
              <span className="so-stat-val">{isLoading ? '—' : filtered.length}</span>
              <span className="so-stat-lbl">Total Orders</span>
            </div>
          </div>
          <div className="so-stat">
            <DollarSign size={20} className="so-stat-icon" />
            <div>
              <span className="so-stat-val">{isLoading ? '—' : `$${totalRevenue.toFixed(2)}`}</span>
              <span className="so-stat-lbl">Revenue</span>
            </div>
          </div>
          <div className="so-stat">
            <Package size={20} className="so-stat-icon" />
            <div>
              <span className="so-stat-val">{isLoading ? '—' : totalItems}</span>
              <span className="so-stat-lbl">Items Sold</span>
            </div>
          </div>
          <div className="so-stat">
            <CheckCircle size={20} className="so-stat-icon" />
            <div>
              <span className="so-stat-val">{isLoading ? '—' : completed}</span>
              <span className="so-stat-lbl">Completed</span>
            </div>
          </div>
          {!isLoading && pending > 0 && (
            <div className="so-stat so-stat--warn">
              <Clock size={20} className="so-stat-icon" />
              <div>
                <span className="so-stat-val">{pending}</span>
                <span className="so-stat-lbl">Pending</span>
              </div>
            </div>
          )}
        </div>

        {/* Date range */}
        <div className="so-date-bar">
          <div className="so-presets">
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
          <div className="so-daterange">
            <Calendar size={13} className="so-cal-icon" />
            <input
              type="date"
              value={dateFrom}
              max={dateTo || todayStr()}
              onChange={(e) => handleCustomDate('from', e.target.value)}
              className="so-date-inp"
            />
            <ChevronRight size={12} className="so-arrow-sep" />
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={todayStr()}
              onChange={(e) => handleCustomDate('to', e.target.value)}
              className="so-date-inp"
            />
          </div>
        </div>

        {/* Status filter + search */}
        <div className="so-toolbar">
          <div className="so-filters">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                className={`so-filter-btn ${statusFilter === f ? 'so-filter-btn--active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'all' ? 'All Statuses' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="so-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by ID, cashier or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="so-search"
            />
          </div>
        </div>

        {/* Table */}
        <div className="so-table-wrap">
          <table className="so-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Cashier</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Items</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <div className="so-skeleton" style={{ width: j === 0 ? 70 : j === 7 ? 60 : '75%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="so-empty">
                    <div className="empty-state">
                      <Receipt size={28} />
                      <p>{orders.length === 0 ? 'No orders found for this period' : 'No orders match your filters'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="so-order-id">#{order.orderNumber ?? order._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="so-cashier">
                        <span className="so-cashier-avatar">
                          {(order.cashierName ?? '?')[0].toUpperCase()}
                        </span>
                        {order.cashierName ?? '—'}
                      </div>
                    </td>
                    <td>{order.customerName || <span style={{ color: 'var(--text-lt)' }}>Walk-in</span>}</td>
                    <td className="so-time">{order.createdAt ? formatDate(order.createdAt) : '—'}</td>
                    <td className="so-time">{order.createdAt ? formatTime(order.createdAt) : '—'}</td>
                    <td className="so-items">{itemCount(order.items)} items</td>
                    <td>
                      <span className={`so-status so-status--${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="so-total">${(order.total ?? 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
