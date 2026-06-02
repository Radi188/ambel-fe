import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, DollarSign, Coins, Check } from 'lucide-react';
import { closeShift as closeShiftLocal, selectCurrentShift, toUSD } from '../features/shifts/shiftsSlice';
import { useCloseShiftMutation } from '../store/apis/shiftsApi';
import { useKhrRate } from '../hooks/useKhrRate';
import { selectUser } from '../features/auth/authSlice';
import { clearCart } from '../features/cart/cartSlice';
import { tokenService } from '../services/tokenService';

function formatDuration(isoStart) {
  const ms = Date.now() - new Date(isoStart).getTime();
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function CloseShiftModal({ onCancel }) {
  const dispatch  = useDispatch();
  const shift     = useSelector(selectCurrentShift);
  const user      = useSelector(selectUser);
  const khrRate   = useKhrRate();
  const [closeShiftApi, { isLoading }] = useCloseShiftMutation();

  const [closingUSD, setClosingUSD] = useState('');
  const [closingKHR, setClosingKHR] = useState('');
  const [note, setNote]             = useState('');
  const [error, setError]           = useState('');

  if (!shift) return null;

  const openingTotalUSD = toUSD(shift.openingCashUSD, shift.openingCashKHR, khrRate);
  const expectedCashUSD = openingTotalUSD + shift.cashRevenue;
  const actualCashUSD   = toUSD(closingUSD, closingKHR, khrRate);
  const hasClosing      = Number(closingUSD) > 0 || Number(closingKHR) > 0;
  const cashDiff        = actualCashUSD - expectedCashUSD;

  const handleClose = async () => {
    setError('');
    try {
      await closeShiftApi({
        id:            shift._id,
        endingCash:    Number(closingUSD) || 0,
        endingCashKhr: Number(closingKHR) || 0,
        notes:         note || undefined,
      }).unwrap();

      // Super admin opened this shift against a specific branch — release that
      // branch scope on close so they're no longer pinned to it.
      if (user?.role === 'super_admin') {
        tokenService.setBranchId(null);
      }

      dispatch(closeShiftLocal({
        closingCashUSD: Number(closingUSD) || 0,
        closingCashKHR: Number(closingKHR) || 0,
      }));
      // Shift is over — discard any items still sitting in the cart so the next
      // shift starts with an empty order.
      dispatch(clearCart());
      onCancel();
    } catch (err) {
      setError(err?.data?.message ?? 'Failed to close shift. Please try again.');
    }
  };

  return (
    <div className="shift-modal-overlay">
      <div className="shift-modal shift-modal--close">
        <div className="shift-modal-header">
          <div className="shift-modal-icon shift-modal-icon--warn"><Lock size={28} /></div>
          <h2 className="shift-modal-title">Close Shift</h2>
          <p className="shift-modal-sub">{shift.cashier} · Started {formatTime(shift.openedAt)} · {formatDuration(shift.openedAt)}</p>
        </div>

        <div className="shift-summary-grid">
          <div className="shift-stat">
            <span className="shift-stat-label">Orders Taken</span>
            <span className="shift-stat-value">{shift.orders}</span>
          </div>
          <div className="shift-stat">
            <span className="shift-stat-label">Total Revenue</span>
            <span className="shift-stat-value shift-stat-value--revenue">${shift.revenue.toFixed(2)}</span>
          </div>
          <div className="shift-stat">
            <span className="shift-stat-label">Card Sales</span>
            <span className="shift-stat-value">${shift.cardRevenue.toFixed(2)}</span>
          </div>
          <div className="shift-stat">
            <span className="shift-stat-label">Cash Sales</span>
            <span className="shift-stat-value">${shift.cashRevenue.toFixed(2)}</span>
          </div>
          <div className="shift-stat">
            <span className="shift-stat-label">QR Sales</span>
            <span className="shift-stat-value">${shift.gopayRevenue.toFixed(2)}</span>
          </div>
          <div className="shift-stat">
            <span className="shift-stat-label">Opening Cash</span>
            <span className="shift-stat-value">≈ ${openingTotalUSD.toFixed(2)}</span>
          </div>
        </div>

        <div className="shift-cash-check">
          <div className="shift-expected-row">
            <span>Expected cash in drawer</span>
            <span className="shift-expected-amt">≈ ${expectedCashUSD.toFixed(2)}</span>
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Actual cash counted</label>
            <div className="dual-currency-wrap">
              <div className="currency-row">
                <div className="currency-label">
                  <DollarSign size={14} />
                  <span>USD</span>
                </div>
                <div className="cash-input-wrap">
                  <span className="cash-symbol">$</span>
                  <input className="shift-input shift-input--cash" type="number" min="0" step="0.01" placeholder="0.00"
                    value={closingUSD} onChange={(e) => setClosingUSD(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="currency-divider">
                <span /><span className="currency-divider-text">+</span><span />
              </div>
              <div className="currency-row">
                <div className="currency-label">
                  <Coins size={14} />
                  <span>KHR</span>
                </div>
                <div className="cash-input-wrap">
                  <span className="cash-symbol cash-symbol--khr">៛</span>
                  <input className="shift-input shift-input--cash" type="number" min="0" step="100" placeholder="0"
                    value={closingKHR} onChange={(e) => setClosingKHR(e.target.value)} />
                </div>
              </div>
            </div>

            {hasClosing && (
              <div className="currency-total">
                <span>Total equivalent</span>
                <strong>≈ ${actualCashUSD.toFixed(2)}</strong>
                <span className="currency-rate">Rate: 1 USD = {khrRate.toLocaleString()} KHR</span>
              </div>
            )}
          </div>

          {hasClosing && (
            <div className={`cash-diff ${Math.abs(cashDiff) < 0.01 ? 'cash-diff--exact' : cashDiff > 0 ? 'cash-diff--over' : 'cash-diff--short'}`}>
              {Math.abs(cashDiff) < 0.01 && <><Check size={14} /> Cash balanced</>}
              {cashDiff >  0.01 && `↑ Over by $${Math.abs(cashDiff).toFixed(2)}`}
              {cashDiff < -0.01 && `↓ Short by $${Math.abs(cashDiff).toFixed(2)}`}
            </div>
          )}
        </div>

        <div className="shift-field" style={{ marginBottom: 0 }}>
          <label>Note (optional)</label>
          <input className="shift-input" type="text" placeholder="End of shift note…"
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && (
          <div className="login-error" style={{ marginTop: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="shift-modal-actions" style={{ marginTop: 16 }}>
          <button className="shift-cancel-btn" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button
            className={`shift-close-btn ${(!hasClosing || isLoading) ? 'shift-close-btn--disabled' : ''}`}
            onClick={handleClose}
            disabled={!hasClosing || isLoading}
          >
            {isLoading ? <span className="login-spinner" /> : 'Close Shift & Print Summary'}
          </button>
        </div>
      </div>
    </div>
  );
}
