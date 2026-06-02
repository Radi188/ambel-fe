import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, Receipt, BarChart2, Star, AlertTriangle, RefreshCw } from 'lucide-react';
import TopBar from '../components/TopBar';
import {
  useGetSalesReportQuery,
  useGetOrdersReportQuery,
  useGetProductsReportQuery,
} from '../store/apis/reportsApi';
import { useGetOrdersQuery } from '../store/apis/ordersApi';
import { selectUser } from '../features/auth/authSlice';

function todayStr() { return new Date().toISOString().split('T')[0]; }

function formatHour(h) {
  if (h === 12) return '12pm';
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function buildHourlyData(orders) {
  const now     = new Date();
  const end     = now.getHours();
  const start   = 7;
  const buckets = {};
  for (let h = start; h <= Math.max(end, start); h++) buckets[h] = 0;

  const todayDate = todayStr();
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (d.toISOString().split('T')[0] !== todayDate) return;
    const h = d.getHours();
    if (h in buckets) buckets[h] += o.total;
  });

  return Object.entries(buckets).map(([h, sales]) => ({
    hour:  formatHour(parseInt(h, 10)),
    sales: Number(sales.toFixed(2)),
  }));
}

function InlineError({ onRetry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-lt)', fontSize: 12 }}>
      <AlertTriangle size={13} />
      <span>Failed to load</span>
      <button
        onClick={onRetry}
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12 }}
      >
        <RefreshCw size={11} /> Retry
      </button>
    </div>
  );
}

function StatValue({ loading, error, empty, onRetry, children }) {
  if (error)   return <InlineError onRetry={onRetry} />;
  if (loading) return <span className="stat-value" style={{ opacity: .4 }}>—</span>;
  if (empty)   return <span className="stat-value" style={{ color: 'var(--text-lt)' }}>No data</span>;
  return children;
}

