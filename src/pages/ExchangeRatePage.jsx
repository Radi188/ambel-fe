import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeftRight, Plus, Pencil, Trash2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import TopBar from '../components/TopBar';
import { selectUser } from '../features/auth/authSlice';
import {
  useGetCurrentRateQuery,
  useGetExchangeRatesQuery,
  useCreateExchangeRateMutation,
  useUpdateExchangeRateMutation,
  useDeleteExchangeRateMutation,
} from '../store/apis/exchangeRatesApi';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Modal ────────────────────────────────────────────────────────
function RateModal({ initial, onSave, onClose, isSaving, saveError }) {
  const isEdit = !!initial;
  const [rate,          setRate]          = useState(initial?.rate ?? '');
  const [effectiveDate, setEffectiveDate] = useState(
    initial?.effectiveDate ? new Date(initial.effectiveDate).toISOString().split('T')[0] : todayStr()
  );
  const [note, setNote] = useState(initial?.note ?? '');

  const canSubmit = Number(rate) > 0 && effectiveDate;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...(isEdit ? { id: initial._id } : {}),
      rate:          Number(rate),
      effectiveDate,
      note:          note.trim() || undefined,
    });
  }

  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shift-modal" style={{ maxWidth: 400 }}>
        <button className="custom-close" onClick={onClose} style={{ position: 'absolute', top: 12, right: 12 }}>
          <X size={18} />
        </button>

        <div className="shift-modal-header" style={{ marginBottom: 20 }}>
          <h2 className="shift-modal-title">{isEdit ? 'Edit Rate' : 'Set New Rate'}</h2>
          <p className="shift-modal-sub">KHR per 1 USD</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Rate <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(KHR per $1)</span></label>
            <div className="cash-input-wrap">
              <span className="cash-symbol cash-symbol--khr">៛</span>
              <input
                className="shift-input shift-input--cash"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 4100"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                autoFocus
                required
              />
            </div>
            {Number(rate) > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-lt)', marginTop: 4, display: 'block' }}>
                $1 = {Number(rate).toLocaleString()} ៛
              </span>
            )}
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Effective Date</label>
            <input
              className="shift-input"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Note <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
            <input className="shift-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. NBC official rate" />
          </div>

          {saveError && (
            <div className="login-error">
              <AlertTriangle size={14} /> {saveError}
            </div>
          )}

          <button
            type="submit"
            className={`shift-open-btn ${(!canSubmit || isSaving) ? 'shift-open-btn--disabled' : ''}`}
            disabled={!canSubmit || isSaving}
            style={{ marginTop: 4 }}
          >
            {isSaving ? <span className="login-spinner" /> : isEdit ? 'Save Changes' : 'Set Rate'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ExchangeRatePage() {
  const user         = useSelector(selectUser);
  const isSuperAdmin = user?.role === 'super_admin';

  const [modal,        setModal]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveError,    setSaveError]    = useState('');

  const { data: current, isLoading: currentLoading } = useGetCurrentRateQuery(
    undefined,
    { refetchOnMountOrArgChange: true },
  );
  const { data: rates = [], isLoading, isError, refetch } = useGetExchangeRatesQuery(
    undefined,
    { refetchOnMountOrArgChange: true },
  );

  const [createRate, { isLoading: creating }] = useCreateExchangeRateMutation();
  const [updateRate, { isLoading: updating }] = useUpdateExchangeRateMutation();
  const [deleteRate, { isLoading: deleting }] = useDeleteExchangeRateMutation();

  async function handleSave(payload) {
    setSaveError('');
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        await updateRate({ id, ...body }).unwrap();
      } else {
        await createRate(payload).unwrap();
      }
      setModal(null);
    } catch (err) {
      setSaveError(err?.data?.message ?? 'Failed to save. Please try again.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteRate(id).unwrap();
      setDeleteTarget(null);
    } catch { /* silent */ }
  }

  return (
    <div className="page-layout">
      <TopBar title="Exchange Rate" />
      <div className="page-content">

        {isError && (
          <div className="so-error-banner">
            <AlertTriangle size={15} />
            <span>Failed to load exchange rates</span>
            <button className="so-retry-btn" onClick={refetch}><RefreshCw size={12} /> Retry</button>
          </div>
        )}

        {/* Current rate banner */}
        <div style={{
          background: 'var(--grey-900)', color: 'var(--white)',
          borderRadius: 12, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div>
            <p style={{ fontSize: 12, opacity: .6, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Current Rate</p>
            {currentLoading ? (
              <div style={{ height: 36, width: 160, background: 'rgba(255,255,255,.1)', borderRadius: 6 }} />
            ) : current ? (
              <>
                <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  $1 = {current.rate.toLocaleString()} ៛
                </p>
                <p style={{ fontSize: 12, opacity: .5, marginTop: 6 }}>
                  Effective {fmtDate(current.effectiveDate)}
                  {current.note ? ` · ${current.note}` : ''}
                </p>
              </>
            ) : (
              <p style={{ opacity: .6, fontSize: 14 }}>No rate configured yet</p>
            )}
          </div>
          <ArrowLeftRight size={32} style={{ opacity: .3 }} />
        </div>

        {/* History header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-lt)' }}>Rate history</p>
          {isSuperAdmin && (
            <button
              className="shift-open-btn"
              style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => { setSaveError(''); setModal('create'); }}
            >
              <Plus size={15} /> Set New Rate
            </button>
          )}
        </div>

        {/* Table */}
        <div className="so-table-wrap">
          <table className="so-table">
            <thead>
              <tr>
                <th>Rate (KHR / $1)</th>
                <th>Effective Date</th>
                <th>Note</th>
                <th>Set By</th>
                {isSuperAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isSuperAdmin ? 5 : 4 }).map((__, j) => (
                      <td key={j}><div className="so-skeleton" style={{ width: '70%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="so-empty">
                    <div className="empty-state">
                      <ArrowLeftRight size={28} />
                      <p>No exchange rates set yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rates.map((r) => (
                  <tr key={r._id} style={r._id === current?._id ? { background: 'var(--grey-50)' } : {}}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: 15 }}>
                        {r.rate.toLocaleString()}
                      </span>
                      {r._id === current?._id && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          background: 'var(--grey-900)', color: 'var(--white)',
                          padding: '2px 6px', borderRadius: 4, letterSpacing: '.04em',
                        }}>
                          Current
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-lt)' }}>{fmtDate(r.effectiveDate)}</td>
                    <td style={{ color: 'var(--text-lt)' }}>{r.note || <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-lt)' }}>{r.createdBy?.name ?? '—'}</td>
                    {isSuperAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="admin-outline-btn admin-outline-btn--sm" onClick={() => { setSaveError(''); setModal(r); }} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button
                            className="admin-outline-btn admin-outline-btn--sm"
                            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                            onClick={() => setDeleteTarget(r)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <RateModal
          initial={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={creating || updating}
          saveError={saveError}
        />
      )}

      {deleteTarget && (
        <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="shift-modal" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{ color: 'var(--red)', marginBottom: 12 }}><Trash2 size={32} /></div>
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Delete this rate?</h3>
            <p style={{ color: 'var(--text-lt)', fontSize: 13, marginBottom: 6 }}>
              Rate: <strong>{deleteTarget.rate.toLocaleString()} ៛</strong> · Effective {fmtDate(deleteTarget.effectiveDate)}
            </p>
            <p style={{ color: 'var(--text-lt)', fontSize: 13, marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="shift-open-btn"
                style={{ flex: 1, background: 'var(--white)', color: 'var(--text-dark)', border: '1px solid var(--border)' }}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="shift-open-btn"
                style={{ flex: 1, background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={() => handleDelete(deleteTarget._id)}
                disabled={deleting}
              >
                {deleting ? <span className="login-spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
