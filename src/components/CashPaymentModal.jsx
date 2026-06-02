import { useState, useMemo } from 'react';
import { Banknote, DollarSign, Coins, Check, RotateCcw } from 'lucide-react';
import { useKhrRate } from '../hooks/useKhrRate';

// Denominations shown as quick-add buttons
const USD_DENOMS = [1, 5, 10, 20, 50, 100];
const KHR_DENOMS = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

function khrDisplay(n) {
  return `${Math.round(n).toLocaleString()} ៛`;
}
function usdDisplay(n) {
  return `$${Math.abs(n).toFixed(2)}`;
}

export default function CashPaymentModal({ total, onConfirm, onCancel, isLoading }) {
  const khrRate = useKhrRate();

  const [receivedUSD, setReceivedUSD] = useState('');
  const [receivedKHR, setReceivedKHR] = useState('');

  // Determine if total is KHR (≥100) or USD (<100)
  const isKHR    = total >= 100;
  const totalKHR = isKHR ? total : Math.round(total * khrRate);
  const totalUSD = totalKHR / khrRate;

  // How much the customer handed over (converted to KHR for calculation)
  const receivedTotalKHR = useMemo(() => {
    const khr = Number(receivedKHR) || 0;
    const usd = Number(receivedUSD) || 0;
    return khr + Math.round(usd * khrRate);
  }, [receivedUSD, receivedKHR, khrRate]);

  const changeKHR   = receivedTotalKHR - totalKHR;
  const enoughCash  = receivedTotalKHR >= totalKHR;
  const exactAmount = changeKHR === 0;

  // Change breakdown: USD bills + KHR remainder
  const changeUSDpart = enoughCash ? Math.floor(changeKHR / khrRate) : 0;
  const changeKHRpart = enoughCash ? Math.round((changeKHR % khrRate) / 100) * 100 : 0;

  const hasReceived = (Number(receivedUSD) || 0) > 0 || (Number(receivedKHR) || 0) > 0;

  // Tapping a note adds it to the running total (counts cash as it's handed over)
  const addUSD = (d) => setReceivedUSD((p) => String((Number(p) || 0) + d));
  const addKHR = (d) => setReceivedKHR((p) => String((Number(p) || 0) + d));
  const clearReceived = () => { setReceivedUSD(''); setReceivedKHR(''); };
  const setExact = () => { setReceivedKHR(String(totalKHR)); setReceivedUSD(''); };

  const handleConfirm = () => {
    onConfirm(Number(receivedKHR) || 0, Number(receivedUSD) || 0);
  };

  return (
    <div className="cash-sidebar-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <aside className="cash-sidebar" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="cash-modal-header">
          <div className="cash-modal-icon"><Banknote size={28} /></div>
          <div>
            <h2 className="cash-modal-title">Cash Payment</h2>
            <p className="cash-modal-sub">Enter the amount received from customer</p>
          </div>
          <button className="custom-close" onClick={onCancel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="cash-sidebar-body">

          {/* Amount Due */}
          <div className="cash-due-row">
            <div className="cash-due-card">
              <span className="cash-due-label">Amount Due</span>
              <span className="cash-due-khr">{khrDisplay(totalKHR)}</span>
              <span className="cash-due-usd">≈ {usdDisplay(totalUSD)}</span>
            </div>
          </div>

          {/* Cash Received Inputs */}
          <div className="cash-received-section">
            <div className="cash-received-head">
              <p className="cash-section-label" style={{ margin: 0 }}>Cash Received</p>
              {hasReceived && (
                <button className="cash-clear-btn" onClick={clearReceived}>
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>

            <div className="cash-inputs">
              {/* USD */}
              <div className="cash-input-row">
                <div className="cash-currency-label">
                  <DollarSign size={14} />
                  <span>USD</span>
                </div>
                <div className="cash-input-wrap" style={{ flex: 1 }}>
                  <span className="cash-symbol">$</span>
                  <input
                    className="shift-input shift-input--cash"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={receivedUSD}
                    onChange={(e) => setReceivedUSD(e.target.value)}
                  />
                </div>
              </div>

              {/* KHR */}
              <div className="cash-input-row">
                <div className="cash-currency-label">
                  <Coins size={14} />
                  <span>KHR</span>
                </div>
                <div className="cash-input-wrap" style={{ flex: 1 }}>
                  <span className="cash-symbol cash-symbol--khr">៛</span>
                  <input
                    className="shift-input shift-input--cash"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={receivedKHR}
                    onChange={(e) => setReceivedKHR(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Denomination quick-add buttons */}
          <div className="cash-notes-section">
            <div className="cash-notes-head">
              <span className="cash-presets-label">USD</span>
              <button className="cash-exact-link" onClick={setExact}>Exact amount</button>
            </div>
            <div className="cash-denom-grid">
              {USD_DENOMS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="cash-denom-btn cash-denom-btn--usd"
                  onClick={() => addUSD(d)}
                >
                  ${d}
                </button>
              ))}
            </div>

            <span className="cash-presets-label" style={{ marginTop: 14, display: 'block' }}>KHR</span>
            <div className="cash-denom-grid">
              {KHR_DENOMS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="cash-denom-btn cash-denom-btn--khr"
                  onClick={() => addKHR(d)}
                >
                  {d >= 1000 ? `${(d / 1000).toLocaleString()}K` : d} ៛
                </button>
              ))}
            </div>
          </div>

          {/* Change Due */}
          <div className={`cash-change-section ${!enoughCash && receivedTotalKHR > 0 ? 'cash-change-section--short' : ''} ${enoughCash ? 'cash-change-section--show' : ''}`}>
            {receivedTotalKHR > 0 && !enoughCash && (
              <div className="cash-change-short">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Not enough — short by <strong>{khrDisplay(totalKHR - receivedTotalKHR)}</strong></span>
              </div>
            )}

            {enoughCash && (
              <>
                <p className="cash-section-label">Change to Return</p>
                {exactAmount ? (
                  <div className="cash-change-exact">
                    <Check size={14} />
                    <span>Exact amount — no change needed</span>
                  </div>
                ) : (
                  <div className="cash-change-cards">
                    {changeUSDpart > 0 && (
                      <div className="cash-change-card cash-change-card--usd">
                        <span className="cash-change-currency">USD</span>
                        <span className="cash-change-amount">{usdDisplay(changeUSDpart)}</span>
                        <span className="cash-change-note">{changeUSDpart} bill{changeUSDpart > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {changeKHRpart > 0 && (
                      <div className="cash-change-card cash-change-card--khr">
                        <span className="cash-change-currency">KHR</span>
                        <span className="cash-change-amount">{khrDisplay(changeKHRpart)}</span>
                        <span className="cash-change-note">coin / note</span>
                      </div>
                    )}
                    {changeUSDpart === 0 && changeKHRpart === 0 && changeKHR > 0 && (
                      <div className="cash-change-card cash-change-card--khr">
                        <span className="cash-change-currency">KHR</span>
                        <span className="cash-change-amount">{khrDisplay(changeKHR)}</span>
                        <span className="cash-change-note">change</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="cash-change-total">
                  Total change: <strong>{khrDisplay(changeKHR)}</strong>
                  <span style={{ color: 'var(--text-lt)' }}> ≈ {usdDisplay(changeKHR / khrRate)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="cash-modal-actions">
          <button className="shift-cancel-btn" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button
            className={`cash-confirm-btn ${(!enoughCash || isLoading) ? 'cash-confirm-btn--disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!enoughCash || isLoading}
          >
            {isLoading ? (
              <span className="login-spinner" />
            ) : (
              <>
                <span>Confirm Payment</span>
                <span className="cash-confirm-total">{khrDisplay(totalKHR)}</span>
              </>
            )}
          </button>
        </div>

      </aside>
    </div>
  );
}