export default function DashboardPage() {
  const user = useSelector(selectUser);
  // Super-admin has no fixed branch — show cross-branch (global) figures by
  // opting out of the x-branch-id scoping the API client adds by default.
  const isSuperAdmin = user?.role === 'super_admin';
  // Manager/cashier are pinned to their own branch; super-admin sees all branches.
  const branchId = user?.branchId ?? user?.branch?._id ?? user?.branch ?? null;

  // Header that controls branch scoping for every dashboard call.
  const scopeHeaders = useMemo(() => {
    if (isSuperAdmin) return { 'x-skip-branch': '1' };
    return branchId ? { 'x-branch-id': branchId } : undefined;
  }, [isSuperAdmin, branchId]);

  const todayParam = useMemo(
    () => ({ dateFrom: todayStr(), dateTo: todayStr(), ...(scopeHeaders && { headers: scopeHeaders }) }),
    [scopeHeaders],
  );

  const ordersArg = useMemo(
    () => (scopeHeaders ? { headers: scopeHeaders } : undefined),
    [scopeHeaders],
  );

  const {
    data: salesData, isLoading: salesLoading, isError: salesError, refetch: refetchSales,
  } = useGetSalesReportQuery(todayParam, { refetchOnMountOrArgChange: true });

  const {
    data: ordersData, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders,
  } = useGetOrdersReportQuery(todayParam, { refetchOnMountOrArgChange: true });

  const {
    data: productsData, isLoading: productsLoading, isError: productsError, refetch: refetchProducts,
  } = useGetProductsReportQuery(todayParam, { refetchOnMountOrArgChange: true });

  const {
    data: recentOrders, isLoading: recentLoading, isError: recentError, refetch: refetchRecent,
  } = useGetOrdersQuery(ordersArg, { refetchOnMountOrArgChange: true });

  const todaySales  = salesData?.overview?.totalRevenue      ?? null;
  const totalOrders = ordersData?.overview?.totalOrders      ?? null;
  const avgOrder    = ordersData?.overview?.averageOrderValue ?? null;
  const topItems    = productsData?.topProducts?.slice(0, 5) ?? [];
  const maxSold     = topItems[0]?.totalQuantity || 1;

  const hourlyData = useMemo(() => buildHourlyData(recentOrders ?? []), [recentOrders]);
  const maxSales   = Math.max(...hourlyData.map((d) => d.sales), 1);
  const hasHourly  = hourlyData.some((d) => d.sales > 0);

  return (
    <div className="page-layout">
      <TopBar title="Dashboard" />
      <div className="dashboard-content">

        <div className="stats-grid">
          <div className="stat-card stat-card--primary">
            <div className="stat-icon"><DollarSign size={22} /></div>
            <div className="stat-body">
              <span className="stat-label">Today's Revenue</span>
              <StatValue loading={salesLoading} error={salesError} empty={todaySales === null} onRetry={refetchSales}>
                <span className="stat-value">${todaySales?.toFixed(2)}</span>
              </StatValue>
              <span className="stat-change stat-change--neutral">→ today</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><Receipt size={22} /></div>
            <div className="stat-body">
              <span className="stat-label">Total Orders</span>
              <StatValue loading={ordersLoading} error={ordersError} empty={totalOrders === null} onRetry={refetchOrders}>
                <span className="stat-value">{totalOrders}</span>
              </StatValue>
              <span className="stat-change stat-change--neutral">→ today</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><BarChart2 size={22} /></div>
            <div className="stat-body">
              <span className="stat-label">Avg. Order Value</span>
              <StatValue loading={ordersLoading} error={ordersError} empty={avgOrder === null} onRetry={refetchOrders}>
                <span className="stat-value">${avgOrder?.toFixed(2)}</span>
              </StatValue>
              <span className="stat-change stat-change--neutral">→ steady</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><Star size={22} /></div>
            <div className="stat-body">
              <span className="stat-label">Satisfaction</span>
              <span className="stat-value">4.8</span>
              <span className="stat-change stat-change--up">↑ 0.1 this week</span>
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="chart-card">
            <h3 className="card-title">Hourly Sales</h3>
            {recentError ? (
              <InlineError onRetry={refetchRecent} />
            ) : recentLoading ? (
              <div className="bar-chart" style={{ opacity: .3 }}>
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bar-col">
                    <div className="bar" style={{ height: `${20 + i * 12}%`, background: 'var(--grey-200)' }} />
                    <span className="bar-label">—</span>
                  </div>
                ))}
              </div>
            ) : !hasHourly ? (
              <p style={{ color: 'var(--text-lt)', fontSize: 13, padding: '20px 0' }}>No sales recorded today yet</p>
            ) : (
              <div className="bar-chart">
                {hourlyData.map((d) => (
                  <div key={d.hour} className="bar-col">
                    <div
                      className="bar"
                      style={{ height: `${Math.max((d.sales / maxSales) * 100, d.sales > 0 ? 4 : 0)}%` }}
                      title={`$${d.sales.toFixed(2)}`}
                    />
                    <span className="bar-label">{d.hour}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="top-items-card">
            <h3 className="card-title">Top Selling Items</h3>
            {productsError ? (
              <InlineError onRetry={refetchProducts} />
            ) : productsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map((i) => (
                  <div key={i} style={{ height: 36, background: 'var(--grey-100)', borderRadius: 6, opacity: .5 }} />
                ))}
              </div>
            ) : topItems.length === 0 ? (
              <p style={{ color: 'var(--text-lt)', fontSize: 13, padding: '20px 0' }}>No sales recorded today yet</p>
            ) : (
              <div className="top-items-list">
                {topItems.map((item, i) => (
                  <div key={String(item.productId)} className="top-item">
                    <span className="top-item-rank">{i + 1}</span>
                    <div className="top-item-info">
                      <span className="top-item-name">{item.productName}</span>
                      <div className="top-item-bar-wrap">
                        <div
                          className="top-item-bar"
                          style={{ width: `${(item.totalQuantity / maxSold) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="top-item-stats">
                      <span className="top-item-sold">{item.totalQuantity} sold</span>
                      <span className="top-item-rev">${item.totalRevenue.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="recent-orders-card">
          <h3 className="card-title">Recent Orders</h3>
          {recentError ? (
            <InlineError onRetry={refetchRecent} />
          ) : recentLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map((i) => (
                <div key={i} style={{ height: 40, background: 'var(--grey-100)', borderRadius: 6, opacity: .5 }} />
              ))}
            </div>
          ) : (recentOrders ?? []).length === 0 ? (
            <p style={{ color: 'var(--text-lt)', fontSize: 13, padding: '20px 0' }}>No orders yet</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Cashier</th>
                  <th>Items</th>
                  <th>Time</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders ?? []).slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td className="order-id">#{order.orderNumber ?? order._id.slice(-6).toUpperCase()}</td>
                    <td>{order.cashierName ?? '—'}</td>
                    <td>{order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} items</td>
                    <td>{order.createdAt ? formatTime(order.createdAt) : '—'}</td>
                    <td className="order-total">${order.total.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-badge--${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
