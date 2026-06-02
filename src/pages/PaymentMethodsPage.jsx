import { useState } from 'react';
import { useSelector } from 'react-redux';
import { CreditCard, Plus, Pencil, Trash2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import TopBar from '../components/TopBar';
import { selectUser } from '../features/auth/authSlice';
import {
  useGetPaymentMethodsQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
} from '../store/apis/paymentMethodsApi';

// ─── Modal ────────────────────────────────────────────────────────
function MethodModal({ initial, onSave, onClose, isSaving, saveError }) {
  const isEdit = !!initial;
  const [name,        setName]        = useState(initial?.name        ?? '');
  const [code,        setCode]        = useState(initial?.code        ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive,    setIsActive]    = useState(initial?.isActive    ?? true);

  const canSubmit = name.trim() && code.trim();

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...(isEdit ? { id: initial._id } : {}),
      name:        name.trim(),
      code:        code.trim().toLowerCase(),
      description: description.trim() || undefined,
      isActive,
    });
  }

  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shift-modal" style={{ maxWidth: 400 }}>
        <button className="custom-close" onClick={onClose} style={{ position: 'absolute', top: 12, right: 12 }}>
          <X size={18} />
        </button>

        <div className="shift-modal-header" style={{ marginBottom: 20 }}>
          <h2 className="shift-modal-title">{isEdit ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Name</label>
            <input className="shift-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cash" required />
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Code <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(unique identifier)</span></label>
            <input
              className="shift-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s/g, '_'))}
              placeholder="e.g. cash, card, qr_code"
              disabled={isEdit}
              style={isEdit ? { opacity: .6, cursor: 'not-allowed' } : {}}
              required
            />
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Description <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
            <input className="shift-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description…" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-dark)', cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (available at POS)
          </label>

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
            {isSaving ? <span className="login-spinner" /> : isEdit ? 'Save Changes' : 'Add Method'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function PaymentMethodsPage() {
  const user         = useSelector(selectUser);
  const isSuperAdmin = user?.role === 'super_admin';

  const [modal,        setModal]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveError,    setSaveError]    = useState('');

  const { data: methods = [], isLoading, isError, refetch } = useGetPaymentMethodsQuery(
    {},
    { refetchOnMountOrArgChange: true },
  );

  const [createMethod, { isLoading: creating }] = useCreatePaymentMethodMutation();
  const [updateMethod, { isLoading: updating }] = useUpdatePaymentMethodMutation();
  const [deleteMethod, { isLoading: deleting }] = useDeletePaymentMethodMutation();

  async function handleSave(payload) {
    setSaveError('');
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        await updateMethod({ id, ...body }).unwrap();
      } else {
        await createMethod(payload).unwrap();
      }
      setModal(null);
    } catch (err) {
      setSaveError(err?.data?.message ?? 'Failed to save. Please try again.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMethod(id).unwrap();
      setDeleteTarget(null);
    } catch { /* error state shows via refetch */ }
  }

  return (
    <div className="page-layout">
      <TopBar title="Payment Methods" />
      <div className="page-content">

        {isError && (
          <div className="so-error-banner">
            <AlertTriangle size={15} />
            <span>Failed to load payment methods</span>
            <button className="so-retry-btn" onClick={refetch}><RefreshCw size={12} /> Retry</button>
          </div>
        )}

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-lt)' }}>
            {isLoading ? '—' : `${methods.length} method${methods.length !== 1 ? 's' : ''} configured`}
          </p>
          {isSuperAdmin && (
            <button
              className="shift-open-btn"
              style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => { setSaveError(''); setModal('create'); }}
            >
              <Plus size={15} /> Add Method
            </button>
          )}
        </div>

        {/* Table */}
        <div className="so-table-wrap">
          <table className="so-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Status</th>
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
              ) : methods.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="so-empty">
                    <div className="empty-state">
                      <CreditCard size={28} />
                      <p>No payment methods yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                methods.map((m) => (
                  <tr key={m._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{m.name}</td>
                    <td><code style={{ fontSize: 12, background: 'var(--grey-100)', padding: '2px 7px', borderRadius: 4 }}>{m.code}</code></td>
                    <td style={{ color: 'var(--text-lt)' }}>{m.description || <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                    <td>
                      <span className={`so-status ${m.isActive ? 'so-status--completed' : 'so-status--cancelled'}`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="admin-outline-btn admin-outline-btn--sm" onClick={() => { setSaveError(''); setModal(m); }} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button
                            className="admin-outline-btn admin-outline-btn--sm"
                            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                            onClick={() => setDeleteTarget(m)}
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
        <MethodModal
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
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Delete "{deleteTarget.name}"?</h3>
            <p style={{ color: 'var(--text-lt)', fontSize: 13, marginBottom: 20 }}>
              This will remove the payment method. Existing payments using this method are unaffected.
            </p>
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
