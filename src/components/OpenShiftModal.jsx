import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Coffee, DollarSign, Coins, Building2, User } from 'lucide-react';
import { openShift as openShiftLocal } from '../features/shifts/shiftsSlice';
import { useOpenShiftMutation } from '../store/apis/shiftsApi';
import { useGetBranchesQuery } from '../store/apis/branchesApi';
import { useGetCashiersQuery } from '../store/apis/staffApi';
import { selectUser } from '../features/auth/authSlice';
import { useKhrRate } from '../hooks/useKhrRate';
import { tokenService } from '../services/tokenService';

export default function OpenShiftModal({ onClose }) {
  const dispatch   = useDispatch();
  const user       = useSelector(selectUser);
  const [openShiftApi, { isLoading }] = useOpenShiftMutation();

  const khrRate      = useKhrRate();
  const isSuperAdmin = user?.role === 'super_admin';

  const { data: branches = [], isLoading: branchesLoading } = useGetBranchesQuery(
    { active: true },
    { skip: !isSuperAdmin },
  );
  const { data: cashiers = [], isLoading: cashiersLoading } = useGetCashiersQuery({ active: true });

  const [selectedBranchId,  setSelectedBranchId]  = useState('');
  const [selectedCashierId, setSelectedCashierId] = useState('');
  const [usd,  setUsd]  = useState('');
  const [khr,  setKhr]  = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const usdNum   = Number(usd) || 0;
  const khrNum   = Number(khr) || 0;
  const totalUSD = usdNum + khrNum / khrRate;

  const noCashierProfiles = !cashiersLoading && cashiers.length === 0;

  const hasAmount  = usdNum > 0 || khrNum > 0;
  const hasBranch  = !isSuperAdmin || selectedBranchId !== '';
  // If no profiles exist, we fall back to user.name — no selection needed
  const hasCashier = noCashierProfiles || selectedCashierId !== '';
  const canSubmit  = hasAmount && hasBranch && hasCashier;

  const selectedBranch  = branches.find((b) => b._id === selectedBranchId);
  const selectedCashier = cashiers.find((c) => c._id === selectedCashierId);
  const displayCashierName = selectedCashier?.name ?? user?.name;

  const handleOpen = async () => {
    setError('');
    try {
      const result = await openShiftApi({
        // If a profile was selected use its ID; otherwise pass name for auto-create
        ...(selectedCashierId
          ? { cashierId: selectedCashierId }
          : { cashierName: user?.name }),
        startingCash:    usdNum,
        startingCashKhr: khrNum,
        notes:           note || undefined,
        // Super admin scopes the shift to a specific branch via x-branch-id header
        ...(isSuperAdmin && selectedBranchId ? { branchId: selectedBranchId } : {}),
      }).unwrap();

      // Super admin has no fixed branch — persist the branch they opened the shift
      // for so every subsequent request (orders, etc.) carries the x-branch-id header.
      if (isSuperAdmin && selectedBranchId) {
        tokenService.setBranchId(selectedBranchId);
      }

      // Update local Redux state for immediate UI feedback
      dispatch(openShiftLocal({
        cashier:        displayCashierName,
        openingCashUSD: usdNum,
        openingCashKHR: khrNum,
        _id:            result._id,
      }));
      onClose?.();
    } catch (err) {
      setError(err?.data?.message ?? 'Failed to open shift. Please try again.');
    }
  };

  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="shift-modal" style={{ position: 'relative' }}>
        {onClose && (
          <button
            className="custom-close"
            onClick={onClose}
            style={{ position: 'absolute', top: 12, right: 12 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
        <div className="shift-modal-header">
          <div className="shift-modal-icon"><Coffee size={28} /></div>
          <h2 className="shift-modal-title">Start Your Shift</h2>
          <p className="shift-modal-sub">Count the opening cash before taking orders</p>
        </div>

        <div className="open-shift-cashier">
          <div className="open-shift-avatar">{user?.name?.[0]}</div>
          <div>
            <span className="open-shift-name">{user?.name}</span>
            <span className="open-shift-role">{user?.role}</span>
          </div>
        </div>

        {/* Cashier profile selector */}
        <div className="shift-field">
          <label>
            <User size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Cashier Profile
          </label>
          {cashiersLoading ? (
            <div className="shift-input" style={{ color: 'var(--text-lt)' }}>Loading cashiers…</div>
          ) : noCashierProfiles ? (
            <div className="shift-input" style={{ color: 'var(--text-lt)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={14} />
              <span>Using your account: <strong>{user?.name}</strong></span>
            </div>
          ) : (
            <select
              className="shift-input"
              value={selectedCashierId}
              onChange={(e) => setSelectedCashierId(e.target.value)}
              style={{ cursor: 'pointer' }}
              autoFocus
            >
              <option value="">— Select cashier —</option>
              {cashiers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {isSuperAdmin && (
          <div className="shift-field">
            <label>
              <Building2 size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Opening shift for branch
            </label>
            {branchesLoading ? (
              <div className="shift-input" style={{ color: 'var(--text-lt)', display: 'flex', alignItems: 'center' }}>
                Loading branches…
              </div>
            ) : (
              <select
                className="shift-input"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">— Select a branch —</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            )}
            {selectedBranch && (
              <span style={{ fontSize: 11, color: 'var(--text-lt)', marginTop: 4, display: 'block' }}>
                {selectedBranch.address ?? selectedBranch.email ?? ''}
              </span>
            )}
          </div>
        )}

        <div className="shift-field">
          <label>Cash in Drawer</label>
          <div className="dual-currency-wrap">
            <div className="currency-row">
              <div className="currency-label">
                <DollarSign size={14} />
                <span>USD</span>
              </div>
              <div className="cash-input-wrap">
                <span className="cash-symbol">$</span>
                <input
                  className="shift-input shift-input--cash"
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={usd}
                  onChange={(e) => setUsd(e.target.value)}
                  autoFocus
                />
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
                <input
                  className="shift-input shift-input--cash"
                  type="number" min="0" step="100" placeholder="0"
                  value={khr}
                  onChange={(e) => setKhr(e.target.value)}
                />
              </div>
            </div>
          </div>

          {hasAmount && (
            <div className="currency-total">
              <span>Total equivalent</span>
              <strong>≈ ${totalUSD.toFixed(2)}</strong>
              <span className="currency-rate">Rate: 1 USD = {khrRate.toLocaleString()} KHR</span>
            </div>
          )}
        </div>

        <div className="shift-field" style={{ marginBottom: 0 }}>
          <label>Note (optional)</label>
          <input
            className="shift-input"
            type="text"
            placeholder="Add a note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && (
          <div className="login-error" style={{ marginTop: 12 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <button
          className={`shift-open-btn ${(!canSubmit || isLoading) ? 'shift-open-btn--disabled' : ''}`}
          style={{ marginTop: 16 }}
          onClick={handleOpen}
          disabled={!canSubmit || isLoading}
        >
          {isLoading ? <span className="login-spinner" /> : 'Open Register & Start Shift'}
        </button>
      </div>
    </div>
  );
}
