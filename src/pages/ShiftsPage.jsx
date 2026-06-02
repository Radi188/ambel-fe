import { useSelector } from 'react-redux';
import { Clock, Check } from 'lucide-react';
import TopBar from '../components/TopBar';
import { selectCurrentShift, selectShiftHistory, toUSD } from '../features/shifts/shiftsSlice';
import { useKhrRate } from '../hooks/useKhrRate';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function calcDuration(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function activeDuration(start) {
  const ms = Date.now() - new Date(start).getTime();
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function CashDisplay({ usd, khr, rate }) {
  return (
    <div className="cash-display">
      {usd > 0 && <span className="cash-display-usd">${usd.toFixed(2)}</span>}
      {khr > 0 && <span className="cash-display-khr">៛{khr.toLocaleString()}</span>}
      {(usd > 0 || khr > 0) && (
        <span className="cash-display-equiv">≈ ${toUSD(usd, khr, rate).toFixed(2)}</span>
      )}
    </div>
  );
}

export default function ShiftsPage() {
  const current  = useSelector(selectCurrentShift);
  const history  = useSelector(selectShiftHistory);
  const khrRate  = useKhrRate();

  return (
    <div className="page-layout">
      <TopBar title="Shift Management" />
      <div className="page-content">

        {current && (
          <div className="active-shift-banner">
            <div className="active-shift-pulse" />
            <div className="active-shift-info">
              <span className="active-shift-label">Active Shift</span>
              <span className="active-shift-cashier">{current.cashier}</span>
            </div>
            <div className="active-shift-stats">
              <div className="active-shift-stat">
                <span>{current.orders}</span>
                <span>Orders</span>
              </div>
              <div className="active-shift-stat">
                <span>${current.revenue.toFixed(2)}</span>
                <span>Revenue</span>
              </div>
              <div className="active-shift-stat">
                <span>{activeDuration(current.openedAt)}</span>
                <span>Duration</span>
              </div>
              <div className="active-shift-stat">
                <span>≈ ${toUSD(current.openingCashUSD, current.openingCashKHR, khrRate).toFixed(2)}</span>
                <span>Opening Cash</span>
              </div>
            </div>
            <div className="active-shift-id">{current.id}</div>
          </div>
        )}

        <h3 className="section-title">Shift History</h3>

        {history.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} />
            <p>No completed shifts yet</p>
          </div>
        ) : (
          <div className="shifts-list">
            {history.map((shift) => {
              const openingUSD = toUSD(shift.openingCashUSD, shift.openingCashKHR, khrRate);
              const closingUSD = toUSD(shift.closingCashUSD, shift.closingCashKHR, khrRate);
              const cashDiff   = closingUSD - (openingUSD + shift.cashRevenue);

              return (
                <div key={shift.id} className="shift-card">
                  <div className="shift-card-top">
                    <div className="shift-card-id-wrap">
                      <span className="shift-card-id">{shift.id}</span>
                      <span className="status-badge status-badge--completed">Completed</span>
                    </div>
                    <div className="shift-card-cashier">
                      <span className="shift-avatar">{shift.cashier[0]}</span>
                      {shift.cashier}
                    </div>
                  </div>

                  <div className="shift-card-meta">
                    <div className="shift-meta-item">
                      <span>Started</span>
                      <strong>{formatDateTime(shift.openedAt)}</strong>
                    </div>
                    <div className="shift-meta-item">
                      <span>Closed</span>
                      <strong>{formatDateTime(shift.closedAt)}</strong>
                    </div>
                    <div className="shift-meta-item">
                      <span>Duration</span>
                      <strong>{calcDuration(shift.openedAt, shift.closedAt)}</strong>
                    </div>
                    <div className="shift-meta-item">
                      <span>Orders</span>
                      <strong>{shift.orders}</strong>
                    </div>
                  </div>

                  <div className="shift-card-financials">
                    <div className="shift-fin-item">
                      <span>Total Revenue</span>
                      <strong className="shift-fin-revenue">${shift.revenue.toFixed(2)}</strong>
                    </div>
                    <div className="shift-fin-item">
                      <span>Card</span>
                      <strong>${shift.cardRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="shift-fin-item">
                      <span>Cash</span>
                      <strong>${shift.cashRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="shift-fin-item">
                      <span>GoPay</span>
                      <strong>${shift.gopayRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="shift-fin-item shift-fin-item--wide">
                      <span>Opening Cash</span>
                      <CashDisplay usd={shift.openingCashUSD} khr={shift.openingCashKHR} rate={khrRate} />
                    </div>
                    <div className="shift-fin-item shift-fin-item--wide">
                      <span>Closing Cash</span>
                      <CashDisplay usd={shift.closingCashUSD} khr={shift.closingCashKHR} rate={khrRate} />
                    </div>
                    <div className={`shift-fin-item shift-fin-diff ${Math.abs(cashDiff) < 0.01 ? 'shift-fin-diff--exact' : cashDiff > 0 ? 'shift-fin-diff--over' : 'shift-fin-diff--short'}`}>
                      <span>Cash Variance</span>
                      <strong>
                        {Math.abs(cashDiff) < 0.01 && <><Check size={14} /> Balanced</>}
                        {cashDiff >  0.01 && `+$${Math.abs(cashDiff).toFixed(2)}`}
                        {cashDiff < -0.01 && `-$${Math.abs(cashDiff).toFixed(2)}`}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
