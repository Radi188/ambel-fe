import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Users, Plus, Pencil, Trash2, AlertTriangle, RefreshCw, X, Eye, EyeOff } from 'lucide-react';
import TopBar from '../components/TopBar';
import { selectUser } from '../features/auth/authSlice';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../store/apis/staffApi';
import { useGetBranchesQuery } from '../store/apis/branchesApi';

const ROLES      = ['cashier', 'manager', 'super_admin'];
const ROLE_LABEL = { cashier: 'Cashier', manager: 'Branch Manager', super_admin: 'Super Admin' };
const ROLE_STYLE = {
  cashier:     { background: '#f0fdf4', color: '#15803d' },
  manager:     { background: '#eff6ff', color: '#1d4ed8' },
  super_admin: { background: '#faf5ff', color: '#7c3aed' },
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Create / Edit Modal ──────────────────────────────────────────
function UserModal({ initial, isSuperAdmin, branches, onSave, onClose, isSaving, saveError }) {
  const isEdit = !!initial;

  // Managers can only create cashier / manager accounts
  const availableRoles = isSuperAdmin ? ROLES : ROLES.filter((r) => r !== 'super_admin');

  const [name,     setName]     = useState(initial?.name     ?? '');
  const [email,    setEmail]    = useState(initial?.email    ?? '');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [role,     setRole]     = useState(initial?.role     ?? 'cashier');
  const [branchId, setBranchId] = useState(initial?.branch?._id ?? initial?.branch ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  // Branch selector only shown to super_admin — managers have their branch injected by the backend
  const showBranchPicker = isSuperAdmin && role !== 'super_admin';
  const canSubmit = name.trim() && email.trim() &&
    (!isEdit ? password.trim() : true) &&
    (!showBranchPicker || branchId);

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name:     name.trim(),
      email:    email.trim(),
      role,
      isActive,
      ...(showBranchPicker && branchId ? { branch: branchId } : {}),
      ...(!isEdit || password ? { password } : {}),
    };
    if (isEdit) payload.id = initial._id;
    onSave(payload);
  }

  return (
    <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shift-modal" style={{ maxWidth: 440 }}>
        <button className="custom-close" onClick={onClose} style={{ position: 'absolute', top: 12, right: 12 }}>
          <X size={18} />
        </button>

        <div className="shift-modal-header" style={{ marginBottom: 20 }}>
          <h2 className="shift-modal-title">{isEdit ? 'Edit User' : 'Add User'}</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Full Name</label>
            <input className="shift-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya Chen" required />
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Email</label>
            <input className="shift-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@ambel.com" required />
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <div style={{ position: 'relative' }}>
              <input
                className="shift-input"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Min. 8 characters'}
                required={!isEdit}
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lt)', display: 'flex' }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="shift-field" style={{ marginBottom: 0 }}>
            <label>Role</label>
            <select className="shift-input" value={role} onChange={(e) => setRole(e.target.value)} style={{ cursor: 'pointer' }}>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>

          {showBranchPicker && (
            <div className="shift-field" style={{ marginBottom: 0 }}>
              <label>Branch</label>
              <select className="shift-input" value={branchId} onChange={(e) => setBranchId(e.target.value)} required style={{ cursor: 'pointer' }}>
                <option value="">— Select branch —</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {isEdit && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-dark)', cursor: 'pointer' }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active account
            </label>
          )}

          {saveError && (
            <div className="login-error">
              <AlertTriangle size={14} />
              {saveError}
            </div>
          )}

          <button
            type="submit"
            className={`shift-open-btn ${(!canSubmit || isSaving) ? 'shift-open-btn--disabled' : ''}`}
            disabled={!canSubmit || isSaving}
            style={{ marginTop: 4 }}
          >
            {isSaving ? <span className="login-spinner" /> : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function UsersPage() {
  const currentUser  = useSelector(selectUser);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Managers can only see cashier/manager accounts in their branch
  const filterOptions = isSuperAdmin
    ? ['all', ...ROLES]
    : ['all', 'cashier', 'manager'];

  const [roleFilter,  setRoleFilter]  = useState('all');
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState(null); // null | 'create' | { ...user }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveError,   setSaveError]   = useState('');

  const { data: users = [], isLoading, isError, refetch } = useGetUsersQuery(
    roleFilter !== 'all' ? { role: roleFilter } : {},
    { refetchOnMountOrArgChange: true },
  );

  const { data: branches = [] } = useGetBranchesQuery(
    { active: true },
    { skip: !isSuperAdmin },
  );

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function handleSave(payload) {
    setSaveError('');
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        await updateUser({ id, ...body }).unwrap();
      } else {
        await createUser(payload).unwrap();
      }
      setModal(null);
    } catch (err) {
      setSaveError(err?.data?.message ?? 'Failed to save. Please try again.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteUser(id).unwrap();
      setDeleteTarget(null);
    } catch {
      // error handled silently — refetch will restore correct state
    }
  }

  return (
    <div className="page-layout">
      <TopBar title="Users" />
      <div className="page-content">

        {isError && (
          <div className="so-error-banner">
            <AlertTriangle size={15} />
            <span>Failed to load users</span>
            <button className="so-retry-btn" onClick={refetch}><RefreshCw size={12} /> Retry</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="so-toolbar" style={{ marginBottom: 16 }}>
          <div className="so-filters">
            {filterOptions.map((r) => (
              <button
                key={r}
                className={`so-filter-btn ${roleFilter === r ? 'so-filter-btn--active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r === 'all' ? 'All Roles' : ROLE_LABEL[r]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="so-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="so-search"
              />
            </div>
            <button
              className="shift-open-btn"
              style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              onClick={() => { setSaveError(''); setModal('create'); }}
            >
              <Plus size={15} /> Add User
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="so-table-wrap">
          <table className="so-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}><div className="so-skeleton" style={{ width: j === 6 ? 60 : '70%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="so-empty">
                    <div className="empty-state">
                      <Users size={28} />
                      <p>{users.length === 0 ? 'No users yet' : 'No users match your search'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="so-cashier">
                        <span className="so-cashier-avatar">{u.name[0]?.toUpperCase()}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-lt)' }}>{u.email}</td>
                    <td>
                      <span style={{
                        ...ROLE_STYLE[u.role],
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
                      }}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-lt)' }}>
                      {u.branch?.name ?? u.branch ?? <span style={{ color: 'var(--text-faint)' }}>All branches</span>}
                    </td>
                    <td>
                      <span className={`so-status ${u.isActive ? 'so-status--completed' : 'so-status--cancelled'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-lt)' }}>{u.createdAt ? fmtDate(u.createdAt) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="admin-outline-btn admin-outline-btn--sm"
                          onClick={() => { setSaveError(''); setModal(u); }}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        {isSuperAdmin && u._id !== currentUser?._id && (
                          <button
                            className="admin-outline-btn admin-outline-btn--sm"
                            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                            onClick={() => setDeleteTarget(u)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <UserModal
          initial={modal === 'create' ? null : modal}
          isSuperAdmin={isSuperAdmin}
          branches={branches}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={creating || updating}
          saveError={saveError}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="shift-modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="shift-modal" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ color: 'var(--red)', marginBottom: 12 }}><Trash2 size={32} /></div>
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Delete {deleteTarget.name}?</h3>
            <p style={{ color: 'var(--text-lt)', fontSize: 13, marginBottom: 20 }}>
              This action cannot be undone. The user will lose all access.
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
